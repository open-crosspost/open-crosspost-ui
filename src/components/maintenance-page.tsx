import { motion } from "framer-motion";
import { PenSquare, Wrench } from "lucide-react";
import * as React from "react";

export function MaintenancePage() {
  return (
    <div className="min-h-screen p-1 sm:p-2 md:p-8 relative">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-auto min-h-[calc(100vh-0.5rem)] sm:min-h-[790px] w-full sm:max-w-4xl border-2 border-gray-800 bg-white shadow-[2px_2px_0_rgba(0,0,0,1)] sm:shadow-[4px_4px_0_rgba(0,0,0,1)]"
      >
        {/* Header */}
        <div className="border-b-2 border-gray-800 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <PenSquare size={24} />
            <h1 className="text-3xl font-bold">crosspost</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-8 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="max-w-md"
          >
            <div className="mb-6">
              <Wrench size={64} className="mx-auto text-gray-600" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Under Maintenance</h2>
            <p className="text-lg text-gray-700 mb-2">
              Crosspost is temporarily under maintenance.
            </p>
            <p className="text-lg text-gray-700">We'll be back soon.</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="flex justify-between m-2 sm:m-4 font-mono text-gray-500 text-xs sm:text-sm">
        <div className="flex gap-2">
          <a
            href="https://app.potlock.org/?tab=project&projectId=crosspost.near"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border-2 border-gray-800 bg-white hover:shadow-[1px_1px_0_rgba(0,0,0,1)] transition-all"
          >
            donate ❤️
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <span>a part of</span>
            <a
              href="https://everything.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <img
                src="/black-dot.svg"
                alt="everything"
                className="w-[16px] h-[16px] sm:w-[24px] sm:h-[24px]"
              />
            </a>
          </div>
          <div className="w-28 sm:w-36">
            <img
              src="/built-on-near.svg"
              alt="built on near"
              className="w-full h-auto"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
