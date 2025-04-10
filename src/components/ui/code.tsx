
import { cn } from "@/lib/utils";

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Code({ className, children, ...props }: CodeProps) {
  return (
    <code
      className={cn(
        "relative rounded bg-zinc-800 px-[0.3rem] py-[0.2rem] font-mono text-sm overflow-x-auto max-w-full block whitespace-pre-wrap",
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}
