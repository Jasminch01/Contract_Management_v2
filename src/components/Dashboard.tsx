/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
"use client";
import { exportDatabaseCSV } from "@/api/exportApi";
import ContractProgress from "./Dashboard/ContractProgress";
import HistoricalDailyCommision from "./Dashboard/HistoricalDailyCommision";
import HistoricalPrices from "./Dashboard/HistoricalPrices";
import HistoycalNotebooks from "./Dashboard/HistoycalNotebooks";
import { getSummeryReport, getHistoricalReport } from "@/api/dashboardApi";
import { useQuery } from "@tanstack/react-query";
import { FiDownload } from "react-icons/fi";

// Skeleton Card Component
const SkeletonCard = () => (
  <div className="shadow-lg border-t-4 border-gray-200 rounded-lg px-2 py-4 flex flex-col h-full animate-pulse">
    <div className="h-4 bg-gray-200 rounded mb-5 w-3/4"></div>
    <div className="flex items-center justify-between mt-auto">
      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Chart Skeleton Component
const ChartSkeleton = () => (
  <div className="shadow-lg rounded-lg p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded mb-4 w-1/3"></div>
    <div className="h-48 bg-gray-200 rounded"></div>
  </div>
);

// Loading State Component
const DashboardSkeleton = () => (
  <div className="mt-20 pl-10 pr-3">
    <div className="">
      <div className="h-6 bg-gray-200 rounded mb-10 w-32 animate-pulse"></div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 2xl:gap-10 gap-5 max-2xl:mt-10 mt-5 2xl:mt-40">
        {Array.from({ length: 4 }).map((_, index) => (
          <ChartSkeleton key={index} />
        ))}
      </div>
    </div>
  </div>
);

// Error State Component
const ErrorState = ({ title, message, onRetry }) => (
  <div className="mt-20 pl-10 pr-3">
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
        <div className="text-red-500 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
        <p className="text-red-600 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  // Fetch summary data
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["summeryReport"],
    queryFn: getSummeryReport,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch historical data
  const {
    data: historicalData,
    isLoading: historicalLoading,
    error: historicalError,
    refetch: refetchHistorical,
  } = useQuery({
    queryKey: ["historicalReport"],
    queryFn: getHistoricalReport,
    retry: 2,
    retryDelay: 1000,
  });

  // Show loading skeleton while either request is loading
  if (summaryLoading || historicalLoading) {
    return <DashboardSkeleton />;
  }

  // Show error states
  if (summaryError) {
    return (
      <ErrorState
        title="Failed to Load Dashboard Summary"
        message={summaryError.message}
        onRetry={refetchSummary}
      />
    );
  }

  if (historicalError) {
    return (
      <ErrorState
        title="Failed to Load Historical Data"
        message={historicalError.message}
        onRetry={refetchHistorical}
      />
    );
  }

  // Destructure the summary data when it's available
  const {
    dailyCommission,
    weeklyCommssion,
    totalContracts,
    completedContracts,
    uncompleteContracts,
    todayContracts,
  } = summaryData || {};

  // Destructure the historical data when it's available
  const { historicalCommissions, historicalContracts, historicalPrices } =
    historicalData || {};

  return (
    <div className="mt-20 pl-10 pr-3">
      <div className="">
        <div className="flex justify-between">
          <p className="font-bold text-xl mb-10">Dashboard</p>
          <div>
            <button
              onClick={exportDatabaseCSV}
              className="cursor-pointer px-3 py-2 border border-gray-200 rounded flex items-center justify-center gap-2 text-sm hover:bg-gray-100 transition-colors "
            >
              <FiDownload /> Export All Data
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-5">
          {/* Card 1 */}
          <div className="shadow-lg border-t-4 border-purple-500 rounded-lg p-2 py-4 flex flex-col h-full transition-all duration-300 hover:shadow-xl">
            <p className="text-base mb-5 text-gray-600">Daily Commission</p>
            <div className="flex items-center justify-between mt-auto">
              <p className="text-xl font-bold text-gray-900">
                ${dailyCommission ?? "0"}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="shadow-lg border-t-4 border-purple-500 rounded-lg px-2 py-4 flex flex-col h-full transition-all duration-300 hover:shadow-xl">
            <p className="text-base mb-5 text-gray-600">Weekly Commission</p>
            <div className="flex items-center justify-between mt-auto">
              <p className="text-xl font-bold text-gray-900">
                ${weeklyCommssion ?? "0"}
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="shadow-lg border-t-4 border-purple-500 rounded-lg px-2 py-4 flex flex-col h-full transition-all duration-300 hover:shadow-xl">
            <p className="text-base mb-5 text-gray-600">Total Contracts</p>
            <div className="flex items-center justify-between mt-auto">
              <p className="text-xl font-bold text-gray-900">
                {totalContracts ?? "0"}
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="shadow-lg border-t-4 border-purple-500 rounded-lg px-2 py-4 flex flex-col h-full transition-all duration-300 hover:shadow-xl">
            <p className="text-base mb-5 text-gray-600">Completed Contracts</p>
            <div className="mt-auto">
              <p className="text-xl font-bold text-gray-900">
                {completedContracts ?? "0"}
              </p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="shadow-lg border-t-4 border-purple-500 rounded-lg px-2 py-4 flex flex-col h-full transition-all duration-300 hover:shadow-xl">
            <p className="text-base mb-5 text-gray-600">Uncomplete Contracts</p>
            <div className="mt-auto">
              <p className="text-xl font-bold text-gray-900">
                {uncompleteContracts ?? "0"}
              </p>
            </div>
          </div>

          {/* Card 6 */}
          <div className="shadow-lg border-t-4 border-purple-500 rounded-lg px-2 py-4 flex flex-col h-full transition-all duration-300 hover:shadow-xl">
            <p className="text-base mb-5 text-gray-600">Today Contracts</p>
            <div className="mt-auto">
              <p className="text-xl font-bold text-gray-900">
                {todayContracts ?? "0"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 2xl:gap-10 gap-5 max-2xl:mt-10 mt-5 2xl:mt-40">
          <HistoricalDailyCommision data={historicalCommissions} />
          <HistoycalNotebooks data={historicalContracts} />
          <HistoricalPrices data={historicalPrices} />
          <ContractProgress />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
