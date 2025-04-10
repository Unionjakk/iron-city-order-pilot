
import * as React from "react"
import { cn } from "@/lib/utils"

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ className, ...props }, ref) => {
    return (
      <code
        ref={ref}
        className={cn(
          "relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm",
          className
        )}
        {...props}
      />
    )
  }
)
Code.displayName = "Code"

export { Code }
