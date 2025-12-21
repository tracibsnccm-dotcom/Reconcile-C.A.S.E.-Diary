import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div className={`border-b p-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <h3 className={`text-xl font-semibold ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
};
