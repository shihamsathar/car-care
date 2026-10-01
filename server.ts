import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body Parsers & CORS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'CarCare Pro - Qatar Workshop Management',
    locale: 'Asia/Qatar',
    time: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// REST API v1
const apiRouter = express.Router();

// SSE Live Event updates
let sseClients: Response[] = [];

apiRouter.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Subscribed to CarCare Pro live events' })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

const broadcastEvent = (eventType: string, payload: any) => {
  const message = `data: ${JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() })}\n\n`;
  sseClients.forEach((client) => client.write(message));
};

// API: Auth status
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  res.json({
    status: 'authenticated',
    user: {
      id: 'user-superadmin',
      name: 'Tariq Al-Mohannadi',
      role: 'SUPER_ADMIN',
      email: 'admin@carcarepro.qa',
    },
  });
});

// API: WhatsApp Message dispatcher
apiRouter.post('/jobs/:id/report/send', (req: Request, res: Response) => {
  const { id } = req.params;
  const { mode = 'link', phone, customerName, make, model, plate, jobNo } = req.body;

  broadcastEvent('JOB_REPORT_SENT', { jobId: id, jobNo, phone, timestamp: new Date().toISOString() });

  res.json({
    success: true,
    jobId: id,
    mode,
    status: 'Sent',
    sentAt: new Date().toISOString(),
    message: `Report dispatched successfully for ${make} ${model} (${plate})`,
  });
});

// Mount /api/v1 and /api
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// Start Server & mount Vite in Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CarCare Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
