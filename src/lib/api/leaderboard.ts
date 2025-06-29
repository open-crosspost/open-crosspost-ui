import { useQuery } from "@tanstack/react-query";
import { getClient } from "@/lib/authorization-service";
import { TimePeriod, AccountActivityEntry } from "@crosspost/types";

export const fetchLeaderboard = async ({
  limit,
  offset,
  timeframe,
}: {
  limit: number;
  offset: number;
  timeframe: TimePeriod;
}): Promise<AccountActivityEntry[]> => {
  const client = getClient();
  const response = await client.activity.getLeaderboard({
    limit,
    offset,
    timeframe,
  });
  return response.data?.entries || [];
};

export const useLeaderboardQuery = (limit: number = 3) => {
  return useQuery<AccountActivityEntry[]>({
    queryKey: ["leaderboard", limit],
    queryFn: () =>
      fetchLeaderboard({ limit, offset: 0, timeframe: TimePeriod.ALL }),
  });
};
