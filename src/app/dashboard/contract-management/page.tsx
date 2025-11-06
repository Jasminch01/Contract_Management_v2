/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DataTable from "react-data-table-component";
import toast, { Toaster } from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HiOutlineDocumentDuplicate } from "react-icons/hi";
import { IoIosPersonAdd, IoIosSend } from "react-icons/io";
import { IoFilterSharp, IoWarning } from "react-icons/io5";
import { MdOutlineEdit } from "react-icons/md";
import { RiCircleFill, RiDeleteBin6Fill } from "react-icons/ri";
import ExportCsv from "@/components/contract/ExportCsv";
import PdfExportButton from "@/components/contract/PdfExportButton";
import AdvanceSearchFilter from "@/components/contract/AdvanceSearchFilter";
import { fetchContracts, moveContractToTrash } from "@/api/ContractAPi";
import {
  TContract,
  FetchContractsParams,
  ContractsPaginatedResponse,
} from "@/types/types";

import { IoReceiptOutline } from "react-icons/io5";
import { MdCheckCircle } from "react-icons/md";
import {
  authorizeXero,
  createXeroInvoice,
  getXeroConnectionStatus,
} from "@/api/xeroApi";
import { GiPaperClip } from "react-icons/gi";

// Types for pagination parameters
interface PaginationState {
  page: number;
  limit: number;
  searchFilters: Record<string, string>;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

// LocalStorage key for persisting filters
const FILTER_STORAGE_KEY = "contract_management_filters";

// Helper functions for localStorage
const saveFiltersToStorage = (state: PaginationState) => {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving filters to localStorage:", error);
  }
};

const loadFiltersFromStorage = (): Partial<PaginationState> | null => {
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading filters from localStorage:", error);
  }
  return null;
};

