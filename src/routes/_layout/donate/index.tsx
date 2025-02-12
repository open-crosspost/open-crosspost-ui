import { accountId } from "@/App";
import { DonationFeed } from "@/components/donation-feed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NETWORK_ID,
  POTLOCK_DONATE_CONTRACT_ID,
  useDonate,
} from "@/lib/potlock";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import React, { useState } from "react";
import { isSignedIn, login } from "web4-api-js";

export const Route = createFileRoute("/_layout/donate/")({
  component: DonatePage,
});

function DonatePage() {
  const [amount, setAmount] = useState<string>("");
  const { mutate: donate } = useDonate();

  const handleDonate = () => {
    if (!amount) return;

    if (!isSignedIn()) {
      login({
        contractId: POTLOCK_DONATE_CONTRACT_ID[NETWORK_ID],
      });
      return;
    }

    donate({
      recipientId: accountId,
      donationAmount: parseFloat(amount),
    });
    setAmount("");
  };

  return (
    <div className="flex flex-col pt-36">
      {/* Support section - stays at the top */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 },
        }}
        className="flex-none"
      >
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-black">
            Support
          </h2>
          <p className="text-gray-600">
            Your support helps keep this project running and growing.
          </p>

          <div className="flex gap-4">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount in NEAR"
              className="flex-1 px-4 py-2 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all"
              min="0"
              step="0.1"
            />
            <Button
              variant="outline"
              onClick={handleDonate}
              disabled={!amount}
              className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
            >
              <Heart className="w-4 h-4 text-black mr-2" />
              <span className="text-black">Donate</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Feed section - scrolls below */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 },
        }}
        className="my-12"
      >
        <h3 className="text-2xl font-bold mb-4 text-black">Recent Donations</h3>
        <DonationFeed />
      </motion.div>
    </div>
  );
}
