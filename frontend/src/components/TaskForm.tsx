import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { taskAPI } from '../services/api';
import type { Task, CreateTaskRequest } from '../services/api';

interface FormData {
  title: string;
  description: string;
  status: Task['status'];
  dueDate: string;
}

const TaskForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      status: 'PENDING',
      dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskAPI.getTaskById(id!),
    enabled: isEditing,
  });

  React.useEffect(() => {
    if (task) {
      setValue('title', task.title);
      setValue('description', task.description || '');
      setValue('status', task.status);
      setValue('dueDate', format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm"));
    }
  }, [task, setValue]);

  const createMutation = useMutation({
    mutationFn: taskAPI.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully');
      navigate('/');
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => taskAPI.updateTask(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      toast.success('Task updated successfully');
      navigate('/');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  const onSubmit = (data: FormData) => {
    const taskData: CreateTaskRequest = {
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      dueDate: new Date(data.dueDate).toISOString(),
    };

    if (isEditing) {
      updateMutation.mutate(taskData);
    } else {
      createMutation.mutate(taskData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingTask) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tasks
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Task' : 'Create New Task'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Update the task details below' : 'Fill in the details to create a new task'}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              {...register('title', { 
                required: 'Title is required',
                maxLength: { value: 255, message: 'Title must be less than 255 characters' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a clear, descriptive title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide additional details about the task (optional)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Add any relevant details, requirements, or notes for this task.
            </p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date & Time *
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              {...register('dueDate', { 
                required: 'Due date is required',
                validate: {
                  notInPast: (value) => {
                    const selectedDate = new Date(value);
                    const now = new Date();
                    return selectedDate > now || 'Due date must be in the future';
                  }
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Set when this task should be completed.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isLoading 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Task' : 'Create Task')
              }
            </button>
            <Link
              to="/"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;