import { Buyer, Seller, TContract } from "@/types/types";
import Image from "next/image";

// Preview Component
interface PreviewContractProps {
  contract: TContract;
  selectedBuyer: Buyer | undefined;
  selectedSeller: Seller | undefined;
  onBackToEdit: () => void;
}

const PreviewContract: React.FC<PreviewContractProps> = ({
  contract,
  selectedBuyer,
  selectedSeller,
  onBackToEdit,
}) => {
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
              <p>{selectedBuyer?.name}</p>
              <p>{selectedBuyer?.officeAddress}</p>
              <p>ABN : {selectedBuyer?.abn}</p>
              <p>Email : {contract.buyerContact?.email}</p>
              <p>
                Contact : {contract.buyerContact?.name || contract.buyer.name}
              </p>
              {contract.conveyance === "Port Zone" ? (
                <p>Contract Number : {contract?.contractNumber}</p>
              ) : (
                <p>Buyer Contract : {contract?.contractNumber}</p>
              )}
            </div>

            <div className="pb-1 space-y-2">
              <h2 className="font-bold text-sm">Seller</h2>
              <p>{selectedSeller?.legalName}</p>
              <p>{selectedSeller?.address}</p>
              <p>NGR : {contract.ngrNumber || "N/A"}</p>
              <p>Email : {contract.sellerContact?.email}</p>
              <p>
                Contact : {contract?.sellerContact?.name}{" "}
                {contract?.sellerContact?.phoneNumber ||
                  contract?.seller.phoneNumber}
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
                      {contract.certificationScheme}
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
                      {contract.tonnes} METRIC TONNES - {contract.tolerance}{" "}
                    </span>
                  </div>

                  <div className="flex pb-1">
                    <span className="w-1/4 font-semibold">Price:</span>
                    <span className="w-3/4">
                      A${contract.priceExGST} PER TONNE IN{" "}
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
                      {contract.brokerRate} PER TONNE (EXCLUSIVE OF GST) INVOICE
                      TO {contract.brokeragePayableBy?.toUpperCase()} TO BE
                      FORWARDED ON SEPARATELY TO THIS CONTRACT
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
                    <span className="font-semibold mb-1 w-1/4">Brokerage:</span>
                    <p className="text-xs w-3/4">
                      BROKERAGE PAYABLE BY{" "}
                      {contract.brokeragePayableBy?.toUpperCase()} AT A$
                      {contract.brokerRate} PER TONNE (EXCLUSIVE OF GST) INVOICE
                      TO {contract.brokeragePayableBy?.toUpperCase()} TO BE
                      FORWARDED ON SEPARATELY TO THIS CONTRACT
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer Note */}
            <div className="mt-4 text-xs italic">
              <p>
                Growth Grain Services as broker does not guarantee the
                performance of this contract. Both the buyer and the seller are
                bound by the above contract and mentioned GTA contracts to
                execute the contract. Seller is responsible for any applicable
                levies/royalties
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={onBackToEdit}
          className="py-2 px-5 bg-[#2A5D36] text-white rounded"
        >
          Back to Edit
        </button>
      </div>
    </div>
  );
};

export default PreviewContract;
