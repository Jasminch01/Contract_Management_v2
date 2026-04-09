/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
"use client";
import DeliveredBidsTable from "@/components/Dashboard/DeliverdBidsTable";
import PortZoneBidsTable from "@/components/Dashboard/PortZoneBidsTable";
import DateRangeModal from "@/components/DateRangeModal";
import React from "react";
import { useState, useEffect, useMemo } from "react";
import { Toaster, toast } from "react-hot-toast";
import { RiArrowDropDownLine } from "react-icons/ri";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPortZoneBid,
  fetchPortZoneBids,
  updatePortZoneBid,
} from "@/api/portZoneApi";
import {
  createDeliveredBid,
  fetchDeliveredBids,
  updateDeliveredBid,
} from "@/api/deliverdBidsApi";

const clientLocations = [
  "Murray Bridge ASW1",
  "Murray Bridge CANO",
  "Wasleys SFW1",
  "Wasleys BAR1",
  "Wasleys CANO",
  "Laucke Daveyston SFW1",
  "Laucke Daveyston BAR1",
  "Laucke Daveyston CANS",
  "Southern Cross Feedlot (TFI) BAR1",
  "Dublin NIP/HAL",
  "Dublin Canola",
  "Semaphore Containers NIP/HAL",
  "Semaphore Containers APW1",
].map((loc) => `${loc}`);

// Backend schema types for Port Zone Bids
interface PortZoneBid {
  _id?: string;
  label:
    | "Outer Harbor"
    | "Port Lincoln"
    | "Port Giles"
    | "Wallaroo"
    | "Lucky Bay"
    | "Thevenard"
    | "Wallaroo Tports";
  season: string; // format: "24/25"
  date: string; // ISO date string
  APW1?: number | null;
  H1?: number | null;
  H2?: number | null;
  AUH2?: number | null;
  ASW1?: number | null;
  AGP1?: number | null;
  SFW1?: number | null;
  BAR1?: number | null;
  MA1?: number | null;
  CM1?: number | null;
  COMD?: number | null;
  CANS?: number | null;
  FIEV?: number | null;
  "NIP/HAL"?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// For Port Zone table display - combines static labels with fetched data
interface PortZoneTableRow {
  id: string;
  label: string;
  APW1: number | null;
  H1: number | null;
  H2: number | null;
  AUH2: number | null;
  ASW1: number | null;
  AGP1: number | null;
  SFW1: number | null;
  BAR1: number | null;
  MA1: number | null;
  CM1: number | null;
  COMD: number | null;
  CANS: number | null;
  FIEV: number | null;
  "NIP/HAL": number | null;
  hasData: boolean; // to track if this row has existing data
  _id?: string; // for updates
}

// For Delivered Bids table display
interface DeliveredBidTableRow {
  id: string;
  location: string;
  january: number | null;
  february: number | null;
  march: number | null;
  april: number | null;
  may: number | null;
  june: number | null;
  july: number | null;
  august: number | null;
  september: number | null;
  october: number | null;
  november: number | null;
  december: number | null;
  hasData: boolean;
  _id?: string;
}

// Static data
const portZoneLabels = [
  "Outer Harbor",
  "Port Lincoln",
  "Port Giles",
  "Wallaroo",
  "Lucky Bay",
  "Thevenard",
  "Wallaroo Tports",
] as const;

const grainTypes = [
  "APW1",
  "H1",
  "H2",
  "AUH2",
  "ASW1",
  "AGP1",
  "SFW1",
  "BAR1",
  "MA1",
  "CM1",
  "COMD",
  "CANS",
  "FIEV",
  "NIP/HAL",
] as const;

const monthFields = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

