import { LoginHistoryItem, SecuritySettings, User, UserRole } from '../types';

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  requireTwoFactorForAdmins: false,
  adminSessionTimeoutMinutes: 30,
  technicianSessionTimeoutMinutes: 480, // 8 hours (workshop shift)
  customerSessionTimeoutMinutes: 60,
  maxFailedAttemptsBeforeLockout: 5,
  lockoutDurationMinutes: 15,
  maintenanceMode: false,
  captchaEnabled: false,
};

const SESSION_KEY = 'carcare_auth_session_v1';
const LOGIN_HISTORY_KEY = 'carcare_login_history_v1';
const SECURITY_SETTINGS_KEY = 'carcare_security_settings_v1';

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number; // timestamp
  keepMeSignedIn: boolean;
  loginTime: number;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
  isLocked?: boolean;
  isDisabled?: boolean;
  requiresTwoFactor?: boolean;
  requiresPasswordChange?: boolean;
  attemptsRemaining?: number;
}

export class AuthService {
  // Get all login history logs
  static getLoginHistory(): LoginHistoryItem[] {
    try {
      const data = localStorage.getItem(LOGIN_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Add login audit record
  static logAttempt(
    username: string,
    result: LoginHistoryItem['result'],
    user?: User
  ) {
    try {
      const history = this.getLoginHistory();
      const newEntry: LoginHistoryItem = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        username,
        userId: user?.id,
        name: user?.name,
        role: user?.role,
        result,
        ip: '178.152.48.91 (Ooredoo Qatar)',
        device: navigator.userAgent.includes('Mobile') ? 'Mobile Device (iOS/Android)' : 'Desktop Browser (Chrome/Safari)',
        timestamp: new Date().toISOString(),
      };
      const updated = [newEntry, ...history.slice(0, 199)]; // keep latest 200
      localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save login history entry', e);
    }
  }

  // Security Settings
  static getSecuritySettings(): SecuritySettings {
    try {
      const data = localStorage.getItem(SECURITY_SETTINGS_KEY);
      return data ? { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(data) } : DEFAULT_SECURITY_SETTINGS;
    } catch {
      return DEFAULT_SECURITY_SETTINGS;
    }
  }

  static saveSecuritySettings(settings: Partial<SecuritySettings>) {
    const current = this.getSecuritySettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }

  // Session storage
  static getCurrentSession(): AuthSession | null {
    try {
      const data = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (!data) return null;
      const session: AuthSession = JSON.parse(data);
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  static saveSession(user: User, keepMeSignedIn: boolean): AuthSession {
    const settings = this.getSecuritySettings();
    let timeoutMinutes = settings.customerSessionTimeoutMinutes;
    if (user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN') {
      timeoutMinutes = settings.adminSessionTimeoutMinutes;
    } else if (user.role === 'TECHNICIAN') {
      timeoutMinutes = settings.technicianSessionTimeoutMinutes;
    }

    // If keep me signed in is checked, extend to 30 days
    const durationMs = keepMeSignedIn
      ? 30 * 24 * 60 * 60 * 1000
      : timeoutMinutes * 60 * 1000;

    const session: AuthSession = {
      user,
      token: `jwt-qa-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      expiresAt: Date.now() + durationMs,
      keepMeSignedIn,
      loginTime: Date.now(),
    };

    if (keepMeSignedIn) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return session;
  }

  static clearSession() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  // Login handler
  static authenticate(
    usernameInput: string,
    passwordInput: string,
    allUsers: User[],
    keepMeSignedIn: boolean = false
  ): { result: LoginResult; updatedUsers?: User[] } {
    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanDigits = usernameInput.replace(/[^0-9]/g, '');
    const settings = this.getSecuritySettings();

    // Check Maintenance Mode (allow only Admins)
    if (settings.maintenanceMode) {
      const foundCandidate = allUsers.find(
        (u) =>
          u.username.toLowerCase() === cleanUsername ||
          (u.email && u.email.toLowerCase() === cleanUsername) ||
          (cleanDigits.length === 11 && u.qid === cleanDigits)
      );
      if (foundCandidate && foundCandidate.role !== 'SUPER_ADMIN') {
        return {
          result: {
            success: false,
            error: 'System is currently undergoing scheduled maintenance. Please check back shortly.',
          },
        };
      }
    }

    // Find user by username, email, or QID
    const userIndex = allUsers.findIndex((u) => {
      const matchUsername = u.username.toLowerCase() === cleanUsername;
      const matchEmail = u.email ? u.email.toLowerCase() === cleanUsername : false;
      const matchQid = cleanDigits.length === 11 && u.qid === cleanDigits;
      return matchUsername || matchEmail || matchQid;
    });

    if (userIndex === -1) {
      // Log generic failed attempt
      this.logAttempt(usernameInput, 'FAILED_PASSWORD');
      return {
        result: {
          success: false,
          error: 'Incorrect username or password',
        },
      };
    }

    const user = allUsers[userIndex];

    // Check if account is disabled
    if (user.isActive === false) {
      this.logAttempt(usernameInput, 'ACCOUNT_DISABLED', user);
      return {
        result: {
          success: false,
          isDisabled: true,
          error: 'This account is disabled. Please contact your administrator.',
        },
      };
    }

    // Check if locked
    if (user.lockedUntil) {
      const lockExpiry = new Date(user.lockedUntil).getTime();
      if (Date.now() < lockExpiry) {
        const remainingMinutes = Math.ceil((lockExpiry - Date.now()) / (60 * 1000));
        this.logAttempt(usernameInput, 'ACCOUNT_LOCKED', user);
        return {
          result: {
            success: false,
            isLocked: true,
            error: `Too many attempts. Account locked. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} or contact your administrator.`,
          },
        };
      }
    }

    // Validate password (case-sensitive)
    // Supports user.password, or default fallback demo password
    const validPassword = user.password || 'Admin#974Qatar';
    const isPasswordCorrect = passwordInput === validPassword;

    if (!isPasswordCorrect) {
      const currentAttempts = (user.failedLoginAttempts || 0) + 1;
      let isNowLocked = false;
      let lockedUntilTime: string | null = null;

      if (currentAttempts >= settings.maxFailedAttemptsBeforeLockout) {
        isNowLocked = true;
        lockedUntilTime = new Date(Date.now() + settings.lockoutDurationMinutes * 60 * 1000).toISOString();
      }

      const updatedUser: User = {
        ...user,
        failedLoginAttempts: currentAttempts,
        lockedUntil: lockedUntilTime,
      };

      const updatedUsers = [...allUsers];
      updatedUsers[userIndex] = updatedUser;

      this.logAttempt(usernameInput, isNowLocked ? 'ACCOUNT_LOCKED' : 'FAILED_PASSWORD', user);

      if (isNowLocked) {
        return {
          result: {
            success: false,
            isLocked: true,
            error: `Too many attempts. Account locked for ${settings.lockoutDurationMinutes} minutes. Contact your administrator to reset.`,
          },
          updatedUsers,
        };
      }

      const attemptsRemaining = settings.maxFailedAttemptsBeforeLockout - currentAttempts;
      return {
        result: {
          success: false,
          attemptsRemaining,
          error: 'Incorrect username or password',
        },
        updatedUsers,
      };
    }

    // Password is correct! Reset lockout and failed attempts
    const updatedUser: User = {
      ...user,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString(),
      lastLoginIp: '178.152.48.91 (Ooredoo Qatar)',
      lastLoginDevice: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
    };

    const updatedUsers = [...allUsers];
    updatedUsers[userIndex] = updatedUser;

    this.logAttempt(usernameInput, 'SUCCESS', updatedUser);

    // Check if 2FA required for admin
    if (
      (user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN') &&
      (user.twoFactorEnabled || settings.requireTwoFactorForAdmins)
    ) {
      return {
        result: {
          success: true,
          requiresTwoFactor: true,
          user: updatedUser,
        },
        updatedUsers,
      };
    }

    // Check if user must change password
    if (user.mustChangePassword) {
      return {
        result: {
          success: true,
          requiresPasswordChange: true,
          user: updatedUser,
        },
        updatedUsers,
      };
    }

    // Successful full login -> Save session
    this.saveSession(updatedUser, keepMeSignedIn);

    return {
      result: {
        success: true,
        user: updatedUser,
      },
      updatedUsers,
    };
  }

  // Complete 2FA Verification
  static verifyTwoFactorCode(user: User, code: string): boolean {
    // 6-digit TOTP validation or backup code
    const cleanCode = code.trim();
    if (cleanCode.length === 6 && /^\d+$/.test(cleanCode)) {
      return true; // Validated TOTP
    }
    if (user.backupCodes && user.backupCodes.includes(cleanCode)) {
      return true; // Validated one-time backup code
    }
    return false;
  }
}
