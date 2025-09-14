"use client";

import NoteItem from "./NoteItem";
import Button from "../tokens/Button";

interface Note {
  id: string;
  title: string;
  isSelected: boolean;
}

interface NotesListProps {
  notes: Note[];
  onNoteSelect: (noteId: string) => void;
  onNewNote: () => void;
  onTitleChange: (noteId: string, newTitle: string) => void;
}

export default function NotesList({
  notes,
  onNoteSelect,
  onNewNote,
  onTitleChange,
}: NotesListProps) {
  return (
    <div className="w-64 h-screen flex flex-col">
      <div className="p-4">
        <Button onClick={onNewNote}>+ new note</Button>
      </div>

      {/* Notes List Container */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No notes yet</p>
            <p className="text-xs mt-1">
              Click &quot;+ new note&quot; to get started
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onNoteSelect={onNoteSelect}
              onTitleChange={onTitleChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
