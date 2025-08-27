"use client";
import { useState } from "react";
import { useCreateAssignment } from "@hooks/useAssignments";
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
      className="space-y-3"
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
        <Input placeholder="e.g., Homework 1" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2 items-end">
        <div className="grid gap-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
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
        <div className="grid gap-2">
          <Label>Due</Label>
          <Input type="datetime-local" className="[&::-webkit-calendar-picker-indicator]:opacity-70" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={!title || submitting}>
        {submitting ? (<span className="inline-flex items-center gap-2"><Spinner size={16} /> Adding…</span>) : "Add"}
      </Button>
    </form>
  );
}

export default AssignmentForm;


