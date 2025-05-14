import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

export function BackButton({ cleanup }: { cleanup: () => void }) {
  return (
    <Button
      size="sm"
      className="mr-2"
      onClick={() => {
        cleanup?.();
        window.history.back();
      }}
    >
      <ArrowLeft size={16} className="mr-1" />
      Back
    </Button>
  );
}
