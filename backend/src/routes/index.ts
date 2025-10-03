import { Router } from 'express';
import { healthRouter } from './health.js';
import { analysisRouter } from './analysis.js';
import { dashboardRouter } from './dashboard.js';
import { billingRouter } from './billing.js';
import { projectsRouter } from './projects.js';

export const routes = Router();

routes.use('/health', healthRouter);
routes.use('/analysis', analysisRouter);
routes.use('/dashboard', dashboardRouter);
routes.use('/billing', billingRouter);
routes.use('/projects', projectsRouter);
