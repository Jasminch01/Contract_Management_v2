export interface HistoricalPrice {
  id: string;
  commodity: string;
  date: string;
  price: number;
  quality: string;
  comment?: string; // Optional field
}

export interface ContractType {
  id: number;
  name: string;
}

export type BrokeragePayableOption = {
  name: string;
  value: string;
};

export interface ConveyanceOption {
  id: number;
  value: string;
  label: string;
}

export interface TrashData {
  buyers: Buyer[];
  sellers: Seller[];
  contracts: TContract[];
}

export interface HistoricalPricesData {
  historical_prices: HistoricalPrice[];
}

export interface PortZoneBid {
  _id?: string;
  label:
    | "Outer Harbor"
    | "Port Lincoln"
    | "Port Giles"
    | "Wallaroo"
    | "Lucky Bay"
    | "Thevenard"
    | "Wallaroo Tports";
  season: string;

  // Bid types - matching backend schema exactly
  APW1: number | null;
  H1: number | number | null;
  H2: number | null;
  AUH2: number | null;
  ASW1: number | null;
  AGP1: number | null;
  SFW1: number | null;
  BAR1: number | null;
  MA1: number | null;
  CM1: number | null;
  COMD: number | null;
  CANS: number | null;
  FIEV: number | null;
  "NIP/HAL": number | null;
  // Timestamps (handled by MongoDB)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContactDetails {
  name: string;
  email: string;
  phoneNumber: string;
  isPrimary? : boolean;
}

export interface Buyer {
  _id?: string;
  name: string;
  abn: string;
  officeAddress: string;
  accountNumber: string;
  contacts: ContactDetails[]; // New field for contact details
  email: string; // Main buyer email
  phoneNumber: string; // Main buyer phone
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ContractStatus = "Draft" | "Incomplete" | "Complete" | "Invoiced";

// For the array of contracts

export type BulkHandlerName =
  | "Viterra"
  | "Graincorp"
  | "GrainFlow"
  | "Tports"
  | "CBH"
  | "Louis Dreyfus";

export type BulkHandlerCredential = {
  handlerName: BulkHandlerName;
  identifier: string;
  password: string;
};

export interface Seller {
  _id?: string;
  legalName: string;
  abn?: string;
  additionalNgrs?: string[];
  accountNumber?: string;
  email?: string;
  authorityToAct?: string;
  address?: string;
  mainNgr?: string;
  contactName: ContactDetails[];
  locationZone?: string[];
  phoneNumber?: string;
  authorityActFormPdf?: string;
  bulkHandlerCredentials: BulkHandlerCredential[];
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TContract {
  _id?: string;
  buyerContractReference: string;
  sellerContractReference: string;
  grade: string;
  buyer: Buyer;
  seller: Seller;
  contractType: string;
  deliveryOption: string;
  deliveryPeriod: {
    start: string;
    end: string;
  };
  freight: string;
  weights: string;
  priceExGST: string;
  conveyance: string;
  attachedSellerContract?: string;
  attachedBuyerContract?: string;
  commodity: string;
  certificationScheme: string;
  paymentTerms: string;
  brokerRate: string;
  deliveryDestination: string;
  brokeragePayableBy: string;
  specialCondition: string;
  termsAndConditions: string;
  notes: string;
  ngrNumber?: string;
  buyerContact?: ContactDetails;
  sellerContact?: ContactDetails;
  tonnes: string;
  tolerance: string;
  season: string;
  isDeleted: boolean;
  deletedAt: string;
  status: string;
  createdAt: string; // or Date if you'll parse it
  contractNumber: string;
  xeroInvoiceId: string;
  xeroInvoiceNumber: string;
  contractDate: string; // Added contractDate
}
export interface TUpdateContract {
  _id?: string;
  contractNumber: string;
  buyerContractReference: string;
  sellerContractReference: string;
  grade: string;
  buyer: string;
  seller: string;
  contractType: string;
  deliveryOption: string;
  deliveryPeriod: {
    start: string;
    end: string;
  };
  freight: string;
  weights: string;
  priceExGST: string;
  conveyance: string;
  attachedSellerContract?: string;
  attachedBuyerContract?: string;
  commodity: string;
  certificationScheme: string;
  paymentTerms: string;
  brokerRate: string;
  deliveryDestination: string;
  brokeragePayableBy: string;
  specialCondition: string;
  termsAndConditions: string;
  notes: string;
  tonnes: string;
  ngrNumber?: string;
  buyerContact?: ContactDetails;
  sellerContact?: ContactDetails;
  tolerance: string;
  season: string;
  status?: string;
  contractDate: string;
}

export interface FetchContractsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";

  // Specific field filters for AdvanceSearchFilter
  contractNumber?: string;
  ngrNumber?: string;
  commodity?: string;
  sellerName?: string;
  buyerName?: string;
  grade?: string;
  tonnes?: string;

  // Add any other filter parameters your API supports
  season?: string;
  buyerId?: string;
  sellerId?: string;
  dateFrom?: string;
  dateTo?: string;
  deliveryDestination?: string;
  priceFrom?: number;
  priceTo?: number;
}

export interface ContractsPaginatedResponse {
  page: number;
  totalPages: number;
  total: number;
  data: TContract[];
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  limit?: number;
}

// Types
export interface FetchBuyersParams {
  page?: number;
  limit?: number;
  name?: string;
  abn?: string;
  contactName?: string;
  email?: string;
  phoneNumber?: string;
  dateFilter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface BuyersPaginatedResponse {
  page: number;
  totalPages: number;
  total: number;
  data: Buyer[];
}

export interface FetchSellersParams {
  page?: number;
  limit?: number;
  legalName?: string;
  abn?: string;
  contactName?: string;
  email?: string;
  phoneNumber?: string;
  dateFilter?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SellersPaginatedResponse {
  page: number;
  totalPages: number;
  total: number;
  data: Seller[];
}

// Add these types to your types/types.ts file

export interface XeroConnectionStatus {
  connected: boolean;
  tenantName: string ;
  connectedAt: string;
}

export interface CreateInvoiceRequest {
  contractIds: string[];
  invoiceDate: string;
  dueDate: string;
  reference: string;
  notes: string;
}

export interface XeroInvoiceLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode?: string;
  taxType?: string;
  lineAmount?: number;
}

export interface XeroContact {
  contactID?: string;
  name: string;
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
}

export interface XeroInvoice {
  invoiceID?: string;
  invoiceNumber?: string;
  type: "ACCREC" | "ACCPAY";
  contact: XeroContact;
  date: string;
  dueDate: string;
  lineItems: XeroInvoiceLineItem[];
  reference?: string;
  status?: "DRAFT" | "SUBMITTED" | "AUTHORISED" | "PAID";
  lineAmountTypes?: "Exclusive" | "Inclusive" | "NoTax";
  subTotal?: number;
  totalTax?: number;
  total?: number;
  currencyCode?: string;
}

export interface CreateInvoiceResponse {
  isUpdate: boolean;
  success: boolean;
  message: string;
  data?: {
    invoiceId: string;
    invoiceNumber: string;
    xeroUrl: string;
    invoice: XeroInvoice;
    isUpdate : boolean;
  };
}

export interface XeroErrorResponse {
  success: false;
  message: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
}

export interface XeroAuthorizationState {
  isAuthorizing: boolean;
  isConnected: boolean;
  error?: string;
}
