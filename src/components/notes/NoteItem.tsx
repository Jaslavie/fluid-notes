"use client";

import { useState } from "react";

interface Note {
  id: string;
  title: string;
  isSelected: boolean;
}

interface NoteItemProps {
  note: Note;
  onNoteSelect: (noteId: string) => void;
  onTitleChange: (noteId: string, newTitle: string) => void;
}

export default function NoteItem({
  note,
  onNoteSelect,
  onTitleChange,
}: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);

  const handleTitleClick = () => {
    setIsEditing(true);
    setEditTitle(note.title);
  };

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle.trim() !== note.title) {
      onTitleChange(note.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(note.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  const handleClick = () => {
    if (!isEditing) {
      onNoteSelect(note.id);
    }
  };

  return (
    <div
      className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-100 transition-colors ${
        note.isSelected ? "note-selected" : ""
      }`}
      onClick={handleClick}
    >
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleTitleSubmit}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none font-medium text-gray-700"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <h3
          className="font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleTitleClick();
          }}
        >
          {note.title}
        </h3>
      )}
    </div>
  );
}
