import { InlineBadges } from "@/components/badges/inline-badges";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@crosspost/sdk";
import {
  AccountActivityEntry,
  ActivityLeaderboardQuerySchema,
  Platform,
  TimePeriod,
} from "@crosspost/types";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
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
  validateSearch: (search) => ActivityLeaderboardQuerySchema.parse(search),
});

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
    timeframe,
    platforms: [platform as Platform],
  });

  return {
    entries: response.data?.entries || [],
    meta: response.meta || { pagination: { total: 0, limit, offset } },
  };
};

function LeaderboardPage() {
  const search = useSearch({ from: Route.id });
  const { timeframe, platforms } = search;
  const navigate = useNavigate({ from: Route.fullPath });
  const { wallet, signedAccountId } = useWalletSelector();

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
      platforms,
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
        timeframe: timeframe ?? TimePeriod.ALL,
        // platforms,
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
      cell: (info) => <div className="w-[20px]">{info.getValue()}</div>,
    }),
    columnHelper.accessor("signerId", {
      header: "NEAR Account",
      cell: (info) => {
        const accountId = info.getValue();
        return (
          <div className="flex items-center gap-2 w-[120px]">
            <Link
              to={`/profile/$accountId`}
              params={{ accountId }}
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors block truncate"
            >
              {accountId}
            </Link>
            <InlineBadges accountId={accountId} />
          </div>
        );
      },
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
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-4">
        <BackButton />
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <Label className="block text-sm font-medium mb-1">
              Time Period
            </Label>
            <Select
              value={timeframe}
              onValueChange={(v) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    timeframe: (v as TimePeriod) || undefined,
                  }),
                  replace: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TimePeriod.DAILY}>Last 24 Hours</SelectItem>
                <SelectItem value={TimePeriod.WEEKLY}>Last Week</SelectItem>
                <SelectItem value={TimePeriod.MONTHLY}>Last Month</SelectItem>
                <SelectItem value={TimePeriod.YEARLY}>Last Year</SelectItem>
                <SelectItem value={TimePeriod.ALL}>All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select
            value={platforms}
            // Update platform state correctly using Platform enum values
            onChange={(e) => setPlatform(e.target.value || undefined)} // Keep as string for value, handle conversion in fetch
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">All Platforms</option>
            {Object.entries(Platform).map(([key, value]) => (
              <option key={key} value={value}>
                {" "}
                {key}
              </option>
            ))}
          </select>
        </div> */}
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
          <div className="overflow-x-auto base-component rounded-lg">
            <Table className="min-w-full">
              <TableHeader className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
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
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="bg-white divide-y divide-gray-200">
                {table.getRowModel()?.rows?.length > 0 ? (
                  table.getRowModel()?.rows?.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells()?.map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap text-sm"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 disabled:opacity-50"
              >
                {"<<"}
              </Button>
              <Button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 disabled:opacity-50"
              >
                {"<"}
              </Button>
              <Button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 disabled:opacity-50"
              >
                {">"}
              </Button>
              <Button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 disabled:opacity-50"
              >
                {">>"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Page{" "}
                  <strong>
                    {table.getState().pagination.pageIndex + 1} of{" "}
                    {/* Use table.getPageCount() which relies on totalEntries */}
                    {table.getPageCount() > 0 ? table.getPageCount() : 1}
                  </strong>
                </Label>
                <Select
                  value={table.getState().pagination.pageSize.toString()}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select page size" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((pageSize) => (
                      <SelectItem key={pageSize} value={pageSize.toString()}>
                        Show {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
