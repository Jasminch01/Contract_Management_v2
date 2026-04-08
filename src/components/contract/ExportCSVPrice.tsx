/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useEffect } from "react";
import { CSVLink } from "react-csv";

// Types
interface CSVHeader {
  label: string;
  key: string;
}

interface DeliverdBid {
  location: string;
}

interface PortZone {
  port: string;
}

interface HistoricalPrice {
  id: string;
  portZones: PortZone[];
  [key: string]: string | PortZone[];
}

interface DeliverdBids {
  id: string;
  locations: DeliverdBid[];
  [key: string]: string | DeliverdBid[];
}

type ExportData = HistoricalPrice | DeliverdBids;

interface ExportCSVButtonProps {
  data: ExportData[];
  keys: string[];
  filename: string;
  disabled?: boolean;
  isPortZoneData?: boolean;
}

const ExportCSVPrice: React.FC<ExportCSVButtonProps> = ({
  data,
  keys,
  filename,
  disabled: externalDisabled,
  isPortZoneData = true,
}) => {
  const [isDisabled, setIsDisabled] = useState(true);
  const [hasData, setHasData] = useState(false);

  // Check if data is valid and not empty
  useEffect(() => {
    if (!data || data.length === 0) {
      setHasData(false);
      setIsDisabled(true);
      return;
    }

    // Check if any row has actual data
    const hasValidData = data.some((row) => {
      // For port zone data, check if any grain type key has a value
      if (isPortZoneData) {
        return keys.some(
          (key) =>
            typeof row[key] === "string" && (row[key] as string).trim() !== ""
        );
      }
      // For delivered bids, check if any month key has a value
      else {
        return keys.some(
          (key) =>
            typeof row[key] === "string" && (row[key] as string).trim() !== ""
        );
      }
    });

    setHasData(hasValidData);
    setIsDisabled(externalDisabled || !hasValidData);
  }, [data, keys, externalDisabled, isPortZoneData]);
  // Headers
  const headers: CSVHeader[] = isPortZoneData
    ? [
        { label: "Port Zone", key: "portzone" },
        ...keys.map((key) => ({
          label: key.toUpperCase(),
          key,
        })),
      ]
    : [
        { label: "Location", key: "location" },
        ...keys.map((key) => ({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          key,
        })),
      ];

  // Construct CSV data
  const csvData: Record<string, string>[] = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((row) => {
      try {
        if (isPortZoneData) {
          const historical = row as HistoricalPrice;
          // Check if portZones exists and is an array before mapping
          const portZone =
            historical.portZones && Array.isArray(historical.portZones)
              ? historical.portZones.map((zone) => zone.port).join(", ")
              : "";

          const rowData: Record<string, string> = { portzone: portZone };
          keys.forEach((key) => {
            rowData[key] =
              typeof historical[key] === "string"
                ? (historical[key] as string)
                : "";
          });
          return rowData;
        } else {
          const delivered = row as DeliverdBids;
          // Check if locations exists and is an array before mapping
          const locations =
            delivered.locations && Array.isArray(delivered.locations)
              ? delivered.locations.map((loc) => loc.location).join(", ")
              : "";

          const rowData: Record<string, string> = {
            location: locations,
          };
          keys.forEach((key) => {
            rowData[key] =
              typeof delivered[key] === "string"
                ? (delivered[key] as string)
                : "";
          });
          return rowData;
        }
      } catch (error) {
        console.error("Error processing row:", row, error);
        return { error: "Error processing data" };
      }
    });
  }, [data, keys, isPortZoneData]);

  return (
    <>
      {hasData ? (
        <CSVLink
          data={csvData}
          headers={headers}
          filename={filename}
          className={`flex items-center gap-2 px-2 py-1 border border-gray-300 rounded-md text-gray-700 ${
            isDisabled
              ? "bg-gray-100 cursor-not-allowed opacity-50"
              : "bg-white hover:bg-gray-50 cursor-pointer"
          }`}
          target="_blank"
          style={isDisabled ? { pointerEvents: "none" } : undefined}
        >
          Export as CSV
        </CSVLink>
      ) : (
        <button
          disabled
          className="flex items-center gap-2 px-2 py-1 border border-gray-300 rounded-md text-gray-700 bg-gray-100 cursor-not-allowed opacity-50"
        >
          Export as CSV
        </button>
      )}
    </>
  );
};

export default ExportCSVPrice;
