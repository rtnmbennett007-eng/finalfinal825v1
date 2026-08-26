import React, { useState } from 'react';
import {
  ListTodo,
  Plus,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  Clock,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Sparkles,
} from 'lucide-react';
import { Client, InternalTask, PriorityLevel, TaskStatus } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { formatDate } from '../../../utils/dateUtils';

interface ClientTasksTabProps {
  client: Client;
  tasks?: InternalTask[];
  onRefresh: () => void;
}

export const ClientTasksTab: React.FC<ClientTasksTabProps> = ({
  client,
  tasks = [],
  onRefresh,
}) => {
  const { createTask, updateTask, deleteTask, snoozeTask, addToast } = useData();
  const { currentUser, staffList } = useAuth();

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<InternalTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const [taskForm, setTaskForm] = useState<Partial<InternalTask>>({
    title: '',
    description: '',
    clientId: client?.id || '',
    clientName: `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || 'Client',
    assignedTo: client?.assignedStaff || currentUser?.name || 'Dana',
    dueDate: new Date(Date.now() + 3600000 * 24 * 2).toISOString().split('T')[0],
    dueTime: '17:00',
    priority: 'High',
    status: 'To Do',
    reminder: '1 hour before',
    notes: '',
  });

  const clientTasks = safeTasks.filter((t) => t?.clientId === client?.id);

  // Handle Toggle Status
  const handleToggleStatus = async (task: InternalTask) => {
    const nextStatus: TaskStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    try {
      await updateTask(task.id, { status: nextStatus });
      addToast(
        'success',
        nextStatus === 'Completed' ? 'Task Completed' : 'Task Reopened',
        `Task "${task.title}" updated.`
      );
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Status Update Failed', err.message);
    }
  };

  // Handle Save Task (Create or Edit)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title?.trim()) return;

    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskForm);
        addToast('success', 'Task Updated', `Task "${taskForm.title}" saved.`);
      } else {
        await createTask({
          ...taskForm,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
        });
        addToast('success', 'Task Created', `Task assigned to ${taskForm.assignedTo}.`);
      }

      setShowAddModal(false);
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        assignedTo: client.assignedStaff || 'Dana',
        dueDate: new Date(Date.now() + 3600000 * 24 * 2).toISOString().split('T')[0],
        dueTime: '17:00',
        priority: 'High',
        status: 'To Do',
        reminder: '1 hour before',
        notes: '',
      });
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Failed to Save Task', err.message);
    }
  };

  // Handle Delete Task
  const handleDelete = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await deleteTask(taskToDelete);
      addToast('success', 'Task Deleted', 'Task removed from queue.');
      setTaskToDelete(null);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    } finally {
      setIsDeletingTask(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold uppercase">
                Client Tasks & Follow-Ups
              </span>
              <span className="text-xs text-slate-400">
                Active Tasks:{' '}
                <strong className="text-amber-300">
                  {clientTasks.filter((t) => t.status !== 'Completed').length}
                </strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Internal Tasks, Milestones & Strategy Actions
            </h2>
            <p className="text-xs text-slate-400">
              Tasks created here or converted from Funding Strategy sync directly to the user's dashboard.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client Task</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {clientTasks.length === 0 ? (
          <div className="bg-[#0b1528] border border-blue-900/60 p-8 rounded-2xl shadow-xl text-center space-y-3">
            <ListTodo className="w-10 h-10 text-slate-500 mx-auto opacity-60" />
            <h3 className="text-base font-bold text-slate-100">No Open Tasks for this Client</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add a follow-up task or convert a next step from the Funding Strategy tab to assign work.
            </p>
          </div>
        ) : (
          clientTasks.map((task) => {
            const isDone = task.status === 'Completed';

            return (
              <div
                key={task.id}
                className={`bg-[#0b1528] border p-4 rounded-2xl shadow-lg flex items-start justify-between gap-4 transition-all ${
                  isDone
                    ? 'border-emerald-800/40 bg-emerald-950/10 opacity-75'
                    : 'border-blue-900/60 hover:border-blue-700/60'
                }`}
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-0.5 text-slate-400 hover:text-amber-400 transition-colors shrink-0"
                    title="Click to toggle status"
                  >
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4
                        className={`text-sm font-bold ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-100'
                        }`}
                      >
                        {task.title}
                      </h4>

                      <span
                        className={`text-[9px] font-mono px-2 py-0.2 rounded font-bold uppercase ${
                          task.priority === 'High'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : task.priority === 'Medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {task.priority} Priority
                      </span>

                      <span
                        className={`text-[9px] font-mono px-2 py-0.2 rounded font-bold uppercase ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-300 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        Assigned to: <strong className="text-slate-200">{task.assignedTo}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-white" />
                        Due: {formatDate(task.dueDate)} {task.dueTime ? `@ ${task.dueTime}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setTaskForm(task);
                      setShowAddModal(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-blue-900/40 transition-colors"
                    title="Edit task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1832] border border-blue-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-blue-900 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-amber-400" />
                {editingTask ? 'Edit Task' : 'Add Client Task'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Call client for missing W2 or follow up on approval"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="Details, phone numbers, or specific conditions to check..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Staff</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, priority: e.target.value as PriorityLevel })
                    }
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })
                    }
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-blue-900 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  {editingTask ? 'Save Task Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Confirm Modal */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Internal Task"
        message="Are you sure you want to remove this task from the client's queue? This action cannot be undone."
        confirmText="Delete Task"
        cancelText="Cancel"
        isLoading={isDeletingTask}
        type="danger"
      />
    </div>
  );
};
