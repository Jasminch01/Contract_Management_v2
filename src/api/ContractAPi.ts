import { FetchContractsParams, TContract, TUpdateContract } from "@/types/types";
import { instance } from "./api";
import axios, { AxiosResponse } from "axios";

export const createContract = async (contract: TUpdateContract) => {
  try {
    const res = await instance.post("contracts", contract);
    return res;
  } catch (error) {
    // console.log(error);
    throw error;
  }
};

// API functions
interface ContractsPaginatedResponse {
  page: number;
  totalPages: number;
  total: number;
  data: TContract[];
}


export const fetchContracts = async (
  params: FetchContractsParams = {}
): Promise<ContractsPaginatedResponse> => {
  try {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const response: AxiosResponse<ContractsPaginatedResponse> = await instance.get(
      `contracts?${queryParams.toString()}`
    );
    console.log(response.data)
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error fetching contracts:", error.message);
    } else {
      console.error("Unexpected error fetching contracts:", error);
    }

    return {
      page: 1,
      totalPages: 0,
      total: 0,
      data: [],
    };
  }
};

//fetch contract
export const fetchContract = async (id: string) => {
  try {
    const contract = await instance.get(`/contracts/${id}`);
    return contract;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error fetching buyers:", error.message);
    } else {
      console.error("Unexpected error fetching buyers:", error);
    }
    return {};
  }
};

export const updateContract = async (
  updatedContract: TUpdateContract,
  id: string
): Promise<TContract> => {
  // Replace 'any' with your actual contract response type
  try {
    const response = await instance.put(`/contracts/${id}`, updatedContract);
    return response.data; // Return the actual data, not the full axios response
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error update contract:", error.message);
    } else {
      console.error("Unexpected error update contract:", error);
    }
    // Throw the error so React Query can handle it properly
    throw error;
  }
};

export const moveContractToTrash = async (
  buyerIds: string[]
): Promise<void> => {
  try {
    if (buyerIds.length === 0) return;

    await Promise.all(
      buyerIds.map((id) => instance.patch(`contracts/${id}/trash`))
    );
  } catch (error) {
    console.error("Move to trash error:", error);

    throw error;
  }
};
