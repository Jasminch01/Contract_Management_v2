/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { BulkHandlerCredential, Seller, ContactDetails } from "@/types/types";
import { createSeller } from "@/api/sellerApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

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

const CreateSellerPage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [bulkHandlerCredentials, setBulkHandlerCredentials] =
    useState<BulkHandlerCredential[]>(initialCredentials);

  // State for password visibility - track each row separately
  const [passwordVisibility, setPasswordVisibility] = useState<boolean[]>(
    new Array(handlerNames.length).fill(false)
  );
  const [uploadingAthAct, setUploadingAthAct] = useState(false);

  // Updated contact state to handle ContactDetails object with isPrimary
  const [currentContact, setCurrentContact] = useState<ContactDetails>({
    name: "",
    email: "",
    phoneNumber: "",
    isPrimary: false,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState<Seller>({
    legalName: "",
    address: "",
    abn: "",
    mainNgr: "",
    additionalNgrs: [],
    contactName: [] as ContactDetails[],
    email: "",
    phoneNumber: "",
    locationZone: [],
    accountNumber: "",
    authorityActFormPdf: "",
    authorityToAct: "",
    bulkHandlerCredentials: [],
  });

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

  // TanStack Query mutation for creating seller
  const createSellerMutation = useMutation({
    mutationFn: createSeller,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
      queryClient.setQueryData(["seller"], (oldData: Seller[] | undefined) => {
        if (oldData) {
          return [data, ...oldData];
        }
        return [data];
      });

      toast.success("Seller created successfully!");
      router.push("/dashboard/seller-management");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create seller");
    },
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "additionalNgrs") {
      setInputValue(value);
      setFormData((prev) => {
        const ngrArray = value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== "");

        return {
          ...prev,
          [name]: ngrArray,
        };
      });
      return;
    }

    if (name !== "contactName") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle contact detail changes
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentContact((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentContact((prev) => ({
      ...prev,
      isPrimary: e.target.checked,
    }));
  };

  const addContactName = () => {
    // Validate all fields are filled
    if (
      !currentContact.name.trim() ||
      !currentContact.email.trim() ||
      !currentContact.phoneNumber.trim()
    ) {
      toast.error(
        "Please fill in all contact fields (name, email, and phone number)"
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentContact.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if contact with same email already exists
    const emailExists = formData.contactName.some(
      (contact) =>
        contact.email.toLowerCase() === currentContact.email.toLowerCase()
    );

    if (emailExists) {
      toast.error("Contact with this email already exists");
      return;
    }
    const nameExists = formData.contactName.some(
      (contact) =>
        contact.name.toLowerCase() === currentContact.name.toLowerCase()
    );

    if (nameExists) {
      toast.error("Contact with this name already exists");
      return;
    }

    // Add contact to list
    const newContact = {
      name: currentContact.name.trim(),
      email: currentContact.email.trim(),
      phoneNumber: currentContact.phoneNumber.trim(),
      isPrimary: currentContact.isPrimary || false,
    };

    // If this contact is marked as primary, remove primary from others
    let updatedContacts = formData.contactName;
    if (newContact.isPrimary) {
      updatedContacts = formData.contactName.map((c) => ({ ...c, isPrimary: false }));
    }

    // If this is the first contact, make it primary automatically
    if (formData.contactName.length === 0) {
      newContact.isPrimary = true;
    }

    setFormData((prev) => ({
      ...prev,
      contactName: [newContact, ...updatedContacts],
    }));

    // Reset current contact
    setCurrentContact({
      name: "",
      email: "",
      phoneNumber: "",
      isPrimary: false,
    });

    toast.success("Contact added successfully");
  };

  const removeContactName = (emailToRemove: string) => {
    const updatedContacts = formData.contactName.filter(
      (contact) => contact.email !== emailToRemove
    );

    // If we removed the primary contact and there are still contacts left,
    // make the first one primary
    const removedContact = formData.contactName.find(
      (contact) => contact.email === emailToRemove
    );
    if (removedContact?.isPrimary && updatedContacts.length > 0) {
      updatedContacts[0].isPrimary = true;
    }

    setFormData((prev) => ({
      ...prev,
      contactName: updatedContacts,
    }));
  };

  const setPrimaryContact = (contactEmail: string) => {
    setFormData((prev) => ({
      ...prev,
      contactName: prev.contactName.map((c) => ({
        ...c,
        isPrimary: c.email === contactEmail,
      })),
    }));
    toast.success("Primary contact updated");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addContactName();
    }
  };

  const handleAuthorityActFormUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingAthAct(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        authorityActFormPdf: url,
      }));
      toast.success("Buyer contract uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload buyer contract");
      console.error("Upload error:", error);
    } finally {
      setUploadingAthAct(false);
    }
  };

  const handleLocationZoneChange = (zone: string) => {
    setFormData((prev) => {
      if (prev.locationZone.includes(zone)) {
        return {
          ...prev,
          locationZone: prev.locationZone.filter((z) => z !== zone),
        };
      } else {
        return {
          ...prev,
          locationZone: [...prev.locationZone, zone],
        };
      }
    });
  };

  const removeZone = (zone: string) => {
    setFormData((prev) => ({
      ...prev,
      locationZone: prev.locationZone.filter((z) => z !== zone),
    }));
  };

  const handleCredentialChange = (
    index: number,
    field: keyof Omit<BulkHandlerCredential, "handlerName">,
    value: string
  ) => {
    setBulkHandlerCredentials((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const togglePasswordVisibility = (index: number) => {
    setPasswordVisibility((prev) =>
      prev.map((visible, idx) => (idx === index ? !visible : visible))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.legalName ||
      !formData.abn ||
      formData.contactName.length === 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.contactName.length === 0) {
      toast.error("Please add at least one contact");
      return;
    }

    const validCredentials = bulkHandlerCredentials.filter(
      (cred) => cred.identifier.trim() !== "" && cred.password.trim() !== ""
    );

    const newSeller: Seller = {
      ...formData,
      bulkHandlerCredentials: validCredentials,
    };

    createSellerMutation.mutate(newSeller);
  };

  const saveCredentials = () => {
    const filledCredentials = bulkHandlerCredentials.filter(
      (cred) => cred.identifier.trim() !== "" || cred.password.trim() !== ""
    );

    if (filledCredentials.length > 0) {
      toast.success(
        `${filledCredentials.length} bulk handler credentials saved`
      );
    }

    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 md:mt-32 px-4 xl:overflow-scroll xl:h-[40rem] hide-scrollbar-xl">
      <Toaster />
      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          {/* Header with Bulk Password Handler Button */}
          <div className="mb-10 flex justify-between items-center">
            <div>
              <h1 className="font-bold text-xl">Create Seller</h1>
              <p className="text-sm">Fill up the form below</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#2A5D36] py-2 px-6 text-white rounded hover:bg-[#1e4728] transition-colors cursor-pointer"
            >
              Bulk Handler Passwords
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="space-y-6">
              {/* Row 1 */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700">
                    SELLER LEGAL NAME *
                  </label>
                  <input
                    type="text"
                    name="legalName"
                    value={formData.legalName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700">
                    SELLER OFFICE ADDRESS *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700">
                    SELLER ABN *
                  </label>
                  <input
                    type="text"
                    name="abn"
                    value={formData.abn}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                  />
                </div>

                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700">
                    SELLER EMAIL *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700">
                    SELLER PHONE NUMBER *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                  />
                </div>

                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700">
                    SELLER MAIN NGR
                  </label>
                  <input
                    type="text"
                    name="mainNgr"
                    value={formData.mainNgr}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SELLER ADDITIONAL NGRS (comma separated)
                  </label>
                  <input
                    type="text"
                    name="additionalNgrs"
                    value={inputValue}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2A5D36] focus:border-[#2A5D36]"
                    placeholder="11, 22, 33"
                  />
                </div>

                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SELLER LOCATION ZONE (Multiple Select)
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <div
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#2A5D36] focus:border-[#2A5D36] cursor-pointer min-h-[42px] flex items-center justify-between"
                    >
                      <div className="flex-1 flex flex-wrap gap-1 mr-2">
                        {formData.locationZone.length === 0 ? (
                          <span className="text-gray-500 text-sm">
                            Select location zones...
                          </span>
                        ) : (
                          formData.locationZone.map((zone) => (
                            <span
                              key={zone}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#2A5D36] text-white"
                            >
                              <span className="max-w-[100px] truncate">
                                {zone}
                              </span>
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
                                checked={formData.locationZone.includes(zone)}
                                onChange={() => handleLocationZoneChange(zone)}
                                className="mr-3 h-4 w-4 text-[#2A5D36] focus:ring-[#2A5D36] border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700 flex-1">
                                {zone}
                              </span>
                              {formData.locationZone.includes(zone) && (
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

                        <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
                          <div className="flex justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  locationZone: [],
                                }));
                              }}
                              className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              Clear All
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  locationZone: [...locationZones],
                                }));
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
              </div>

              {/* Row 5 - Location Zone and Account Number */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700">
                    ACCOUNT NUMBER
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                    placeholder=""
                  />
                </div>
                {/* Authority to Act Form */}
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700">
                    AUTHORITY TO ACT (FORM)
                  </label>
                  <input
                    type="file"
                    name="authorityActFormPdf"
                    disabled={uploadingAthAct}
                    onChange={handleAuthorityActFormUpload}
                    accept="application/pdf"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                  />
                  {uploadingAthAct && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <AiOutlineLoading3Quarters className="animate-spin text-gray-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full border-t pt-6 mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SELLER CONTACT DETAILS *
              </label>
              <div className="space-y-2">
                {/* Contact Input Fields */}
                <div className="space-y-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                  <input
                    type="text"
                    name="name"
                    value={currentContact.name}
                    onChange={handleContactChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Contact Name"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A5D36] focus:border-transparent text-sm"
                    disabled={createSellerMutation.isPending}
                  />
                  <input
                    type="email"
                    name="email"
                    value={currentContact.email}
                    onChange={handleContactChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Contact Email"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A5D36] focus:border-transparent text-sm"
                    disabled={createSellerMutation.isPending}
                  />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={currentContact.phoneNumber}
                    onChange={handleContactChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Contact Phone Number"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2A5D36] focus:border-transparent text-sm"
                    disabled={createSellerMutation.isPending}
                  />
                  
                  {/* Primary Contact Checkbox - only show if there are already contacts */}
                  {formData.contactName.length > 0 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPrimary"
                        checked={currentContact.isPrimary}
                        onChange={handlePrimaryChange}
                        className="w-4 h-4 text-[#2A5D36] focus:ring-[#2A5D36] border-gray-300 rounded"
                        disabled={createSellerMutation.isPending}
                      />
                      <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700">
                        Set as Primary Contact
                      </label>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={addContactName}
                    className="w-full bg-[#2A5D36] text-white px-3 py-2 rounded-md text-sm hover:bg-[#1e4728] transition-colors"
                    disabled={createSellerMutation.isPending}
                  >
                    Add Contact
                  </button>
                </div>

                {/* Display added contacts */}
                {formData.contactName.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {formData.contactName.map((contact, index) => (
                      <div
                        key={index}
                        className={`bg-white border rounded-md p-3 flex justify-between items-start ${
                          contact.isPrimary ? "border-[#2A5D36] border-2" : "border-gray-200"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm text-gray-900">
                              {contact.name}
                            </div>
                            {contact.isPrimary && (
                              <span className="bg-[#2A5D36] text-white text-xs px-2 py-1 rounded-full">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            {contact.email}
                          </div>
                          <div className="text-xs text-gray-600">
                            {contact.phoneNumber}
                          </div>
                          {!contact.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryContact(contact.email)}
                              className="mt-2 text-xs text-[#2A5D36] hover:underline"
                              disabled={createSellerMutation.isPending}
                            >
                              Set as Primary
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeContactName(contact.email)}
                          className="text-red-500 hover:text-red-700 font-bold text-lg leading-none ml-2"
                          disabled={createSellerMutation.isPending}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-10 text-center md:text-left flex space-x-5 items-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-500 cursor-pointer py-2 px-6 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={createSellerMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingAthAct || createSellerMutation.isPending}
                className="bg-[#2A5D36] py-2 px-6 text-white rounded-md hover:bg-[#1e4728] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createSellerMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bulk Password Handler Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-8 max-h-[90vh] flex flex-col">
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
                Enter credentials for bulk handlers (optional - only filled
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

export default CreateSellerPage;