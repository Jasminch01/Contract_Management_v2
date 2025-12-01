"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { IoIosAdd, IoIosSearch, IoIosClose } from "react-icons/io";
import { Buyer } from "@/types/types";
import { getBuyers, searchBuyers } from "@/api/buyerApi";
import { useRouter } from "next/navigation";

interface BuyerSelectProps {
  onSelect: (buyer: Buyer) => void;
}

// Custom hook for debouncing
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const BuyerSelect = ({ onSelect }: BuyerSelectProps) => {
  // State management with proper types
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search term with 500ms delay for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const router = useRouter();

  // Query for initial buyers list (limit 10)
  const {
    data: initialBuyersResponse,
    isLoading: isLoadingInitial,
    isError: isErrorInitial,
    refetch: refetchInitial,
  } = useQuery({
    queryKey: ["buyers", "initial"],
    queryFn: () => getBuyers({ limit: 10 }), // Pass limit parameter
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: isDropdownOpen && !debouncedSearchTerm.trim(),
  });

  // Query for search results
  const {
    data: searchResults = [],
    isLoading: isLoadingSearch,
    isError: isErrorSearch,
    refetch: refetchSearch,
    isFetching: isFetchingSearch,
  } = useQuery({
    queryKey: ["buyers", "search", debouncedSearchTerm],
    queryFn: () => searchBuyers(debouncedSearchTerm),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    enabled: isDropdownOpen && !!debouncedSearchTerm.trim(),
  });

  // Extract buyers array from paginated response
  const initialBuyers = initialBuyersResponse?.data || [];

  // Determine which data to show
  const buyers = debouncedSearchTerm.trim() ? searchResults : initialBuyers;
  const isLoading = debouncedSearchTerm.trim()
    ? isLoadingSearch
    : isLoadingInitial;
  const isError = debouncedSearchTerm.trim() ? isErrorSearch : isErrorInitial;
  const isFetching = debouncedSearchTerm.trim() ? isFetchingSearch : false;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchTerm(""); // Clear search when closing
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isDropdownOpen]);

  // Handle opening dropdown
  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      setSearchTerm(""); // Clear search when opening
    }
  };

  // Handle selecting a buyer
  const handleSelectBuyer = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setIsDropdownOpen(false);
    setSearchTerm(""); // Clear search after selection
    onSelect(buyer); // Pass the selected buyer back to parent
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  // Handle retry on error
  const handleRetry = () => {
    if (debouncedSearchTerm.trim()) {
      refetchSearch();
    } else {
      refetchInitial();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setSearchTerm("");
    }
  };

  // Determine loading state
  const isSearching = isLoading || isFetching;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs text-gray-700 uppercase">Buyer *</label>

      {/* Custom select button */}
      <div className="relative mt-1">
        <button
          type="button"
          className="block w-full px-3 py-2 text-left border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          onClick={handleToggleDropdown}
          disabled={false}
        >
          {selectedBuyer ? selectedBuyer.name : "Select Buyer"}
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>
      </div>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search buyers..."
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={handleClearSearch}
                >
                  <IoIosClose className="h-4 w-4" />
                </button>
              )}
              {isSearching && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="animate-spin h-4 w-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Error state */}
          {isError && (
            <div className="p-4 text-center">
              <p className="text-red-600 text-sm mb-2">
                {searchTerm
                  ? `Failed to search for "${searchTerm}"`
                  : "Failed to load buyers"}
              </p>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
                onClick={handleRetry}
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading state (initial load) */}
          {isLoading && !searchTerm && (
            <div className="p-4 text-center">
              <p className="text-gray-500 text-sm">Loading buyers...</p>
            </div>
          )}

          {/* Buyer options */}
          {!isError && (
            <>
              <div className="max-h-60 overflow-y-auto">
                {buyers.length > 0 ? (
                  buyers.map((buyer: Buyer) => (
                    <div
                      key={buyer._id}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${
                        selectedBuyer?._id === buyer._id
                          ? "bg-blue-50 text-blue-700"
                          : ""
                      }`}
                      onClick={() => handleSelectBuyer(buyer)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block font-medium">{buyer.name}</span>
                          {/* Show contact count if available */}
                          {buyer.contacts && buyer.contacts.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {buyer.contacts.length} contact{buyer.contacts.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {selectedBuyer?._id === buyer._id && (
                          <svg
                            className="h-4 w-4 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))
                ) : !isSearching ? (
                  <div className="px-4 py-8 text-center">
                    {searchTerm ? (
                      <div>
                        <p className="text-gray-500 text-sm mb-2">
                          No buyers found matching &quot;{searchTerm}&quot;
                        </p>
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                          onClick={() => setSearchTerm("")}
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No buyers found</p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-500 text-sm">
                      {searchTerm
                        ? `Searching for "${searchTerm}"...`
                        : "Loading..."}
                    </p>
                  </div>
                )}
              </div>

              {/* Add new buyer section */}
              {!isSearching && (
                <div className="p-2 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded flex items-center transition-colors"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setSearchTerm("");
                      router.push("/dashboard/buyer-management/create-buyer");
                    }}
                  >
                    <IoIosAdd className="mr-2" />
                    Add New Buyer
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BuyerSelect;