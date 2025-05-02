import { getErrorMessage } from "@crosspost/sdk";
import {
  AccountActivityEntry,
  Filter,
  Platform,
  TimePeriod,
} from "@crosspost/types";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import React, { useState } from "react";
import { BackButton } from "../../../../components/back-button";
import { getClient } from "../../../../lib/authorization-service";

export const Route = createFileRoute("/_layout/_crosspost/leaderboard/")({
  component: LeaderboardPage,
});

// Function to fetch leaderboard data
const fetchLeaderboard = async ({
  limit,
  offset,
  timeframe,
  platform,
}: {
  limit: number;
  offset: number;
  timeframe: TimePeriod;
  platform?: string;
}) => {
  const client = getClient();

  const response = await client.activity.getLeaderboard({
    limit,
    offset,
    filter: {
      timeframe,
      platforms: [platform as Platform],
    },
  });

  return {
    entries: response.data?.entries || [],
    meta: response.meta || { pagination: { total: 0, limit, offset } },
  };
};

function LeaderboardPage() {
  const { wallet, signedAccountId } = useWalletSelector();

  const [timeframe, setTimeframe] = useState<TimePeriod>(TimePeriod.ALL);
  const [platform, setPlatform] = useState<string | undefined>(undefined);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "rank", desc: false },
  ]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    data: queryResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "leaderboard",
      pagination.pageIndex,
      pagination.pageSize,
      timeframe,
      platform,
      !!wallet,
      signedAccountId,
    ],
    queryFn: async () => {
      if (!wallet || !signedAccountId) {
        throw new Error("Wallet not connected");
      }

      return fetchLeaderboard({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        timeframe,
        platform,
      });
    },
    enabled: !!wallet && !!signedAccountId,
  });

  // Extract data and metadata from query result
  const data = queryResult?.entries || [];
  const totalEntries = queryResult?.meta?.pagination?.total || data.length; // Fallback to data.length if meta is not available

  const columnHelper = createColumnHelper<AccountActivityEntry>();
  const columns = [
    columnHelper.accessor("rank", {
      header: "Rank",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("signerId", {
      header: "NEAR Account",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <span>{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("totalPosts", {
      header: "Posts",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor((row) => (row as any).firstPostTimestamp, {
      id: "firstPostTimestamp",
      header: "First Post",
      cell: (info) => {
        const timestamp = info.getValue();
        if (!timestamp) return "N/A";
        try {
          const date = new Date(timestamp);
          if (isNaN(date.getTime())) return "Invalid Date";
          return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch (e) {
          console.error("Error parsing first post date:", timestamp, e);
          return "Invalid Date";
        }
      },
    }),
    columnHelper.accessor("lastActive", {
      header: "Last Active",
      cell: (info) => {
        const dateTimeString = info.getValue();
        if (!dateTimeString) return "N/A";
        try {
          const date = new Date(dateTimeString);
          if (isNaN(date.getTime())) return "Invalid Date"; // Check if date is valid
          return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch (e) {
          console.error("Error parsing last active date:", dateTimeString, e);
          return "Invalid Date";
        }
      },
    }),
  ];

  // Initialize TanStack Table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true, // Keep manual pagination
    // pageCount is derived from totalEntries fetched from API
    pageCount:
      totalEntries > 0 ? Math.ceil(totalEntries / pagination.pageSize) : -1, // Use -1 or 0 if total unknown initially
    // Alternatively, if totalEntries is 0 initially: pageCount: Math.max(1, Math.ceil(totalEntries / pagination.pageSize))
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4">
        <BackButton />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Time Period</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as TimePeriod)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value={TimePeriod.DAILY}>Last 24 Hours</option>
            <option value={TimePeriod.WEEKLY}>Last Week</option>
            <option value={TimePeriod.MONTHLY}>Last Month</option>
            <option value={TimePeriod.YEARLY}>Last Year</option>
            <option value={TimePeriod.ALL}>All Time</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select
            value={platform || ""}
            // Update platform state correctly using Platform enum values
            onChange={(e) => setPlatform(e.target.value || undefined)} // Keep as string for value, handle conversion in fetch
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">All Platforms</option>
            {/* Use Platform enum keys/values for options */}
            {Object.entries(Platform).map(([key, value]) => (
              <option key={key} value={value}>
                {" "}
                {/* Use enum value */}
                {key} {/* Display enum key */}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {getErrorMessage(error, "Failed to fetch leaderboard data")}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getIsSorted() === "asc" ? (
                            <span>▲</span>
                          ) : header.column.getIsSorted() === "desc" ? (
                            <span>▼</span>
                          ) : null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.getRowModel()?.rows?.length > 0 ? (
                  table.getRowModel()?.rows?.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells()?.map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap text-sm"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {"<<"}
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {"<"}
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {">"}
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {">>"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">
                Page{" "}
                <strong>
                  {table.getState().pagination.pageIndex + 1} of{" "}
                  {/* Use table.getPageCount() which relies on totalEntries */}
                  {table.getPageCount() > 0 ? table.getPageCount() : 1}
                </strong>
              </span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                className="border rounded px-2 py-1"
              >
                {[10, 25, 50, 100].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
