import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRightIcon, Heart, PenSquare } from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_layout/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  const title = `
open crosspost
  `;

  const description = `
An open-source interface for seamless social media crossposting.
  `;

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8 pt-36">
      {/* Logo */}
      <motion.div variants={item}>
        <div className="mx-auto w-20 h-20 bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center transform hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all">
          <PenSquare className="w-10 h-10 text-black" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={item}
        className="text-5xl md:text-6xl font-bold tracking-tight text-black"
      >
        {title}
      </motion.h1>

      {/* Description */}
      <motion.div variants={item}>
        <ReactMarkdown className="markdown">{description}</ReactMarkdown>
      </motion.div>

      {/* Donate Button */}
      <motion.div variants={item}>
        <div className="flex flex-col items-center gap-2">
          <div className="w-[200px]">
            <Button
              variant="outline"
              className="w-full justify-start group border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
              onClick={() =>
                (window.location.href = "https://crosspost.everything.dev")
              }
            >
              <ArrowUpRightIcon className="w-4 h-4 text-black mr-2" />
              <span className="text-black">Get Started</span>
            </Button>
            <Button
              variant="outline"
              className="w-full mt-2 justify-start group border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
              onClick={() => navigate({ to: "/donate" })}
            >
              <Heart className="w-4 h-4 text-black mr-2" />
              <span className="text-black">Support the Project</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
