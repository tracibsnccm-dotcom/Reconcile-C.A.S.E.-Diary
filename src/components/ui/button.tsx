import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "outline";
  size?: "sm" | "default";
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}) => {
  const baseStyle = "font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantStyle = variant === "outline" 
    ? "border border-gray-300 text-gray-700 hover:bg-gray-50" 
    : "bg-blue-600 text-white hover:bg-blue-700";
  const sizeStyle = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2";

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
