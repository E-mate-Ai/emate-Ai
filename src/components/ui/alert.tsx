import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border text-sm transition-all [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-1px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-card/95 border-border text-text-primary shadow-xl backdrop-blur-md",
        destructive:
          "border-destructive/40 text-destructive bg-destructive/10 backdrop-blur-md",
        info: "bg-card/95 border-border text-text-primary shadow-xl backdrop-blur-md",
      },
      layout: {
        default: "p-4",
        complex: "p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        row: "p-4 flex items-center justify-between gap-4",
      },
      size: {
        default: "p-4 text-sm",
        sm: "p-3 text-xs",
        lg: "p-4 md:p-5 text-sm",
      },
      isNotification: {
        true: "shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-400 ease-out",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      layout: "default",
      size: "default",
      isNotification: false,
    },
  }
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, layout, size, isNotification, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant, layout, size, isNotification, className }))}
      {...props}
    />
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-display text-sm font-semibold leading-tight tracking-tight text-text-primary", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs text-text-secondary [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription, alertVariants }
