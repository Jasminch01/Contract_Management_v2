/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
"use client";
import { IoArrowBack } from "react-icons/io5";
import BuyerSelect from "./BuyerSelect";
import SellerSelect from "./SellerSelect";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays } from "date-fns";
import { useState, useEffect } from "react";
import SelectBuyerSeller from "./SelectBuyerSeller";
import SelectContractType from "./SelectContractType";
import {
  Buyer,
  ContractType,
  Seller,
  TContract,
  TUpdateContract,
} from "@/types/types";
import toast from "react-hot-toast";
import ConveyanceSelect from "./ConveyanceSelect";
import { createContract } from "@/api/ContractAPi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { satoshiFont } from "@/font/font";
import { instance } from "@/api/api";

interface NextContractNumberResponse {
  nextContractNumber: string;
}

const CreateContractForm = () => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [formData, setFormData] = useState<TUpdateContract>({
    contractNumber: "",
    contractDate: "",
    buyerContractReference: "",
    sellerContractReference: "",
    grade: "",
    buyer: "",
    seller: "",
    contractType: "",
    deliveryOption: "",
    deliveryPeriod: {
      start: "",
      end: "",
    },
    freight: "",
    weights: "",
    priceExGST: "",
    conveyance: "",
    attachedSellerContract: "",
    attachedBuyerContract: "",
    commodity: "",
    certificationScheme: "",
    paymentTerms: "",
    brokerRate: "",
    deliveryDestination: "",
    brokeragePayableBy: "",
    specialCondition: "",
    termsAndConditions: "",
    notes: "",
    tonnes: " ",
    ngrNumber: "",
    tolerance: "",
    season: "",
  });

  const [isGrowerContract, setIsGrowerContract] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
  });
  const [uploadingBuyerContract, setUploadingBuyerContract] = useState(false);
  const [isLoadingContractNumber, setIsLoadingContractNumber] = useState(true);
  const [uploadingSellerContract, setUploadingSellerContract] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller>();
  const [startDate, endDate] = dateRange;
  const router = useRouter();
  const queryClient = useQueryClient();

  const createContractMutation = useMutation({
    mutationFn: createContract,
    onSuccess: (data) => {
      // Or optimistically update the cache - with null check
      queryClient.setQueryData(
        ["contracts"],
        (old: TContract[] | undefined) => {
          // Handle case where old data doesn't exist
          const existingContracts = old || [];
          return [data, ...existingContracts];
        }
      );

      // Invalidate and refetch contracts list
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      queryClient.invalidateQueries({ queryKey: ["sellers"] });
      queryClient.invalidateQueries({ queryKey: ["buyers"] });

      const isDraft = data.status === "draft";
      toast.success(
        isDraft
          ? "Contract saved as draft successfully!"
          : "Contract created successfully!"
      );
      router.push("/dashboard/contract-management");
    },
    onError: (error) => {
      console.error("Error creating contract:", error);
      toast.error("Failed to create contract. Please try again.");
    },
  });

  //contract number
  const fetchNextContractNumber = async () => {
    try {
      setIsLoadingContractNumber(true);

      // Using your instance with proper typing
      const response = await instance.get<NextContractNumberResponse>(
        "/contracts/next-number"
      );

      if (!response.data) {
        throw new Error("Failed to fetch contract number");
      }

      setFormData((prev) => ({
        ...prev,
        contractNumber: response.data.nextContractNumber,
      }));
    } catch (error) {
      console.error("Error fetching contract number:", error);
      toast.error("Failed to fetch contract number. Using fallback.");

      // Fallback to a default number
      setFormData((prev) => ({
        ...prev,
        contractNumber: "JZ02633", //contract number
      }));
    } finally {
      setIsLoadingContractNumber(false);
    }
  };

  useEffect(() => {
    fetchNextContractNumber();
  }, []);

  // Cloudinary upload function
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

  // Handle buyer contract file upload
  const handleBuyerContractUpload = async (
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

    setUploadingBuyerContract(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        attachedBuyerContract: url,
      }));
      toast.success("Buyer contract uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload buyer contract");
      console.error("Upload error:", error);
    } finally {
      setUploadingBuyerContract(false);
    }
  };

  // Handle seller contract file upload
  const handleSellerContractUpload = async (
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

    setUploadingSellerContract(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        attachedSellerContract: url,
      }));
      toast.success("Seller contract uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload seller contract");
      console.error("Upload error:", error);
    } finally {
      setUploadingSellerContract(false);
    }
  };

  // Update isGrowerContract when contractType changes
  useEffect(() => {
    setIsGrowerContract(formData.contractType === "Grower");
  }, [formData.contractType]);

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    router.back();
  };

  const handleDateChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);

    // Convert date range to string for storage in formData
    if (update[0] && update[1]) {
      const start = `${update[0].toLocaleDateString()}`;
      const end = `${update[1].toLocaleDateString()}`;
      setFormData((prev) => ({
        ...prev,
        deliveryPeriod: {
          start,
          end,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        deliveryPeriod: {
          start: "",
          end: "",
        },
      }));
    }
  };

  const getFormattedSeasons = () => {
    if (typeof window === "undefined") {
      // Return empty array during SSR to avoid hydration mismatch
      return [];
    }

    // This gets the current year every time the function is called
    // So it automatically updates when the year changes
    const currentYear = new Date().getFullYear();

    // Generate seasons: 1 future season + current season + previous seasons back to 2021/2022
    // But filter out any seasons below 2021/2022
    const seasons = [];

    // Start from next year (future season) and go backwards
    for (let i = 0; i < 20; i++) {
      // 20 is a safe upper limit to ensure we capture all needed seasons
      const startYear = currentYear + 1 - i; // +1 for future season, then go backwards
      const endYear = startYear + 1;

      // Stop if we go below 2021/2022 season
      if (startYear < 2021) {
        break;
      }

      seasons.push(`${String(startYear)}/${String(endYear)}`);
    }

    return seasons;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // For updating buyer information
  const handleBuyerSelect = (buyer: Buyer) => {
    const primaryContact = buyer.contacts?.find((c) => c.isPrimary);

    setFormData((prev) => ({
      ...prev,
      buyer: buyer._id as string,
      buyerContact: primaryContact,
    }));
  };

  // For updating seller information
const handleSellerSelect = (seller: Seller) => {
  const primaryContact =
    seller.contactName?.find((c) => c.isPrimary === true);
  
  console.log(primaryContact);
  setSelectedSeller(seller);

  setFormData((prev) => ({
    ...prev,
    seller: seller._id as string,
    sellerContact: primaryContact,
  }));
};

  // For updating contract type
  const handleContractTypeSelect = (type: ContractType) => {
    setFormData((prev) => ({
      ...prev,
      contractType: type.name,
    }));
  };

  // For updating brokerage payable by
  const handleBrokerageSelect = (option: ContractType) => {
    setFormData((prev) => ({
      ...prev,
      brokeragePayableBy: option.name,
    }));
  };

  const showNotification = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification({ message: "", type: "", visible: false });
    }, 4000);
  };

  // Validation function for active contracts
  const validateActiveContract = () => {
    let hasError = false;

    if (!formData.seller) {
      showNotification("Please select a seller", "error");
      hasError = true;
    }

    if (!formData.buyer) {
      showNotification("Please select a buyer", "error");
      hasError = true;
    }

    if (!formData.brokeragePayableBy) {
      showNotification(
        "Please select who the brokerage is payable by",
        "error"
      );
      hasError = true;
    }

    if (!formData.contractType) {
      showNotification("Please select type of contract", "error");
      hasError = true;
    }

    if (!formData.conveyance) {
      showNotification("Please select conveyance", "error");
      hasError = true;
    }

    // Check other required fields based on your form requirements
    const requiredFields = [
      { field: "contractDate", message: "Contract date is required" },
      { field: "deliveryPeriod.start", message: "Delivery period is required" },
      {
        field: "deliveryDestination",
        message: "Delivery destination is required",
      },
      { field: "deliveryOption", message: "Delivery option is required" },
      { field: "brokerRate", message: "Broker rate is required" },
      { field: "freight", message: "Freight is required" },
      { field: "grade", message: "Grade is required" },
      { field: "weights", message: "Weights is required" },
      { field: "priceExGST", message: "Price (Ex-GST) is required" },
      { field: "commodity", message: "Commodity is required" },
      { field: "tonnes", message: "Tonnes is required" },
      { field: "season", message: "Season is required" },
      { field: "tolerance", message: "Tolerance is required" },
    ];

    for (const { field, message } of requiredFields) {
      let value;
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        value = formData[parent as keyof typeof formData]?.[child as any];
      } else {
        value = formData[field as keyof typeof formData];
      }

      if (!value || (typeof value === "string" && value.trim() === "")) {
        showNotification(message, "error");
        hasError = true;
        break; // Show one error at a time
      }
    }

    return !hasError;
  };

  const validateDraftContract = () => {
    let hasError = false;

    if (!formData.seller) {
      showNotification("Must have to select a seller to save draft", "error");
      hasError = true;
    }

    if (!formData.buyer) {
      showNotification("Must have to  select a buyer to save draft", "error");
      hasError = true;
    }

    if (!formData.brokeragePayableBy) {
      showNotification(
        "Must have to select who the brokerage is payable by to save draft",
        "error"
      );
      hasError = true;
    }
    return !hasError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission first

    // Only validate required fields for active contracts
    if (!validateActiveContract()) {
      return;
    }

    // Create active contract
    const newContract: TUpdateContract = {
      ...formData,
    };

    createContractMutation.mutate(newContract);
    // console.log(newContract)
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!validateDraftContract()) {
      return;
    }

    // No validation required for drafts - save whatever is filled
    const draftContract: TUpdateContract = {
      ...formData,
      status: "Draft",
    };

    createContractMutation.mutate(draftContract);
  };

  return (
    <div className="xl:overflow-scroll xl:h-[35rem] 2xl:h-full 2xl:overflow-visible hide-scrollbar-xl">
      <form className="space-y-6 mt-7 md:mt-10" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:grid-rows-8 gap-3 sm:gap-4 xl:gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              Contract Number
            </label>
            {isLoadingContractNumber ? (
              <div className="mt-1 block w-full px-3 py-2 font-semibold border border-gray-300 rounded focus:outline-none bg-gray-50 items-center">
                <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              <input
                type="text"
                name="contractNumber"
                value={formData.contractNumber}
                className="mt-1 block w-full px-3 py-2 font-semibold border border-gray-300 rounded focus:outline-none bg-gray-50 cursor-not-allowed"
                placeholder=""
                readOnly
                style={{ backgroundColor: "#f9f9f9" }}
              />
            )}
          </div>
          {/* Contract Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              CONTRACT DATE *
            </label>
            <input
              type="date"
              name="contractDate"
              value={formData.contractDate}
              onChange={handleChange}
              placeholder="sjfkjdf"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
          {/* Delivery Period - Full width on mobile, spans appropriately on larger screens */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-700 uppercase">
              DELIVERY PERIOD *
            </label>
            <div className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={handleDateChange}
                isClearable={true}
                placeholderText="Select date range"
                className="w-full focus:outline-none "
                dateFormat="MMM d, yyyy"
                maxDate={addDays(new Date(), 365)}
                shouldCloseOnSelect={false}
                selectsDisabledDaysInRange
              />
            </div>
          </div>
          {/* Delivery Destination */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              DELIVERY DESTINATION *
            </label>
            <input
              name="deliveryDestination"
              value={formData.deliveryDestination}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>

          {/* Delivery Option */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              DELIVERY OPTION *
            </label>
            <input
              type="text"
              name="deliveryOption"
              value={formData.deliveryOption}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>

          {/* Broker Rate */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              BROKER RATE *
            </label>
            <input
              type="number"
              name="brokerRate"
              value={formData.brokerRate}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder=""
            />
          </div>

          {/* Seller Contract Reference */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              SELLER CONTRACT REFERENCE
            </label>
            <input
              type="text"
              name="sellerContractReference"
              value={formData.sellerContractReference}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>

          {/* Special Condition - Spans 2 rows on xl, full width on smaller screens */}
          <div className="sm:col-span-2 lg:col-span-1 xl:row-span-2">
            <label className="block text-xs font-medium text-gray-700 uppercase">
              SPECIAL CONDITION
            </label>
            <textarea
              name="specialCondition"
              value={formData.specialCondition}
              onChange={handleChange}
              className="mt-1 block resize-none w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 h-24 sm:h-32 xl:h-full"
              placeholder=""
            />
          </div>

          {/* Freight */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              FREIGHT *
            </label>
            <input
              onChange={handleChange}
              name="freight"
              value={formData.freight}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>

          {/* Buyer Contract Reference */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              BUYER CONTRACT REFERENCE
            </label>
            <input
              onChange={handleChange}
              name="buyerContractReference"
              value={formData.buyerContractReference}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>

          {/* Grade */}
          <div className="lg:row-start-4 xl:row-start-4">
            <label className="block text-xs font-medium text-gray-700 uppercase">
              GRADE *
            </label>
            <input
              onChange={handleChange}
              name="grade"
              value={formData.grade}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>

          {/* Weights */}
          <div className="lg:row-start-4 xl:row-start-4">
            <label className="block text-xs font-medium text-gray-700 uppercase">
              WEIGHTS *
            </label>
            <input
              onChange={handleChange}
              name="weights"
              value={formData.weights}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>

          {/* Brokerage Select */}
          <div className="lg:row-start-4 xl:row-start-4">
            <SelectBuyerSeller onSelect={handleBrokerageSelect} />
          </div>

          {/* Terms & Conditions - Spans 2 rows on md and xl, full width on smaller screens */}
          <div className="sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:row-start-4 xl:row-span-2 xl:row-start-4">
            <label className="block text-xs font-medium text-gray-700 uppercase">
              TERMS & CONDITIONS
            </label>
            <textarea
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={handleChange}
              className="mt-1 block w-full resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 h-24 sm:h-32 lg:h-full"
              placeholder=""
            />
          </div>

          {/* Buyer Select */}
          <div>
            <BuyerSelect onSelect={handleBuyerSelect} />
          </div>

          {/* Price (Ex-GST) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              PRICE (EX-GST) *
            </label>
            <input
              value={formData.priceExGST}
              onChange={handleChange}
              name="priceExGST"
              type="number"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder=""
            />
          </div>

          {/* Attach Buyer's Contract - Full width on mobile */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-700 uppercase">
              ATTACH BUYERS CONTRACT
            </label>
            <div className="relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleBuyerContractUpload}
                disabled={uploadingBuyerContract}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
              {uploadingBuyerContract && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <AiOutlineLoading3Quarters className="animate-spin text-gray-500" />
                </div>
              )}
            </div>
            {/* {formData.attachedBuyerContract && (
              <div className="mt-2">
                <a
                  href={formData.attachedBuyerContract}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  View uploaded contract
                </a>
              </div>
            )} */}
          </div>

          {/* Seller Select */}
          <div className="lg:row-start-6 xl:row-start-6">
            <SellerSelect onSelect={handleSellerSelect} />
          </div>

          {/* Conveyance Select */}
          <div className="lg:row-start-6 xl:row-start-6">
            <ConveyanceSelect
              value={formData.conveyance}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, conveyance: value }))
              }
            />
          </div>

          {/* Certification Scheme */}
          <div className="lg:row-start-6 xl:row-start-6">
            <label className="block text-xs font-medium text-gray-700 uppercase">
              CERTIFICATION SCHEME
            </label>
            <input
              onChange={handleChange}
              name="certificationScheme"
              value={formData.certificationScheme}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>

          {/* Notes - Spans 2 rows on md and xl, full width on smaller screens */}
          <div className="sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:row-start-6 xl:row-span-2 xl:row-start-6">
            <label className="block text-xs font-medium text-gray-700 uppercase">
              NOTES
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 h-24 sm:h-32 lg:h-full"
              placeholder=""
            />
          </div>

          {/* Attach Seller's Contract - Full width on mobile */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-700 uppercase">
              ATTACH SELLERS CONTRACT
            </label>
            <div className="relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleSellerContractUpload}
                disabled={uploadingSellerContract}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
              {uploadingSellerContract && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <AiOutlineLoading3Quarters className="animate-spin text-gray-500" />
                </div>
              )}
            </div>
          </div>

          {/* Commodity */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              COMMODITY *
            </label>
            <input
              type="text"
              onChange={handleChange}
              name="commodity"
              value={formData.commodity}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>

          {/* Tonnes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              TONNES *
            </label>
            <input
              onChange={handleChange}
              name="tonnes"
              value={formData.tonnes}
              type="number"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder=""
            />
          </div>

          {/* Contract Type Select */}
          <div>
            <SelectContractType onSelect={handleContractTypeSelect} />
          </div>
          {/* NGR Number - Conditional */}
          {isGrowerContract && (
            <div className="lg:row-start-8 xl:row-start-8">
              <label className="block text-xs font-medium text-gray-700 uppercase">
                NGR NUMBER
              </label>
              <select
                name="ngrNumber"
                onChange={handleChange}
                value={formData.ngrNumber}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
              >
                <option value="">Select NGR Number</option>

                {/* Main NGR - Highlighted */}
                {selectedSeller?.additionalNgrs && (
                  <option
                    value={selectedSeller.mainNgr}
                    className=" bg-blue-50 text-blue-800"
                  >
                    {selectedSeller.mainNgr} (Main NGR)
                  </option>
                )}

                {/* Additional NGRs */}
                {selectedSeller?.additionalNgrs?.map((ngr, index) => (
                  <option key={index} value={ngr} className="text-gray-700">
                    {ngr}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Season Dropdown */}
          <div className={`lg:row-start-8 xl:row-start-8`}>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              SEASON *
            </label>
            <select
              name="season"
              value={formData.season}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="">Select Season</option>
              {getFormattedSeasons().map((season) => (
                <option
                  key={season}
                  value={season}
                  className={`${satoshiFont.className}`}
                >
                  {season}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              PAYMENT TERMS
            </label>
            <input
              type="text"
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>

          {/* Tolerance */}
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              TOLERANCE *
            </label>
            <input
              onChange={handleChange}
              name="tolerance"
              value={formData.tolerance}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder=""
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center gap-3 cursor-pointer order-3 sm:order-1"
          >
            <IoArrowBack /> Back
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={
              uploadingBuyerContract ||
              uploadingSellerContract ||
              createContractMutation.isPending
            }
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-2"
          >
            {createContractMutation.isPending ? (
              <div className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Saving...
              </div>
            ) : (
              "Save Draft"
            )}
          </button>

          <button
            type="submit"
            disabled={
              uploadingBuyerContract ||
              uploadingSellerContract ||
              createContractMutation.isPending
            }
            className="px-6 py-2 bg-[#2A5D36] text-white rounded hover:bg-[#1e4728] focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-3"
          >
            {createContractMutation.isPending ? (
              <div className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Creating...
              </div>
            ) : (
              "Create Contract"
            )}
          </button>
        </div>
      </form>
      {notification.visible && (
        <div className="fixed top-4 right-4 max-w-md z-50">
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
                {notification.type === "error" && (
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
  );
};

export default CreateContractForm;
