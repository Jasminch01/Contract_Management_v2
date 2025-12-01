/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { IoIosClose } from "react-icons/io";
import { FaCheck } from "react-icons/fa";
import { LuSearch } from "react-icons/lu";

interface SearchFilterBarProps {
  onFilterChange: (filters: Record<string, string>) => void;
  initialFilters?: Record<string, string>;
}

export default function AdvanceSearchFilter({
  onFilterChange,
  initialFilters = {},
}: SearchFilterBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filterOptions = [
    {
      id: "ngr",
      label: "NGR",
    },
    {
      id: "commodity",
      label: "Commodity",
    },
    {
      id: "seller",
      label: "Seller",
    },
    {
      id: "buyer",
      label: "Buyer",
    },
    {
      id: "grade",
      label: "Grade",
    },
    {
      id: "tonnes",
      label: "Tonnes",
    },
    {
      id: "contractNumber",
      label: "Contract Number",
    },
  ];

  // Initialize filters from props on mount
  useEffect(() => {
    if (!isInitialized && initialFilters && Object.keys(initialFilters).length > 0) {
      const filterKeys = Object.keys(initialFilters);
      const filterValues = Object.values(initialFilters);
      
      // Set selected filters based on initial filters
      setSelectedFilters(filterKeys);
      
      // Set search term to the first filter value (assuming all values are the same)
      // If different values exist for different filters, use the first one
      if (filterValues.length > 0 && filterValues[0]) {
        setSearchTerm(filterValues[0]);
      }
      
      setIsInitialized(true);
    }
  }, [initialFilters, isInitialized]);

  // Handle click outside to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node) &&
        inputRef.current !== event.target
      ) {
        setIsInputFocused(false);
        applyFilters(); // Apply filters when clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchTerm, selectedFilters]);

  const applyFilters = () => {
    const filters: Record<string, string> = {};
    
    if (searchTerm && selectedFilters.length > 0) {
      // If we have both search term and selected filters, apply to each selected filter
      selectedFilters.forEach(filterId => {
        filters[filterId] = searchTerm;
      });
    } else if (searchTerm && selectedFilters.length === 0) {
      // If we have a search term but no filters selected, default to contractNumber
      filters.contractNumber = searchTerm;
    }
    
    onFilterChange(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilters();
      inputRef.current?.blur(); // Remove focus from input
    }
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const clearAllFilters = () => {
    setSelectedFilters([]);
    setSearchTerm("");
    onFilterChange({});
  };

  return (
    <div className="w-full relative">
      {/* Search Bar */}
      <div className="w-full border border-gray-200 rounded-lg shadow-sm bg-white">
        <div className="flex items-center px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Contract"
            className="w-full focus:outline-none text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onKeyPress={handleKeyPress}
            onBlur={applyFilters} // Apply filters when input loses focus
          />
          <LuSearch className="cursor-pointer" />
        </div>

        {/* Active Filter Pills */}
        {selectedFilters.length > 0 && searchTerm && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {selectedFilters.map((filterId) => {
              const option = filterOptions.find(opt => opt.id === filterId);
              return option ? (
                <span
                  key={filterId}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {option.label}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFilter(filterId);
                      // Reapply filters after a short delay
                      setTimeout(() => {
                        const newFilters = selectedFilters
                          .filter(id => id !== filterId)
                          .reduce((acc, id) => {
                            acc[id] = searchTerm;
                            return acc;
                          }, {} as Record<string, string>);
                        onFilterChange(newFilters);
                      }, 0);
                    }}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <IoIosClose className="text-base" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Filter Dropdown Panel */}
      {isInputFocused && (
        <div
          ref={filterRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium text-base mr-2">Filter</span>
                {selectedFilters.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-sm">
                    {selectedFilters.length}
                  </span>
                )}
              </div>
              {selectedFilters.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700 flex items-center"
                >
                  Clear all
                  <IoIosClose className="text-2xl" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Options Grid */}
          <div className="grid xl:grid-cols-4 grid-cols-2 gap-5 p-4">
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
                  className={`size-3 rounded-full border flex items-center justify-center mr-3 ${
                    selectedFilters.includes(option.id)
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedFilters.includes(option.id) && (
                    <FaCheck className="text-xs text-white" />
                  )}
                </div>
                <p className="text-xs">{option.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}