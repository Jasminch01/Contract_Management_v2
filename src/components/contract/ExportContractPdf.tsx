import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PdfImage,
} from "@react-pdf/renderer";
import { TContract } from "@/types/types";

const contractPdfStyles = StyleSheet.create({
  page: {
    fontSize: 14,
    fontFamily: "Helvetica",
    height: "100%",
  },
  container: {
    paddingTop: 30,
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 50,
  },
  headerContainer: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 8,
  },
  logo: {
    width: 45,
    height: 45,
  },
  headerText: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  abn: {
    fontSize: 8,
  },
  partiesSection: {
    marginBottom: 8,
    paddingHorizontal: 50,
    flexDirection: "row",
    rowGap: 10,
    gap: 15,
    paddingVertical: 10,
  },
  partyColumn: {
    flex: 1,
  },
  partyTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },
  partyText: {
    fontSize: 10,
    marginBottom: 2,
    lineHeight: 1.2,
  },
  brokerRefSection: {
    width: "100%",
    paddingVertical: 6,
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
  },
  brokerRefContent: {
    flexDirection: "row",
    paddingHorizontal: 50,
  },
  brokerRefItem: {
    width: "25%",
    fontSize: 9,
  },
  boldText: {
    fontWeight: "bold",
  },
  detailsSection: {
    marginTop: 10,
    paddingLeft: 50,
    paddingRight: 10,
    flexGrow: 1,
  },
  detailRow: {
    marginTop: 10,
    flexDirection: "row",
    marginBottom: 6,
    minHeight: 12,
  },
  detailLabel: {
    width: "25%",
    fontWeight: "bold",
    fontSize: 9,
  },
  detailValue: {
    width: "75%",
    fontSize: 9,
  },
  termsTitle: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 9,
  },
  termsText: {
    fontSize: 9,
    lineHeight: 1.3,
    marginBottom: 8,
  },
  footerNote: {
    marginTop: "auto",
    fontSize: 9,
    fontStyle: "italic",
    paddingHorizontal: 10,
    lineHeight: 1.2,
    paddingBottom: 10,
  },
});

