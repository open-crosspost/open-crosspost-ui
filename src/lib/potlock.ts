import { parseNearAmount } from "@near-js/utils";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { call, view } from "web4-api-js";

export const NETWORK_ID = "mainnet";

export const POTLOCK_DONATE_CONTRACT_ID = {
  mainnet: "donate.potlock.near",
  testnet: "donate.potlock.testnet",
} as const;

interface Donation {
  donor_id: string;
  total_amount: string;
}

export function useGetAllDonations(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ["all-donations"],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const donations = (await view(
          POTLOCK_DONATE_CONTRACT_ID[NETWORK_ID],
          "get_donations",
          {
            from_index: pageParam,
            limit,
          },
        )) as Donation[];

        // Handle empty responses or invalid data
        if (!donations || !Array.isArray(donations)) {
          return [];
        }

        return donations.reverse(); // most recent first
      } catch (error) {
        console.error("Error fetching donations:", error);
        return [];
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the page is empty or has fewer items than limit, we're at the end
      if (!lastPage || lastPage.length < limit) {
        return undefined;
      }

      // Calculate next index
      return allPages.length * limit;
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    initialPageParam: 0,
  });
}

export function useGetDonationsForRecipient({
  recipientId,
}: {
  recipientId?: string;
}) {
  return useQuery({
    queryKey: ["donations", recipientId],
    queryFn: async () => {
      try {
        if (!recipientId) return [];

        const donations = (await view(
          POTLOCK_DONATE_CONTRACT_ID[NETWORK_ID],
          "get_donations_for_recipient",
          { recipient_id: recipientId },
        )) as Donation[];

        // Handle empty responses or invalid data
        if (!donations || !Array.isArray(donations)) {
          return [];
        }

        return donations.reverse();
      } catch (error) {
        console.error("Error fetching recipient donations:", error);
        return [];
      }
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    enabled: !!recipientId,
  });
}

interface DonateParams {
  recipientId: string;
  donationAmount: number;
}

export function useDonate() {
  return useMutation({
    mutationFn: async ({ recipientId, donationAmount }: DonateParams) => {
      try {
        const deposit = parseNearAmount(donationAmount.toString());
        if (!deposit) {
          throw new Error("Invalid donation amount");
        }

        return await call(
          POTLOCK_DONATE_CONTRACT_ID[NETWORK_ID],
          "donate",
          { recipient_id: recipientId },
          { deposit }
        );
      } catch (error) {
        console.error("Error in donation:", error);
        throw error;
      }
    },
  });
}
