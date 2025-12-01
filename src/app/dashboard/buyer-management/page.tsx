/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { getBuyers, moveBuyersToTrash } from "@/api/buyerApi";
import {
  Buyer,
  BuyersPaginatedResponse,
  FetchBuyersParams,
} from "@/types/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import toast, { Toaster } from "react-hot-toast";
import { IoIosPersonAdd } from "react-icons/io";
import { IoFilterSharp, IoWarning } from "react-icons/io5";
import { LuSearch } from "react-icons/lu";
import { MdOutlineEdit } from "react-icons/md";
import { RiDeleteBin6Fill } from "react-icons/ri";

// Types for pagination parameters
interface PaginationState {
  page: number;
  limit: number;
  searchFilters: Record<string, string>;
  dateFilter: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const columns = [
  {
    name: "BUYER NAME",
    selector: (row: Buyer) => row?.name || "",
    sortable: true,
    sortField: "name",
  },
  {
    name: "ABN",
    selector: (row: Buyer) => row?.abn || "",
    sortable: true,
    sortField: "abn",
  },
  {
    name: "CONTACT NAMES",
    selector: (row: Buyer) =>
      Array.isArray(row.contacts)
        ? row.contacts.map((contact) => contact.name).join(", ")
        : "",
    sortable: true,
    sortField: "contactName",
  },
  {
    name: "EMAIL",
    selector: (row: Buyer) => row?.email || "",
    sortable: true,
    sortField: "email",
  },
  {
    name: "PHONE",
    selector: (row: Buyer) => row?.phoneNumber || "",
    sortable: true,
    sortField: "phoneNumber",
  },
  {
    name: "CREATED DATE",
    selector: (row: Buyer) =>
      row?.createdAt ? new Date(row?.createdAt).toLocaleDateString() : "N/A",
    sortable: true,
    sortField: "createdAt",
  },
];

const customStyles = {
  headRow: {
    style: {
      backgroundColor: "#f8f9fa",
      borderBottom: "1px solid #ddd",
    },
  },
  headCells: {
    style: {
      borderRight: "1px solid #ddd",
      fontWeight: "bold",
      color: "gray",
    },
  },
  cells: {
    style: {
      borderRight: "1px solid #ddd",
      padding: "12px 15px",
    },
  },
  rows: {
    style: {
      "&:hover": {
        backgroundColor: "#E8F2FF",
        cursor: "pointer",
      },
    },
  },
};

const dateFilterOptions = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Recent" },
  { value: "lastWeek", label: "Last Week" },
];

const rowsPerPageOptions = [10, 25, 50, 100];

const BuyerManagementPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State management
  const [isMounted, setIsMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Buyer[]>([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // For the input field
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); // For debounced search

  // Pagination state
  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: 1,
    limit: 10,
    searchFilters: {},
    dateFilter: "all",
    sortBy: "",
    sortOrder: "asc",
  });

  // Track if search filters are active
  const [hasSearchFilters, setHasSearchFilters] = useState(false);

  // Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounce search term for auto-search (optional - can be removed if you only want manual search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchInput);
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle manual search (Enter key or search button click)
  const handleSearch = useCallback(() => {
    setSearchTerm(searchInput.trim());
    setPaginationState((prev) => ({
      ...prev,
      page: 1, // Reset to first page when searching
    }));
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  }, [searchInput]);

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);

    // If input is cleared, immediately clear the search
    if (value.trim() === "") {
      setSearchTerm("");
      setPaginationState((prev) => ({
        ...prev,
        page: 1,
      }));
    }
  };

  // Build query parameters for API
  const buildQueryParams = useCallback((): FetchBuyersParams => {
    const params: FetchBuyersParams = {
      page: paginationState.page,
      limit: paginationState.limit,
    };

    // Add search filters
    if (searchTerm.trim()) {
      // For buyer search, we can search across multiple fields
      params.name = searchTerm.trim();
      params.abn = searchTerm.trim();
    }

    if (paginationState.dateFilter !== "all") {
      params.dateFilter = paginationState.dateFilter;
    }

    if (paginationState.sortBy) {
      params.sortBy = paginationState.sortBy;
      params.sortOrder = paginationState.sortOrder;
    }

    return params;
  }, [paginationState, searchTerm]);

  // TanStack Query for fetching buyers with pagination
  const {
    data: buyersResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<BuyersPaginatedResponse>({
    queryKey: ["buyers", paginationState, searchTerm],
    queryFn: () => {
      return getBuyers(buildQueryParams());
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: isMounted,
  });

  // Extract data from response
  const buyers = buyersResponse?.data || [];
  const totalPages = buyersResponse?.totalPages || 0;
  const totalRecords = buyersResponse?.total || 0;
  const currentPage = buyersResponse?.page || 1;

  // Update filter active state
  useEffect(() => {
    const hasFilters =
      searchTerm.trim() !== "" || paginationState.dateFilter !== "all";
    setIsFilterActive(hasFilters);
    setHasSearchFilters(hasFilters);
  }, [searchTerm, paginationState.dateFilter]);

  // Mutation for deleting buyers
  const deleteBuyersMutation = useMutation({
    mutationFn: moveBuyersToTrash,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      queryClient.invalidateQueries({ queryKey: ["deletedItems"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });

      setToggleCleared(!toggleCleared);
      setIsDeleteConfirmOpen(false);
      toast.success(`${variables.length} buyer(s) moved to trash`);
      setSelectedRows([]);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete buyers");
    },
  });

  // Handle row click to view details
  const handleRowClicked = (row: Buyer) => {
    if (row?._id) {
      router.push(`/dashboard/buyer-management/${row._id}`);
    }
  };

  // Handle row selection
  const handleChange = (selected: {
    allSelected: boolean;
    selectedCount: number;
    selectedRows: Buyer[];
  }) => {
    setSelectedRows(selected.selectedRows);
  };

  // Handle pagination change
  const handlePageChange = (page: number) => {
    setPaginationState((prev) => ({ ...prev, page }));
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  };

  // Handle rows per page change
  const handlePerRowsChange = (newPerPage: number) => {
    setPaginationState((prev) => ({
      ...prev,
      limit: newPerPage,
      page: 1,
    }));
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  };

  // Handle sorting
  const handleSort = (column: any, sortDirection: "asc" | "desc") => {
    setPaginationState((prev) => ({
      ...prev,
      sortBy: column.sortField || column.selector,
      sortOrder: sortDirection,
      page: 1,
    }));
  };

  // Handle date filter change
  const handleDateFilterChange = useCallback((value: string) => {
    setPaginationState((prev) => ({
      ...prev,
      dateFilter: value,
      page: 1,
    }));
    setIsFilterOpen(false);
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setPaginationState((prev) => ({
      ...prev,
      dateFilter: "all",
      page: 1,
    }));
    setSearchTerm("");
    setSearchInput("");
    setIsFilterOpen(false);
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  }, []);

  const handleEdit = () => {
    if (selectedRows.length === 0) {
      toast.error("Please select a buyer to edit");
      return;
    }
    if (selectedRows.length > 1) {
      toast.error("Please select only one buyer to edit");
      return;
    }
    router.push(`/dashboard/buyer-management/edit/${selectedRows[0]._id}`);
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one buyer to delete");
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedRows.length === 0) return;

    const idsToDelete = selectedRows.reduce<string[]>((acc, row) => {
      if (row._id) acc.push(row._id);
      return acc;
    }, []);

    if (idsToDelete.length === 0) return;

    deleteBuyersMutation.mutate(idsToDelete);
  };

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="mt-20 flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A5D36]"></div>
        <span className="ml-3 text-gray-600">Initializing...</span>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-20 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A5D36] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading buyers...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="mt-20 flex flex-col justify-center items-center min-h-64">
        <div className="text-red-500 text-center">
          <IoWarning className="text-4xl mx-auto mb-2" />
          <p className="text-lg font-semibold">Error loading buyers</p>
          <p className="text-sm text-gray-600 mt-1">
            {error?.message || "Something went wrong"}
          </p>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["buyers"] });
            refetch();
          }}
          className="mt-4 px-4 py-2 bg-[#2A5D36] text-white rounded hover:bg-[#1e4728] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-20">
      <Toaster />
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-gray-300 px-4">
        {/* Create New Buyer Button */}
        <div className="w-full md:w-auto">
          <Link href="/dashboard/buyer-management/create-buyer">
            <button className="w-full md:w-auto px-4 py-2 bg-[#2A5D36] text-white text-sm flex items-center justify-center gap-2 rounded cursor-pointer hover:bg-[#1e4728] transition-colors shadow-sm">
              Create New Buyer
              <IoIosPersonAdd className="text-lg" />
            </button>
          </Link>
        </div>

        {/* Search Input */}
        <div className="w-full xl:w-[30rem] md:w-64 lg:w-80 px-4 py-2 rounded-md border border-gray-300 flex items-center gap-2 bg-white shadow-sm">
          <input
            type="text"
            placeholder="Search by Name, ABN"
            className="w-full focus:outline-none bg-transparent"
            value={searchInput}
            onChange={handleSearchInputChange}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleSearch}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            type="button"
          >
            <LuSearch className="text-gray-500 cursor-pointer hover:text-gray-700" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 px-4">
          {/* Title */}
          <div className="w-full md:w-auto">
            <h2 className="text-lg font-semibold text-gray-800">
              List of Buyers ({totalRecords} total)
              {isFilterActive && (
                <span className="text-sm font-normal text-gray-600">
                  {` - Showing ${buyers.length} filtered results`}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
              {totalPages > 0 && (
                <span>
                  {" "}
                  • Showing {(currentPage - 1) * paginationState.limit +
                    1} to{" "}
                  {Math.min(currentPage * paginationState.limit, totalRecords)}{" "}
                  entries
                </span>
              )}
              {hasSearchFilters && (
                <span className="ml-2 text-blue-600">
                  • Active filters applied
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full md:w-auto flex gap-2">
            <button
              onClick={handleEdit}
              className={`w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 text-sm hover:bg-gray-50 transition-colors shadow-sm ${
                selectedRows.length === 1
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              }`}
              disabled={selectedRows.length !== 1}
            >
              <MdOutlineEdit />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className={`w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 text-sm hover:bg-gray-50 transition-colors shadow-sm ${
                selectedRows.length > 0 && !deleteBuyersMutation.isPending
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              }`}
              disabled={
                selectedRows.length === 0 || deleteBuyersMutation.isPending
              }
            >
              {deleteBuyersMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              ) : (
                <RiDeleteBin6Fill className="text-red-500" />
              )}
              Delete
            </button>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors shadow-sm ${
                  isFilterActive ? "bg-blue-50 border-blue-300" : ""
                }`}
              >
                <IoFilterSharp
                  className={isFilterActive ? "text-blue-600" : ""}
                />
                Filter
                {isFilterActive && (
                  <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 p-3">
                    <p className="font-medium text-gray-700">
                      Filter by Creation Date
                    </p>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {dateFilterOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`px-4 py-2 text-sm cursor-pointer flex items-center ${
                          paginationState.dateFilter === option.value
                            ? "bg-blue-50 text-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleDateFilterChange(option.value)}
                      >
                        <span className="flex-grow">{option.label}</span>
                        {paginationState.dateFilter === option.value && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-blue-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>

                  {isFilterActive && (
                    <div
                      className="border-t border-gray-200 px-4 py-2 text-sm cursor-pointer text-red-500 hover:bg-red-50 flex items-center justify-between"
                      onClick={clearFilters}
                    >
                      <span>Clear all filters</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DataTable with Server-side Pagination */}
        <div className="overflow-auto border border-gray-200 shadow-sm">
          <DataTable
            columns={columns}
            data={buyers}
            customStyles={customStyles}
            onRowClicked={handleRowClicked}
            selectableRows
            onSelectedRowsChange={handleChange}
            clearSelectedRows={toggleCleared}
            fixedHeader
            fixedHeaderScrollHeight="500px"
            responsive
            pointerOnHover
            selectableRowsHighlight
            highlightOnHover
            progressPending={isFetching}
            progressComponent={
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A5D36]"></div>
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            }
            // Server-side pagination
            pagination
            paginationServer
            paginationTotalRows={totalRecords}
            paginationDefaultPage={currentPage}
            paginationPerPage={paginationState.limit}
            paginationRowsPerPageOptions={rowsPerPageOptions}
            onChangeRowsPerPage={handlePerRowsChange}
            onChangePage={handlePageChange}
            paginationComponentOptions={{
              rowsPerPageText: "Rows per page:",
              rangeSeparatorText: "of",
              noRowsPerPage: false,
              selectAllRowsItem: false,
              selectAllRowsItemText: "All",
            }}
            // Server-side sorting
            sortServer
            onSort={handleSort}
            // No data component
            noDataComponent={
              <div className="p-10 text-center text-gray-500">
                {totalRecords === 0 && !hasSearchFilters
                  ? "No buyers found. Create your first buyer to get started."
                  : "No buyers found matching your current filters."}
                {isFilterActive && (
                  <div className="mt-4">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            }
          />
        </div>

        {/* Additional pagination info */}
        {totalRecords > 0 && (
          <div className="mt-4 px-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
            <div>
              Showing {(currentPage - 1) * paginationState.limit + 1} to{" "}
              {Math.min(currentPage * paginationState.limit, totalRecords)} of{" "}
              {totalRecords} entries
              {isFilterActive && (
                <span> (filtered from {totalRecords} total entries)</span>
              )}
            </div>
            <div className="mt-2 sm:mt-0">
              {selectedRows.length > 0 && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {selectedRows.length} selected
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="px-5 py-3 border-b border-[#D3D3D3]">
              <h3 className="text-lg font-semibold flex gap-x-5 items-center">
                <IoWarning color="red" />
                Move to trash selected buyers?
              </h3>
            </div>
            <div className="mt-5 px-5 pb-5">
              <p className="mb-4 text-center">
                Are you sure you want to move {selectedRows.length} selected
                buyer(s) to trash?
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  This action can be undone from the trash.
                </span>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  disabled={deleteBuyersMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-[#BF3131] text-white rounded hover:bg-[#a52a2a] flex items-center gap-2"
                  disabled={deleteBuyersMutation.isPending}
                >
                  {deleteBuyersMutation.isPending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {deleteBuyersMutation.isPending
                    ? "Moving..."
                    : "Move to Trash"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerManagementPage;
