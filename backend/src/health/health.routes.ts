import { Router } from 'express';
import { TaskRepository } from '../tasks/task.repository';

/**
 * /health      liveness: the process is up.
 * /health/ready readiness: the database can be reached.
 */
export const createHealthRouter = (repository: TaskRepository): Router => {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({ status: 'UP' });
  });

  router.get('/ready', async (req, res) => {
    try {
      await repository.ping();
      res.json({ status: 'UP', checks: { database: 'UP' } });
    } catch (error) {
      req.log?.warn({ err: error }, 'Readiness check failed');
      res.status(503).json({ status: 'DOWN', checks: { database: 'DOWN' } });
    }
  });

  return router;
};
