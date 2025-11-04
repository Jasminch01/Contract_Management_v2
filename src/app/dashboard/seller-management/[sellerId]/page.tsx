"use client";
import { getseller } from "@/api/sellerApi";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { MdKeyboardBackspace, MdOutlineEdit } from "react-icons/md";
import { useQuery } from "@tanstack/react-query";
import { BulkHandlerCredential, ContactDetails, Seller } from "@/types/types";

const handlerNames = [
  "Viterra",
  "Graincorp",
  "GrainFlow",
  "Tports",
  "CBH",
  "Louis Dreyfus",
] as const;

const initialCredentials: BulkHandlerCredential[] = handlerNames.map(
  (name) => ({
    handlerName: name,
    identifier: "",
    password: "",
  })
);

const SellerInformationPage = () => {
  const { sellerId } = useParams();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkHandlerCredentials, setBulkHandlerCredentials] =
    useState<BulkHandlerCredential[]>(initialCredentials);

  // State for password visibility - track each row separately
  const [passwordVisibility, setPasswordVisibility] = useState<boolean[]>(
    new Array(handlerNames.length).fill(false)
  );

  const sellerIdStr = sellerId?.toString() as string;

  // TanStack Query for fetching seller data
  const {
    data: sellerData,
    isLoading: loading,
    error,
    isError,
  } = useQuery({
    queryKey: ["seller", sellerIdStr],
    queryFn: () => getseller(sellerIdStr) as Promise<Seller>,
    enabled: !!sellerIdStr, // Only run query if sellerId exists
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 2, // Retry failed requests 2 times
  });

  // Initialize bulk handler credentials when data is fetched
  useEffect(() => {
    if (sellerData) {
      const existingCredentials = sellerData.bulkHandlerCredentials || [];
      const mergedCredentials = handlerNames.map((handlerName) => {
        const existing = existingCredentials.find(
          (cred) => cred.handlerName === handlerName
        );
        return (
          existing || {
            handlerName,
            identifier: "",
            password: "",
          }
        );
      });
      setBulkHandlerCredentials(mergedCredentials);
    }
  }, [sellerData]);

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.back();
  };

  // Toggle password visibility for a specific row
  const togglePasswordVisibility = (index: number) => {
    setPasswordVisibility((prev) =>
      prev.map((visible, idx) => (idx === index ? !visible : visible))
    );
  };

  // Open modal and reset password visibility
  const openModal = () => {
    setPasswordVisibility(new Array(handlerNames.length).fill(false));
    setIsModalOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-10">Loading seller information...</div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        Error:{" "}
        {error instanceof Error ? error.message : "Failed to fetch seller data"}
      </div>
    );
  }

  // No data state
  if (!sellerData) {
    return <div className="text-center py-10">No seller data found</div>;
  }
  // Filter credentials that have data
  const validCredentials = bulkHandlerCredentials.filter(
    (cred) => cred.identifier.trim() !== "" || cred.password.trim() !== ""
  );

  return (
    <div>
      {/* Header */}
      <div className="border-b border-gray-300 py-10">
        <div className="mx-auto max-w-6xl flex justify-between items-center px-4">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={handleBack}
              className="cursor-pointer"
            >
              <MdKeyboardBackspace size={24} />
            </button>
            <p className="text-xl font-semibold">Seller Information</p>
          </div>

          {/* Bulk Handler Password Button */}
          <button
            onClick={openModal}
            className="bg-[#2A5D36] py-2 px-6 text-white rounded hover:bg-[#1e4728] transition-colors cursor-pointer"
          >
            Bulk Handler Password
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="my-10 text-center">
        <p className="text-lg">{sellerData.legalName}</p>
      </div>

      {/* Info Grid */}
      <div className="flex flex-col items-center mx-auto max-w-6xl w-full xl:overflow-scroll xl:h-[38rem] hide-scrollbar-xl">
        <div className="grid grid-cols-2 w-full border border-gray-300 rounded-md">
          <InfoRow label="Seller Legal Name" value={sellerData.legalName} />
          <InfoRow label="Seller ABN" value={sellerData.abn || "N/A"} />
          <InfoRow
            label="Seller Additional NGRs"
            value={sellerData?.additionalNgrs?.join(", ") || "N/A"}
          />
          <InfoRow label="Seller Email" value={sellerData?.email || "N/A"} />
          <InfoRow
            label="Seller Farm or PO Address"
            value={sellerData?.address || "N/A"}
          />
          <InfoRow
            label="Seller Main NGR"
            value={sellerData?.mainNgr || "N/A"}
          />
          <InfoRow
            label="Seller Phone Number"
            value={sellerData?.phoneNumber || "N/A"}
          />
          <div className="border-b border-r border-gray-300 p-3 text-[#1A1A1A] flex items-center min-h-[60px]">
            Authority To Act
          </div>
          <div className="border-b border-gray-300 p-3 flex items-center min-h-[60px]">
            {sellerData?.authorityActFormPdf ? (
              <a
                className="text-blue-400"
                href={sellerData?.authorityActFormPdf}
              >
                {" "}
                View – Authority To Act
              </a>
            ) : (
              <p>N/A</p>
            )}
          </div>
        </div>
        <div className="w-full">
          {/* Contacts Information */}
          {sellerData.contactName && sellerData.contactName.length > 0 && (
            <div className="w-full mt-5 border border-gray-300 rounded-md overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h3 className="font-semibold text-gray-700">
                  Contact Information ({sellerData.contactName.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-300">
                {sellerData.contactName.map(
                  (contact: ContactDetails, index: number) => (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">
                            Contact Name
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {contact.name}
                            </p>
                            {contact.isPrimary && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">
                            Email
                          </p>
                          <p className="text-gray-900">
                            {contact.email || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">
                            Phone Number
                          </p>
                          <p className="text-gray-900">
                            {contact.phoneNumber || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* No contacts message */}
          {(!sellerData.contactName || sellerData.contactName.length === 0) && (
            <div className="w-full border border-gray-300 rounded-md overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h3 className="font-semibold text-gray-700">
                  Contact Information
                </h3>
              </div>
              <div className="p-8 text-center text-gray-500">
                <p>No contact information available</p>
              </div>
            </div>
          )}
        </div>

        {/* Edit Button */}
        <div className="mt-10">
          <Link
            href={`/dashboard/seller-management/edit/${sellerId?.toString()}`}
          >
            <button className="py-2 cursor-pointer px-5 bg-[#2A5D36] text-white rounded flex items-center gap-2 hover:bg-[#1e4728]">
              <MdOutlineEdit className="text-lg" />
              Edit
            </button>
          </Link>
        </div>
      </div>

      {/* Bulk Handler Passwords Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-4 flex justify-between items-center border-b rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900">
                Bulk Handler Passwords
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl focus:outline-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 px-6 py-4 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                View stored credentials for bulk handlers (read-only)
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">
                        Bulk Handler
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">
                        Username/Email/PAN No
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">
                        Password
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkHandlerCredentials.map((handler, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 font-medium">
                          {handler.handlerName}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="px-3 py-2 bg-gray-50 rounded border text-sm font-mono">
                            {handler.identifier || "Not configured"}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-2 bg-gray-50 rounded border text-sm font-mono flex-1">
                              {handler.password
                                ? passwordVisibility[idx]
                                  ? handler.password
                                  : "•".repeat(handler.password.length)
                                : "Not configured"}
                            </div>
                            {handler.password && (
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(idx)}
                                className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                title={
                                  passwordVisibility[idx]
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {passwordVisibility[idx] ? (
                                  // Eye slash icon (hide)
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                    />
                                  </svg>
                                ) : (
                                  // Eye icon (show)
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {validCredentials.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No bulk handler credentials configured
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white p-4 flex justify-end gap-3 border-t rounded-b-lg">
              <button
                onClick={() => setIsModalOpen(false)}
                className="py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Extracted row component for cleaner code
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <>
    <div className="border-b border-r border-gray-300 p-3 text-[#1A1A1A] flex items-center min-h-[60px]">
      {label}
    </div>
    <div className="border-b border-gray-300 p-3 flex items-center min-h-[60px]">
      {value || "N/A"}
    </div>
  </>
);

export default SellerInformationPage;
