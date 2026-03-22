"use client";
import React, { useState, useEffect } from "react";
import { IoReceiptOutline, IoWarning } from "react-icons/io5";
import { MdCheckCircle } from "react-icons/md";
import { TContract } from "@/types/types";

interface XeroInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: TContract | null;
  onConfirm: (data: InvoiceFormData) => void;
  isLoading: boolean;
}

export interface InvoiceFormData {
  contractId: string;
  invoiceDate: string;
  dueDate: string;
  reference: string;
  notes: string;
}

// Helper function to calculate due date with proper month/year handling
const calculateDueDate = (invoiceDateStr: string, daysOffset: number): string => {
  const invoiceDate = new Date(invoiceDateStr);
  const dueDate = new Date(invoiceDate);
  
  // Add days - JavaScript Date automatically handles month/year boundaries
  // (e.g., Jan 31 + 14 days = Feb 14, Dec 25 + 14 days = Jan 8 of next year)
  dueDate.setDate(dueDate.getDate() + daysOffset);
  
  return dueDate.toISOString().split("T")[0];
};

const XeroInvoiceModal: React.FC<XeroInvoiceModalProps> = ({
  isOpen,
  onClose,
  contract,
  onConfirm,
  isLoading,
}) => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    contractId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    reference: "",
    notes: "",
  });

  // Initialize form data when contract changes
  useEffect(() => {
    if (contract) {
      const todayStr = new Date().toISOString().split("T")[0];
      
      setFormData({
        contractId: contract._id || "",
        invoiceDate: todayStr,
        dueDate: calculateDueDate(todayStr, 14),
        reference: `${contract.contractNumber} - ${contract.seller?.legalName}`,
        notes: contract.notes || "",
      });
    }
  }, [contract]);

  // Auto-update due date when invoice date changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      dueDate: calculateDueDate(prev.invoiceDate, 14),
    }));
  }, [formData.invoiceDate]);

  // Reset form on close
  const handleClose = () => {
    setFormData({
      contractId: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      reference: "",
      notes: "",
    });
    onClose();
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.dueDate) {
      return;
    }
    onConfirm(formData);
  };

  if (!isOpen || !contract) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-xl font-semibold flex gap-x-3 items-center">
            <IoReceiptOutline className="text-blue-600 text-2xl" />
            Create Xero Invoice
          </h3>
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
                  {contract.contractNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(
                    contract.contractDate || contract.createdAt
                  ).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Buyer:</span>
                <span className="ml-2 font-medium">
                  {contract.buyer?.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Seller:</span>
                <span className="ml-2 font-medium">
                  {contract.seller?.legalName}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Grade:</span>
                <span className="ml-2 font-medium">{contract.grade}</span>
              </div>
              <div>
                <span className="text-gray-600">Tonnes:</span>
                <span className="ml-2 font-medium">{contract.tonnes}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Price (Ex GST):</span>
                <span className="ml-2 font-medium text-green-600">
                  ${contract.priceExGST?.toLocaleString() || 0}
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
                  value={formData.invoiceDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      invoiceDate: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  min={formData.invoiceDate}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
                placeholder="Enter invoice reference"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Additional notes for the invoice"
                rows={3}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              />
            </div>
          </div>

          {/* Warning Message */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 flex items-start gap-2">
              <IoWarning className="text-lg flex-shrink-0 mt-0.5" />
              <span>
                This will create a draft invoice in Xero. You can review and
                modify it before sending to the customer.
              </span>
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-5 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.dueDate}
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <MdCheckCircle />
                Create Invoice in Xero
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default XeroInvoiceModal;