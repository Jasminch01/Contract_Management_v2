"use client";
import { BulkHandlerCredential, ContactDetails, Seller } from "@/types/types";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import {
  MdSave,
  MdCancel,
  MdKeyboardBackspace,
  MdDelete,
  MdAdd,
} from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import toast, { Toaster } from "react-hot-toast";
import { getseller, updateSeller } from "@/api/sellerApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

const SellerInformationEditPage = () => {
  const { sellerId } = useParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [sellerData, setSellerData] = useState<Seller | null>(null);
  const [originalSellerData, setOriginalSellerData] = useState<Seller | null>(
    null
  );
  const [bulkHandlerCredentials, setBulkHandlerCredentials] =
    useState<BulkHandlerCredential[]>(initialCredentials);
  const [originalCredentials, setOriginalCredentials] =
    useState<BulkHandlerCredential[]>(initialCredentials);

  // State for password visibility - track each row separately
  const [passwordVisibility, setPasswordVisibility] = useState<boolean[]>(
    new Array(handlerNames.length).fill(false)
  );

  // Add state for authority to act PDF upload
  const [uploadingAuthorityPdf, setUploadingAuthorityPdf] = useState(false);

  // Add ref for file input to reset it after removal
  const authorityFileInputRef = useRef<HTMLInputElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  // Replace the currentContactName state with:
  const [newContact, setNewContact] = useState<ContactDetails>({
    name: "",
    email: "",
    phoneNumber: "",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ngrInputValue, setNgrInputValue] = useState("");

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [hasChanges, setHasChanges] = useState(false);

  // Fix: Ensure sellerId is properly handled
  const sellerIdStr = Array.isArray(sellerId)
    ? sellerId[0]
    : sellerId?.toString();

  const {
    data: fetchSellerData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["seller", sellerIdStr],
    queryFn: () => getseller(sellerIdStr!) as Promise<Seller>,
    enabled: !!sellerIdStr,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  const locationZones = [
    "Eyre Peninsula",
    "Northern Adelaide",
    "Yorke Peninsular",
    "Southern Adelaide",
    "Riverland/Mallee",
    "Victoria",
    "TRADE",
  ];

  // Cloudinary upload function (same as in contract component)
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset"
    );
    formData.append("resource_type", "auto");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CLOUDINARY_URL}${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload file");
    }
  };

  // Handle Authority to Act PDF upload
  const handleAuthorityPdfUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    // Validate file size (e.g., max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingAuthorityPdf(true);
    try {
      const url = await uploadToCloudinary(file);
      setSellerData((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, authorityActFormPdf: url };
        setHasChanges(checkForChanges(updated));
        return updated;
      });
      toast.success("Authority to Act form uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload Authority to Act form");
      console.error("Upload error:", error);
    } finally {
      setUploadingAuthorityPdf(false);
    }
  };

  // Handle remove Authority to Act PDF
  const handleRemoveAuthorityPdf = () => {
    setSellerData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, authorityActFormPdf: "" };
      setHasChanges(checkForChanges(updated));
      return updated;
    });

    // Reset the file input field
    if (authorityFileInputRef.current) {
      authorityFileInputRef.current.value = "";
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Mutation to update seller data
  const updateSellerMutation = useMutation({
    mutationFn: (updatedSeller: Seller) =>
      updateSeller(updatedSeller, sellerIdStr!),
    onMutate: async (updatedSeller) => {
      setSaveStatus("saving");
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["sellers", sellerIdStr] });

      // Snapshot the previous value
      const previousSeller = queryClient.getQueryData(["seller", sellerIdStr]);
      queryClient.invalidateQueries({ queryKey: ["contract"] });

      // Optimistically update to the new value
      queryClient.setQueryData(["seller", sellerIdStr], updatedSeller);

      return { previousSeller };
    },
    onError: (error, updatedSeller, context) => {
      setSaveStatus("error");
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSeller) {
        queryClient.setQueryData(
          ["seller", sellerIdStr],
          context.previousSeller
        );
      }
      console.error("Update seller error:", error);
      toast.error("Failed to update seller information");
    },
    onSuccess: () => {
      setSaveStatus("success");
      toast.success("Seller information updated successfully");
      setHasChanges(false);

      // Invalidate and refetch seller data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["seller", sellerIdStr] });

      // Also invalidate the sellers list if you have one
      queryClient.invalidateQueries({ queryKey: ["sellers"] });

      // Navigate back to seller management after a short delay
      setTimeout(() => {
        router.push(`/dashboard/seller-management`);
      }, 1000);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state consistency
      queryClient.invalidateQueries({ queryKey: ["seller", sellerIdStr] });
    },
  });

  // Initialize data when fetched
  useEffect(() => {
    if (fetchSellerData) {
      const initializedData = {
        ...fetchSellerData,
        locationZone: fetchSellerData.locationZone || [],
        additionalNgrs: fetchSellerData.additionalNgrs || [],
        accountNumber: fetchSellerData.accountNumber || "",
        contactName: Array.isArray(fetchSellerData.contactName) // Changed from contactName
          ? fetchSellerData.contactName
          : [],
        bulkHandlerCredentials: fetchSellerData.bulkHandlerCredentials || [],
        authorityActFormPdf: fetchSellerData.authorityActFormPdf || "",
      };

      setSellerData(initializedData);
      setOriginalSellerData(initializedData);
      if (
        initializedData.additionalNgrs &&
        initializedData.additionalNgrs.length > 0
      ) {
        setNgrInputValue(initializedData.additionalNgrs.join(", "));
      }

      // Initialize bulk handler credentials
      const existingCredentials = fetchSellerData.bulkHandlerCredentials || [];
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
      setOriginalCredentials(JSON.parse(JSON.stringify(mergedCredentials)));
    }
  }, [fetchSellerData]);

  // Fix: Utility function to check for changes (including credentials)
  const checkForChanges = (
    updatedData: Seller,
    updatedCredentials?: BulkHandlerCredential[]
  ) => {
    if (!originalSellerData) return false;

    const credentialsToCheck = updatedCredentials || bulkHandlerCredentials;

    const dataChanged =
      JSON.stringify({
        ...updatedData,
        bulkHandlerCredentials: undefined, // Exclude credentials from seller data comparison
      }) !==
      JSON.stringify({
        ...originalSellerData,
        bulkHandlerCredentials: undefined,
      });

    const credentialsChanged =
      JSON.stringify(credentialsToCheck) !==
      JSON.stringify(originalCredentials);

    return dataChanged || credentialsChanged;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Skip contact name handling here since it's handled separately
    if (name === "contactName") {
      return;
    }

    setSellerData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [name]: value };
      setHasChanges(checkForChanges(updated));
      return updated;
    });
  };

  // Fix: Handle Additional NGRs change properly
  const handleAdditionalNGRChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    // Update the display value
    setNgrInputValue(value);

    // Update the seller data
    setSellerData((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        additionalNgrs: value
          ? value
              .split(",") // Split by comma only
              .map((s) => s.trim())
              .filter((s) => s !== "")
          : [],
      };
      setHasChanges(checkForChanges(updated));
      return updated;
    });
  };

  // Fix: Handle Location Zone change properly
  const handleLocationZoneChange = (zone: string) => {
    setSellerData((prev) => {
      if (!prev) return prev;
      const currentZones = prev.locationZone || [];
      const updated = {
        ...prev,
        locationZone: currentZones.includes(zone)
          ? currentZones.filter((z) => z !== zone)
          : [...currentZones, zone],
      };
      setHasChanges(checkForChanges(updated));
      return updated;
    });
  };

  const removeZone = (zoneToRemove: string) => {
    setSellerData((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        locationZone: (prev.locationZone || []).filter(
          (z) => z !== zoneToRemove
        ),
      };
      setHasChanges(checkForChanges(updated));
      return updated;
    });
  };

  const handleCredentialChange = (
    index: number,
    field: keyof Omit<BulkHandlerCredential, "handlerName">,
    value: string
  ) => {
    setBulkHandlerCredentials((prev) => {
      const updated = prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      );

      // Check for changes whenever credentials are updated
      if (sellerData) {
        setHasChanges(checkForChanges(sellerData, updated));
      }

      return updated;
    });
  };

  // Toggle password visibility for a specific row
  const togglePasswordVisibility = (index: number) => {
    setPasswordVisibility((prev) =>
      prev.map((visible, idx) => (idx === index ? !visible : visible))
    );
  };

  const handleCancel = () => {
    if (originalSellerData) {
      setSellerData({ ...originalSellerData });
    }
    setBulkHandlerCredentials(JSON.parse(JSON.stringify(originalCredentials)));
    setHasChanges(false);
    setSaveStatus("idle");
  };

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (hasChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }
    router.back();
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

    const contactExists = sellerData?.contactName.some(
      (contact) =>
        contact.email.toLowerCase() === newContact.email.toLowerCase()
    );

    if (contactExists) {
      toast.error("Contact email already exists");
      return;
    }

    setSellerData((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        contactName: [...prev.contactName, { ...newContact }], // Use contactName
      };
      setHasChanges(checkForChanges(updated));
      return updated;
    });

    setNewContact({
      name: "",
      email: "",
      phoneNumber: "",
    });
    toast.success("Contact added");
  };

  const removeContact = (index: number) => {
    setSellerData((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        contactName: prev.contactName.filter((_, i) => i !== index), // Use contactName
      };
      setHasChanges(checkForChanges(updated));
      return updated;
    });
    toast.success("Contact removed");
  };

  const updateContact = (
    index: number,
    field: keyof ContactDetails,
    value: string
  ) => {
    setSellerData((prev) => {
      if (!prev) return prev;
      const updatedContacts = [...prev.contactName]; // Use contactName
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value,
      };
      const updated = {
        ...prev,
        contactName: updatedContacts, // Use contactName
      };
      setHasChanges(checkForChanges(updated));
      return updated;
    });
  };

  const handleSave = async () => {
    if (!sellerData || !sellerIdStr) return;

    // Validate contacts
    if (!sellerData.contactName || sellerData.contactName.length === 0) {
      toast.error("Please add at least one contact");
      return;
    }

    const invalidContact = sellerData.contactName.find(
      (contact) => !contact.name.trim()
    );
    if (invalidContact) {
      toast.error("All contacts must have a name");
      return;
    }

    // Filter out credentials that have both identifier and password filled
    const validCredentials = bulkHandlerCredentials.filter(
      (cred) => cred.identifier.trim() !== "" && cred.password.trim() !== ""
    );

    const sellerDataWithCredentials: Seller = {
      ...sellerData,
      bulkHandlerCredentials: validCredentials,
    };

    updateSellerMutation.mutate(sellerDataWithCredentials);
  };
  // Save credentials and close modal
  const saveCredentials = () => {
    const filledCredentials = bulkHandlerCredentials.filter(
      (cred) => cred.identifier.trim() !== "" || cred.password.trim() !== ""
    );

    if (filledCredentials.length > 0) {
      toast.success(
        `${filledCredentials.length} bulk handler credentials updated`
      );
    }

    setIsModalOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          <p className="text-gray-600">Loading seller data...</p>
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
              : "Failed to load seller data"}
          </p>
          <div className="space-x-4">
            <button
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["seller", sellerIdStr],
                })
              }
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/dashboard/seller-management")}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Seller Management
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fix: Better handling of seller not found case
  if (!sellerData && !isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            Seller with ID {sellerId} not found
          </p>
          <button
            onClick={() => router.push("/dashboard/seller-management")}
            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
          >
            Back to Seller Management
          </button>
        </div>
      </div>
    );
  }

  if (!sellerData) {
    return null;
  }

  return (
    <div>
      <Toaster />
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2A5D36] py-2 px-6 text-white rounded hover:bg-[#1e4728] transition-colors cursor-pointer"
          >
            Bulk Handler Password
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl mt-10 px-4 xl:overflow-scroll xl:h-[38rem] hide-scrollbar-xl">
        <div className="flex flex-col items-center mx-auto max-w-6xl w-full mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 w-full border border-gray-300 rounded-md p-6 gap-5 bg-white">
            <Field
              label="Seller Legal Name"
              name="legalName"
              value={sellerData?.legalName || ""}
              onChange={handleInputChange}
            />
            <Field
              label="Office Address"
              name="address"
              value={sellerData?.address || ""}
              onChange={handleInputChange}
            />
            <Field
              label="ABN"
              name="abn"
              value={sellerData?.abn || ""}
              onChange={handleInputChange}
            />
            <Field
              label="Main NGR"
              name="mainNgr"
              value={sellerData?.mainNgr || ""}
              onChange={handleInputChange}
            />

            <Field
              label="Email"
              name="email"
              value={sellerData?.email || ""}
              onChange={handleInputChange}
            />
            <Field
              label="Phone Number"
              name="phoneNumber"
              value={sellerData?.phoneNumber || ""}
              onChange={handleInputChange}
            />
            <Field
              label="Account Number"
              name="accountNumber"
              value={sellerData?.accountNumber || ""}
              onChange={handleInputChange}
            />

            {/* Fix: Location Zone Selector */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SELLER LOCATION ZONE (Multiple Select)
              </label>
              <div className="relative" ref={dropdownRef}>
                {/* Dropdown Button with Selected Items Inside */}
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#2A5D36] focus:border-[#2A5D36] cursor-pointer min-h-[42px] flex items-center justify-between"
                >
                  <div className="flex-1 flex flex-wrap gap-1 mr-2">
                    {(sellerData.locationZone || []).length === 0 ? (
                      <span className="text-gray-500 text-sm">
                        Select location zones...
                      </span>
                    ) : (
                      (sellerData.locationZone || []).map((zone) => (
                        <span
                          key={zone}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#2A5D36] text-white"
                        >
                          <span className="max-w-[100px] truncate">{zone}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeZone(zone);
                            }}
                            className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full hover:bg-[#1e4728] focus:outline-none transition-colors text-xs cursor-pointer"
                            title={`Remove ${zone}`}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="py-1">
                      {locationZones.map((zone) => (
                        <label
                          key={zone}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={(sellerData.locationZone || []).includes(
                              zone
                            )}
                            onChange={() => handleLocationZoneChange(zone)}
                            className="mr-3 h-4 w-4 text-[#2A5D36] focus:ring-[#2A5D36] border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700 flex-1">
                            {zone}
                          </span>
                          {(sellerData.locationZone || []).includes(zone) && (
                            <svg
                              className="w-4 h-4 text-[#2A5D36]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>

                    {/* Clear All & Select All Actions */}
                    <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setSellerData((prev) => {
                              if (!prev) return prev;
                              const updated = { ...prev, locationZone: [] };
                              setHasChanges(checkForChanges(updated));
                              return updated;
                            });
                          }}
                          className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSellerData((prev) => {
                              if (!prev) return prev;
                              const updated = {
                                ...prev,
                                locationZone: [...locationZones],
                              };
                              setHasChanges(checkForChanges(updated));
                              return updated;
                            });
                          }}
                          className="text-xs text-[#2A5D36] hover:text-[#1e4728] transition-colors"
                        >
                          Select All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fix: Additional NGRs */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Additional NGRs
              </label>
              <input
                type="text"
                name="additionalNgrs"
                value={ngrInputValue}
                onChange={handleAdditionalNGRChange}
                className="w-full mb-2 p-2 border border-gray-300 rounded focus:outline-none focus:border-green-700"
                placeholder="Enter NGRs separated by commas (e.g., 11, 22, 33)"
              />
            </div>
            {/* Updated Authority to Act Form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AUTHORITY TO ACT (FORM)
              </label>
              {sellerData.authorityActFormPdf ? (
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={sellerData.authorityActFormPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Current Authority to Act Form
                  </a>
                  <button
                    type="button"
                    onClick={handleRemoveAuthorityPdf}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove Authority to Act form"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 relative">
                  <input
                    ref={authorityFileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleAuthorityPdfUpload}
                    disabled={uploadingAuthorityPdf}
                    className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-gray-50 file:text-gray-700
            hover:file:bg-gray-100 disabled:opacity-50"
                  />
                  {uploadingAuthorityPdf && (
                    <div className="absolute right-2">
                      <AiOutlineLoading3Quarters className="animate-spin text-gray-500" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contacts Section */}
            {/* Contacts Section */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Contact Information *
              </label>

              {/* Existing Contacts */}
              {sellerData?.contactName && sellerData.contactName.length > 0 && (
                <div className="space-y-3 mb-4">
                  {sellerData.contactName.map((contact, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-700 text-sm">
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
                          disabled={updateSellerMutation.isPending}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <MdDelete size={18} />
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
                            disabled={updateSellerMutation.isPending}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-green-700"
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
                            disabled={updateSellerMutation.isPending}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-green-700"
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
                            disabled={updateSellerMutation.isPending}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-green-700"
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
                            setSellerData((prev) => {
                              if (!prev) return prev;
                              const updatedContacts = prev.contactName.map(
                                (c, i) => ({
                                  ...c,
                                  isPrimary:
                                    i === index ? e.target.checked : false,
                                })
                              );
                              const updated = {
                                ...prev,
                                contactName: updatedContacts,
                              };
                              setHasChanges(checkForChanges(updated));
                              return updated;
                            });
                          }}
                          disabled={updateSellerMutation.isPending}
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
              <div className="border-2 border-dashed border-gray-300 rounded-md p-3 bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-3 text-sm">
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
                      disabled={updateSellerMutation.isPending}
                      placeholder="Contact name"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-green-700"
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
                      disabled={updateSellerMutation.isPending}
                      placeholder="Contact email"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-green-700"
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
                      disabled={updateSellerMutation.isPending}
                      placeholder="Contact phone"
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-green-700"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addContact}
                  disabled={
                    updateSellerMutation.isPending || !newContact.name.trim()
                  }
                  className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <MdAdd size={18} />
                  Add Contact
                </button>
              </div>

              {(!sellerData?.contactName ||
                sellerData.contactName.length === 0) && (
                <p className="text-red-500 text-xs mt-2">
                  At least one contact is required
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {hasChanges && (
            <div className="mt-10 flex gap-3">
              <button
                onClick={handleCancel}
                disabled={saveStatus === "saving"}
                className="py-2 px-5 bg-gray-500 text-white rounded flex items-center gap-2 hover:bg-gray-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <MdCancel className="text-lg" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  saveStatus === "saving" ||
                  uploadingAuthorityPdf ||
                  sellerData.contactName.length === 0
                }
                className="py-2 px-5 bg-[#2A5D36] text-white rounded flex items-center gap-2 hover:bg-[#1e4a2a] transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                <MdSave className="text-lg" />
                {saveStatus === "saving" ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Password Handler Modal */}
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
                Update credentials for bulk handlers (optional - only filled
                credentials will be saved)
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
                          <input
                            type="text"
                            value={handler.identifier}
                            onChange={(e) =>
                              handleCredentialChange(
                                idx,
                                "identifier",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#2A5D36] focus:border-[#2A5D36] text-sm"
                            placeholder="Enter username/email/PAN"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="relative">
                            <input
                              type={
                                passwordVisibility[idx] ? "text" : "password"
                              }
                              value={handler.password}
                              onChange={(e) =>
                                handleCredentialChange(
                                  idx,
                                  "password",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:ring-1 focus:ring-[#2A5D36] focus:border-[#2A5D36] text-sm"
                              placeholder="Enter password"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(idx)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white p-4 flex justify-end gap-3 border-t rounded-b-lg">
              <button
                onClick={() => setIsModalOpen(false)}
                className="py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveCredentials}
                className="bg-[#2A5D36] py-2 px-6 cursor-pointer text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-700 hover:bg-[#1e4728]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div>
    <label className="text-sm font-medium text-gray-700 mb-1 block">
      {label}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-700"
    />
  </div>
);

export default SellerInformationEditPage;
