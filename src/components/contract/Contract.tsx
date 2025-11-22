import { TContract } from "@/types/types";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { MdOutlineEdit } from "react-icons/md";
interface ContractProps {
  contract: TContract;
}

const Contract: React.FC<ContractProps> = ({ contract }) => {
  const [preview, setPreview] = useState(false);
  if (preview) {
    return (
      <div className="max-w-3xl mx-auto mt-5 max-h-[50rem] overflow-y-scroll">
        <div className="max-w-3xl mx-auto border border-gray-300">
          <div className="text-sm bg-white py-10">
            {/* Header */}
            <div className="mb-4 border-b border-gray-300 pb-5 flex items-center space-x-20 pl-20">
              <div>
                <Image
                  src={"/Original.png"}
                  alt="growth-grain-logo"
                  width={50}
                  height={50}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">GROWTH GRAIN SERVICES</h1>
                <p className="text-xs">ABN 54 157 832 245</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 text-xs px-20">
              <div className="pb-1 space-y-2">
                <h2 className="font-bold text-sm">Buyer</h2>
                <p>{contract?.buyer?.name}</p>
                <p>{contract?.buyer?.officeAddress}</p>
                <p>ABN : {contract?.buyer?.abn}</p>
                <p>Email : {contract?.buyerContact?.email}</p>
                <p>Contact : {contract?.buyerContact?.name}</p>
                {contract.conveyance === "Port Zone" ? (
                  <p>Contract Number : {contract?.contractNumber}</p>
                ) : (
                  <p> Buyer Contract : {contract?.contractNumber}</p>
                )}
              </div>

              <div className="pb-1 space-y-2">
                <h2 className="font-bold text-sm">Seller</h2>
                <p>{contract.seller.legalName}</p>
                <p>{contract.seller.address}</p>
                <p>NGR : {contract.ngrNumber || "N/A"}</p>
                <p>Email : {contract.sellerContact?.email}</p>
                <p>
                  Contact : {contract?.sellerContact?.name}{" "}
                  {contract?.seller.phoneNumber}
                </p>
                <p>ABN : {contract?.seller?.abn}</p>
              </div>
            </div>

            {/* Full-width Broker Ref section with borders */}
            <div>
              <div className="w-full py-2 mb-4 border-b border-t border-gray-300">
                <div className="flex px-20">
                  <span className="w-1/4 font-semibold">Broker Ref:</span>
                  <span className="w-1/4">{contract.contractNumber}</span>
                  <span className="w-1/4 font-semibold">Contract Date:</span>
                  <span className="w-1/4">
                    {contract.contractDate.toString().split("T")[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Contract Details Section */}
            <div className="pl-20 pr-10">
              <div className="space-y-2 text-xs">
                {/* Conditional rendering based on conveyance */}
                {contract.conveyance === "Port Zone" ? (
                  <>
                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">
                        Certification Scheme:
                      </span>
                      <span className="w-3/4">
                        {contract?.certificationScheme || "N/A"}
                      </span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Commodity:</span>
                      <span className="w-3/4">{contract.commodity}</span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Season:</span>
                      <span className="w-3/4">{contract.season}</span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Quality:</span>
                      <span className="w-3/4">{contract.grade}</span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Quantity:</span>
                      <span className="w-3/4">
                        {contract.tonnes} METRIC TONNES - {contract.tolerance}
                      </span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Price:</span>
                      <span className="w-3/4">
                        A${contract.priceExGST} PER TONNE{" "}
                        {contract.deliveryDestination}
                      </span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">
                        Delivery Period:
                      </span>
                      <span className="w-3/4">
                        {contract?.deliveryPeriod?.start &&
                          contract?.deliveryPeriod?.end &&
                          `${new Date(contract.deliveryPeriod.start)
                            .toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                            .replace(/(\d+)/, (match) => {
                              const day = parseInt(match);
                              if (day === 1 || day === 21 || day === 31)
                                return day + "ST";
                              if (day === 2 || day === 22) return day + "ND";
                              if (day === 3 || day === 23) return day + "RD";
                              return day + "TH";
                            })
                            .toUpperCase()} - ${new Date(
                            contract.deliveryPeriod.end
                          )
                            .toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                            .replace(/(\d+)/, (match) => {
                              const day = parseInt(match);
                              if (day === 1 || day === 21 || day === 31)
                                return day + "ST";
                              if (day === 2 || day === 22) return day + "ND";
                              if (day === 3 || day === 23) return day + "RD";
                              return day + "TH";
                            })
                            .toUpperCase()}`}{" "}
                        - {contract?.deliveryOption}
                      </span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Payment:</span>
                      <span className="w-3/4">{contract.paymentTerms}</span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Freight:</span>
                      <span className="w-3/4">{contract.freight}</span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Weight:</span>
                      <span className="w-3/4">{contract.weights}</span>
                    </div>

                    <div className="pb-1 flex">
                      <div className="font-semibold w-1/4">
                        Terms & Conditions:
                      </div>
                      <p className="text-xs w-3/4">
                        {contract.termsAndConditions}
                      </p>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">
                        Special Conditions:
                      </span>
                      <span className="w-3/4 uppercase">
                        {contract.specialCondition}
                      </span>
                    </div>

                    <div className="pb-1 flex">
                      <div className="font-semibold w-1/4">Brokerage:</div>
                      <p className="text-xs w-3/4">
                        BROKERAGE PAYABLE BY{" "}
                        {contract.brokeragePayableBy?.toUpperCase()} AT A$
                        {contract.brokerRate} PER TONNE (EXCLUSIVE OF GST)
                        INVOICE TO {contract.brokeragePayableBy?.toUpperCase()}{" "}
                        TO BE FORWARDED ON SEPARATELY TO THIS CONTRACT
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Default layout for non-portzone conveyance */}
                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">
                        Certification Scheme:
                      </span>
                      <span className="w-3/4">
                        {contract?.certificationScheme || "N/A"}
                      </span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Commodity:</span>
                      <span className="w-3/4">{contract.commodity}</span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Season:</span>
                      <span className="w-3/4">{contract.season}</span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Quality:</span>
                      <span className="w-3/4">
                        {contract.grade} AS PER GTA CSG-101 STANDARDS
                      </span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Quantity:</span>
                      <span className="w-3/4">
                        {contract.tonnes} METRIC TONNES - {contract.tolerance}{" "}
                        TOLERANCE
                      </span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Price:</span>
                      <span className="w-3/4">
                        {contract.conveyance === "Delivered Site"
                          ? `A$${contract.priceExGST} PER TONNE IN DEPOT ${contract.deliveryDestination}`
                          : contract.conveyance === "Del MZ" ||
                            contract.conveyance === "Del Destination"
                          ? `A$${contract.priceExGST} PER TONNE DELIVERED ${contract.deliveryDestination}`
                          : `A$${contract.priceExGST} PER TONNE ${contract.deliveryDestination}`}
                      </span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">
                        Delivery Period:
                      </span>
                      <span className="w-3/4">
                        {contract?.deliveryPeriod?.start &&
                          contract?.deliveryPeriod?.end &&
                          `${new Date(contract.deliveryPeriod.start)
                            .toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                            .replace(/(\d+)/, (match) => {
                              const day = parseInt(match);
                              if (day === 1 || day === 21 || day === 31)
                                return day + "ST";
                              if (day === 2 || day === 22) return day + "ND";
                              if (day === 3 || day === 23) return day + "RD";
                              return day + "TH";
                            })
                            .toUpperCase()} - ${new Date(
                            contract.deliveryPeriod.end
                          )
                            .toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                            .replace(/(\d+)/, (match) => {
                              const day = parseInt(match);
                              if (day === 1 || day === 21 || day === 31)
                                return day + "ST";
                              if (day === 2 || day === 22) return day + "ND";
                              if (day === 3 || day === 23) return day + "RD";
                              return day + "TH";
                            })
                            .toUpperCase()}`}{" "}
                        - {contract.deliveryOption}
                      </span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Payment:</span>
                      <span className="w-3/4">{contract.paymentTerms}</span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Freight:</span>
                      <span className="w-3/4">{contract.freight}</span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">Weight:</span>
                      <span className="w-3/4">{contract.weights}</span>
                    </div>

                    <div className="pb-1 flex">
                      <span className="font-semibold w-1/4">
                        Terms & Conditions:
                      </span>
                      <span className="text-xs w-3/4">
                        {contract.termsAndConditions}
                      </span>
                    </div>

                    <div className="flex pb-1">
                      <span className="w-1/4 font-semibold">
                        Special Conditions:
                      </span>
                      <span className="w-3/4 uppercase">
                        {contract.specialCondition}
                      </span>
                    </div>

                    <div className="pb-1 flex">
                      <span className="font-semibold mb-1 w-1/4">
                        Brokerage:
                      </span>
                      <span className="text-xs w-3/4">
                        AT SELLERS COST AT A$1.00 PER TONNE (EXCLUSIVE OF GST)
                        INVOICE TO SELLER TO BE FORWARDED ON SEPARATELY TO THIS
                        CONTRACT
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Note */}
              <div className="mt-4 text-xs italic">
                <p>
                  Growth Grain Services as broker does not guarantee the
                  performance of this contract. Both the buyer and the seller
                  are bound by the above contract and mentioned GTA contracts to
                  execute the contract. Seller is responsible for any applicable
                  levies/royalties
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="my-10 text-center">
        <p className="text-lg">
          {contract.commodity} - {contract.season}
        </p>
      </div>

      <div className="flex flex-col items-center mx-auto max-w-6xl gap-6 xl:overflow-y-scroll xl:h-[40rem]">
        {/* Main Contract Details */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="flex flex-col border border-gray-300 rounded-md">
            <div className="flex border-b border-gray-300 w-full">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Contract Number
              </div>
              <div className="w-1/2 p-3">
                {contract.contractNumber || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Contract Date
              </div>
              <div className="w-1/2 p-3">
                {contract.contractDate
                  ? new Date(contract.contractDate).toISOString().split("T")[0]
                  : new Date(contract.createdAt).toISOString().split("T")[0]}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Commodity
              </div>
              <div className="w-1/2 p-3">{contract.commodity || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">Season</div>
              <div className="w-1/2 p-3">{contract.season || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Tolerance
              </div>
              <div className="w-1/2 p-3">{contract.tolerance || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">Tonnes</div>
              <div className="w-1/2 p-3">{contract.tonnes || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">Grade</div>
              <div className="w-1/2 p-3">{contract.grade || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Weights
              </div>
              <div className="w-1/2 p-3">{contract.weights || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Price (ex GST)
              </div>
              <div className="w-1/2 p-3">{contract.priceExGST || "N/A"}</div>
            </div>
            <div className="flex">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Buyer contract Reference
              </div>
              <div className="w-1/2 p-3">
                {contract.buyerContractReference || "N/A"}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col border border-gray-300 rounded-md">
            <div className="flex border-b border-gray-300 w-full">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Delivery Period
              </div>
              <div className="w-1/2 p-3">
                <p>
                  start :{" "}
                  {contract?.deliveryPeriod?.start
                    ? new Date(
                        contract.deliveryPeriod.start
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
                <p>
                  end :{" "}
                  {contract?.deliveryPeriod?.end
                    ? new Date(contract.deliveryPeriod.end).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Delivery Option
              </div>
              <div className="w-1/2 p-3">
                {contract.deliveryOption || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Payment Terms
              </div>
              <div className="w-1/2 p-3">{contract.paymentTerms || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Freight
              </div>
              <div className="w-1/2 p-3">{contract.freight || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Conveyance
              </div>
              <div className="w-1/2 p-3">{contract.conveyance || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Certification Scheme
              </div>
              <div className="w-1/2 p-3">
                {contract.certificationScheme || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">Broker</div>
              <div className="w-1/2 p-3">
                {/* {contract.seller.legalName || "N/A"} */}
                Growth Grain Services
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Brokerage Payable By
              </div>
              <div className="w-1/2 p-3">
                {contract.brokeragePayableBy || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Broker Rate
              </div>
              <div className="w-1/2 p-3">{contract.brokerRate || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">Status</div>
              <div className="w-1/2 p-3">{contract.status || "N/A"}</div>
            </div>
            <div className="flex">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Seller Contract Reference
              </div>
              <div className="w-1/2 p-3">
                {contract.sellerContractReference || "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Information */}
        <div className="w-full border border-gray-300 rounded-md">
          <div className="border-b border-gray-300 p-3 bg-gray-50">
            <p className="font-semibold">Buyer Information</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Buyer Name
              </div>
              <div className="w-1/2 p-3">{contract.buyer?.name || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">ABN</div>
              <div className="w-1/2 p-3">{contract.buyer?.abn || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Office Address
              </div>
              <div className="w-1/2 p-3">
                {contract.buyer?.officeAddress || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Contact Name
              </div>
              <div className="w-1/2 p-3">
                {contract?.buyerContact?.name || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">Email</div>
              <div className="w-1/2 p-3">
                {contract.buyerContact?.email || "N/A"}
              </div>
            </div>
            <div className="flex">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">Phone</div>
              <div className="w-1/2 p-3">
                {contract.buyerContact?.phoneNumber || "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Seller Information */}
        <div className="w-full border border-gray-300 rounded-md">
          <div className="border-b border-gray-300 p-3 bg-gray-50">
            <p className="font-semibold">Seller Information</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Legal Name
              </div>
              <div className="w-1/2 p-3">
                {contract.seller?.legalName || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Office Address
              </div>
              <div className="w-1/2 p-3">
                {contract.seller?.address || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">ABN</div>
              <div className="w-1/2 p-3">{contract.seller?.abn || "N/A"}</div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Main NGR
              </div>
              <div className="w-1/2 p-3">
                {contract?.ngrNumber || contract?.seller?.mainNgr || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Contact Name
              </div>
              <div className="w-1/2 p-3">
                {contract?.sellerContact?.name || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">Email</div>
              <div className="w-1/2 p-3">
                {contract.sellerContact?.email || "N/A"}
              </div>
            </div>
            <div className="flex">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">Phone</div>
              <div className="w-1/2 p-3">
                {contract.sellerContact?.phoneNumber || "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="w-full border border-gray-300 rounded-md">
          <div className="border-b border-gray-300 p-3 bg-gray-50">
            <p className="font-semibold">Additional Information</p>
          </div>
          <div className="grid grid-cols-1">
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Special Conditions
              </div>
              <div className="w-1/2 p-3">
                {contract.specialCondition || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Terms & Conditions
              </div>
              <div className="w-1/2 p-3">
                {contract.termsAndConditions || "N/A"}
              </div>
            </div>
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">Notes</div>
              <div className="w-1/2 p-3">{contract.notes || "N/A"}</div>
            </div>
            <div className="flex">
              <div className="w-1/2 p-3 text-[#1A1A1A] font-medium">
                Attachments
              </div>
              <div className="w-1/2 p-3">
                <div className="flex flex-col gap-1">
                  {contract.attachedBuyerContract ? (
                    <a
                      href={contract.attachedBuyerContract}
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Buyer&apos;s Contract
                    </a>
                  ) : (
                    <p>N/A</p>
                  )}
                  {contract.attachedSellerContract ? (
                    <a
                      href={contract.attachedSellerContract}
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Seller&apos;s Contract
                    </a>
                  ) : (
                    <p>N/A</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <div className="mt-10 w-full flex justify-center gap-5">
          <Link href={`/dashboard/contract-management/edit/${contract._id}`}>
            <button className="cursor-pointer py-2 px-5 bg-[#2A5D36] text-white hover:bg-[#1e4728]  rounded flex items-center gap-2">
              <MdOutlineEdit className="text-lg" />
              Edit Contract
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="cursor-pointer py-2 px-5 bg-[#2A5D36] hover:bg-[#1e4728] text-white rounded flex items-center gap-2"
          >
            Preview Contract
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contract;
