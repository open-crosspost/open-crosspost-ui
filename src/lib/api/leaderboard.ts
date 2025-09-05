import { useQuery } from "@tanstack/react-query";
import { getClient } from "@/lib/authorization-service";
import { TimePeriod, AccountActivityEntry } from "@crosspost/types";

export const fetchLeaderboard = async ({
  limit,
  offset,
  timeframe,
  startDate,
  endDate,
  platforms,
}: {
  limit: number;
  offset: number;
  timeframe: TimePeriod;
  startDate?: string;
  endDate?: string;
  platforms?: string[];
}): Promise<{ entries: AccountActivityEntry[]; meta?: { pagination: { total: number } } }> => {
  const client = getClient();
  const response = await client.activity.getLeaderboard({
    limit,
    offset,
    timeframe,
    startDate,
    endDate,
    platforms,
  });
  
  // Handle nested response structure
  const responseData = response.data;
  let entries: any[] = [];
  let meta: any = { pagination: { total: 0 } };

  if (responseData) {
    // Check if entries is directly an array
    if (Array.isArray(responseData.entries)) {
      entries = responseData.entries;
      meta = responseData.meta || meta;
    } 
    // Check if entries is an object with nested entries
    else if (responseData.entries && Array.isArray(responseData.entries.entries)) {
      entries = responseData.entries.entries;
      meta = responseData.entries.meta || meta;
    }
    // Check if the entire response is an array
    else if (Array.isArray(responseData)) {
      entries = responseData;
    }
  }

  return {
    entries,
    meta
  };
};

export const useLeaderboardQuery = (limit: number = 3) => {
  return useQuery<AccountActivityEntry[]>({
    queryKey: ["leaderboard", limit],
    queryFn: async () => {
      const result = await fetchLeaderboard({ 
        limit, 
        offset: 0, 
        timeframe: TimePeriod.ALL 
      });
      return result.entries; // Return just the entries array
    },
  });
};
