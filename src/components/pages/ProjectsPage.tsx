import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FolderKanban,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Tag,
  Trash2,
  Edit2,
  Folder,
  ArrowRight,
} from 'lucide-react';
import { Project } from '../../types';

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    tasks,
    setProjectModalOpen,
    deleteProject,
    setTaskModalOpen,
    setEditingTask,
    setActivePage,
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredProjects = projects.filter((p) =>
    filterStatus === 'all' ? true : p.status === filterStatus
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectTasks = selectedProject
    ? tasks.filter((t) => t.projectId === selectedProject.id)
    : [];

  const completedProjectTasks = projectTasks.filter((t) => t.status === 'completed');
  const projectProgress = projectTasks.length
    ? Math.round((completedProjectTasks.length / projectTasks.length) * 100)
    : 0;

  const handleAddTaskForProject = () => {
    if (!selectedProject) return;
    setEditingTask({
      id: '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      category: 'project',
      dueDate: new Date().toISOString().split('T')[0],
      estimatedMinutes: 60,
      projectId: selectedProject.id,
      createdAt: new Date().toISOString(),
      subtasks: [],
    });
    setTaskModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="page-intro flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-0.5">
            <FolderKanban className="w-4 h-4" />
            <span>Workspace Workstreams</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Projects</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize engineering repositories, course laboratories, and career sprints.
          </p>
        </div>

        <button
          onClick={() => setProjectModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="md:col-span-3 rounded-2xl border border-dashed border-slate-300/70 bg-white px-6 py-10 text-center">
            <FolderKanban className="mx-auto h-5 w-5 text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-slate-800">No projects to show</p>
            <p className="mt-1 text-xs text-slate-500">Create a workspace to connect tasks and track project progress.</p>
            <button onClick={() => setProjectModalOpen(true)} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-blue-700">
              Create project
            </button>
          </div>
        ) : filteredProjects.map((project) => {
          const pTasks = tasks.filter((t) => t.projectId === project.id);
          const pCompleted = pTasks.filter((t) => t.status === 'completed').length;
          const pRate = pTasks.length ? Math.round((pCompleted / pTasks.length) * 100) : 0;
          const isSelected = selectedProject?.id === project.id;

          return (
            <div
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-blue-50 border-blue-300/60 ring-1 ring-blue-300/30 shadow-xl'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-md"
                    style={{ backgroundColor: project.color || '#245EEA' }}
                  />
                  <span className="text-xs font-semibold text-slate-700 capitalize">
                    {project.status}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(project.id);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-rose-700"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">{project.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                {project.description}
              </p>

              {/* Progress */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Completion</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800">{pRate}%</span>
                </div>
                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pRate}%`,
                      backgroundColor: project.color || '#245EEA',
                    }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {project.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="tabular-nums">Deadline: {project.deadline}</span>
                <span className="font-medium text-slate-700">
                  {pCompleted}/{pTasks.length} tasks
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Project Deep Dive & Associated Tasks */}
      {selectedProject && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-700 font-medium mb-1">
                <span>Selected Project Workspace</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{selectedProject.status}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {selectedProject.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{selectedProject.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddTaskForProject}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project Task</span>
              </button>
            </div>
          </div>

          {/* Project task list */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              Associated Deliverables ({completedProjectTasks.length}/{projectTasks.length} Done):
            </span>

            {projectTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No tasks currently linked to this project. Click "+ Add Project Task" to assign one!
              </div>
            ) : (
              projectTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        task.status === 'completed'
                          ? 'bg-emerald-500'
                          : task.priority === 'high'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <div
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          task.status === 'completed'
                            ? 'line-through text-slate-500'
                            : 'text-slate-800'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="tabular-nums">Due {task.dueDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{task.estimatedMinutes}m</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{task.priority} Prio</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                      task.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
