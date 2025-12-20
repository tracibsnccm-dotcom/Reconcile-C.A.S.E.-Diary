import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const baseStyle = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const variantStyle = variant === "outline" 
    ? "border border-gray-400 text-gray-700" 
    : "bg-gray-100 text-gray-800";

  return (
    <div className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};
