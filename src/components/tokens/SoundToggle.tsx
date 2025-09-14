"use client";

interface SoundToggleProps {
  soundEnabled: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ soundEnabled, onToggle }: SoundToggleProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-2">
      <span className="text-gray-700 font-medium">Sound</span>
      <button
        onClick={onToggle}
        className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-color ${
          soundEnabled ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            soundEnabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}