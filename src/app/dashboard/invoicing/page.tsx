/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataTable from "react-data-table-component";
import toast, { Toaster } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IoWarning } from "react-icons/io5";
import { RiCircleFill } from "react-icons/ri";
import { MdDelete, MdFileDownload, MdClose } from "react-icons/md";
import { fetchContracts, updateContract } from "@/api/ContractAPi";
import { TContract, ContractsPaginatedResponse } from "@/types/types";
import InvoiceSearchFilter from "@/components/contract/InvoiceSearchFilter";



interface PaginationState {
  page: number;
  limit: number;
  searchFilters: Record<string, string>;
  dateFrom?: string;
  dateTo?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

// Delete Warning Modal Component
interface DeleteWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  isDeleting?: boolean;
}

const DeleteWarningModal: React.FC<DeleteWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <IoWarning className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Confirm Deletion
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            You are about to mark{" "}
            <span className="font-semibold text-gray-900">
              {selectedCount} Invoiced contract{selectedCount > 1 ? "s" : ""}
            </span> to remove {selectedCount > 1 ? "them" : "it"} from the invoiced
            list.
          </p>
          <p className="text-sm text-gray-600 mt-4">
            Are you sure you want to continue?
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-700 cursor-pointer text-white rounded-lg hover:bg-red-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Deleting...
              </>
            ) : (
              <>
                <IoWarning className="text-lg" />
                Yes, Delete
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

const columns = [
  {
    name: "Invoice No",
    selector: (row: TContract) => row?.xeroInvoiceNumber || "",
    width: "120px",
  },
  {
    name: "CONTRACT NUMBER",
    selector: (row: TContract) => row?.contractNumber || "",
    sortable: true,
    sortField: "contractNumber",
    width: "160px",
  },
  {
    name: "NGR",
    selector: (row: TContract) => row?.ngrNumber || row?.seller?.mainNgr || "",
    sortable: true,
    sortField: "ngrNumber",
    width: "130px",
  },
  {
    name: "SELLER",
    selector: (row: TContract) => row?.seller?.legalName || "",
    sortable: true,
    sortField: "seller.legalName",
    grow: 1,
  },
  {
    name: "BUYER",
    selector: (row: TContract) => row?.buyer?.name || "",
    sortable: true,
    sortField: "buyer.name",
    grow: 1,
  },
  {
    name: "COMMODITY",
    selector: (row: TContract) => row?.commodity || "",
    sortable: true,
    sortField: "commodity",
    width: "130px",
  },
  {
    name: "GRADE",
    selector: (row: TContract) => row?.grade || "",
    sortable: true,
    sortField: "grade",
    width: "100px",
  },
  {
    name: "TONNES",
    selector: (row: TContract) => row?.tonnes || 0,
    sortable: true,
    sortField: "tonnes",
    cell: (row: TContract) => <span>{row?.tonnes?.toLocaleString() || 0}</span>,
    width: "100px",
  },
  {
    name: "CONTRACT PRICE",
    selector: (row: TContract) => row?.priceExGST || 0,
    sortable: true,
    sortField: "priceExGST",
    cell: (row: TContract) => (
      <span>${row?.priceExGST?.toLocaleString() || 0}</span>
    ),
    width: "150px",
  },
  {
    name: "STATUS",
    selector: (row: TContract) => row?.status || "",
    sortable: true,
    sortField: "status",
    cell: (row: TContract) => (
      <p className="text-xs flex items-center gap-x-2">
        <RiCircleFill className="text-[#3B82F6]" />
        {row.status || "Unknown"}
      </p>
    ),
    width: "120px",
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
    },
  },
  headCells: {
    style: {
      borderRight: "1px solid #ddd",
      fontWeight: "bold",
      color: "#6B7280",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
  },
};

const InvoicingPage = () => {
  const router = useRouter();

  // State management
  const [isMounted, setIsMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState<TContract[]>([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Pagination state - hardcoded to Invoiced status
  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: 1,
    limit: 10,
    searchFilters: {},
    dateFrom: undefined,
    dateTo: undefined,
    sortBy: "contractDate",
    sortOrder: "desc",
  });
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (contracts: TContract[]) => {
      const updatePromises = contracts.map((contract) =>
        updateContract(
          {
            status: "Complete",
            xeroInvoiceId: "",
            xeroInvoiceNumber: "",
          } as any,
          contract._id as string
        )
      );
      return Promise.all(updatePromises);
    },

    onMutate: async (contracts) => {
      await queryClient.cancelQueries({ queryKey: ["contracts", "invoiced"] });

      const previousContracts = queryClient.getQueryData([
        "contracts",
        "invoiced",
        paginationState,
      ]);

      queryClient.setQueryData(
        ["contracts", "invoiced", paginationState],
        (old: any) => {
          if (!old?.data) return old;

          const contractIds = contracts.map((c) => c._id);

          return {
            ...old,
            data: old.data.filter(
              (contract: TContract) => !contractIds.includes(contract._id)
            ),
            total: (old.total || 0) - contracts.length,
            pagination: old.pagination
              ? {
                  ...old.pagination,
                  totalCount: old.pagination.totalCount - contracts.length,
                }
              : undefined,
          };
        }
      );

      setSelectedRows([]);
      setToggleCleared((prev) => !prev);

      toast.success(
        `Removing ${contracts.length} contract${
          contracts.length > 1 ? "s" : ""
        } from invoiced...`
      );

      return { previousContracts };
    },

    onSuccess: (_, contracts) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success(
        `${contracts.length} contract${
          contracts.length > 1 ? "s" : ""
        } marked as Complete and removed from invoiced list`
      );
    },

    onError: (error: any, _, context) => {
      if (context?.previousContracts) {
        queryClient.setQueryData(
          ["contracts", "invoiced", paginationState],
          context.previousContracts
        );
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update contracts";
      toast.error(errorMessage);
    },
  });

  // Delete handler - opens modal
  const handleDelete = () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one contract to remove");
      return;
    }
    setShowDeleteModal(true);
  };

  // Confirm delete - executes deletion
  const confirmDelete = () => {
    deleteMutation.mutate(selectedRows);
    setShowDeleteModal(false);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Build query params including search filters
  const buildQueryParams = () => {
    const params: any = {
      page: paginationState.page,
      limit: paginationState.limit,
      status: "Invoiced",
      sortBy: paginationState.sortBy,
      sortOrder: paginationState.sortOrder,
    };

    // Add search filters to query params
    Object.entries(paginationState.searchFilters).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        switch (key) {
          case "contractNumber":
            params.contractNumber = value.trim();
            break;
          case "ngr":
            params.ngrNumber = value.trim();
            break;
          case "seller":
            params.sellerName = value.trim();
            break;
          case "buyer":
            params.buyerName = value.trim();
            break;
          default:
            params[key] = value.trim();
        }
      }
    });

    // Add date filters
    if (paginationState.dateFrom) {
      params.dateFrom = paginationState.dateFrom;
    }
    if (paginationState.dateTo) {
      params.dateTo = paginationState.dateTo;
    }

    return params;
  };

  // Fetch contracts - only Invoiced status with server-side filtering
  const {
    data: contractsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<ContractsPaginatedResponse>({
    queryKey: ["contracts", "invoiced", paginationState],
    queryFn: () => {
      return fetchContracts(buildQueryParams());
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: isMounted,
  });

  // Extract data from response
  const contracts = contractsResponse?.data || [];
  const totalRecords = contractsResponse?.total || 0;
  const currentPage = contractsResponse?.page || 1;
  const totalPages = contractsResponse?.totalPages || 0;

  // Handle filter change from InvoiceSearchFilter
  const handleFilterChange = (filters: {
    searchFilters: Record<string, string>;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    setPaginationState((prev) => ({
      ...prev,
      page: 1,
      searchFilters: filters.searchFilters,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }));
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  };

  // Handle row click
  const handleRowClicked = (row: TContract) => {
    if (row?._id) {
      router.push(`/dashboard/contract-management/${row._id}`);
    }
  };

  // Handle row selection
  const handleChange = (selected: {
    allSelected: boolean;
    selectedCount: number;
    selectedRows: TContract[];
  }) => {
    setSelectedRows(
      selected.selectedRows.filter((row): row is TContract => row?._id != null)
    );
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPaginationState((prev) => ({ ...prev, page }));
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  };

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

  // Export to CSV
  const handleExport = () => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : contracts;

    const csvHeaders =
      "Date,Contract Number,NGR,Seller,Buyer,Commodity,Grade,Tonnes,Contract Price,Status\n";
    const csvRows = dataToExport
      .map((contract) => {
        const date = new Date(
          contract.contractDate || contract.createdAt
        ).toLocaleDateString();
        const contractNumber = contract.contractNumber || "";
        const ngr = contract.ngrNumber || contract.seller?.mainNgr || "";
        const seller = contract.seller?.legalName || "";
        const buyer = contract.buyer?.name || "";
        const commodity = contract.commodity || "";
        const grade = contract.grade || "";
        const tonnes = contract.tonnes || 0;
        const price = contract.priceExGST || 0;
        const status = contract.status || "";

        return `"${date}","${contractNumber}","${ngr}","${seller}","${buyer}","${commodity}","${grade}","${tonnes}","${price}","${status}"`;
      })
      .join("\n");

    const csv = csvHeaders + csvRows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoiced-contracts-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // View in Xero
  const handleViewInXero = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one contract to view in Xero");
      return;
    }

    selectedRows.forEach((row: TContract) => {
      if (!row?.xeroInvoiceId) {
        console.warn(`Contract ${row.contractNumber} has no Xero Invoice ID`);
        return;
      }

      const invoiceUrl = `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${row.xeroInvoiceId}`;
      window.open(invoiceUrl, "_blank");
    });
  };

  const hasActiveFilters =
    Object.keys(paginationState.searchFilters).length > 0 ||
    paginationState.dateFrom ||
    paginationState.dateTo;

  if (!isMounted) {
    return (
      <div className="mt-20 flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A5D36]"></div>
        <span className="ml-3 text-gray-600">Initializing...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-20 flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A5D36]"></div>
        <span className="ml-3 text-gray-600">
          Loading invoiced contracts...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-20 flex flex-col justify-center items-center min-h-64">
        <div className="text-red-500 text-center">
          <IoWarning className="text-4xl mx-auto mb-2" />
          <p className="text-lg font-semibold">Error loading contracts</p>
          <p className="text-sm text-gray-600 mt-1">
            {error?.message || "Something went wrong"}
          </p>
        </div>
        <button
          onClick={() => refetch()}
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

      {/* Delete Warning Modal */}
      <DeleteWarningModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        selectedCount={selectedRows.length}
        isDeleting={deleteMutation.isPending}
      />

      <div className="px-5">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Invoiced Contracts
          </h1>
        </div>
        <div className="flex justify-between">
          {/* Action Buttons */}
          <div className="mb-4 flex flex-wrap gap-3">
            <button
              onClick={handleViewInXero}
              disabled={selectedRows.length === 0}
              className="px-4 py-2 bg-[#13B5EA] text-white rounded-lg hover:bg-[#0E92BB] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
              View in Xero{" "}
              {selectedRows.length > 0 && `(${selectedRows.length})`}
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-[#2A5D36] text-white rounded-lg hover:bg-[#1e4728] transition-colors flex items-center gap-2 font-medium"
            >
              <MdFileDownload className="text-xl" />
              Export{" "}
              {selectedRows.length > 0
                ? `Selected (${selectedRows.length})`
                : "All"}
            </button>
            <button
              onClick={handleDelete}
              disabled={selectedRows.length === 0 || deleteMutation.isPending}
              className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <MdDelete className="text-xl" />
              {deleteMutation.isPending
                ? "Deleting..."
                : `Delete${
                    selectedRows.length > 0 ? ` (${selectedRows.length})` : ""
                  }`}
            </button>
          </div>
          {/* Invoice Search Filter */}
          <div className="w-full xl:w-[30rem] md:w-64 lg:w-80 relative">
            <InvoiceSearchFilter onFilterChange={handleFilterChange} />
          </div>
        </div>
        {/* Results Summary */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{contracts.length}</span> of{" "}
            <span className="font-semibold">{totalRecords}</span> invoiced
            contract{totalRecords !== 1 ? "s" : ""}
            {hasActiveFilters && " (filtered)"}
          </p>
          {selectedRows.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {selectedRows.length} selected
            </span>
          )}
        </div>

        {/* Pagination Info */}
        {totalRecords > 0 && (
          <p className="text-xs text-gray-500 mb-3">
            Page {currentPage} of {totalPages} • Showing{" "}
            {(currentPage - 1) * paginationState.limit + 1} to{" "}
            {Math.min(currentPage * paginationState.limit, totalRecords)}{" "}
            entries
          </p>
        )}
      </div>

      {/* DataTable */}
      <div className="overflow-x-auto border border-gray-300">
        <DataTable
          columns={columns}
          data={contracts}
          customStyles={customStyles}
          onRowClicked={handleRowClicked}
          selectableRows
          onSelectedRowsChange={handleChange}
          clearSelectedRows={toggleCleared}
          fixedHeader
          fixedHeaderScrollHeight="550px"
          highlightOnHover
          selectableRowsHighlight
          responsive
          pointerOnHover
          progressPending={isFetching}
          progressComponent={
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A5D36]"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          }
          pagination
          paginationServer
          paginationTotalRows={totalRecords}
          paginationDefaultPage={currentPage}
          paginationPerPage={paginationState.limit}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          onChangeRowsPerPage={handlePerRowsChange}
          onChangePage={handlePageChange}
          paginationComponentOptions={{
            rowsPerPageText: "Rows per page:",
            rangeSeparatorText: "of",
            noRowsPerPage: false,
            selectAllRowsItem: false,
          }}
          sortServer
          onSort={handleSort}
          noDataComponent={
            <div className="p-10 text-center text-gray-500">
              {hasActiveFilters
                ? "No invoiced contracts match your current filters."
                : "No invoiced contracts found."}
            </div>
          }
        />
      </div>
    </div>
  );
};

export default InvoicingPage;
