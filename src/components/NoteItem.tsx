"use client";

import EditableTitle from "./EditableTitle";

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
  const handleClick = () => {
    onNoteSelect(note.id);
  };

  // 
  const handleTitleChange = (newTitle: string) => {
    onTitleChange(note.id, newTitle);
  };

  return (
    <div
      className={`py-2 px-4 cursor-pointer border-0 transition-colors`}
      onClick={handleClick}
    >
      <EditableTitle
        title={note.title}
        onTitleChange={handleTitleChange}
        className="font-medium text-gray-900 transition-colors"
        tag="h4" 
      />
    </div>
  );
}
