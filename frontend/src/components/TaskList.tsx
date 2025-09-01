import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, Calendar, AlertCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { taskAPI } from '../services/api';
import type { Task } from '../services/api';

const TaskList: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskAPI.getAllTasks,
  });

  const deleteMutation = useMutation({
    mutationFn: taskAPI.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  const filteredTasks = tasks.filter(task => 
    filter === 'all' || task.status === filter
  );

  const getStatusBadge = (status: Task['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const isOverdue = (dueDate: string, status: Task['status']) => {
    return new Date(dueDate) < new Date() && status !== 'COMPLETED';
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <AlertCircle className="mx-auto h-8 w-8 mb-2" />
        Failed to load tasks. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Manage your casework tasks efficiently</p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? 'All Tasks' : status.replace('_', ' ')}
              {status !== 'all' && (
                <span className="ml-1 text-xs">
                  ({tasks.filter(t => t.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-500 text-lg mb-2">
            {filter === 'all' ? 'No tasks found' : `No ${filter.replace('_', ' ').toLowerCase()} tasks`}
          </div>
          <p className="text-gray-400 mb-4">
            {filter === 'all' 
              ? 'Get started by creating your first task' 
              : 'Try selecting a different filter or create a new task'
            }
          </p>
          <Link
            to="/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
                isOverdue(task.dueDate, task.status) ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    {isOverdue(task.dueDate, task.status) && (
                      <div className="flex items-center text-red-600 ml-2">
                        <AlertCircle className="h-5 w-5 mr-1 flex-shrink-0" />
                        <span className="text-sm font-medium">Overdue</span>
                      </div>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {format(new Date(task.dueDate), 'MMM dd, yyyy HH:mm')}
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link
                    to={`/edit/${task.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit task"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(task.id, task.title)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={deleteMutation.isPending}
                    title="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;