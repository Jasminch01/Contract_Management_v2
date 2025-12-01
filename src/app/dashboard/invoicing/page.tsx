/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DataTable from "react-data-table-component";
import { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { IoWarning } from "react-icons/io5";
import { RiCircleFill } from "react-icons/ri";
import { MdFileDownload } from "react-icons/md";
import { fetchContracts } from "@/api/ContractAPi";
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
      // padding: "12px",
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

const ContractManagementPage = () => {
  const router = useRouter();

  // State management
  const [isMounted, setIsMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState<TContract[]>([]);
  const [toggleCleared, setToggleCleared] = useState(false);

  // Pagination state - hardcoded to Invoiced status
  const [paginationState, setPaginationState] = useState<PaginationState>({
    page: 1,
    limit: 25,
    searchFilters: {},
    dateFrom: undefined,
    dateTo: undefined,
    sortBy: "contractDate",
    sortOrder: "desc",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch contracts - only Invoiced status
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
      return fetchContracts({
        ...paginationState,
        status: "Invoiced",
      });
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: isMounted,
  });

  // Extract and filter data
  let contracts = contractsResponse?.data || [];

  // Apply client-side filters
  if (
    Object.keys(paginationState.searchFilters).length > 0 ||
    paginationState.dateFrom ||
    paginationState.dateTo
  ) {
    contracts = contracts.filter((contract) => {
      // Apply search filters
      const searchMatch = Object.entries(paginationState.searchFilters).every(
        ([key, value]) => {
          if (!value) return true;

          const searchValue = value.toLowerCase();

          switch (key) {
            case "contractNumber":
              return contract.contractNumber
                ?.toLowerCase()
                .includes(searchValue);
            case "ngr":
              return (
                contract.ngrNumber?.toLowerCase().includes(searchValue) ||
                contract.seller?.mainNgr?.toLowerCase().includes(searchValue)
              );
            case "seller":
              return contract.seller?.legalName
                ?.toLowerCase()
                .includes(searchValue);
            case "buyer":
              return contract.buyer?.name?.toLowerCase().includes(searchValue);
            default:
              return true;
          }
        }
      );

      // Apply date filters
      const contractDate = new Date(
        contract.contractDate || contract.createdAt
      );
      const dateFromMatch =
        !paginationState.dateFrom ||
        contractDate >= new Date(paginationState.dateFrom);
      const dateToMatch =
        !paginationState.dateTo ||
        contractDate <= new Date(paginationState.dateTo + "T23:59:59");

      return searchMatch && dateFromMatch && dateToMatch;
    });
  }

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

      // ✅ Xero invoice direct URL
      const invoiceUrl = `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${row.xeroInvoiceId}`;

      // ✅ Open in a new tab
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
          </div>
          {/* Invoice Search Filter */}
          <div className="w-full xl:w-[30rem] md:w-64 lg:w-80 relative">
            <InvoiceSearchFilter onFilterChange={handleFilterChange} />
          </div>
        </div>
        {/* Results Summary */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{contracts.length}</span>{" "}
            invoiced contract{contracts.length !== 1 ? "s" : ""}
            {hasActiveFilters && " (filtered)"}
          </p>
          {selectedRows.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {selectedRows.length} selected
            </span>
          )}
        </div>
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
          paginationPerPage={paginationState.limit}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          onChangeRowsPerPage={handlePerRowsChange}
          onChangePage={handlePageChange}
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

export default ContractManagementPage;
