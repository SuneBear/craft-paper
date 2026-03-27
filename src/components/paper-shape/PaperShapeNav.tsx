import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/ui/paper-shape', label: '✨ 总览', end: true },
  { to: '/ui/paper-shape/examples', label: '📋 示例库' },
  { to: '/ui/paper-shape/stack', label: '📚 堆叠组合' },
  { to: '/ui/paper-shape/playground', label: '🎮 参数编辑器' },
];

export function PaperShapeNav() {
  return (
    <nav className="flex items-center gap-1 p-2 rounded-xl bg-card border border-border mb-6 overflow-x-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'px-4 py-2 rounded-lg text-sm font-craft font-medium transition-all whitespace-nowrap',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
