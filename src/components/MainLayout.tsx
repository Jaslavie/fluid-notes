"use client";

import { useState } from "react";
import NotesList from "@/components/NotesList";
import NotesContent from "./NotesContent";
import SoundToggle from "./tokens/SoundToggle";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  dateRange?: string;
  isSelected: boolean;
}

export default function MainLayout() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true); // Default to ON

  const handleNoteSelect = (noteId: string) => {
    setNotes(
      notes.map((note) => ({
        ...note,
        isSelected: note.id === noteId,
      }))
    );
    setSelectedNoteId(noteId);
  };

  const handleNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "New Note",
      content: "",
      tags: [],
      isSelected: true,
    };

    setNotes(notes.map((note) => ({ ...note, isSelected: false })));
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  };

  const handleTitleChange = (noteId: string, newTitle: string) => {
    setNotes(
      notes.map((note) =>
        note.id === noteId ? { ...note, title: newTitle } : note
      )
    );
  };

  const handleSelectedNoteTitleChange = (newTitle: string) => {
    if (selectedNoteId) {
      handleTitleChange(selectedNoteId, newTitle);
    }
  };

  const handleContentChange = (content: string) => {
    if (!selectedNoteId) return;
    setNotes(
      notes.map((note) =>
        note.id === selectedNoteId ? { ...note, content } : note
      )
    );
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const selectedNote = selectedNoteId
    ? notes.find((note) => note.id === selectedNoteId) || null
    : null;

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Sound Toggle Component */}
      <SoundToggle soundEnabled={soundEnabled} onToggle={toggleSound} />

      <NotesList
        notes={notes}
        onNoteSelect={handleNoteSelect}
        onNewNote={handleNewNote}
        onTitleChange={handleTitleChange}
      />
      <NotesContent
        selectedNote={selectedNote}
        onContentChange={handleContentChange}
        onTitleChange={handleSelectedNoteTitleChange}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}
