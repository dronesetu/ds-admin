import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 backdrop-blur-md transition-all duration-300 hover:border-zinc-700/60 hover:shadow-lg hover:shadow-emerald-950/5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
    label?: string;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, change, className = '' }: StatsCardProps) {
  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          <h4 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">{value}</h4>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-emerald-400">
          {icon}
        </div>
      </div>
      
      {change && (
        <div className="mt-4 flex items-center gap-1.5">
          {change.type === 'increase' && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              {change.value}
            </span>
          )}
          {change.type === 'decrease' && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
              <ArrowDownRight className="h-3 w-3" />
              {change.value}
            </span>
          )}
          {change.type === 'neutral' && (
            <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-400">
              {change.value}
            </span>
          )}
          {change.label && (
            <span className="text-xs text-zinc-500">{change.label}</span>
          )}
        </div>
      )}
    </Card>
  );
}
