import * as React from "react";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({ className = "", ...props }) => {
  return (
    <div className={`border-t ${className}`} {...props} />
  );
};
