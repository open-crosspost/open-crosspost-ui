import { motion } from "framer-motion";
import { PenSquare } from "lucide-react";
import React from "react";

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 1,
        }}
      >
        <PenSquare size={48} className="text-gray-500" />
      </motion.div>
      {message && <p className="mt-4 text-lg text-gray-600">{message}</p>}
    </div>
  );
};
