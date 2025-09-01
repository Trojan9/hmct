import { RequestHandler, Router } from 'express';

import taskController from '../controllers/taskController';

const router = Router();

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Public
 * @body    { title: string, description?: string, status?: TaskStatus, dueDate: string }
 */
router.post('/', taskController.createTask);


/**
 * @route   GET /api/tasks
 * @desc    Get all tasks
 * @access  Public
 * @query   status?: TaskStatus, sortBy?: string, order?: 'asc' | 'desc'
 */
router.get('/', taskController.getAllTasks);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Public
 */
router.get('/:id', taskController.getTaskById);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Public
 * @body    { title?: string, description?: string, status?: TaskStatus, dueDate?: string }
 */
router.put('/:id', taskController.updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Public
 */
router.delete('/:id', taskController.deleteTask);

export default router;