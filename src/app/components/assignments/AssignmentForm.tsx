"use client";
import { useState } from "react";
import { useCreateAssignment } from "@/app/hooks/useAssignments";
import { assignmentTypeEnum } from "@/lib/validators";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { Label } from "@components/ui/label";

export function AssignmentForm({ courseId, onCreated }: { courseId?: string; onCreated?: () => void }) {
  const create = useCreateAssignment();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("OTHER");
  const [dueAt, setDueAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await create.mutateAsync({ courseId, title, type, dueAt: dueAt || undefined });
        setTitle("");
        setDueAt("");
        onCreated?.();
        setSubmitting(false);
      }}
    >
      <div className="grid gap-2">
        <Label>Title</Label>
        <Input placeholder="e.g., Homework 1" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 text-base px-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-end">
        <div className="grid gap-2 min-w-0 md:w-[200px]">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full h-10 text-sm px-3 overflow-hidden text-ellipsis">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {assignmentTypeEnum.options.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 min-w-0">
          <Label>Due (optional)</Label>
          <Input
            type="datetime-local"
            className="w-full h-10 min-w-0 text-sm px-3 [&::-webkit-calendar-picker-indicator]:opacity-70"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!title || submitting} className="px-5">
          {submitting ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Adding…</span>) : "Add"}
        </Button>
      </div>
    </form>
  );
}

export default AssignmentForm;


