import React, { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 hidden w-max -translate-x-1/2 rounded bg-black px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100 z-50">
        {text}
        <div className="absolute left-1/2 top-full -mt-1 h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-black"></div>
      </div>
    </div>
  );
};