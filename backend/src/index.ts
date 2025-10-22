import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { scheduleWeeklyRefresh } from './jobs/weeklyRefresh.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(cors({ origin: env.frontendOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? 500;
  logger.error({ err }, 'Request failed');
  res.status(status).json({ error: err.message ?? 'Internal Server Error' });
});

scheduleWeeklyRefresh();

app.listen(env.port, () => {
  logger.info(`API listening on ${env.port}`);
});
