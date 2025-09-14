"use client";

import { useState, useEffect } from "react";
import EditableTitle from "./EditableTitle";
import TypeArea from "./TypeArea";

interface NoteContent {
  id: string;
  title: string;
  content: string;
  tags: string[];
  dateRange?: string;
}

interface NotesContentProps {
  selectedNote: NoteContent | null; // the note that is currently selected
  onContentChange: (content: string) => void; // callback when user changes content
  onTitleChange: (newTitle: string) => void;
  soundEnabled: boolean;
}

export default function NotesContent({
  selectedNote,
  onContentChange,
  onTitleChange,
  soundEnabled,
}: NotesContentProps) {
  const [content, setContent] = useState(selectedNote?.content || "");

  // function to set the content of the note
  useEffect(() => {
    if (selectedNote) {
      setContent(selectedNote.content);
    }
  }, [selectedNote]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  if (!selectedNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-800">
          <h2 className="text-xl font-medium mb-2">No note selected</h2>
          <p>Select a note from the left sidebar to start writing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Header with Editable Title */}
      <div className="p-6 border-b border-gray-200">
        <EditableTitle
          title={selectedNote.title}
          onTitleChange={onTitleChange}
          className="text-2xl font-bold text-gray-900 mb-2 transition-colors cursor-pointer"
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl">
          {/* Date Range */}
          {selectedNote.dateRange && (
            <div className="mb-4">
              <span className="bg-gray-100 text-gray-600 px-3 py-1 text-sm">
                {selectedNote.dateRange}
              </span>
            </div>
          )}

          {/* Typewriter Textarea */}
          <TypeArea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing your notes here..."
            soundEnabled={soundEnabled}
          />
        </div>
      </div>
    </div>
  );
}
