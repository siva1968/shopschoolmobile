export enum API_TYPE {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  PUT = "PUT",
  DELETE = "DELETE",
}

export enum Route {
  signIn = "/",
  account = "/account",
  profile = "/profile",
  orders = "/orders",
  cart = "/cart",
  shop = "/shop",
  aboutUs = "/about-us",
  privacyPolicy = "/privacy-policy",
  termsConditions = "/terms-conditions",
  returnRefundPolicy = "/return-refund-policy",
  // Dynamic routes (use with template literals)
  shopKit = "/shop/:id/kit", // Use as `/shop/${id}/kit`
  shopUniform = "/shop/:id/uniform", // Use as `/shop/${id}/uniform`
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
