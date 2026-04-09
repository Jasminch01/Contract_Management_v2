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
  <div className="mt-6 md:mt-20 px-4 md:pl-10 md:pr-3">
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
  <div className="mt-6 md:mt-20 px-4 md:pl-10 md:pr-3">
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
    <div className="mt-4 xl:mt-20 px-4 xl:pl-10 xl:pr-8">
      <div className="">
        {/* Header Section - Title hidden on mobile as it moves to MobileAppBar */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 xl:mb-10">
          <p className="font-bold text-2xl xl:text-xl hidden xl:block text-gray-800">Dashboard</p>
          <div className="w-full sm:w-auto">
            <button
              onClick={exportDatabaseCSV}
              className="w-full sm:w-auto cursor-pointer px-5 py-3 xl:py-2.5 border border-gray-200 rounded-xl xl:rounded flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-all bg-white shadow-sm"
            >
              <FiDownload className="text-lg xl:text-sm" /> Export All Data
            </button>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 xl:gap-5">
          {/* Card 1: Daily Commission */}
          <div className="bg-white shadow-sm border border-gray-100 border-t-4 border-t-purple-500 rounded-2xl xl:rounded-lg p-5 xl:p-2 xl:py-4 flex flex-col h-full transition-all duration-300 hover:shadow-md">
            <p className="text-sm xl:text-base mb-3 xl:mb-5 text-gray-500 font-medium">Daily Commission</p>
            <div className="flex items-center justify-between mt-auto">
              <p className="text-2xl xl:text-xl font-bold text-gray-900 tracking-tight">
                ${dailyCommission ?? "0"}
              </p>
              <div className="xl:hidden bg-purple-50 p-2 rounded-xl text-purple-600">
                <FiDownload className="rotate-180" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-gray-100 border-t-4 border-t-purple-500 rounded-2xl xl:rounded-lg p-5 xl:p-2 xl:py-4 flex flex-col h-full transition-all duration-300 hover:shadow-md">
            <p className="text-sm xl:text-base mb-3 xl:mb-5 text-gray-500 font-medium">Weekly Commission</p>
            <div className="flex items-center justify-between mt-auto">
              <p className="text-2xl xl:text-xl font-bold text-gray-900 tracking-tight">
                ${weeklyCommssion ?? "0"}
              </p>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-gray-100 border-t-4 border-t-purple-500 rounded-2xl xl:rounded-lg p-5 xl:p-2 xl:py-4 flex flex-col h-full transition-all duration-300 hover:shadow-md">
            <p className="text-sm xl:text-base mb-3 xl:mb-5 text-gray-500 font-medium">Total Contracts</p>
            <div className="flex items-center justify-between mt-auto">
              <p className="text-2xl xl:text-xl font-bold text-gray-900 tracking-tight">
                {totalContracts ?? "0"}
              </p>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-gray-100 border-t-4 border-t-purple-500 rounded-2xl xl:rounded-lg p-5 xl:p-2 xl:py-4 flex flex-col h-full transition-all duration-300 hover:shadow-md">
            <p className="text-sm xl:text-base mb-3 xl:mb-5 text-gray-500 font-medium">Completed</p>
            <div className="mt-auto">
              <p className="text-2xl xl:text-xl font-bold text-gray-900 tracking-tight">
                {completedContracts ?? "0"}
              </p>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-gray-100 border-t-4 border-t-purple-500 rounded-2xl xl:rounded-lg p-5 xl:p-2 xl:py-4 flex flex-col h-full transition-all duration-300 hover:shadow-md">
            <p className="text-sm xl:text-base mb-3 xl:mb-5 text-gray-500 font-medium">Incomplete</p>
            <div className="mt-auto">
              <p className="text-2xl xl:text-xl font-bold text-gray-900 tracking-tight">
                {uncompleteContracts ?? "0"}
              </p>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-gray-100 border-t-4 border-t-purple-500 rounded-2xl xl:rounded-lg p-5 xl:p-2 xl:py-4 flex flex-col h-full transition-all duration-300 hover:shadow-md">
            <p className="text-sm xl:text-base mb-3 xl:mb-5 text-gray-500 font-medium">Today&apos;s New</p>
            <div className="mt-auto">
              <p className="text-2xl xl:text-xl font-bold text-gray-900 tracking-tight">
                {todayContracts ?? "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Charts & Advanced Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8 mt-10 xl:mt-20 pb-10">
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
