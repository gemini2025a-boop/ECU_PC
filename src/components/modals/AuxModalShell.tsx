import React from 'react';
import { X } from 'lucide-react';

interface AuxModalShellProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'cyan' | 'amber' | 'rose';
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export const AuxModalShell: React.FC<AuxModalShellProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = 'emerald',
  onClose,
  children,
  maxWidth = 'max-w-6xl',
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    cyan: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    amber: 'bg-amber-950 text-amber-300 border-amber-800',
    rose: 'bg-rose-950 text-rose-300 border-rose-800',
  }[badgeColor];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
      <div
        className={`bg-slate-900 border border-slate-700 rounded-lg w-full ${maxWidth} max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans`}
      >
        {/* 窗口顶栏 */}
        <div className="h-12 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider truncate">
              {title}
            </h2>
            {badge && (
              <span
                className={`text-[10px] font-sans px-2 py-0.5 rounded border font-semibold shrink-0 ${badgeClasses}`}
              >
                {badge}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-slate-400 hidden md:inline truncate">
                · {subtitle}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="关闭当前窗口 (快捷键: Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 窗口滚动内容区 */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
