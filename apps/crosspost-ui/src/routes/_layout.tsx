import { Outlet, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import React from "react";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
// import { HelperBuddy } from "../components/helper-buddy";

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <>
      <div className="min-h-screen p-2 relative">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto min-h-[calc(100vh-1rem)] w-full border-2 border-primary  bg-white dark:bg-black shadow-[4px_4px_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_rgba(255,255,255,0.3)]"
        >
          <Header />
          <div className="p-2 sm:p-4 md:p-8">
            <Outlet />
          </div>
        </motion.div>
      </div>
      {/* <HelperBuddy /> */}
      <Footer />
    </>
  );
}
