import React from 'react';
import { cn } from '../../lib/utils'; // Import the helper we just created

export const Card = ({ children, className = "", ...props }) => (
  <div 
    className={cn(
      "rounded-xl border shadow-sm transition-all", 
      "bg-slate-800 border-slate-700 text-slate-200", // Default Dark Theme
      className
    )}
    {...props} 
  >
    {children}
  </div>
);