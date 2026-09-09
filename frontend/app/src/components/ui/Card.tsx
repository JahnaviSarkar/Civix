import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-2xl border border-[#D9F0FF] shadow-xs overflow-hidden p-6 transition-all hover:shadow-md hover:border-[#89B9E6]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
