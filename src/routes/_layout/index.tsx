import { Button } from "@/components/ui/button";
import { ThingComponent } from "@/components/Thing";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Edit2 } from "lucide-react";
import React from "react";

export const Route = createFileRoute("/_layout/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pt-36">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-end mb-4"
      >
        <Button
          variant="outline"
          className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
          onClick={() => navigate({ to: "/edit" })}
        >
          <Edit2 className="w-4 h-4 text-black mr-2" />
          <span className="text-black">Edit</span>
        </Button>
      </motion.div>

      {/* The ThingComponent will try to load from thing.json if available, 
          otherwise fall back to localStorage or default data */}
      <ThingComponent path="thing.json" />
    </div>
  );
}
