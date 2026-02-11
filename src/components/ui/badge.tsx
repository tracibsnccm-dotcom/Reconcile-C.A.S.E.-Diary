import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        platinum: "bg-gradient-to-br from-[#E5E4E2] to-[#B8B8B8] border-[#A0A0A0] text-black font-bold shadow-[inset_0_1px_3px_rgba(255,255,255,0.6),0_1px_3px_rgba(0,0,0,0.3)] [text-shadow:0_1px_1px_rgba(255,255,255,0.7)]",
        gold: "bg-gradient-to-br from-[#FFD700] to-[#B09837] border-[#B09837] text-black font-bold shadow-[inset_0_1px_3px_rgba(255,255,255,0.6),0_1px_3px_rgba(0,0,0,0.3)] [text-shadow:0_1px_1px_rgba(255,255,255,0.7)]",
        silver: "bg-gradient-to-br from-[#C0C0C0] to-[#9E9E9E] border-[#9E9E9E] text-black font-bold shadow-[inset_0_1px_3px_rgba(255,255,255,0.6),0_1px_3px_rgba(0,0,0,0.3)] [text-shadow:0_1px_1px_rgba(255,255,255,0.7)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
