import { accountId } from "@/App";
import { useGetDonationsForRecipient } from "@/lib/potlock";
import { formatNearAmount } from "@near-js/utils";
import { motion } from "framer-motion";
import React from "react";

export function DonationFeed() {
  const { data: donationsData, isLoading } = useGetDonationsForRecipient({
    recipientId: accountId,
  });
  // Check if we have any valid donations
  const hasValidDonations = React.useMemo(() => {
    if (!donationsData) return false;
    return Array.isArray(donationsData) && donationsData.length > 0;
  }, [donationsData]);

  // Only process donations if we have valid data
  const allDonations = React.useMemo(() => {
    if (!hasValidDonations) return [];
    return donationsData || [];
  }, [donationsData, hasValidDonations]);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="text-center py-8 text-gray-600 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-white"
        >
          Loading donations...
        </motion.div>
      ) : !hasValidDonations ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="text-center py-8 text-gray-600 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-white"
        >
          No donations yet...
          <br />
          please donate ❤️
        </motion.div>
      ) : (
        allDonations.map((donation, index) => (
          <motion.div
            key={`${donation.donor_id}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.4,
              ease: [0.23, 1, 0.32, 1],
              delay: index * 0.1, // Add 0.1s delay for each subsequent item
            }}
            className="p-4 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-white transform-gpu"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-black">
                {donation.donor_id}
              </span>
              <span className="text-gray-600">
                {formatNearAmount(donation.total_amount)} NEAR
              </span>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