const ExportContractPdf = ({ contracts }: { contracts: TContract[] }) => {
  return (
    <Document>
      {contracts.map((contract, index) => (
        <Page key={index} size="A4" style={contractPdfStyles.page}>
          <View style={contractPdfStyles.container}>
            <View style={contractPdfStyles.content}>
              {/* Header */}
              <View style={contractPdfStyles.headerContainer}>
                <View style={contractPdfStyles.header}>
                  <PdfImage
                    src="/Original.png"
                    style={contractPdfStyles.logo}
                  />
                  <View style={contractPdfStyles.headerText}>
                    <Text style={contractPdfStyles.companyName}>
                      GROWTH GRAIN SERVICES
                    </Text>
                    <Text style={contractPdfStyles.abn}>
                      ABN 54 157 832 245
                    </Text>
                  </View>
                </View>
              </View>

              {/* Buyer/Seller Section */}
              <View style={contractPdfStyles.partiesSection}>
                <View style={contractPdfStyles.partyColumn}>
                  <Text style={contractPdfStyles.partyTitle}>Buyer</Text>
                  <Text style={contractPdfStyles.partyText}>
                    {contract.buyer?.name || "N/A"}
                  </Text>
                  <Text style={contractPdfStyles.partyText}>
                    {contract.buyer?.officeAddress || "N/A"}
                  </Text>
                  <Text style={contractPdfStyles.partyText}>
                    ABN : {contract.buyer?.abn || "N/A"}
                  </Text>
                  <Text style={contractPdfStyles.partyText}>
                    Email : {contract?.buyerContact?.email}
                  </Text>
                  <Text style={contractPdfStyles.partyText}>
                    Contact : {contract?.buyerContact?.name}
                  </Text>
                  <Text style={contractPdfStyles.partyText}>
                    {contract.conveyance === "Port Zone"
                      ? `Contract Number : ${contract?.contractNumber}`
                      : `Buyer Contract : ${contract?.contractNumber}`}
                  </Text>
                </View>

                <View style={contractPdfStyles.partyColumn}>
                  <Text style={contractPdfStyles.partyTitle}>Seller</Text>
                  <Text style={contractPdfStyles.partyText}>
                    {contract.seller?.legalName || "N/A"}
                  </Text>
                  <Text style={contractPdfStyles.partyText}>
                    {contract.seller?.address || "N/A"}
                  </Text>
                  <Text style={contractPdfStyles.partyText}>
                    NGR : {contract.ngrNumber || "N/A"}
                  </Text>
                  <Text style={contractPdfStyles.partyText}>
                    Email : {contract.sellerContact?.email}
                  </Text>
                  <Text style={contractPdfStyles.partyText}>
                    Contact : {contract?.sellerContact?.name}{" "}
                    {contract?.sellerContact?.phoneNumber}
                  </Text>
                  <Text style={contractPdfStyles.partyText}>
                    ABN : {contract?.seller?.abn}
                  </Text>
                </View>
              </View>

              {/* Broker Ref Section */}
              <View style={contractPdfStyles.brokerRefSection}>
                <View>
                  <View style={contractPdfStyles.brokerRefContent}>
                    <Text
                      style={[
                        contractPdfStyles.brokerRefItem,
                        contractPdfStyles.boldText,
                      ]}
                    >
                      Broker Ref:
                    </Text>
                    <Text style={contractPdfStyles.brokerRefItem}>
                      {contract.contractNumber || "N/A"}
                    </Text>
                    <Text
                      style={[
                        contractPdfStyles.brokerRefItem,
                        contractPdfStyles.boldText,
                      ]}
                    >
                      Contract Date:
                    </Text>
                    <Text style={contractPdfStyles.brokerRefItem}>
                      {contract.contractDate
                        ? new Date(contract.contractDate)
                            .toISOString()
                            .split("T")[0]
                        : "N/A"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Contract Details - Conditional rendering based on conveyance */}
              <View style={contractPdfStyles.detailsSection}>
                {contract.conveyance === "Port Zone" ? (
                  <>
                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Certification Scheme:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.certificationScheme || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Commodity:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.commodity || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>Season:</Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.season || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Quality:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.grade || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Quantity:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.tonnes || "0"} METRIC TONNES -{" "}
                        {contract.tolerance}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>Price:</Text>
                      <Text style={contractPdfStyles.detailValue}>
                        A${contract?.priceExGST} PER TONNE{" "}
                        {contract.deliveryDestination || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Delivery Period:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
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
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Payment:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.paymentTerms || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Freight:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.freight || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>Weight:</Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.weights || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Terms & Conditions:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.termsAndConditions || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Special Conditions:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.specialCondition?.toUpperCase() || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Brokerage:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        BROKERAGE PAYABLE BY{" "}
                        {contract.brokeragePayableBy?.toUpperCase() || "N/A"} AT
                        A${contract.brokerRate || "0"} PER TONNE (EXCLUSIVE OF
                        GST) INVOICE TO{" "}
                        {contract.brokeragePayableBy?.toUpperCase() || "N/A"} TO
                        BE FORWARDED ON SEPARATELY TO THIS CONTRACT
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Certification Scheme:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.certificationScheme || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Commodity:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.commodity || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>Season:</Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.season || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Quality:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.grade || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Quantity:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.tonnes || "0"} METRIC TONNES -{" "}
                        {contract.tolerance || "NIL"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>Price:</Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.conveyance === "Delivered Site"
                          ? `A$${contract.priceExGST} PER TONNE IN DEPOT ${contract.deliveryDestination}`
                          : contract.conveyance === "Del MZ" ||
                            contract.conveyance === "Del Destination"
                          ? `A$${contract.priceExGST} PER TONNE DELIVERED ${contract.deliveryDestination}`
                          : `A$${contract.priceExGST} PER TONNE ${contract.deliveryDestination}`}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Delivery Period:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
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
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Payment:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.paymentTerms || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Freight:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.freight || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>Weight:</Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.weights || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Terms & Conditions:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.termsAndConditions || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Special Conditions:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        {contract.specialCondition?.toUpperCase() || "N/A"}
                      </Text>
                    </View>

                    <View style={contractPdfStyles.detailRow}>
                      <Text style={contractPdfStyles.detailLabel}>
                        Brokerage:
                      </Text>
                      <Text style={contractPdfStyles.detailValue}>
                        BROKERAGE PAYABLE BY{" "}
                        {contract.brokeragePayableBy?.toUpperCase() || "N/A"} AT
                        A${contract.brokerRate || "0"} PER TONNE (EXCLUSIVE OF
                        GST) INVOICE TO{" "}
                        {contract.brokeragePayableBy?.toUpperCase() || "N/A"} TO
                        BE FORWARDED ON SEPARATELY TO THIS CONTRACT
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Footer Note */}
              <Text style={contractPdfStyles.footerNote}>
                Growth Grain Services as broker does not guarantee the
                performance of this contract. Both the buyer and the seller are
                bound by the above contract and mentioned GTA contracts to
                execute the contract. Seller is responsible for any applicable
                levies/royalties
              </Text>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default ExportContractPdf;
