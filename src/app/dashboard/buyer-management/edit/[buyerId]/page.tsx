"use client";
import { Buyer, ContactDetails } from "@/types/types";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  MdSave,
  MdCancel,
  MdKeyboardBackspace,
  MdDelete,
  MdAdd,
} from "react-icons/md";
import toast from "react-hot-toast";
import { getBuyer, updateBuyer } from "@/api/buyerApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BuyerInformationEditPage = () => {
  const { buyerId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const buyerIdString = buyerId?.toString() as string;

  const [buyerData, setBuyerData] = useState<Buyer | null>(null);
  const [originalBuyerData, setOriginalBuyerData] = useState<Buyer | null>(
    null
  );
  const [hasChanges, setHasChanges] = useState(false);

  // State for new contact being added
  const [newContact, setNewContact] = useState<ContactDetails>({
    name: "",
    email: "",
    phoneNumber: "",
  });

  // Query to fetch buyer data
  const {
    data: fetchedBuyerData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["buyer", buyerIdString],
    queryFn: () => getBuyer(buyerIdString) as Promise<Buyer>,
    enabled: !!buyerIdString,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Mutation to update buyer data
  const updateBuyerMutation = useMutation({
    mutationFn: (updatedBuyer: Buyer) =>
      updateBuyer(updatedBuyer, buyerIdString),
    onMutate: async (updatedBuyer) => {
      await queryClient.cancelQueries({ queryKey: ["buyer", buyerIdString] });
      await queryClient.cancelQueries({ queryKey: ["buyers"] });

      const previousBuyer = queryClient.getQueryData(["buyer", buyerIdString]);
      const previousBuyers = queryClient.getQueryData(["buyers"]);

      queryClient.setQueryData(["buyer", buyerIdString], updatedBuyer);

      return { previousBuyer, previousBuyers };
    },
    onError: (error, updatedBuyer, context) => {
      if (context?.previousBuyer) {
        queryClient.setQueryData(
          ["buyer", buyerIdString],
          context.previousBuyer
        );
      }
      if (context?.previousBuyers) {
        queryClient.setQueryData(["buyers"], context.previousBuyers);
      }

      console.error(error);
      toast.error("Failed to update buyer information");
    },
    onSuccess: () => {
      toast.success("Buyer information updated successfully");

      queryClient.invalidateQueries({ queryKey: ["buyer", buyerIdString] });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      queryClient.invalidateQueries({ queryKey: ["contract"] });

      router.push(`/dashboard/buyer-management`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["buyer", buyerIdString] });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
    },
  });

  // Set local state when data is fetched
  useEffect(() => {
    if (fetchedBuyerData) {
      const normalizedData = {
        ...fetchedBuyerData,
        contacts: Array.isArray(fetchedBuyerData.contacts)
          ? fetchedBuyerData.contacts
          : [],
      };
      setBuyerData(normalizedData);
      setOriginalBuyerData(normalizedData);
    }
  }, [fetchedBuyerData]);

  // Track changes
  useEffect(() => {
    if (buyerData && originalBuyerData) {
      const changesExist =
        JSON.stringify(buyerData) !== JSON.stringify(originalBuyerData);
      setHasChanges(changesExist);
    }
  }, [buyerData, originalBuyerData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          <p className="text-gray-600">Loading buyer data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {error instanceof Error
              ? error.message
              : "Failed to load buyer data"}
          </p>
          <button
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["buyer", buyerIdString],
              })
            }
            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!buyerData) {
    return (
      <div className="h-screen flex justify-center items-center">
        <p className="text-red-500">Buyer not found</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBuyerData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleNewContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewContact((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addContact = () => {
    if (!newContact.name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    // Check if contact name already exists
    const contactExists = buyerData.contacts.some(
      (contact) => contact.name.toLowerCase() === newContact.name.toLowerCase()
    );

    if (contactExists) {
      toast.error("Contact name already exists");
      return;
    }

    setBuyerData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        contacts: [...prev.contacts, { ...newContact }],
      };
    });

    // Reset new contact form
    setNewContact({
      name: "",
      email: "",
      phoneNumber: "",
    });
    toast.success("Contact added");
  };

  const removeContact = (index: number) => {
    setBuyerData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        contacts: prev.contacts.filter((_, i) => i !== index),
      };
    });
    toast.success("Contact removed");
  };

  const updateContact = (
    index: number,
    field: keyof ContactDetails,
    value: string
  ) => {
    setBuyerData((prev) => {
      if (!prev) return null;
      const updatedContacts = [...prev.contacts];
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value,
      };
      return {
        ...prev,
        contacts: updatedContacts,
      };
    });
  };

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.back();
  };

  const handleSave = async () => {
    if (!buyerData) return;

    // Validation
    if (buyerData.contacts.length === 0) {
      toast.error("Please add at least one contact");
      return;
    }

    // Validate all contacts have names
    const invalidContact = buyerData.contacts.find(
      (contact) => !contact.name.trim()
    );
    if (invalidContact) {
      toast.error("All contacts must have a name");
      return;
    }

    updateBuyerMutation.mutate(buyerData);
  };

  const handleCancel = () => {
    if (originalBuyerData) {
      setBuyerData({ ...originalBuyerData });
    }
    setNewContact({
      name: "",
      email: "",
      phoneNumber: "",
    });
    setHasChanges(false);
  };

  return (
    <div className="pb-10">
      <div className="border-b border-gray-300 py-10">
        <div className="mx-auto max-w-6xl flex items-center gap-5">
          <button type="button" onClick={handleBack} className="cursor-pointer">
            <MdKeyboardBackspace size={24} />
          </button>
          <p className="text-xl font-semibold">Edit Buyer Information</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl mt-10 xl:overflow-scroll xl:h-[38rem] hide-scrollbar-xl">
        <div className="flex flex-col items-center mx-auto max-w-6xl w-full mt-10 gap-6">
          {/* Main Buyer Information */}
          <div className="w-full border border-gray-300 rounded-md overflow-hidden bg-white">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h3 className="font-semibold text-gray-700">
                General Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 p-6 gap-5">
              <Field
                label="Buyer Legal Name"
                name="name"
                value={buyerData.name || ""}
                onChange={handleInputChange}
                required
              />
              <Field
                label="Buyer ABN"
                name="abn"
                value={buyerData.abn || ""}
                onChange={handleInputChange}
                required
              />
              <Field
                label="Buyer Email"
                name="email"
                type="email"
                value={buyerData.email || ""}
                onChange={handleInputChange}
                required
              />
              <Field
                label="Buyer Phone Number"
                name="phoneNumber"
                value={buyerData.phoneNumber || ""}
                onChange={handleInputChange}
                required
              />
              <Field
                label="Buyer Office Address"
                name="officeAddress"
                value={buyerData.officeAddress || ""}
                onChange={handleInputChange}
                required
              />
              <Field
                label="Account Number"
                name="accountNumber"
                value={buyerData.accountNumber || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Contacts Section */}
          <div className="w-full border border-gray-300 rounded-md overflow-hidden bg-white">
            <div className="bg-gray-100 border-b border-gray-300 p-3">
              <h3 className="font-semibold text-gray-700">
                Contact Information ({buyerData.contacts.length})
              </h3>
            </div>

            {/* Existing Contacts */}
            {/* Existing Contacts */}
            <div className="p-6">
              {buyerData.contacts.length > 0 && (
                <div className="space-y-4 mb-6">
                  {buyerData.contacts.map((contact, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-700">
                            Contact {index + 1}
                          </h4>
                          {contact.isPrimary === true && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              Primary
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          disabled={updateBuyerMutation.isPending}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) =>
                              updateContact(index, "name", e.target.value)
                            }
                            disabled={updateBuyerMutation.isPending}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-700"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Email
                          </label>
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) =>
                              updateContact(index, "email", e.target.value)
                            }
                            disabled={updateBuyerMutation.isPending}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-700"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={contact.phoneNumber}
                            onChange={(e) =>
                              updateContact(
                                index,
                                "phoneNumber",
                                e.target.value
                              )
                            }
                            disabled={updateBuyerMutation.isPending}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-700"
                          />
                        </div>
                      </div>
                      {/* Primary Contact Checkbox */}
                      <div className="mt-3 flex items-center">
                        <input
                          type="checkbox"
                          id={`primary-${index}`}
                          checked={contact.isPrimary === true}
                          onChange={(e) => {
                            setBuyerData((prev) => {
                              if (!prev) return null;
                              const updatedContacts = prev.contacts.map(
                                (c, i) => ({
                                  ...c,
                                  isPrimary:
                                    i === index ? e.target.checked : false,
                                })
                              );
                              return {
                                ...prev,
                                contacts: updatedContacts,
                              };
                            });
                          }}
                          disabled={updateBuyerMutation.isPending}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`primary-${index}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          Set as primary contact
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Contact Form */}
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-3">
                  Add New Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newContact.name}
                      onChange={handleNewContactChange}
                      disabled={updateBuyerMutation.isPending}
                      placeholder="Contact name"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newContact.email}
                      onChange={handleNewContactChange}
                      disabled={updateBuyerMutation.isPending}
                      placeholder="Contact email"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={newContact.phoneNumber}
                      onChange={handleNewContactChange}
                      disabled={updateBuyerMutation.isPending}
                      placeholder="Contact phone"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-700"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addContact}
                  disabled={
                    updateBuyerMutation.isPending || !newContact.name.trim()
                  }
                  className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <MdAdd size={20} />
                  Add Contact
                </button>
              </div>

              {buyerData.contacts.length === 0 && (
                <p className="text-red-500 text-sm mt-2">
                  At least one contact is required
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {hasChanges && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCancel}
                disabled={updateBuyerMutation.isPending}
                className="py-2 px-5 bg-gray-500 text-white rounded flex items-center gap-2 hover:bg-gray-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <MdCancel className="text-lg" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  updateBuyerMutation.isPending ||
                  buyerData.contacts.length === 0
                }
                className="py-2 px-5 bg-[#2A5D36] text-white rounded flex items-center gap-2 hover:bg-[#1e4a2a] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <MdSave className="text-lg" />
                {updateBuyerMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1 block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-700"
      required={required}
    />
  </div>
);

export default BuyerInformationEditPage;