  const getFormattedSeasons = () => {
    if (typeof window === "undefined") {
      // Return empty array during SSR to avoid hydration mismatch
      return [];
    }

    // This gets the current year every time the function is called
    // So it automatically updates when the year changes
    const currentYear = new Date().getFullYear();

    // Generate seasons: 1 future season + current season + previous seasons back to 2021/2022
    // But filter out any seasons below 2021/2022
    const seasons = [];

    // Start from next year (future season) and go backwards
    for (let i = 0; i < 20; i++) {
      // 20 is a safe upper limit to ensure we capture all needed seasons
      const startYear = currentYear + 1 - i; // +1 for future season, then go backwards
      const endYear = startYear + 1;

      // Stop if we go below 2021/2022 season
      if (startYear < 2021) {
        break;
      }

      seasons.push(`${String(startYear).slice(-2)}/${String(endYear).slice(-2)}`);
    }

    return seasons;
  };

const getSeasonFromDate = (date: Date) => {
  // This will always use the year from the provided date
  // So it automatically works for any year
  const year = date.getFullYear();
  
  // Each season represents a full year
  // const startYear = year;
  // const endYear = year + 1;

  //season coustomized the current seasone is 25/26 the acual function is top
  const startYear = year -1;
  const endYear = year;
  return `${String(startYear).slice(-2)}/${String(endYear).slice(-2)}`;
};


const getCurrentDateInputValue = () => {
  if (typeof window === "undefined") {
    // Return a static value during SSR
    return "";
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentSeason = () => {
  if (typeof window === "undefined") {
    // Return a static value during SSR
    return "";
  }

  return getSeasonFromDate(new Date());
};

const formatDateForFilename = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Create empty Port Zone table rows with static labels
const createEmptyPortZoneRows = (
  fetchedData: PortZoneBid[] = []
): PortZoneTableRow[] => {
  return portZoneLabels.map((label, index) => {
    const existingData = fetchedData.find((bid) => bid.label === label);

    return {
      id: `pz-${index}`,
      label,
      APW1: existingData?.APW1 || null,
      H1: existingData?.H1 || null,
      H2: existingData?.H2 || null,
      AUH2: existingData?.AUH2 || null,
      ASW1: existingData?.ASW1 || null,
      AGP1: existingData?.AGP1 || null,
      SFW1: existingData?.SFW1 || null,
      BAR1: existingData?.BAR1 || null,
      MA1: existingData?.MA1 || null,
      CM1: existingData?.CM1 || null,
      COMD: existingData?.COMD || null,
      CANS: existingData?.CANS || null,
      FIEV: existingData?.FIEV || null,
      "NIP/HAL": existingData?.["NIP/HAL"] || null,
      hasData: !!existingData,
      _id: existingData?._id,
    };
  });
};

// Create empty Delivered Bids table rows with client locations
const createEmptyDeliveredBidsRows = (
  fetchedData: any[] = []
): DeliveredBidTableRow[] => {
  return clientLocations.map((location, index) => {
    const existingData = fetchedData.find(
      (bid) =>
        (bid as any).label === location || (bid as any).location === location
    );

    const getMonthValue = (monthName: string) => {
      if (!existingData) return null;

      if ((existingData as any).monthlyValues) {
        return (existingData as any).monthlyValues[monthName] || null;
      }

      const lowercaseMonth = monthName.toLowerCase();
      return (existingData as any)[lowercaseMonth] || null;
    };

    return {
      id: `db-${index}`,
      location,
      january: getMonthValue("January"),
      february: getMonthValue("February"),
      march: getMonthValue("March"),
      april: getMonthValue("April"),
      may: getMonthValue("May"),
      june: getMonthValue("June"),
      july: getMonthValue("July"),
      august: getMonthValue("August"),
      september: getMonthValue("September"),
      october: getMonthValue("October"),
      november: getMonthValue("November"),
      december: getMonthValue("December"),
      hasData: !!existingData,
      _id: (existingData as any)?._id,
    };
  });
};

const HistoricalPricesPage = () => {
  const [activeTab, setActiveTab] = useState<
    "historicalPrices" | "deliveredBids"
  >("historicalPrices");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [currentDateInputValue, setCurrentDateInputValue] = useState("");
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);

    if (!selectedDate) {
      const currentDate = getCurrentDateInputValue();
      setSelectedDate(currentDate);
      setCurrentDateInputValue(currentDate);
    }

    if (!selectedSeason) {
      const currentSeason = getCurrentSeason();
      setSelectedSeason(currentSeason);
    }
  }, []);

  const {
    data: fetchedPortZoneBids = [],
    isLoading: isLoadingPortZoneBids,
    error: portZoneBidsError,
    isFetching,
  } = useQuery({
    queryKey: ["portZoneBids", selectedDate, selectedSeason],
    queryFn: () => fetchPortZoneBids(selectedDate, selectedSeason),
    enabled: !!selectedDate && !!selectedSeason && isMounted,
    onSuccess: (data) => {},
    onError: (error) => {},
  });

