import { CheckCircle2, Circle, Clock } from 'lucide-react';

export interface KanbanTask {
  id: string;
  title: string;
  status?: 'todo' | 'in_progress' | 'done' | string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high' | string;
  dueDate?: string;
}

interface KanbanBoardProps {
  tasks: KanbanTask[];
  onStatusChange: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
}

const COLUMNS: Array<{
  id: 'todo' | 'in_progress' | 'done';
  title: string;
  color: string;
  icon: any;
}> = [
  {
    id: 'todo',
    title: 'Rejada',
    color: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
    icon: Circle,
  },
  {
    id: 'in_progress',
    title: 'Jarayonda',
    color: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    icon: Clock,
  },
  {
    id: 'done',
    title: 'Bajarildi',
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    icon: CheckCircle2,
  },
];

export default function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const getTasksByColumn = (colId: 'todo' | 'in_progress' | 'done') => {
    return tasks.filter((t) => {
      if (colId === 'done') return t.status === 'done' || t.completed === true;
      if (colId === 'in_progress') return t.status === 'in_progress' && !t.completed;
      return !t.completed && (t.status === 'todo' || !t.status);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const colTasks = getTasksByColumn(col.id);
        const Icon = col.icon;
        return (
          <div
            key={col.id}
            className="flex flex-col rounded-2xl border border-border/80 bg-card/40 p-4"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Icon size={16} className={col.color} />
                <h4 className="text-sm font-bold text-foreground">{col.title}</h4>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {colTasks.length}
              </span>
            </div>

            <div className="min-h-[140px] flex-1 space-y-2.5 pt-3">
              {colTasks.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-xs italic text-muted-foreground/60">
                  Vazifalar yo'q
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/40"
                  >
                    <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
                    <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="text-[11px] font-semibold capitalize text-muted-foreground/80">
                        {task.priority || 'Oddiy'}
                      </span>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        {col.id !== 'todo' && (
                          <button
                            onClick={() => onStatusChange(task.id, 'todo')}
                            className="rounded px-1.5 py-0.5 text-[10px] hover:bg-muted"
                          >
                            Rejaga
                          </button>
                        )}
                        {col.id !== 'in_progress' && (
                          <button
                            onClick={() => onStatusChange(task.id, 'in_progress')}
                            className="rounded px-1.5 py-0.5 text-[10px] text-sky-400 hover:bg-muted"
                          >
                            Jarayonga
                          </button>
                        )}
                        {col.id !== 'done' && (
                          <button
                            onClick={() => onStatusChange(task.id, 'done')}
                            className="rounded px-1.5 py-0.5 text-[10px] text-emerald-400 hover:bg-muted"
                          >
                            Tugallash
                          </button>
                        )}
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
  );
}
