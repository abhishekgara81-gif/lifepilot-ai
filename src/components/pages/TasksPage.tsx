import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskPriority, TaskCategory, TaskStatus } from '../../types';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Filter,
  Check,
  Edit2,
  Trash2,
  LayoutList,
  Columns,
  Tag,
  Folder,
  ArrowUpDown,
  CheckSquare,
  Repeat,
} from 'lucide-react';
import { getRelativeDate, formatTime12, formatTimeRangeWithMidnight } from '../../data/initialData';

export const TasksPage: React.FC = () => {
  const {
    tasks,
    toggleTaskStatus,
    toggleSubtask,
    deleteTask,
    setTaskModalOpen,
    setEditingTask,
    projects,
    goals,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'duration' | 'title'>('dueDate');

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    }
    if (sortBy === 'priority') {
      const prioMap: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
      return prioMap[a.priority] - prioMap[b.priority];
    }
    if (sortBy === 'duration') {
      return (b.estimatedMinutes || 0) - (a.estimatedMinutes || 0);
    }
    return a.title.localeCompare(b.title);
  });

  const handleCreateNew = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200">
        {/* Left: View toggle and search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* List vs Kanban toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
          </div>

          {/* Quick status tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto">
            {(['all', 'todo', 'in_progress', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-100 text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'all'
                  ? 'All Tasks'
                  : st === 'todo'
                  ? 'To Do'
                  : st === 'in_progress'
                  ? 'In Progress'
                  : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Filters & Create Task button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-300"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-300"
          >
            <option value="all">All Categories</option>
            <option value="study">Study</option>
            <option value="coding">Coding</option>
            <option value="project">Project</option>
            <option value="revision">Revision</option>
            <option value="personal">Personal</option>
            <option value="learning">Learning / Personal Development</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-300"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="duration">Sort by Duration</option>
            <option value="title">Sort by Title</option>
          </select>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task Counts Summary Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800 tabular-nums">{sortedTasks.length}</strong> tasks
          {statusFilter !== 'all' && ` (${statusFilter.replace('_', ' ')})`}
        </span>
        <span className="tabular-nums">
          {tasks.filter((t) => t.status === 'completed').length} of {tasks.length} completed
        </span>
      </div>

      {/* Empty State */}
      {sortedTasks.length === 0 && (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100/80 flex items-center justify-center mx-auto text-slate-500">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No tasks match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or filters, or add a new action task to your queue.
          </p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Task</span>
          </button>
        </div>
      )}

      {/* View Mode 1: Dense Productive List View */}
      {viewMode === 'list' && sortedTasks.length > 0 && (
        <div className="space-y-2.5">
          {sortedTasks.map((task) => {
            const isDone = task.status === 'completed';
            const project = projects.find((p) => p.id === task.projectId);
            const goal = goals.find((g) => g.id === task.goalId);

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-slate-50/40 border-slate-200/60 opacity-60'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Checkbox & Title & Description */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-slate-900'
                          : 'border-slate-300 hover:border-blue-400 bg-slate-100'
                      }`}
                      aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          onClick={() => handleEdit(task)}
                          className={`text-sm font-semibold cursor-pointer truncate ${
                            isDone
                              ? 'line-through text-slate-500'
                              : 'text-slate-900 hover:text-blue-700'
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.recurrence === 'daily' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            <Repeat className="w-3 h-3" />
                            Every day: {formatTimeRangeWithMidnight(task.startTime, task.endTime)}
                          </span>
                        )}

                        {project && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Folder className="w-3 h-3 text-blue-700" />
                            {project.name}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks checklist items if present */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-1.5 mb-2.5 max-w-xl">
                          {task.subtasks.map((st) => (
                            <label
                              key={st.id}
                              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={st.completed}
                                onChange={() => toggleSubtask(task.id, st.id)}
                                className="w-3.5 h-3.5 rounded text-blue-700 bg-slate-50 border-slate-300"
                              />
                              <span className={st.completed ? 'line-through text-slate-500' : ''}>
                                {st.title}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Clean Unboxed Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="capitalize font-medium">
                          {task.category === 'learning' ? 'Learning / Personal Development' : task.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimatedMinutes}m
                        </span>
                        <span aria-hidden="true">·</span>
                        {task.recurrence === 'daily' ? (
                          <span className="tabular-nums flex items-center gap-1 text-blue-700 font-medium">
                            <Repeat className="w-3 h-3" />
                            Repeats daily ({formatTimeRangeWithMidnight(task.startTime, task.endTime)})
                          </span>
                        ) : (
                          <span className="tabular-nums flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ''}
                          </span>
                        )}
                        {goal && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-blue-700 truncate max-w-[180px]">
                              Goal: {goal.title}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Priority tag and Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        task.priority === 'high'
                          ? 'bg-rose-50/60 text-rose-700 border border-rose-200/40'
                          : task.priority === 'medium'
                          ? 'bg-amber-50/60 text-amber-700 border border-amber-200/40'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {task.priority.toUpperCase()}
                    </span>

                    <button
                      onClick={() => handleEdit(task)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-slate-100"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode 2: Kanban Board View */}
      {viewMode === 'kanban' && sortedTasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              { id: 'todo', label: 'To Do', border: 'border-blue-500/30' },
              { id: 'in_progress', label: 'In Progress', border: 'border-amber-500/30' },
              { id: 'completed', label: 'Completed', border: 'border-emerald-500/30' },
            ] as const
          ).map((col) => {
            const colTasks = sortedTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col space-y-3 min-h-[450px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{col.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono tabular-nums">
                      {colTasks.length}
                    </span>
                  </div>
                  {col.id === 'todo' && (
                    <button
                      onClick={handleCreateNew}
                      className="p-1 text-slate-500 hover:text-slate-900"
                      title="Add to column"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-slate-500 text-xs">
                      No tasks in this lane
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            onClick={() => handleEdit(task)}
                            className="text-xs font-semibold text-slate-800 hover:text-blue-700 cursor-pointer line-clamp-2"
                          >
                            {task.title}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                              task.priority === 'high'
                                ? 'bg-rose-50/60 text-rose-700 border border-rose-200/40'
                                : task.priority === 'medium'
                                ? 'bg-amber-50/60 text-amber-700 border border-amber-200/40'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                        </div>

                        {task.recurrence === 'daily' && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                            <Repeat className="w-3 h-3" />
                            <span>Daily: {formatTimeRangeWithMidnight(task.startTime, task.endTime)}</span>
                          </div>
                        )}

                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span className="tabular-nums">
                            {task.recurrence === 'daily' ? 'Repeats Daily' : task.dueDate}
                          </span>
                          <span className="capitalize">
                            {task.category === 'learning' ? 'Learning / Personal Dev' : task.category}
                          </span>
                        </div>

                        {/* Move column quick buttons */}
                        <div className="pt-1 flex items-center justify-between gap-1">
                          <button
                            onClick={() => toggleTaskStatus(task.id)}
                            className="text-[10px] text-slate-500 hover:text-blue-700"
                          >
                            {task.status === 'completed' ? 'Reopen' : 'Mark Done'}
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(task)}
                              className="text-[10px] text-slate-500 hover:text-slate-900 p-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="text-[10px] text-slate-500 hover:text-rose-700 p-1"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
