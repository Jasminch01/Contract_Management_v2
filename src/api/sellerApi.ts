import axios, { AxiosResponse } from "axios";
import { instance } from "./api";
import {
  FetchSellersParams,
  Seller,
  SellersPaginatedResponse,
} from "@/types/types";

export const getseller = async (sellerId: string) => {
  try {
    const data = await instance.get(`sellers/${sellerId}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error fetching sellers:", error.message);
    } else {
      console.error("Unexpected error fetching sellers:", error);
    }
    return error;
  }
};

export const getsellers = async (
  params: FetchSellersParams = {}
): Promise<SellersPaginatedResponse> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const response: AxiosResponse<SellersPaginatedResponse> =
      await instance.get(`sellers?${queryParams.toString()}`);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // console.error("Axios error fetching sellers:", error.message);
    } else {
      // console.error("Unexpected error fetching sellers:", error);
    }

    // Return correct empty structure
    return {
      page: 1,
      totalPages: 0,
      total: 0,
      data: [],
    };
  }
};
export const searchSellers = async (query: string): Promise<Seller[]> => {
  console.log(query)
  try {
    if (!query || !query.trim()) {
      return [];
    }

    const { data } = await instance.get<Seller[]>(
      `sellers/search?q=${encodeURIComponent(query.trim())}`
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error searching sellers:", error.message);
    } else {
      console.error("Unexpected error searching sellers:", error);
    }
    return [];
  }
};
export const createSeller = async (newSeller: Seller) => {
  try {
    const data = await instance.post(`sellers`, newSeller);
    return data;
  } catch (error) {
    return error;
  }
};

export const updateSeller = async (
  updatedSellerData: Seller,
  sellerId: string
) => {
  try {
    const data = await instance.put(`sellers/${sellerId}`, updatedSellerData);
    return data;
  } catch (error) {
    return error;
  }
};

export const moveSelllersToTrash = async (
  buyerIds: string[]
): Promise<void> => {
  try {
    if (buyerIds.length === 0) return;

    await Promise.all(
      buyerIds.map((id) => instance.patch(`sellers/${id}/trash`))
    );
  } catch (error) {
    console.error("Move to trash error:", error);
    throw error;
  }
};
