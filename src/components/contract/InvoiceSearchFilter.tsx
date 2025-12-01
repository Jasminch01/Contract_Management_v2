/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { FaCheck } from "react-icons/fa";
import { LuSearch } from "react-icons/lu";

interface InvoiceSearchFilterProps {
  onFilterChange: (filters: {
    searchFilters: Record<string, string>;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

export default function InvoiceSearchFilter({
  onFilterChange,
}: InvoiceSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filterOptions = [
    {
      id: "seller",
      label: "Seller",
    },
    {
      id: "buyer",
      label: "Buyer",
    },
    {
      id: "ngr",
      label: "NGR",
    },
    {
      id: "contractNumber",
      label: "Contract Number",
    },
  ];

  // Handle click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node) &&
        inputRef.current !== event.target
      ) {
        setIsInputFocused(false);
        applyFilters();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchTerm, selectedFilters]);

  const applyFilters = () => {
    const searchFilters: Record<string, string> = {};

    if (searchTerm && selectedFilters.length > 0) {
      selectedFilters.forEach((filterId) => {
        searchFilters[filterId] = searchTerm;
      });
    } else if (searchTerm && selectedFilters.length === 0) {
      searchFilters.contractNumber = searchTerm;
    }

    onFilterChange({
      searchFilters,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyFilters();
      inputRef.current?.blur();
    }
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <div className="w-full relative">
      {/* Search Bar */}
      <div className="w-full border border-gray-200 rounded-lg shadow-sm bg-white">
        <div className="flex items-center px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search invoiced contracts"
            className="w-full focus:outline-none text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onKeyPress={handleKeyPress}
            onBlur={applyFilters}
          />
          <LuSearch className="cursor-pointer text-gray-400" />
        </div>
      </div>

      {/* Filter Dropdown Panel */}
      {isInputFocused && (
        <div
          ref={filterRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          {/* Search By Section */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Search By
            </h3>
            <div className="flex flex-wrap gap-3">
              {filterOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => toggleFilter(option.id)}
                  className={`border rounded-lg p-2 px-3 flex items-center cursor-pointer transition-colors ${
                    selectedFilters.includes(option.id)
                      ? "bg-blue-50 border-blue-400 shadow-sm"
                      : "border-gray-200 hover:bg-gray-50"
                  } ${
                    option.id === "contractNumber"
                      ? "w-36"
                      : "w-auto min-w-[112px]"
                  }`}
                >
                  <div
                    className={`size-3 rounded-full border flex items-center justify-center mr-3 flex-shrink-0 ${
                      selectedFilters.includes(option.id)
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedFilters.includes(option.id) && (
                      <FaCheck className="text-xs text-white" />
                    )}
                  </div>
                  <p className="text-xs whitespace-nowrap">{option.label}</p>
                </div>
              ))}
            </div>

            {selectedFilters.length === 0 && searchTerm && (
              <p className="text-xs text-gray-500 mt-2">
                Default: Searching by Contract Number
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}