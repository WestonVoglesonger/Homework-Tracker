import { cn } from "./cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 shimmer",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
