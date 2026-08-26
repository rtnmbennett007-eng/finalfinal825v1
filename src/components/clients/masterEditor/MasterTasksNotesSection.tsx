import React, { useState } from 'react';
import { ListTodo, MessageSquare, Plus, Trash2, CheckCircle2, Clock, Pin, AlertTriangle } from 'lucide-react';
import { ClientInternalNote, InternalTask, TaskPriority, TaskStatus } from '../../../types';

interface MasterTasksNotesSectionProps {
  clientId: string;
  clientName: string;
  tasks: InternalTask[];
  notes: ClientInternalNote[];
  onChangeTasks: (updatedTasks: InternalTask[]) => void;
  onChangeNotes: (updatedNotes: ClientInternalNote[]) => void;
}

export const MasterTasksNotesSection: React.FC<MasterTasksNotesSectionProps> = ({
  clientId,
  clientName,
  tasks,
  notes,
  onChangeTasks,
  onChangeNotes,
}) => {
  // New Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('High');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

  // New Note form
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: InternalTask = {
      id: `task-${Date.now()}`,
      title: taskTitle.trim(),
      clientId,
      clientName,
      assignedTo: 'Dana',
      dueDate: taskDueDate,
      dueTime: '10:00',
      priority: taskPriority,
      status: 'To Do',
      reminder: '1 hour before',
      createdBy: 'Dana Javier',
      createdDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onChangeTasks([...tasks, newTask]);
    setTaskTitle('');
  };

  const handleUpdateTaskStatus = (id: string, status: TaskStatus) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t));
    onChangeTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    onChangeTasks(tasks.filter((t) => t.id !== id));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const newNote: ClientInternalNote = {
      id: `note-${Date.now()}`,
      clientId,
      author: 'Dana Javier',
      category: noteCategory,
      content: noteContent.trim(),
      isPinned: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    onChangeNotes([newNote, ...notes]);
    setNoteContent('');
  };

  const handleDeleteNote = (id: string) => {
    onChangeNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Client Tasks Section */}
      <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <ListTodo className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Client Operations Tasks & Action Items
            </h3>
          </div>
          <span className="text-xs text-slate-400">{tasks.length} Assigned Tasks</span>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#070d18] p-3 rounded-xl border border-blue-900/40">
          <div className="md:col-span-2">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="Add next operational task..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
              className="bg-[#0b1528] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="bg-[#0b1528] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!taskTitle.trim()}
            className="py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </form>

        {/* Tasks List */}
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs"
            >
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleUpdateTaskStatus(task.id, task.status === 'Completed' ? 'To Do' : 'Completed')}
                  className="shrink-0"
                >
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      task.status === 'Completed' ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  />
                </button>
                <div>
                  <span
                    className={`font-semibold block ${
                      task.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Due: {task.dueDate} • Assigned: {task.assignedTo} • Priority: {task.priority}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={task.status}
                  onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                  className="bg-[#0b1528] border border-blue-900/60 rounded-lg p-1 text-[11px] text-slate-200 focus:border-amber-400 focus:outline-none"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Snoozed">Snoozed</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1 text-rose-400 hover:bg-rose-500/10 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Internal Staff Notes */}
      <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Internal Staff Logs & Private Notes
            </h3>
          </div>
          <span className="text-xs text-slate-400">{notes.length} Recorded Notes</span>
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="space-y-3 bg-[#070d18] p-3 rounded-xl border border-blue-900/40">
          <textarea
            rows={2}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
            placeholder="Add confidential internal note for operations and underwriting staff..."
          />
          <div className="flex items-center justify-between">
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="bg-[#0b1528] border border-blue-900/70 rounded-xl p-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="General">General</option>
              <option value="Verification">Verification</option>
              <option value="Underwriting">Underwriting</option>
              <option value="Lender">Lender</option>
              <option value="Funding">Funding</option>
              <option value="Commission">Commission</option>
            </select>

            <button
              type="submit"
              disabled={!noteContent.trim()}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              Post Note
            </button>
          </div>
        </form>

        {/* Notes Feed */}
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-amber-300">{note.author}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {note.category || 'General'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400">
                    {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'Recent'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-slate-200 leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
