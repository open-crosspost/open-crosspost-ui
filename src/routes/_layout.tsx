import { Outlet, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import React from "react";

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center bg-white p-4 relative">
      <motion.div
        className="max-w-2xl text-center"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
        initial="hidden"
        animate="show"
      >
        <Outlet />
      </motion.div>
    </div>
  );
}