const clearFiltersFromStorage = () => {
  try {
    localStorage.removeItem(FILTER_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing filters from localStorage:", error);
  }
};

const columns = [
  {
    name: "DATE",
    selector: (row: TContract) => {
      if (!row?.createdAt) return "";
      const date = new Date(row.contractDate || row.createdAt);
      return date.toLocaleDateString();
    },
    sortable: true,
    sortField: "contractDate",
  },
  {
    name: "CONTRACT NUMBER",
    selector: (row: TContract) => row?.contractNumber || "",
    sortable: true,
    sortField: "contractNumber",
  },
  {
    name: "SEASON",
    selector: (row: TContract) => row?.season || "",
    sortable: true,
    sortField: "season",
  },
  {
    name: "NGR",
    selector: (row: TContract) => row?.ngrNumber || row?.seller?.mainNgr || "",
    sortable: true,
    sortField: "ngrNumber",
  },
  {
    name: "SELLER",
    selector: (row: TContract) => row?.seller?.legalName || "",
    sortable: true,
    sortField: "seller.legalName",
  },
  {
    name: "SELLER ATTACHMENT",
    cell: (row: TContract) =>
      row?.attachedSellerContract ? (
        <a
          href={row.attachedSellerContract}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:underline"
        >
          <GiPaperClip size={16} /> View
        </a>
      ) : (
        <span className="text-gray-400">N/A</span>
      ),
    sortable: true,
    sortField: "seller.legalName",
  },
  {
    name: "GRADE",
    selector: (row: TContract) => row?.grade || "",
    sortable: true,
    sortField: "grade",
  },
  {
    name: "TONNES",
    selector: (row: TContract) => row?.tonnes || "",
    sortable: true,
    sortField: "tonnes",
  },
  {
    name: "BUYER",
    selector: (row: TContract) => row?.buyer?.name || "",
    sortable: true,
    sortField: "buyer.name",
  },
  {
    name: "BUYER ATTACHMENT",
    cell: (row: TContract) =>
      row?.attachedBuyerContract ? (
        <a
          href={row.attachedBuyerContract}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:underline"
        >
          <GiPaperClip size={16} /> View
        </a>
      ) : (
        <span className="text-gray-400">N/A</span>
      ),
    sortable: true,
    sortField: "seller.legalName",
  },
  {
    name: "DESTINATION",
    selector: (row: TContract) => row?.deliveryDestination || "",
    sortable: true,
    sortField: "deliveryDestination",
  },
  {
    name: "CONTRACT PRICE",
    selector: (row: TContract) => row?.priceExGST || 0,
    sortable: true,
    sortField: "priceExGST",
  },
  {
    name: "STATUS",
    selector: (row: TContract) => row?.status || "",
    sortable: true,
    sortField: "status",
    cell: (row: TContract) => (
      <p className={`text-xs flex items-center gap-x-3`}>
        <RiCircleFill
          className={`${
            row.status?.toLowerCase() === "complete"
              ? "text-[#108A2B]"
              : row.status?.toLowerCase() === "invoiced"
              ? "text-[#3B82F6]"
              : row.status?.toLowerCase() === "draft"
              ? "text-[#EF4444]"
              : "text-[#FAD957]"
          }`}
        />
        {row.status || "Unknown"}
      </p>
    ),
  },
  {
    name: "NOTES",
    selector: (row: TContract) => row.notes || "",
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
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
  },
  headCells: {
    style: {
      borderRight: "1px solid #ddd",
      fontWeight: "bold",
      color: "gray",
      padding: "12px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
  },
};

const statusOptions = [
  { value: "Complete", label: "Complete" },
  { value: "Incomplete", label: "Incomplete" },
  { value: "Invoiced", label: "Invoiced" },
  { value: "Draft", label: "Draft" },
];

const rowsPerPageOptions = [10, 25, 50, 100];

const ContractManagementPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State management
  const [isMounted, setIsMounted] = useState(false);
  const [selectedRows, setSelectedRows] = useState<TContract[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [toggleCleared, setToggleCleared] = useState(false);

  // Initialize pagination state with stored filters
  const getInitialPaginationState = (): PaginationState => {
    const storedFilters = loadFiltersFromStorage();

    if (storedFilters) {
      return {
        page: storedFilters.page || 1,
        limit: storedFilters.limit || 10,
        searchFilters: storedFilters.searchFilters || {},
        status: storedFilters.status || "",
        sortBy: storedFilters.sortBy || "",
        sortOrder: storedFilters.sortOrder || "asc",
      };
    }

    return {
      page: 1,
      limit: 10,
      searchFilters: {},
      status: "",
      sortBy: "",
      sortOrder: "asc",
    };
  };

  const [paginationState, setPaginationState] = useState<PaginationState>(
    getInitialPaginationState
  );

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    reference: "",
    notes: "",
  });

  const [xeroStatus, setXeroStatus] = useState<{
    isConnected: boolean;
    tenantName: string | null; // ✅ CORRECT
    isChecking: boolean;
  }>({
    isConnected: false,
    tenantName: null,
    isChecking: false,
  });
  // Save filters to localStorage whenever pagination state changes
  useEffect(() => {
    if (isMounted) {
      saveFiltersToStorage(paginationState);
    }
  }, [paginationState, isMounted]);

  // Check Xero connection status on mount
  useEffect(() => {
    const checkXeroStatus = async () => {
      try {
        setXeroStatus((prev) => ({ ...prev, isChecking: true }));
        const status = await getXeroConnectionStatus();

        setXeroStatus({
          isConnected: status?.connected,
          tenantName: status?.tenantName || null,
          isChecking: false,
        });
      } catch (error) {
        console.error("Error checking Xero status:", error);
        setXeroStatus({
          isConnected: false,
          tenantName: null,
          isChecking: false,
        });
      }
    };

    if (isMounted) {
      checkXeroStatus();
    }
  }, [isMounted]);

  //mutation for creating invoice ( multiple contracts)
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const result = await createXeroInvoice(data);
      return result;
    },

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });

      // Refresh Xero status after successful invoice creation
      getXeroConnectionStatus().then((status) => {
        setXeroStatus({
          isConnected: status.connected,
          tenantName: status.tenantName || null,
          isChecking: false,
        });
      });

      setIsInvoiceModalOpen(false);
      setSelectedRows([]);
      setToggleCleared((prev) => !prev);

      // Check if it was an update or creation
      const isUpdate = response?.isUpdate || false;
      toast.success(
        <div>
          <p className="font-semibold">
            Invoice {isUpdate ? "updated" : "created"} successfully
          </p>
        </div>,
        { duration: 5000 }
      );
    },

    onError: async (error: any) => {
      console.error("Error creating invoice:", error);

      const errorData = error.response?.data || error;
      const errorMessage =
        errorData.message || error.message || "Failed to create invoice";
      const requiresReconnection = errorData.requiresReconnection || false;
      const errorCode = errorData.error;

      // Handle token expiration - automatically reconnect
      if (
        requiresReconnection ||
        errorCode === "TOKEN_EXPIRED" ||
        errorCode === "REFRESH_TOKEN_EXPIRED" ||
        errorCode === "AUTHENTICATION_ERROR" ||
        errorCode === "NO_CREDENTIALS" ||
        errorMessage.includes("expired") ||
        errorMessage.includes("reconnect")
      ) {
        toast.dismiss();

        // Show reconnection in progress
        toast.loading("Xero session expired. Reconnecting...", {
          duration: 3000,
        });

        try {
          // Reset connection status
          setXeroStatus({
            isConnected: false,
            tenantName: null,
            isChecking: false,
          });

          // Wait a moment for the toast to show
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Attempt automatic reconnection
          const authorized = await authorizeXero();
          toast.dismiss();

          if (!authorized) {
            toast.error(
              <div>
                <p className="font-semibold">Reconnection Failed</p>
                <p className="text-sm mt-1">
                  Please try creating the invoice again to reconnect.
                </p>
              </div>,
              { duration: 5000 }
            );
            return;
          }

          // Verify the new connection
          const newStatus = await getXeroConnectionStatus();

          setXeroStatus({
            isConnected: newStatus.connected,
            tenantName: newStatus.tenantName || null,
            isChecking: false,
          });

          if (newStatus.connected && newStatus.tenantName) {
            toast.success(
              <div>
                <p className="font-semibold">Reconnected to Xero!</p>
                <p className="text-sm mt-1">
                  Please click &quot;Create Invoice&quot; again to proceed.
                </p>
              </div>,
              { duration: 5000 }
            );
          } else {
            toast.error("Failed to verify Xero connection. Please try again.");
          }
        } catch (reconnectError: any) {
          toast.dismiss();
          console.error("Auto-reconnection failed:", reconnectError);

          toast.error(
            <div>
              <p className="font-semibold">Unable to Reconnect</p>
              <p className="text-sm mt-1">
                {reconnectError.message ||
                  "Please try clicking 'Create Invoice' again."}
              </p>
            </div>,
            { duration: 6000 }
          );
        }
      } else {
        // Other errors
        toast.error(errorMessage, { duration: 4000 });
      }
    },
  });

    const areAllContractsInvoiced = (contracts: TContract[]): boolean => {
    return contracts.length > 0 && 
      contracts.every(contract => contract.status?.toLowerCase() === 'invoiced');
  };
  // Group contracts by invoice recipient (based on brokeragePayableBy)
  const groupContractsByInvoiceRecipient = (contracts: TContract[]) => {
    const groups: { [key: string]: TContract[] } = {};

    contracts.forEach((contract) => {
      const brokeragePayableBy =
        contract.brokeragePayableBy?.toLowerCase().trim() || "buyer";

      let recipientKey = "";

      // Determine the invoice recipient based on brokeragePayableBy
      if (brokeragePayableBy.includes("seller")) {
        // If seller pays (fully or partially), group by seller
        // Use email as primary key, fallback to legal name
        const sellerEmail = contract.seller?.email?.toLowerCase().trim() || "";
        const sellerName = contract.seller?.legalName?.trim() || "";

        // Create a consistent key using email (preferred) or name
        const sellerIdentifier = sellerEmail || sellerName;
        recipientKey = `seller|${sellerIdentifier}`;
      } else {
        // If buyer pays, group by buyer
        // Use email as primary key, fallback to name
        const buyerEmail = contract.buyer?.email?.toLowerCase().trim() || "";
        const buyerName = contract.buyer?.name?.trim() || "";

        // Create a consistent key using email (preferred) or name
        const buyerIdentifier = buyerEmail || buyerName;
        recipientKey = `buyer|${buyerIdentifier}`;
      }

      // Initialize group if it doesn't exist
      if (!groups[recipientKey]) {
        groups[recipientKey] = [];
      }

      groups[recipientKey].push(contract);
    });

    return groups;
  };

  const handleCreateInvoice = async () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one contract to create invoice");
      return;
    }

    // Filter out contracts that are not completed or invoiced
    const allowedStatuses = ["complete", "invoiced"];

    const invalidContracts = selectedRows.filter(
      (contract) =>
        !contract?._id ||
        !allowedStatuses.includes(contract.status?.toLowerCase()) ||
        !contract.buyer?.name ||
        !contract.buyer?.email
    );

    if (invalidContracts.length > 0) {
      const issues = [];

      if (invalidContracts.some((c) => !c?._id)) {
        issues.push("invalid contract data");
      }

      const invalidStatusContracts = invalidContracts.filter(
        (c) => !allowedStatuses.includes(c.status?.toLowerCase())
      );

      if (invalidStatusContracts.length > 0) {
        const statusList = invalidStatusContracts
          .map((c) => `${c.contractNumber} (${c.status || "unknown"})`)
          .join(", ");
        issues.push(`invalid status: ${statusList}`);
      }

      if (invalidContracts.some((c) => !c.buyer?.name || !c.buyer?.email)) {
        issues.push("incomplete buyer information");
      }

      toast.error(
        `Cannot create invoice: ${issues.join(
          "; "
        )}. Only completed or invoiced contracts can be invoiced.`,
        { duration: 6000 }
      );
      return;
    }

    const contractGroups = groupContractsByInvoiceRecipient(selectedRows);
    const groupCount = Object.keys(contractGroups).length;

    if (groupCount > 1) {
      toast.loading(
        `Selected contracts will be split into ${groupCount} separate invoices based on invoice recipient and payment terms.`,
        { duration: 6000 }
      );
    }

    try {
      // Check current connection status
      const status = await getXeroConnectionStatus();

      console.log("Xero Status:", status);

      // If not connected, automatically initiate connection
      if (!status.connected || !status.tenantName) {
        toast.loading("Connecting to Xero...");

        try {
          const authorized = await authorizeXero();
          toast.dismiss();

          if (!authorized) {
            toast.error("Xero authorization failed. Please try again.");
            return;
          }

          // Verify connection after authorization
          const newStatus = await getXeroConnectionStatus();

          console.log("New Xero Status:", newStatus);

          setXeroStatus({
            isConnected: newStatus.connected,
            tenantName: newStatus.tenantName || null,
            isChecking: false,
          });

          if (!newStatus.connected || !newStatus.tenantName) {
            toast.error(
              "Xero connection verification failed. Please try again."
            );
            return;
          }

          toast.success(
            `Xero connected successfully to ${newStatus.tenantName}!`
          );
        } catch (error: any) {
          toast.dismiss();
          toast.error(error.message || "Failed to connect to Xero");
          return;
        }
      } else {
        // Already connected, update UI state
        setXeroStatus({
          isConnected: true,
          tenantName: status.tenantName,
          isChecking: false,
        });
      }

      // Prepare invoice form data
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);

      const firstContract = selectedRows[0];
      const reference =
        selectedRows.length === 1
          ? `${firstContract.contractNumber} - ${firstContract.seller?.legalName}`
          : `Brokerage Invoice - ${selectedRows.length} contracts`;

      const combinedNotes = selectedRows
        .map((c) => c.notes)
        .filter((note) => note && note.trim())
        .join("\n---\n");

      setInvoiceFormData({
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: defaultDueDate.toISOString().split("T")[0],
        reference: reference,
        notes: combinedNotes || "",
      });

      setIsInvoiceModalOpen(true);
    } catch (error: any) {
      console.error("Error in handleCreateInvoice:", error);
      toast.error(error.message || "Failed to verify Xero connection");
    }
  };

  const confirmCreateInvoice = async () => {
    if (!invoiceFormData.dueDate) {
      toast.error("Please select a due date");
      return;
    }

    // Check connection status before proceeding
    try {
      const currentStatus = await getXeroConnectionStatus();

      if (!currentStatus.connected || !currentStatus.tenantName) {
        toast.loading("Xero not connected. Connecting now...");

        try {
          const authorized = await authorizeXero();
          toast.dismiss();

          if (!authorized) {
            toast.error("Failed to connect to Xero. Please try again.");
            return;
          }

          const newStatus = await getXeroConnectionStatus();

          setXeroStatus({
            isConnected: newStatus.connected,
            tenantName: newStatus.tenantName || null,
            isChecking: false,
          });

          if (!newStatus.connected || !newStatus.tenantName) {
            toast.error("Connection verification failed. Please try again.");
            return;
          }

          toast.success(`Connected to Xero: ${newStatus.tenantName}`);
        } catch (connectError: any) {
          toast.dismiss();
          toast.error(connectError.message || "Failed to connect to Xero");
          return;
        }
      }
    } catch (error) {
      console.error("Error checking Xero status:", error);
    }

    const contractGroups = groupContractsByInvoiceRecipient(selectedRows);
    const groupKeys = Object.keys(contractGroups);

    console.log("Contract Groups:", contractGroups);
    console.log("Number of invoices to create:", groupKeys.length);

    if (groupKeys.length === 1) {
      // Single invoice for all contracts (same recipient)
      const contracts = contractGroups[groupKeys[0]];
      const firstContract = contracts[0];

      // Determine recipient info
      const brokeragePayableBy =
        firstContract.brokeragePayableBy?.toLowerCase() || "buyer";
      const recipientType = brokeragePayableBy.includes("seller")
        ? "seller"
        : "buyer";
      const recipientName =
        recipientType === "seller"
          ? firstContract.seller?.legalName
          : firstContract.buyer?.name;

      console.log(
        `Creating single invoice for ${contracts.length} contracts - ${recipientName}`
      );

      createInvoiceMutation.mutate({
        contractIds: contracts.map((c) => c._id!),
        invoiceDate: invoiceFormData.invoiceDate,
        dueDate: invoiceFormData.dueDate,
        reference:
          invoiceFormData.reference ||
          (contracts.length === 1
            ? `${contracts[0].contractNumber} - ${recipientName}`
            : `Brokerage Invoice - ${recipientName} (${contracts.length} contracts)`),
        notes: invoiceFormData.notes,
      });
    } else {
      // Multiple invoices for different recipients
      toast.loading(`Creating ${groupKeys.length} invoices...`);

      try {
        const promises = groupKeys.map((key) => {
          const contracts = contractGroups[key];
          const firstContract = contracts[0];

          // Determine recipient info
          const brokeragePayableBy =
            firstContract.brokeragePayableBy?.toLowerCase() || "buyer";
          const recipientType = brokeragePayableBy.includes("seller")
            ? "seller"
            : "buyer";
          const recipientName =
            recipientType === "seller"
              ? firstContract.seller?.legalName
              : firstContract.buyer?.name;

          const groupReference =
            contracts.length === 1
              ? `${contracts[0].contractNumber} - ${recipientName}`
              : `Brokerage Invoice - ${recipientName} (${contracts.length} contracts)`;

          console.log(
            `Creating invoice for ${contracts.length} contracts - ${recipientName}`
          );

          return createXeroInvoice({
            contractIds: contracts.map((c) => c._id!),
            invoiceDate: invoiceFormData.invoiceDate,
            dueDate: invoiceFormData.dueDate,
            reference: groupReference,
            notes: invoiceFormData.notes,
          });
        });

        const results = await Promise.all(promises);
        toast.dismiss();

        queryClient.invalidateQueries({ queryKey: ["contracts"] });
        setIsInvoiceModalOpen(false);
        setSelectedRows([]);
        setToggleCleared((prev) => !prev);

        // Count how many were updated vs created
        const updatedCount = results.filter((r) => r.data?.isUpdate).length;
        const createdCount = results.length - updatedCount;

        let successMessage = "";
        if (updatedCount > 0 && createdCount > 0) {
          successMessage = `Successfully created ${createdCount} and updated ${updatedCount} invoices!`;
        } else if (updatedCount > 0) {
          successMessage = `Successfully updated ${updatedCount} invoice${
            updatedCount > 1 ? "s" : ""
          }!`;
        } else {
          successMessage = `Successfully created ${createdCount} invoice${
            createdCount > 1 ? "s" : ""
          }!`;
        }

        toast.success(successMessage, {
          duration: 5000,
        });
      } catch (error: any) {
        toast.dismiss();

        // Handle token expiration in batch invoice creation
        const errorData = error.response?.data || error;
        if (errorData.requiresReconnection) {
          toast.error(
            <div>
              <p className="font-semibold">Xero Session Expired</p>
              <p className="text-sm mt-1">
                Please close this dialog and try again to reconnect.
              </p>
            </div>,
            { duration: 5000 }
          );

          setXeroStatus({
            isConnected: false,
            tenantName: null,
            isChecking: false,
          });
        } else {
          toast.error(error.message || "Failed to create invoices");
        }
      }
    }
  };

  // Track if search filters are active
  const [hasSearchFilters, setHasSearchFilters] = useState(
    Object.keys(paginationState.searchFilters).length > 0 &&
      Object.values(paginationState.searchFilters).some((v) => v.trim() !== "")
  );

  // Handle search filter changes from AdvanceSearchFilter component
  const handleAdvanceFilterChange = useCallback(
    (filters: Record<string, string>) => {
      const hasFilters =
        Object.keys(filters).length > 0 &&
        Object.values(filters).some((v) => v.trim() !== "");

      setPaginationState((prev) => ({
        ...prev,
        searchFilters: filters,
        page: 1,
      }));

      setHasSearchFilters(hasFilters);
      setSelectedRows([]);
      setToggleCleared((prev) => !prev);
    },
    []
  );

  // Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Build query parameters for API
  const buildQueryParams = useCallback((): FetchContractsParams => {
    const params: FetchContractsParams = {
      page: paginationState.page,
      limit: paginationState.limit,
    };

    Object.entries(paginationState.searchFilters).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        switch (key) {
          case "ngr":
            params.ngrNumber = value.trim();
            break;
          case "commodity":
            params.commodity = value.trim();
            break;
          case "seller":
            params.sellerName = value.trim();
            break;
          case "buyer":
            params.buyerName = value.trim();
            break;
          case "grade":
            params.grade = value.trim();
            break;
          case "tonnes":
            params.tonnes = value.trim();
            break;
          case "contractNumber":
            params.contractNumber = value.trim();
            break;
          default:
            (params as any)[key] = value.trim();
        }
      }
    });

    if (paginationState.status !== "all" && paginationState.status) {
      params.status = paginationState.status;
    }

    if (paginationState.sortBy) {
      params.sortBy = paginationState.sortBy;
      params.sortOrder = paginationState.sortOrder;
    }
    return params;
  }, [paginationState]);

  // Fetch contracts using TanStack Query with pagination
  const {
    data: contractsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<ContractsPaginatedResponse>({
    queryKey: ["contracts", paginationState],
    queryFn: () => {
      return fetchContracts(buildQueryParams());
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: isMounted,
  });

  const contracts = contractsResponse?.data || [];
  const totalPages = contractsResponse?.totalPages || 0;
  const totalRecords = contractsResponse?.total || 0;
  const currentPage = contractsResponse?.page || 1;

  // Update filter active state
  useEffect(() => {
    const statusActive =
      paginationState.status !== "" && paginationState.status !== "all";
    setIsFilterActive(hasSearchFilters || statusActive);
  }, [paginationState.status, hasSearchFilters]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: moveContractToTrash,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["deletedItems"] });

      setSelectedRows([]);
      setToggleCleared((prev) => !prev);
      setIsDeleteConfirmOpen(false);

      toast.success("Contract(s) deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting contracts:", error);
      toast.error("Failed to delete contracts. Please try again.");
    },
  });

  const handleRowClicked = (row: TContract) => {
    if (row?._id) {
      router.push(`/dashboard/contract-management/${row._id}`);
    }
  };

  const handleChange = (selected: {
    allSelected: boolean;
    selectedCount: number;
    selectedRows: TContract[];
  }) => {
    const validSelectedRows = selected.selectedRows.filter(
      (row): row is TContract => row != null && row._id != null
    );
    setSelectedRows(validSelectedRows);
  };

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

  const handleSort = (column: any, sortDirection: "asc" | "desc") => {
    setPaginationState((prev) => ({
      ...prev,
      sortBy: column.sortField || column.selector,
      sortOrder: sortDirection,
      page: 1,
    }));
  };

  const handleStatusChange = useCallback((value: string) => {
    setPaginationState((prev) => ({
      ...prev,
      status: value,
      page: 1,
    }));
    setIsFilterOpen(false);
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  }, []);

  // Updated clear filters function to also clear localStorage
  const clearFilters = useCallback(() => {
    setPaginationState({
      page: 1,
      limit: 10,
      searchFilters: {},
      status: "",
      sortBy: "",
      sortOrder: "asc",
    });
    setHasSearchFilters(false);
    setIsFilterOpen(false);
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
    clearFiltersFromStorage();
    toast.success("All filters cleared");
  }, []);

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      toast.error("Please select at least one contract to delete");
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    const selectedIds = selectedRows
      .filter((row): row is TContract => row != null && row._id != null)
      .map((row) => row._id!)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (selectedIds.length === 0) {
      toast.error("No valid contracts selected for deletion");
      setIsDeleteConfirmOpen(false);
      return;
    }
    deleteMutation.mutate(selectedIds);
  };

  const handleEdit = () => {
    if (selectedRows.length !== 1) {
      toast.error("Please select exactly one contract to edit");
      return;
    }

    const contract = selectedRows[0];
    if (contract?._id) {
      router.push(`/dashboard/contract-management/edit/${contract._id}`);
    } else {
      toast.error("Selected contract is invalid");
    }
  };

  const handleDuplicate = () => {
    if (selectedRows.length !== 1) {
      toast.error("Please select exactly one contract to duplicate");
      return;
    }

    const contract = selectedRows[0];
    if (contract?._id) {
      router.push(`/dashboard/contract-management/duplicate/${contract._id}`);
    } else {
      toast.error("Selected contract is invalid");
    }
  };

  const handleEmail = async (recipientType: "buyer" | "seller") => {
    if (selectedRows.length === 0) {
      toast.error(
        `Please select at least one contract to email ${recipientType}`
      );
      return;
    }

    try {
      toast.loading("Generating PDF and preparing email...");

      const validRows = selectedRows.filter(
        (row): row is TContract => row != null
      );
      const recipients = validRows
        .map((row) =>
          recipientType === "buyer" ? row.buyer?.email : row.seller?.email
        )
        .filter((email): email is string => Boolean(email));

      if (recipients.length === 0) {
        toast.error(
          `No valid ${recipientType} emails found in selected contracts`
        );
        return;
      }

      const pdfBlob = await generatePDFBlobFromComponent(validRows);

      if (!pdfBlob) {
        throw new Error("Failed to generate PDF");
      }

      const filename = `contracts_${recipientType}_${Date.now()}.pdf`;
      const cloudinaryResponse = await uploadPDFToCloudinary(pdfBlob, filename);

      let subject;
      const contract = validRows[0];
      if (recipientType === "seller" && validRows.length === 1) {
        subject = `Broker Note - ${contract.contractNumber || ""} ${
          contract.tonnes || 0
        }mt ${contract.grade || ""} ${contract.deliveryOption || "Delivered"} ${
          contract.deliveryDestination || ""
        }`;
      } else {
        subject = `${validRows.length} Contract(s) - ${
          recipientType === "buyer" ? "Buyer" : "Seller"
        } Documents`;
      }

      const contractSummary = validRows
        .map(
          (contract) =>
            `• ${contract.contractNumber} - ${contract.tonnes}mt ${contract.grade} (${contract.buyer?.name} ↔ ${contract.seller?.legalName})`
        )
        .join("\n");

      const emailBody = `Dear ${
        recipientType.charAt(0).toUpperCase() + recipientType.slice(1)
      },

Please find the contract document(s) attached below:

${contractSummary}

📎 Download PDF: ${cloudinaryResponse.secure_url}

If you have any questions, please don't hesitate to contact us.

Best regards,
Growth Grain Services`;

      const outlookLink = `mailto:${recipients.join(
        ","
      )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        emailBody
      )}`;

      toast.dismiss();
      window.location.href = outlookLink;

      toast.success(
        `Email prepared with PDF for ${recipients.length} ${recipientType}(s)`
      );
    } catch (error) {
      toast.dismiss();
      console.error("Error preparing email with PDF:", error);
      toast.error("Failed to generate PDF and prepare email");
    }
  };

  const generatePDFBlobFromComponent = async (
    contracts: TContract[]
  ): Promise<Blob | null> => {
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const ExportContractPdf = (
        await import("@/components/contract/ExportContractPdf")
      ).default;

      const blob = await pdf(
        <ExportContractPdf contracts={contracts} />
      ).toBlob();

      return blob;
    } catch (error) {
      console.error("Error generating PDF from component:", error);
      return null;
    }
  };

  const uploadPDFToCloudinary = async (
    pdfBlob: Blob,
    filename: string
  ): Promise<any> => {
    const formData = new FormData();
    formData.append("file", pdfBlob, filename);
    formData.append("resource_type", "raw");
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_CLOUDINARY_URL}${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload PDF to Cloudinary: ${errorText}`);
    }

    return response.json();
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
      <div className="mt-20 flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A5D36]"></div>
        <span className="ml-3 text-gray-600">Loading contracts...</span>
      </div>
    );
  }

  // Error state
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
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
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
        <div className="w-full md:w-auto">
          <Link href="/dashboard/contract-management/create-contract">
            <button className="w-full md:w-auto px-3 py-2 bg-[#2A5D36] text-white text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-[#1e4728] transition-colors rounded">
              Create New Contract
              <IoIosPersonAdd className="text-lg" />
            </button>
          </Link>
        </div>

        {/* Advanced Search Filter */}
        <div className="w-full xl:w-[30rem] md:w-64 lg:w-80 relative">
          <AdvanceSearchFilter
            onFilterChange={handleAdvanceFilterChange}
            initialFilters={paginationState.searchFilters}
          />
        </div>
      </div>

      {/* Table Controls */}
      <div className="mt-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 px-4">
          <div className="w-full md:w-auto">
            <p className="text-lg font-semibold">
              List of Contracts ({totalRecords} total)
              {isFilterActive && (
                <span className="text-sm font-normal text-gray-600">
                  {` - Showing ${contracts.length} filtered results`}
                </span>
              )}
            </p>
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
                  • Active search filters:{" "}
                  {Object.keys(paginationState.searchFilters).join(", ")}
                </span>
              )}
              {paginationState.status && paginationState.status !== "all" && (
                <span className="ml-2 text-blue-600">
                  • Status: {paginationState.status}
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="w-full md:w-auto lg:flex lg:flex-row gap-2 grid grid-cols-3">
      <button
        onClick={handleCreateInvoice}
        disabled={
          selectedRows.length === 0 ||
          selectedRows[0]?.status?.toLowerCase() === "draft" ||
          xeroStatus.isChecking
        }
        className={`w-full md:w-auto xl:px-3 xl:py-2 border rounded flex items-center justify-center gap-2 text-sm transition-colors ${
          selectedRows.length > 0 &&
          selectedRows[0]?.status?.toLowerCase() !== "draft" &&
          !xeroStatus.isChecking
            ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
            : "border-gray-200 cursor-not-allowed opacity-50 pointer-events-none"
        }`}
      >
        {xeroStatus.isChecking ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            Checking...
          </>
        ) : (
          <>
            <IoReceiptOutline />
            {areAllContractsInvoiced(selectedRows) ? 'Update Invoice' : 'Create Invoice'}
          </>
        )}
      </button>

            <button
              onClick={handleDuplicate}
              className={`w-full md:w-auto px-3 py-2 border border-gray-200 rounded flex items-center justify-center gap-2 text-sm hover:bg-gray-100 transition-colors ${
                selectedRows.length > 0
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50 pointer-events-none"
              }`}
            >
              <HiOutlineDocumentDuplicate />
              Duplicate
            </button>
            <ExportCsv selectedRows={selectedRows} />
            <PdfExportButton selectedRows={selectedRows} />

            <button
              onClick={() => handleEmail("buyer")}
              className={`w-full md:w-auto xl:px-3 xl:py-2 border border-gray-200 rounded flex items-center justify-center gap-2 text-sm hover:bg-gray-100 transition-colors ${
                selectedRows.length > 0
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50 pointer-events-none"
              }`}
            >
              <IoIosSend />
              Email to Buyer
            </button>
            <button
              onClick={() => handleEmail("seller")}
              className={`w-full md:w-auto xl:px-3 xl:py-2 border border-gray-200 rounded flex items-center justify-center gap-2 text-sm hover:bg-gray-100 transition-colors ${
                selectedRows.length > 0
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50 pointer-events-none"
              }`}
            >
              <IoIosSend />
              Email to Seller
            </button>
            <button
              onClick={handleEdit}
              className={`w-full md:w-auto xl:px-3 xl:py-2 border border-gray-200 rounded flex items-center justify-center gap-2 text-sm hover:bg-gray-100 transition-colors ${
                selectedRows.length > 0
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50 pointer-events-none"
              }`}
            >
              <MdOutlineEdit />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className={`w-full md:w-auto xl:px-3 xl:py-2 border border-gray-200 rounded flex items-center justify-center gap-2 text-sm hover:bg-gray-100 transition-colors ${
                selectedRows.length > 0 && !deleteMutation.isPending
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-50 pointer-events-none"
              }`}
            >
              <RiDeleteBin6Fill className="text-red-500" />
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`w-full md:w-auto xl:px-3 xl:py-2 border border-gray-200 rounded flex items-center justify-center gap-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors ${
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
                      Filter by Status
                    </p>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {statusOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`px-4 py-2 text-sm cursor-pointer flex items-center ${
                          paginationState.status === option.value
                            ? "bg-blue-50 text-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleStatusChange(option.value)}
                      >
                        <span className="flex-grow">{option.label}</span>
                        {paginationState.status === option.value && (
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
            sortServer
            onSort={handleSort}
            noDataComponent={
              <div className="p-10 text-center text-gray-500">
                {totalRecords === 0 &&
                !hasSearchFilters &&
                (!paginationState.status || paginationState.status === "all")
                  ? "No contracts found. Create your first contract to get started."
                  : "No contracts found matching your current filters."}
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
              {isFilterActive && <span> (filtered from total entries)</span>}
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="px-5 py-3 border-b border-[#D3D3D3]">
              <h3 className="text-lg font-semibold flex gap-x-5 items-center">
                <IoWarning className="text-red-500" />
                Move to Trash
              </h3>
            </div>
            <div className="mt-5 px-5 pb-5">
              <p className="mb-4 text-center">
                Are you sure you want to move{" "}
                {selectedRows.length > 1
                  ? `these ${selectedRows.length} contracts`
                  : "this contract"}{" "}
                to trash?
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  This action can be undone from the trash.
                </span>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-[#BF3131] text-white rounded hover:bg-[#a52a2a] disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {deleteMutation.isPending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {deleteMutation.isPending ? "Moving..." : "Move to Trash"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Xero Invoice Creation Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex gap-x-3 items-center">
                  <IoReceiptOutline className="text-blue-600 text-2xl" />
                  Create Xero Invoice
                </h3>

                {/* Xero Status Indicator */}
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                  <MdCheckCircle className="text-green-600" />
                  <span className="text-sm text-green-700">Connected</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              {/* Contract Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Contract Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Contract Number:</span>
                    <span className="ml-2 font-medium">
                      {selectedRows[0]?.contractNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(
                        selectedRows[0]?.contractDate ||
                          selectedRows[0]?.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Buyer:</span>
                    <span className="ml-2 font-medium">
                      {selectedRows[0]?.buyer?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Seller:</span>
                    <span className="ml-2 font-medium">
                      {selectedRows[0]?.seller?.legalName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Grade:</span>
                    <span className="ml-2 font-medium">
                      {selectedRows[0]?.grade}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tonnes:</span>
                    <span className="ml-2 font-medium">
                      {selectedRows[0]?.tonnes}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Price (Ex GST):</span>
                    <span className="ml-2 font-medium text-green-600">
                      ${selectedRows[0]?.priceExGST?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      value={invoiceFormData.invoiceDate}
                      onChange={(e) =>
                        setInvoiceFormData((prev) => ({
                          ...prev,
                          invoiceDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={invoiceFormData.dueDate}
                      onChange={(e) =>
                        setInvoiceFormData((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                      min={invoiceFormData.invoiceDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={invoiceFormData.reference}
                    onChange={(e) =>
                      setInvoiceFormData((prev) => ({
                        ...prev,
                        reference: e.target.value,
                      }))
                    }
                    placeholder="Enter invoice reference"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={invoiceFormData.notes}
                    onChange={(e) =>
                      setInvoiceFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Additional notes for the invoice"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <MdCheckCircle className="text-lg flex-shrink-0 mt-0.5" />
                    <span>
                      This will create a draft invoice in Xero. You can review
                      and modify it before sending to the customer.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setIsInvoiceModalOpen(false);
                  setInvoiceFormData({
                    invoiceDate: new Date().toISOString().split("T")[0],
                    dueDate: "",
                    reference: "",
                    notes: "",
                  });
                }}
                disabled={createInvoiceMutation.isPending}
                className="px-5 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
             <button
                onClick={confirmCreateInvoice}
                disabled={
                  createInvoiceMutation.isPending || !invoiceFormData.dueDate
                }
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {createInvoiceMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {areAllContractsInvoiced(selectedRows) ? 'Updating Invoice...' : 'Creating Invoice...'}
                  </>
                ) : (
                  <>
                    <MdCheckCircle />
                    {areAllContractsInvoiced(selectedRows) ? 'Update Invoice in Xero' : 'Create Invoice in Xero'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractManagementPage;
