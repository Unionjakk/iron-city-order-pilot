
import React from "react";
import { Input } from "@/components/ui/input";

interface NotesInputProps {
  note: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NotesInput = ({ note, onChange }: NotesInputProps) => {
  return (
    <Input
      placeholder="Add notes here..." 
      className="h-8 border-zinc-700 bg-zinc-800/50 text-zinc-300 w-full"
      value={note}
      onChange={onChange}
    />
  );
};

export default NotesInput;
