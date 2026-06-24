import React from 'react';
import { translate } from '../../utils/translate';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{translate(title)}</h1>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