  const {
    data: fetchedDeliveredBids = [],
    isLoading: isLoadingDeliveredBids,
    error: deliveredBidsError,
  } = useQuery({
    queryKey: ["deliveredBids", selectedDate, selectedSeason],
    queryFn: () => fetchDeliveredBids(selectedDate, selectedSeason),
    enabled: !!selectedDate && !!selectedSeason && isMounted,
  });

  const portZoneTableData = useMemo(() => {
    return createEmptyPortZoneRows(fetchedPortZoneBids);
  }, [fetchedPortZoneBids]);

  const deliveredBidsTableData = useMemo(() => {
    return createEmptyDeliveredBidsRows(fetchedDeliveredBids);
  }, [fetchedDeliveredBids]);

  const updatePortZoneBidMutation = useMutation({
    mutationFn: updatePortZoneBid,
    onSuccess: () => {
      toast.success("Port zone bid updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["portZoneBids", selectedDate, selectedSeason],
      });
    },
    onError: (error) => {
      toast.error("Failed to update port zone bid");
    },
  });

  const createPortZoneBidMutation = useMutation({
    mutationFn: createPortZoneBid,
    onSuccess: () => {
      toast.success("Port zone bid created successfully");
      queryClient.invalidateQueries({
        queryKey: ["portZoneBids", selectedDate, selectedSeason],
      });
    },
    onError: (error) => {
      toast.error("Failed to create port zone bid");
    },
  });

  const updateDeliveredBidMutation = useMutation({
    mutationFn: updateDeliveredBid,
    onSuccess: () => {
      toast.success("Delivered bid updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["deliveredBids", selectedDate, selectedSeason],
      });
    },
    onError: (error) => {
      toast.error(`Failed to update delivered bid: ${error.message}`);
      console.error("Mutation Error:", error);
    },
  });

  const createDeliveredBidMutation = useMutation({
    mutationFn: createDeliveredBid,
    onSuccess: () => {
      toast.success("Delivered bid created successfully");
      queryClient.invalidateQueries({
        queryKey: ["deliveredBids", selectedDate, selectedSeason],
      });
    },
    onError: (error) => {
      toast.error(`Failed to create delivered bid: ${error.message}`);
      console.error("Mutation Error:", error);
    },
  });

  const handlePortZoneDataChange = (
    updatedRow: PortZoneTableRow,
    grainType: string,
    value: number | null
  ) => {
    const bidData = {
      label: updatedRow.label as PortZoneBid["label"],
      date: selectedDate,
      season: selectedSeason,
      [grainType]: value,
    };

    if (updatedRow.hasData && updatedRow._id) {
      updatePortZoneBidMutation.mutate({
        ...bidData,
        _id: updatedRow._id,
      });
    } else {
      createPortZoneBidMutation.mutate(bidData);
    }
  };

  const handleDeliveredBidsDataChange = (
    updatedRow: DeliveredBidTableRow,
    month: string,
    value: number | null
  ) => {
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

    const bidData: any = {
      date: selectedDate,
      season: selectedSeason,
      label: updatedRow.location,
      monthlyValues: {
        [capitalizedMonth]: value,
      },
    };

    if (!selectedDate || isNaN(new Date(selectedDate).getTime())) {
      toast.error("Invalid date");
      return;
    }

    if (updatedRow.hasData && updatedRow._id) {
      updateDeliveredBidMutation.mutate({
        ...bidData,
        _id: updatedRow._id,
      });
    } else {
      createDeliveredBidMutation.mutate(bidData);
    }
  };

  const handleSavePortZones = (data: PortZoneTableRow[]) => {
    toast.success("All port zone changes saved successfully");
  };

  const handleSaveDeliveredBids = (data: DeliveredBidTableRow[]) => {
    toast.success("All delivered bid changes saved successfully");
  };

  const handleExportClick = () => {
    setShowDateRangeModal(true);
  };

  const handleDateRangeConfirm = (startDate: string, endDate: string) => {
    setExportDateRange({ start: startDate, end: endDate });

    const startFormatted = formatDateForFilename(startDate);
    const endFormatted = formatDateForFilename(endDate);
    const filename = `${
      activeTab === "historicalPrices" ? "port-zone-bids" : "delivered-bids"
    }-${startFormatted}-to-${endFormatted}.csv`;

    toast.success(`Exporting data from ${startFormatted} to ${endFormatted}`);

  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setCurrentDateInputValue(newDate);

    if (newDate) {
      const selectedDateObj = new Date(newDate);
      const seasonForDate = getSeasonFromDate(selectedDateObj);
      setSelectedSeason(seasonForDate);
    }
  };

  const handleSeasonChange = (newSeason: string) => {
    setSelectedSeason(newSeason);
    setShowSeasonDropdown(false);
  };

  const tabButtonClass = "py-3 uppercase w-44 text-center relative";
  const tabTextClass = "font-medium";

  if (!isMounted) {
    return (
      <div className="mt-6 md:mt-20">
        <div className="text-center mb-10">
          <p className="text-xl">Historical Daily Prices</p>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mt-6 md:mt-20">
      <Toaster />
      <div className="text-center mb-10">
        <p className="text-xl">Historical Daily Prices</p>
        {isMounted && (
          <p className="text-sm text-gray-600 mt-2">
            Current Season: {getCurrentSeason()}
          </p>
        )}
      </div>

      <div className="">
        <div className="flex flex-col xl:flex-row justify-between border-gray-200">
          <div className="flex gap-x-10">
            <button
              className={tabButtonClass}
              onClick={() => setActiveTab("historicalPrices")}
            >
              <span className={tabTextClass}>Port Zone Bids</span>
              {activeTab === "historicalPrices" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#108A2B]"></div>
              )}
            </button>
            <button
              className={tabButtonClass}
              onClick={() => setActiveTab("deliveredBids")}
            >
              <span className={tabTextClass}>Delivered Bids</span>
              {activeTab === "deliveredBids" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#108A2B]"></div>
              )}
            </button>
          </div>

          <div className="flex gap-4 items-center pr-5 my-5">
            <button
              onClick={handleExportClick}
              className="px-2 py-1 bg-white border-gray-300 border rounded-md hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Export CSV
            </button>

            <div className="relative">
              <input
                type="date"
                value={currentDateInputValue}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowSeasonDropdown(!showSeasonDropdown);
                  setShowDateDropdown(false);
                }}
                className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 min-w-[80px]"
                title="Season runs from July to June (e.g., 24/25 = July 2024 to June 2025)"
              >
                {selectedSeason || getCurrentSeason()}
                <RiArrowDropDownLine className={"text-2xl"} />
              </button>
              {showSeasonDropdown && (
                <div className="absolute right-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                  <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
                    Season
                  </div>
                  {getFormattedSeasons().map((season, index) => {
                    const isCurrentSeason = season === getCurrentSeason();
                    const isSelectedSeason = season === selectedSeason;

                    return (
                      <div
                        key={index}
                        className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                          isSelectedSeason ? "bg-blue-100 font-medium" : ""
                        }`}
                        onClick={() => handleSeasonChange(season)}
                      >
                        {season}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoadingPortZoneBids && activeTab === "historicalPrices" && (
          <div className="text-center py-8">Loading port zone bids...</div>
        )}

        {portZoneBidsError && activeTab === "historicalPrices" && (
          <div className="text-center py-8 text-red-500">
            Error loading port zone bids: {(portZoneBidsError as Error).message}
          </div>
        )}

        {isLoadingDeliveredBids && activeTab === "deliveredBids" && (
          <div className="text-center py-8">Loading delivered bids...</div>
        )}

        {deliveredBidsError && activeTab === "deliveredBids" && (
          <div className="text-center py-8 text-red-500">
            Error loading delivered bids:{" "}
            {(deliveredBidsError as Error).message}
          </div>
        )}

        {activeTab === "historicalPrices" ? (
          <PortZoneBidsTable
            data={portZoneTableData}
            onDataChange={handlePortZoneDataChange}
            onSave={handleSavePortZones}
            isLoading={
              isLoadingPortZoneBids ||
              updatePortZoneBidMutation.isPending ||
              createPortZoneBidMutation.isPending
            }
          />
        ) : (
          <DeliveredBidsTable
            data={deliveredBidsTableData}
            onDataChange={handleDeliveredBidsDataChange}
            onSave={handleSaveDeliveredBids}
            isLoading={
              isLoadingDeliveredBids ||
              updateDeliveredBidMutation.isPending ||
              createDeliveredBidMutation.isPending
            }
          />
        )}
      </div>

      <DateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        onConfirm={handleDateRangeConfirm}
        activeTab={activeTab}
      />
    </div>
  );
};

export default HistoricalPricesPage;
