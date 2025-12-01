/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

"use client";
import { Buyer, Seller, TContract, TrashData } from "@/types/types";
import React, { useEffect, useRef, useState } from "react";
import DataTable from "react-data-table-component";
import { IoFilterSharp } from "react-icons/io5";
import { RiDeleteBin6Fill, RiResetLeftFill } from "react-icons/ri";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  emptyTrashBin,
  getTrashData,
  permanentlyDeleteTrashItems,
  restoreTrashItems,
} from "@/api/rubbishBinApi";

type DeletedItem =
  | (Buyer & { type: "Buyer" })
  | (Seller & { type: "Seller" })
  | (TContract & { type: "Contract" });

// Updated API function with pagination
const fetchDeletedItems = async (page: number, limit: number, type?: string): Promise<TrashData & { pagination: any, summary: any }> => {
  const response = await getTrashData(page, limit, type);
  return response;
};

const permanentlyDeleteItems = async (itemIds: string[]): Promise<void> => {
  await permanentlyDeleteTrashItems(itemIds);
};

const emptyTrash = async (): Promise<void> => {
  await emptyTrashBin();
};

const RubbishBin = () => {
  const [filteredItems, setFilteredItems] = useState<DeletedItem[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState<
    ("Contract" | "Seller" | "Buyer")[]
  >([]);
  const [selectedRows, setSelectedRows] = useState<DeletedItem[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const queryClient = useQueryClient();

  // Simple notification system
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
  });

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification({ message: "", type: "", visible: false });
    }, 3000);
  };

  // Convert activeFilters to API type parameter
  const getTypeFilter = () => {
    if (activeFilters.length === 1) {
      return activeFilters[0].toLowerCase() + 's'; // Convert to plural for API
    }
    return null; // Return all types if multiple or no filters
  };

  // Fetch deleted items using TanStack Query with pagination
  const {
    data: deletedResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["deletedItems", currentPage, itemsPerPage, getTypeFilter()],
    queryFn: () => fetchDeletedItems(currentPage, itemsPerPage, getTypeFilter()),
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Permanent delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: permanentlyDeleteItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deletedItems"] });
      setSelectedRows([]);
      setShowDeleteModal(false);
      showNotification(
        "Selected items permanently deleted successfully",
        "success"
      );
    },
    onError: (error) => {
      console.error("Error permanently deleting items:", error);
      showNotification("Error permanently deleting items", "error");
    },
  });

  // Empty trash mutation
  const emptyTrashMutation = useMutation({
    mutationFn: emptyTrash,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deletedItems"] });
      setCurrentPage(1); // Reset to first page after emptying
      setShowEmptyModal(false);
      showNotification("Rubbish bin emptied successfully", "success");
    },
    onError: (error) => {
      console.error("Error emptying trash:", error);
      showNotification("Error emptying rubbish bin", "error");
    },
  });

  // Restore items mutation
  const restoreItemsMutation = useMutation({
    mutationFn: restoreTrashItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deletedItems"] });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setSelectedRows([]);
      showNotification("Selected items restored successfully", "success");
    },
    onError: (error) => {
      console.error("Error restoring items:", error);
      showNotification("Error restoring items", "error");
    },
  });

  // Process deleted items data
  const deletedItems: DeletedItem[] = React.useMemo(() => {
    if (!deletedResponse) return [];

    const deletedBuyers = deletedResponse.buyers || [];
    const deletedSellers = deletedResponse.sellers || [];
    const deletedContracts = deletedResponse.contracts || [];

    return [
      ...deletedContracts.map((c: TContract) => ({
        ...c,
        type: "Contract" as const,
      })),
      ...deletedSellers.map((s: Seller) => ({
        ...s,
        type: "Seller" as const,
      })),
      ...deletedBuyers.map((b: Buyer) => ({
        ...b,
        type: "Buyer" as const,
      })),
    ];
  }, [deletedResponse]);

  // Handle error state
  useEffect(() => {
    if (error) {
      showNotification("Error loading deleted items", "error");
    }
  }, [error]);

  // Filter dropdown ref for outside click detection
  const filterRef = useRef<HTMLDivElement>(null);

  // Update filtered items (for display purposes, actual filtering is done server-side)
  useEffect(() => {
    setFilteredItems(deletedItems);
  }, [deletedItems]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters]);

  // Outside click effect to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  const toggleFilter = (type: "Contract" | "Seller" | "Buyer") => {
    if (activeFilters.includes(type)) {
      setActiveFilters(activeFilters.filter((t) => t !== type));
    } else {
      // For server-side filtering, only allow one filter at a time
      setActiveFilters([type]);
    }
    setShowFilterDropdown(false);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setShowFilterDropdown(false);
  };

  const handleRowSelected = (state: { selectedRows: DeletedItem[] }) => {
    setSelectedRows(state.selectedRows);
  };

  const handlePermanentDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmPermanentDelete = () => {
    const itemIds = selectedRows
      .map((item) => item._id)
      .filter((id): id is string => id !== undefined);

    if (itemIds.length === 0) {
      showNotification("No valid items selected for deletion", "error");
      return;
    }

    permanentDeleteMutation.mutate(itemIds);
  };

  const cancelPermanentDelete = () => {
    setShowDeleteModal(false);
  };

  const handleEmptyRubbishBin = async () => {
    if (deletedResponse?.summary?.totalDeleted === 0) {
      showNotification("Rubbish bin is already empty", "info");
      return;
    }
    setShowEmptyModal(true);
  };

  const confirmEmptyTrash = () => {
    emptyTrashMutation.mutate();
  };

  const cancelEmptyTrash = () => {
    setShowEmptyModal(false);
  };

  const handleRestore = () => {
    if (selectedRows.length === 0) {
      showNotification("No valid items selected for restoration", "error");
      return;
    }

    const itemIds = selectedRows
      .map((item) => (typeof item === "string" ? item : item._id))
      .filter((id): id is string => id !== undefined);

    if (itemIds.length === 0) {
      showNotification("No valid items with IDs found", "error");
      return;
    }

    restoreItemsMutation.mutate(itemIds);
  };

  // Pagination handlers for DataTable
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedRows([]); // Clear selections when changing pages
  };

  const handlePerRowsChange = (newPerPage: number) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page
    setSelectedRows([]); // Clear selections
  };

  const columns = [
    {
      name: "NAME",
      selector: (row: DeletedItem) => {
        if (row.type === "Buyer") {
          return (row as Buyer).name;
        } else if (row.type === "Seller") {
          return (row as Seller).legalName;
        } else {
          return (row as TContract).contractNumber || "Contract";
        }
      },
      sortable: true,
      wrap: true,
    },
    {
      name: "TYPE",
      selector: (row: DeletedItem) => row.type,
      sortable: true,
      width: "100px",
    },
    {
      name: "EMAIL",
      selector: (row: DeletedItem) => {
        if (row.type === "Buyer" || row.type === "Seller") {
          return (row as Buyer | Seller).email;
        }
        return "N/A";
      },
      sortable: true,
      wrap: true,
    },
    {
      name: "PHONE",
      selector: (row: DeletedItem) => {
        if (row.type === "Buyer" || row.type === "Seller") {
          return (row as Buyer | Seller).phoneNumber || "N/A";
        }
        return "N/A";
      },
      sortable: true,
    },
    {
      name: "ABN",
      selector: (row: DeletedItem) => {
        if (row.type === "Buyer" || row.type === "Seller") {
          return (row as Buyer | Seller).abn;
        }
        return "N/A";
      },
      sortable: true,
    },
    {
      name: "DELETED AT",
      selector: (row: DeletedItem) => {
        const deletedAt = row.deletedAt;
        return deletedAt
          ? new Date(deletedAt).toISOString().split("T")[0]
          : "N/A";
      },
      sortable: true,
      format: (row: DeletedItem) => {
        const deletedAt = row.deletedAt;
        return deletedAt
          ? new Date(deletedAt).toISOString().split("T")[0]
          : "N/A";
      },
      width: "150px",
    },
  ];

  const customStyles = {
    rows: {
      style: {
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "#E8F2FF",
        },
      },
    },
    cells: {
      style: {
        borderRight: "1px solid #ddd",
        padding: "12px",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
      },
    },
    headCells: {
      style: {
        borderRight: "1px solid #ddd",
        fontWeight: "bold",
        color: "gray",
        padding: "12px",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
      },
    },
  };

  const isAnyMutationLoading =
    permanentDeleteMutation.isPending || emptyTrashMutation.isPending;

  return (
    <div className="mt-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-gray-300 px-4">
        {/* Title */}
        <div className="w-full md:w-auto">
          <p className="text-lg font-semibold text-gray-800">Rubbish bin</p>
          {isLoading && <p className="text-sm text-blue-500">Loading...</p>}
        </div>

        {/* Action Buttons */}
        <div className="w-full md:w-auto flex gap-2">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-md border border-gray-300 flex items-center gap-2 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            disabled={isLoading}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            onClick={handleEmptyRubbishBin}
            className="px-4 py-2 rounded-md border border-gray-300 flex items-center gap-2 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={emptyTrashMutation.isPending || (deletedResponse?.summary?.totalDeleted === 0)}
          >
            <RiDeleteBin6Fill className="text-red-500" />
            {emptyTrashMutation.isPending ? "Emptying..." : "Empty Rubbish Bin"}
          </button>
        </div>
      </div>

      <div className="">
        {/* Summary Cards */}
        <div className="mb-4 p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {deletedResponse?.summary?.totalBuyers || 0}
              </div>
              <div className="text-sm text-gray-600">Deleted Buyers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {deletedResponse?.summary?.totalSellers || 0}
              </div>
              <div className="text-sm text-gray-600">Deleted Sellers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {deletedResponse?.summary?.totalContracts || 0}
              </div>
              <div className="text-sm text-gray-600">Deleted Contracts</div>
            </div>
          </div>
        </div>

        {/* Table Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 px-4">
          {/* Title */}
          <div className="w-full md:w-auto">
            <h2 className="font-semibold text-gray-800">
              List of deleted items
            </h2>
            <p className="text-sm text-gray-500">
              {filteredItems.length} of {deletedResponse?.pagination?.totalItems || 0} items
              {activeFilters.length > 0 &&
                ` (filtered by ${activeFilters.join(", ")})`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full md:w-auto flex gap-2 relative">
            <button
              className={`w-full md:w-auto xl:px-3 xl:py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 text-sm transition-colors shadow-sm ${
                selectedRows.length > 0 && !isAnyMutationLoading
                  ? "cursor-pointer hover:bg-gray-50"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={handleRestore}
              disabled={selectedRows.length === 0 || isAnyMutationLoading}
            >
              <RiResetLeftFill />
              {restoreItemsMutation.isPending ? "Restoring..." : "Restore"}
            </button>
            <button
              className={`w-full md:w-auto xl:px-3 xl:py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 text-sm transition-colors shadow-sm ${
                selectedRows.length > 0 && !isAnyMutationLoading
                  ? "cursor-pointer hover:bg-gray-50"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={handlePermanentDelete}
              disabled={selectedRows.length === 0 || isAnyMutationLoading}
            >
              <RiDeleteBin6Fill className="text-red-500" />
              {permanentDeleteMutation.isPending
                ? "Deleting..."
                : "Permanent Delete"}
            </button>
            <div className="relative" ref={filterRef}>
              <button
                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md flex items-center justify-center gap-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <IoFilterSharp />
                Filter
                {activeFilters.length > 0 && ` (${activeFilters.length})`}
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="p-2">
                    <div
                      className={`px-4 py-2 text-sm cursor-pointer rounded ${
                        activeFilters.includes("Contract")
                          ? "bg-blue-100"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => toggleFilter("Contract")}
                    >
                      Contracts
                    </div>

                    <div
                      className={`px-4 py-2 text-sm cursor-pointer rounded ${
                        activeFilters.includes("Seller")
                          ? "bg-blue-100"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => toggleFilter("Seller")}
                    >
                      Sellers
                    </div>
                    <div
                      className={`px-4 py-2 text-sm cursor-pointer rounded ${
                        activeFilters.includes("Buyer")
                          ? "bg-blue-100"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => toggleFilter("Buyer")}
                    >
                      Buyers
                    </div>
                    {activeFilters.length > 0 && (
                      <div
                        className="px-4 py-2 text-sm cursor-pointer rounded hover:bg-gray-100 text-blue-500"
                        onClick={clearAllFilters}
                      >
                        Clear all filters
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DataTable */}
        <div className="overflow-auto border border-gray-200">
          <DataTable
            columns={columns}
            data={filteredItems}
            progressPending={isLoading}
            selectableRows
            pagination
            paginationServer
            paginationTotalRows={deletedResponse?.pagination?.totalItems || 0}
            paginationDefaultPage={currentPage}
            paginationPerPage={itemsPerPage}
            onChangeRowsPerPage={handlePerRowsChange}
            onChangePage={handlePageChange}
            paginationRowsPerPageOptions={[5, 10, 25, 50, 100]}
            highlightOnHover
            noDataComponent={
              <div className="p-4">
                {error
                  ? "Error loading deleted items"
                  : "No deleted items found"}
              </div>
            }
            fixedHeader
            fixedHeaderScrollHeight="500px"
            selectableRowsHighlight
            responsive
            pointerOnHover
            customStyles={customStyles}
            onSelectedRowsChange={handleRowSelected}
            clearSelectedRows={isAnyMutationLoading}
          />
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-center text-gray-800 mb-4">
                Permanently Delete Items
              </h3>
              <p className="text-gray-600 mb-6 text-center">
                Are you sure you want to permanently delete{" "}
                {selectedRows.length} selected item(s)? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelPermanentDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={permanentDeleteMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPermanentDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                  disabled={permanentDeleteMutation.isPending}
                >
                  {permanentDeleteMutation.isPending
                    ? "Deleting..."
                    : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty Trash Confirmation Modal */}
        {showEmptyModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-center text-gray-800 mb-4">
                Empty Rubbish Bin
              </h3>
              <p className="text-gray-600 mb-6 text-center">
                Are you sure you want to empty the entire rubbish bin? This will
                permanently delete all {deletedResponse?.summary?.totalDeleted || 0} items and cannot be
                undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelEmptyTrash}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 cursor-pointer"
                  disabled={emptyTrashMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEmptyTrash}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 cursor-pointer"
                  disabled={emptyTrashMutation.isPending}
                >
                  {emptyTrashMutation.isPending ? "Emptying..." : "Empty Bin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification.visible && (
          <div className="fixed bottom-4 right-4 max-w-md z-50">
            <div
              className={`rounded-md shadow-lg p-4 ${
                notification.type === "success"
                  ? "bg-green-50 border-l-4 border-green-500"
                  : notification.type === "error"
                  ? "bg-red-50 border-l-4 border-red-500"
                  : "bg-blue-50 border-l-4 border-blue-500"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`mr-3 ${
                    notification.type === "success"
                      ? "text-green-500"
                      : notification.type === "error"
                      ? "text-red-500"
                      : "text-blue-500"
                  }`}
                >
                  {notification.type === "success" ? (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : notification.type === "error" ? (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RubbishBin;