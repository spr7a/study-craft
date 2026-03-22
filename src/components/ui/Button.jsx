import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-text-primary text-white rounded-sm hover:-translate-y-[1px] hover:shadow-sm",
        secondary: "bg-transparent border-[1.5px] border-[#D4D2CC] text-text-primary rounded-sm hover:-translate-y-[1px] hover:shadow-sm",
        ghost: "bg-transparent text-text-primary hover:underline underline-offset-4 rounded-sm",
        tag: "bg-bg-tertiary text-text-secondary rounded-pill hover:bg-[#D4D2CC] hover:text-text-primary tracking-[0.06em] text-xs uppercase",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
        tag: "h-6 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
