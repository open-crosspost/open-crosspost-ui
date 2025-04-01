import React, { useEffect, useState } from "react";
import { DndContext, useDraggable } from "@dnd-kit/core";
import { ProfileHighlight } from "./social/profile-highlight";

interface Position {
  x: number;
  y: number;
}

interface DragEndEvent {
  delta: {
    x: number;
    y: number;
  };
}

function DraggableProfileHighlight({ position }: { position: Position }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "profile-highlight",
  });

  const helperAccount = "shitzu.sputnik-dao.near";
  const helperContent = '"Happy Birthday $SHITZU!"';

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        cursor: "grab",
        touchAction: "none",
        ...style,
      }}
      {...listeners}
      {...attributes}
    >
      <ProfileHighlight
        accountId={helperAccount}
        tooltipContent={helperContent}
        size={64}
      />
    </div>
  );
}

export function HelperBuddy() {
  const [position, setPosition] = useState({ x: 16, y: 16 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPosition({
        x: 16,
        y: window.innerHeight - 96,
      });
    }

    // Update position if window is resized
    const handleResize = () => {
      setPosition({
        x: 16,
        y: window.innerHeight - 96,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setPosition((prev) => ({
      x: prev.x + delta.x,
      y: prev.y + delta.y,
    }));
  };

  return (
    <div className="fixed z-[9999]" id="helper-buddy">
      <DndContext onDragEnd={handleDragEnd}>
        <DraggableProfileHighlight position={position} />
      </DndContext>
    </div>
  );
}
