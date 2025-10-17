import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 hover:shadow-[2px_2px_0_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0_rgba(255,255,255,0.3)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none min-h-[36px] touch-manipulation rounded-none",
  {
    variants: {
      variant: {
        default:
          "bg-white dark:bg-black text-primary dark:text-white border-2 border-primary hover:bg-gray-50 dark:hover:bg-gray-900 base-component",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 base-component",
        outline:
          "border-2 border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground base-component",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 base-component",
        ghost:
          "hover:bg-accent hover:text-accent-foreground base-component-ghost",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
