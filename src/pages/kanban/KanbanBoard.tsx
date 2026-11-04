import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Task, TaskStatus } from '../../types';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onStatusChange }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onStatusChange(taskId, status);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="custom-scrollbar flex h-full snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:gap-6">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex min-w-[85vw] max-w-[85vw] snap-center flex-col rounded-2xl border border-border/50 bg-muted/30 p-4 md:min-w-[300px] md:max-w-[300px] md:flex-1 md:snap-align-none"
          onDrop={(e) => handleDrop(e, column.id)}
          onDragOver={handleDragOver}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{column.title}</h3>
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {
                tasks.filter((t) => (t.status || (t.completed ? 'done' : 'todo')) === column.id)
                  .length
              }
            </span>
          </div>

          <div className="min-h-[100px] flex-1 space-y-3">
            {tasks
              .filter((t) => (t.status || (t.completed ? 'done' : 'todo')) === column.id)
              .map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="glass-card group transform cursor-grab rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 active:cursor-grabbing"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'high'
                          ? 'bg-destructive/10 text-destructive'
                          : task.priority === 'medium'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <button className="text-muted-foreground transition-colors hover:text-foreground">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                  <h4 className="mb-1 font-semibold text-foreground">{task.title}</h4>
                  {task.deadline && (
                    <p className="text-xs font-medium text-muted-foreground">
                      Due: {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
