import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, value, defaultValue, ...props }: React.ComponentProps<"input">) {
  // Always provide a string for value if it's not undefined or null
  // If value is provided as part of props, we use it, otherwise we fall back to ""
  // If defaultValue is used, we don't pass value at all to keep it uncontrolled
  const isControlled = value !== undefined;
  const controlledValue = isControlled ? (value ?? "") : undefined;

  return (
    <input
      type={type}
      data-slot="input"
      value={controlledValue}
      defaultValue={defaultValue}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
