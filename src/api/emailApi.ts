/* eslint-disable @typescript-eslint/no-explicit-any */
import { instance } from "./api";

interface OutlookStatusResponse {
  connected: boolean;
}

export const getOutlookConnectionStatus =
  async (): Promise<OutlookStatusResponse> => {
    const res = await instance.get<OutlookStatusResponse>("/outlook/status");
    return res.data; // FIX: Return res.data instead of res
  };

export const initiateOutlookAuth = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Get the base URL - remove trailing slash if present
    const baseURL = instance.defaults.baseURL?.replace(/\/$/, "") || "";

    // Open OAuth in popup
    const width = 700;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Construct the auth URL - make sure there's a slash between baseURL and path
    const authUrl = `${baseURL}/outlook/auth`;

    console.log("Opening OAuth window:", authUrl);

    const authWindow = window.open(
      authUrl,
      "Outlook OAuth",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    if (!authWindow) {
      reject(
        new Error(
          "Failed to open OAuth window. Please allow popups and try again."
        )
      );
      return;
    }

    // Listen for OAuth completion
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message:", event.data);

      if (event.data?.type === "outlook_auth_success") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        authWindow?.close();
        resolve(true);
      } else if (event.data?.type === "outlook_auth_error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        authWindow?.close();
        reject(new Error(event.data.error || "OAuth authorization failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    // Check if window was closed before completion
    const checkClosed = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("OAuth window was closed before completion"));
      }
    }, 500);

    // Timeout after 5 minutes
    setTimeout(() => {
      if (authWindow && !authWindow.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        authWindow.close();
        reject(new Error("OAuth timeout - please try again"));
      }
    }, 5 * 60 * 1000);
  });
};

interface SendContractEmailRequest {
  recipients: string[];
  recipientType: "buyer" | "seller";
  contracts: any[];
  additionalText: string;
  pdf: Blob;
}

interface SendContractEmailResponse {
  success: boolean;
  message: string;
}

export const sendContractEmail = async (
  data: SendContractEmailRequest
): Promise<SendContractEmailResponse> => {
  try {
    const formData = new FormData();
    formData.append(
      "pdf",
      data.pdf,
      `contracts_${data.recipientType}_${Date.now()}.pdf`
    );
    formData.append("recipients", JSON.stringify(data.recipients));
    formData.append("recipientType", data.recipientType);
    formData.append("contracts", JSON.stringify(data.contracts));
    formData.append("additionalText", data.additionalText || "");

    const response = await instance.post<SendContractEmailResponse>(
      "/outlook/send",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to send email"
    );
  }
};
