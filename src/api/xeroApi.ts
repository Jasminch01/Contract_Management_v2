import axios, { AxiosError } from "axios";
import {
  XeroConnectionStatus,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  XeroErrorResponse,
} from "../types/types";
import { instance } from "./api";

/**
 * Check if Xero is currently connected
 */
export const getXeroConnectionStatus =
  async (): Promise<XeroConnectionStatus> => {
    try {
      const res = await instance.get<XeroConnectionStatus>("/xero/status");
      console.log(res);
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching Xero status:", error.message);
      }
      throw handleXeroError(error);
    }
  };

export const createXeroInvoice = async (
  invoiceData: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> => {
  try {
    const { data } = await instance.post<CreateInvoiceResponse>(
      "/xero/create-invoice",
      invoiceData
    );
    console.log(data);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
    }
    throw handleXeroError(error);
  }
};

export const authorizeXero = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const authUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/xero/authorize`;

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const authWindow = window.open(
      authUrl,
      "Xero Authorization",
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0,scrollbars=1`
    );

    if (!authWindow) {
      return reject(
        new Error("Failed to open authorization window. Please allow popups.")
      );
    }

    // Listen for authorization success/failure message
    const messageListener = (event: MessageEvent) => {
      // Verify origin for security
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_BASE_URL,
        "http://localhost:8000",
        "http://localhost:3000",
        window.location.origin,
      ];

      if (!allowedOrigins.some((origin) => event.origin === origin)) {
        return;
      }

      // Handle success message
      if (
        event.data === "xero_authorized" ||
        event.data?.type === "xero_authorized"
      ) {
        window.removeEventListener("message", messageListener);
        clearInterval(checkAuthWindow);
        clearTimeout(timeoutId);

        // Give the window time to close itself
        setTimeout(() => {
          if (!authWindow.closed) {
            authWindow.close();
          }
          resolve(true);
        }, 100);
      }
      // Handle failure message
      else if (
        event.data === "xero_auth_failed" ||
        event.data?.type === "xero_auth_failed"
      ) {
        window.removeEventListener("message", messageListener);
        clearInterval(checkAuthWindow);
        clearTimeout(timeoutId);

        setTimeout(() => {
          if (!authWindow.closed) {
            authWindow.close();
          }
          reject(new Error(event.data?.message || "Xero authorization failed"));
        }, 100);
      }
    };

    window.addEventListener("message", messageListener);

    // Check if window was closed manually
    const checkAuthWindow = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkAuthWindow);
        clearTimeout(timeoutId);
        window.removeEventListener("message", messageListener);
        reject(new Error("Authorization window was closed"));
      }
    }, 500);

    // Timeout after 5 minutes
    const timeoutId = setTimeout(() => {
      if (!authWindow.closed) {
        authWindow.close();
      }
      clearInterval(checkAuthWindow);
      window.removeEventListener("message", messageListener);
      reject(new Error("Authorization timeout - please try again"));
    }, 5 * 60 * 1000);
  });
};

export const disconnectXero = async (): Promise<void> => {
  try {
    await instance.post("/xero/disconnect");
  } catch (error) {
    console.error("Error disconnecting Xero:", error);
    throw handleXeroError(error);
  }
};

export const handleXeroError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<XeroErrorResponse>;
    const message =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      "An error occurred while communicating with Xero";

    // Check for specific error types
    if (axiosError.response?.status === 401) {
      return new Error("Xero authorization expired. Please reconnect.");
    }
    if (axiosError.response?.status === 403) {
      return new Error(
        "Insufficient permissions to perform this action in Xero."
      );
    }
    if (axiosError.response?.status === 404) {
      return new Error(
        "Xero resource not found. Please check your configuration."
      );
    }

    return new Error(message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("An unexpected error occurred");
};

export const ensureXeroAuthorization = async (): Promise<boolean> => {
  try {
    const status = await getXeroConnectionStatus();

    if (status.connected && status.tenantName) {
      return true;
    }

    // Need to authorize
    return await authorizeXero();
  } catch (error) {
    console.error("Error ensuring Xero authorization:", error);
    return false;
  }
};
