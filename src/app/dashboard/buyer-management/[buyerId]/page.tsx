"use client";
import { Buyer, ContactDetails } from "@/types/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { MdKeyboardBackspace, MdOutlineEdit, MdRefresh } from "react-icons/md";
import { getBuyer } from "@/api/buyerApi";
import { useQuery } from "@tanstack/react-query";

const BuyerInformationPage = () => {
  const { buyerId } = useParams();
  const router = useRouter();
  const buyerIdString = buyerId?.toString() as string;

  // Query to fetch buyer data
  const {
    data: buyerData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["buyer", buyerIdString],
    queryFn: () => getBuyer(buyerIdString) as Promise<Buyer>,
    enabled: !!buyerIdString,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always refetch on component mount
  });

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.back();
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="pb-10">
        <div className="border-b border-gray-300 py-10">
          <div className="mx-auto max-w-6xl flex items-center gap-5">
            <button
              type="button"
              onClick={handleBack}
              className="cursor-pointer"
            >
              <MdKeyboardBackspace size={24} />
            </button>
            <p className="text-xl font-semibold">Buyer Information</p>
          </div>
        </div>

        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            <p className="text-gray-600">Loading buyer information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="pb-10">
        <div className="border-b border-gray-300 py-10">
          <div className="mx-auto max-w-6xl flex items-center gap-5">
            <button
              type="button"
              onClick={handleBack}
              className="cursor-pointer"
            >
              <MdKeyboardBackspace size={24} />
            </button>
            <p className="text-xl font-semibold">Buyer Information</p>
          </div>
        </div>

        <div className="text-center py-10 mx-auto max-w-6xl">
          <div className="text-red-500 mb-4 text-lg">
            {error instanceof Error
              ? error.message
              : "Failed to load buyer information"}
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <MdRefresh className={isFetching ? "animate-spin" : ""} />
              {isFetching ? "Retrying..." : "Try Again"}
            </button>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!buyerData) {
    return (
      <div className="pb-10">
        <div className="border-b border-gray-300 py-10">
          <div className="mx-auto max-w-6xl flex items-center gap-5">
            <button
              type="button"
              onClick={handleBack}
              className="cursor-pointer"
            >
              <MdKeyboardBackspace size={24} />
            </button>
            <p className="text-xl font-semibold">Buyer Information</p>
          </div>
        </div>

        <div className="text-center py-10 mx-auto max-w-6xl">
          <div className="mb-4 text-lg">No buyer data found</div>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <MdRefresh />
              Refresh
            </button>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="border-b border-gray-300 py-10">
        <div className="mx-auto max-w-6xl flex items-center gap-5">
          <button type="button" onClick={handleBack} className="cursor-pointer">
            <MdKeyboardBackspace size={24} />
          </button>
          <p className="text-xl font-semibold">Buyer Information</p>

          {/* Refresh button for manual updates */}
          <div className="ml-auto">
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
              title="Refresh buyer information"
            >
              <MdRefresh
                className={`text-lg ${isFetching ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl xl:overflow-scroll xl:h-[38rem] hide-scrollbar-xl">
        <div className="my-10 text-center">
          <h2 className="text-2xl font-semibold">{buyerData.name}</h2>
          {isFetching && (
            <p className="text-sm text-gray-500 mt-2">
              Updating information...
            </p>
          )}
        </div>

        <div className="flex flex-col items-center w-full gap-6">
          {/* Main Buyer Information */}
          <div className="w-full border border-gray-300 rounded-md overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h3 className="font-semibold text-gray-700">
                General Information
              </h3>
            </div>
            <div className="grid grid-cols-2">
              {[
                { label: "Legal Name", value: buyerData.name },
                { label: "ABN", value: buyerData.abn },
                { label: "Office Address", value: buyerData.officeAddress },
                { label: "Account Number", value: buyerData.accountNumber },
                { label: "Email", value: buyerData.email },
                { label: "Phone Number", value: buyerData.phoneNumber },
              ].map((item, index) => (
                <React.Fragment key={index}>
                  <div className="border-b border-r border-gray-300 p-4 bg-gray-50 text-gray-700 font-medium">
                    {item.label}
                  </div>
                  <div className="border-b border-gray-300 p-4">
                    {item.value || "-"}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Contacts Information */}
          {buyerData.contacts && buyerData.contacts.length > 0 && (
            <div className="w-full border border-gray-300 rounded-md overflow-hidden">
              <div className="bg-gray-100 border-b border-gray-300 p-3">
                <h3 className="font-semibold text-gray-700">
                  Contact Information ({buyerData.contacts.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-300">
                {buyerData.contacts.map(
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
                            {contact.isPrimary === true && (
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
          {(!buyerData.contacts || buyerData.contacts.length === 0) && (
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

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="py-2 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 cursor-pointer"
            >
              <MdRefresh className={isFetching ? "animate-spin" : ""} />
              {isFetching ? "Refreshing..." : "Refresh"}
            </button>

            <Link href={`/dashboard/buyer-management/edit/${buyerId}`}>
              <button className="py-2 px-5 bg-[#2A5D36] hover:bg-[#1e4728] text-white rounded flex items-center gap-2 transition-colors cursor-pointer">
                <MdOutlineEdit className="text-lg" />
                Edit Buyer Information
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerInformationPage;
