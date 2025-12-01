/* eslint-disable @typescript-eslint/ban-ts-comment */
import { TContract } from "@/types/types";
import { CSVLink } from "react-csv";
import { IoDocumentText } from "react-icons/io5";

interface ExportCSVButtonProps {
  selectedRows: TContract[];
}

const ExportCsv: React.FC<ExportCSVButtonProps> = ({ selectedRows }) => {
  // Method 1: Transform the data to flatten nested properties
  const transformedData = selectedRows.map((row) => ({
    contractNumber: row.contractNumber,
    season: row?.season || "",
    ngr: row.ngrNumber || "",
    grower: row?.seller?.legalName || "",
    tonnes: row.tonnes,
    buyer: row.buyer?.name || "",
    destination: row.deliveryDestination || "",
    priceExGst: `A$${row?.priceExGST}`,
    status: row.status,
    notes: row.notes || "",
  }));

  const headers = [
    { label: "CONTRACT NUMBER", key: "contractNumber" },
    { label: "SEASON", key: "season" },
    { label: "NGR", key: "ngr" },
    { label: "GROWER", key: "grower" },
    { label: "TONNES", key: "tonnes" },
    { label: "BUYER", key: "buyer" },
    { label: "DESTINATION", key: "destination" },
    { label: "CONTRACT PRICE", key: "priceExGst" },
    { label: "STATUS", key: "status" },
    { label: "NOTES", key: "notes" },
  ];

  return (
    // @ts-expect-error
    <CSVLink
      data={transformedData}
      headers={headers}
      filename={`contracts-export-${new Date().toISOString().slice(0, 10)}.csv`}
      className={`w-full md:w-auto px-3 py-2 border border-gray-200 rounded flex items-center justify-center gap-2 text-sm hover:bg-gray-100 transition-colors ${
        selectedRows.length > 0
          ? "cursor-pointer"
          : "cursor-not-allowed opacity-50 pointer-events-none"
      }`}
      target="_blank"
    >
      <IoDocumentText className="text-gray-700" />
      <span>Export as CSV</span>
    </CSVLink>
  );
};

export default ExportCsv;
