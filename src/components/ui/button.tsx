import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-custom-md hover:shadow-glow hover:-translate-y-0.5 transition-all ease-spring",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-custom-sm hover:shadow-custom-md hover:-translate-y-0.5",
        outline: "border-2 border-primary/20 bg-background hover:bg-primary/5 hover:border-primary/40 text-foreground shadow-custom-sm hover:shadow-custom-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-custom-sm hover:shadow-custom-md hover:-translate-y-0.5",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground transition-colors",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-custom-sm hover:shadow-glow hover:-translate-y-0.5",
        accent: "bg-gradient-accent text-accent-foreground hover:shadow-accent-glow shadow-custom-md hover:-translate-y-0.5 transition-all ease-spring",
        fun: "bg-gradient-fun text-white hover:shadow-custom-xl hover:-translate-y-1 shadow-custom-lg animate-pulse-glow transition-all ease-spring font-bold",
        professional: "bg-gradient-primary text-white hover:shadow-glow shadow-custom-md hover:-translate-y-0.5 transition-all ease-spring",
        card: "bg-card text-card-foreground border-2 border-border hover:border-primary/30 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg font-semibold",
        icon: "h-11 w-11",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
