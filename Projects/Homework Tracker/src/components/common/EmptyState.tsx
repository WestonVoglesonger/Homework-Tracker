import { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border rounded p-6 text-center text-muted-foreground">
      <div className="font-medium mb-2">{title}</div>
      {children && <div className="text-sm">{children}</div>}
    </div>
  );
}

export default EmptyState;


