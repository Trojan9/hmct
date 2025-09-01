import { describe, it, expect } from 'vitest';
import { taskAPI } from './api';

describe('taskAPI', () => {
  it('should have all required API methods', () => {
    expect(taskAPI).toBeDefined();
    expect(typeof taskAPI.getAllTasks).toBe('function');
    expect(typeof taskAPI.getTaskById).toBe('function');
    expect(typeof taskAPI.createTask).toBe('function');
    expect(typeof taskAPI.updateTask).toBe('function');
    expect(typeof taskAPI.deleteTask).toBe('function');
  });

  it('should be properly configured', () => {
    expect(taskAPI).toHaveProperty('getAllTasks');
    expect(taskAPI).toHaveProperty('getTaskById');
    expect(taskAPI).toHaveProperty('createTask');
    expect(taskAPI).toHaveProperty('updateTask');
    expect(taskAPI).toHaveProperty('deleteTask');
  });
});