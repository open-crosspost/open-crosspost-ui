import * as React from "react";
import { X } from "lucide-react";

interface ModalWindowControlsProps {
  onClose: () => void;
}

export function ModalWindowControls({ onClose }: ModalWindowControlsProps): React.ReactElement {
  return (
    <div className="flex items-center justify-end border-b-2 border-gray-800 p-2">
      <button
        onClick={onClose}
        className="rounded-full h-6 w-6 flex items-center justify-center hover:bg-gray-100"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}
