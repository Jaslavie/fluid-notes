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
      className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-100 transition-colors ${
        note.isSelected ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
      }`}
      onClick={handleClick}
    >
      <EditableTitle
        title={note.title}
        onTitleChange={handleTitleChange}
        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
        tag="h3" // Use h3 for note items in the sidebar
      />
    </div>
  );
}
