import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

export function BackButton() {
  return (
    <Button size="sm" className="mr-2" onClick={() => window.history.back()}>
      <ArrowLeft size={16} className="mr-1" />
      Back
    </Button>
  );
}
