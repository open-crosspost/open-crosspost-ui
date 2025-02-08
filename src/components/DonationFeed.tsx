import React from "react";
import { useGetAllDonations } from "@/lib/potlock";
import { motion, AnimatePresence } from "framer-motion";

export function DonationFeed() {
  const {
    data: donationsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGetAllDonations(20);
  const observerTarget = React.useRef<HTMLDivElement>(null);

  // Set up infinite scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        threshold: 0.5,
        rootMargin: "20px",
      },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  // Check if we have any valid donations
  const hasValidDonations = React.useMemo(() => {
    if (!donationsData?.pages?.[0]) return false;
    return (
      Array.isArray(donationsData.pages[0]) && donationsData.pages[0].length > 0
    );
  }, [donationsData?.pages]);

  // Only process donations if we have valid data
  const allDonations = React.useMemo(() => {
    if (!hasValidDonations) return [];
    return donationsData!.pages.flatMap((page) => page || []);
  }, [donationsData?.pages, hasValidDonations]);

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
            }}
            className="p-4 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-white transform-gpu"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-black">
                {donation.donor_id}
              </span>
              <span className="text-gray-600">
                {donation.total_amount} NEAR
              </span>
            </div>
          </motion.div>
        ))
      )}

      {/* Only show observer if we have valid donations and there might be more */}
      {hasValidDonations && hasNextPage && (
        <div ref={observerTarget} className="h-4" />
      )}

      <AnimatePresence>
        {isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-center py-4 text-gray-600"
          >
            Loading more donations...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
