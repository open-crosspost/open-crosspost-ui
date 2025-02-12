import { accountId } from "@/App";
import { Button } from "@/components/ui/button";
import { getImageUrl, getProfile, getSocialLink } from "@/lib/social";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRightIcon, Heart } from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_layout/")({
  loader: async () => {
    try {
      if (accountId) return await getProfile(accountId);
    } catch (error) {
      // Return null to indicate profile fetch failed
      return null;
    }
  },
  component: Index,
});

function Index() {
  const profile = Route.useLoaderData();
  const navigate = useNavigate();

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8 pt-36">
      {/* Logo */}
      <motion.div variants={item}>
        <div className="mx-auto w-20 h-20 bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center transform hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all rounded-md">
          <img
            src={getImageUrl(profile?.image)}
            alt={profile?.name || "Logo"}
            className="w-full h-full object-fit"
          />
          {/* <PenSquare className="w-10 h-10 text-black" /> */}
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={item}
        className="text-5xl md:text-6xl font-bold tracking-tight text-black"
      >
        {profile?.name}
      </motion.h1>

      {/* Description */}
      <motion.div variants={item}>
        <ReactMarkdown className="markdown">
          {profile?.description}
        </ReactMarkdown>
      </motion.div>

      <div className="flex flex-col items-center gap-2">
        <motion.div variants={item}>
          <div className="w-[200px]">
            <Button
              variant="outline"
              className="w-full justify-start group border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
              onClick={() =>
                (window.location.href = getSocialLink(
                  "website",
                  profile?.linktree?.website ?? "everything.dev",
                ))
              }
            >
              <ArrowUpRightIcon className="w-4 h-4 text-black mr-2" />
              <span className="text-black">Use the app</span>
            </Button>
          </div>
        </motion.div>
        <motion.div variants={item}>
          <div className="w-[200px]">
            <Button
              variant="outline"
              className="w-full mt-2 justify-start group border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
              onClick={() => navigate({ to: "/donate" })}
            >
              <Heart className="w-4 h-4 text-black mr-2" />
              <span className="text-black">Support the Project</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
