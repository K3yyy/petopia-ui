import axios from "axios";
import { getSupabaseAccessToken } from "@/lib/supabase";

const statusMessages = {
  400: "The request contains invalid fields.",
  401: "Your session is invalid or has expired. Please sign in again.",
  403: "Your account is not allowed to perform this action.",
  404: "The requested record was not found.",
  409: "This action conflicts with the current record state.",
  422: "The submitted information did not pass validation.",
  429: "Too many requests. Please wait and try again.",
  500: "The server could not complete the request.",
};

export class ApiError extends Error {
  constructor(message, { status, code, data, cause } = {}) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { Accept: "application/json" },
});
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const token = await getSupabaseAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (!body || typeof body.success !== "boolean" || !("data" in body))
      throw new ApiError("The API returned an unexpected response.", {
        status: response.status,
        data: body,
      });
    if (!body.success)
      throw new ApiError(body.message || "The API rejected the request.", {
        status: response.status,
        data: body.data,
      });
    return body;
  },
  (error) => {
    const status = error.response?.status;
    const hadBearerToken = Boolean(
      error.config?.headers?.Authorization ||
      error.config?.headers?.authorization,
    );
    if (status === 401 && hadBearerToken && typeof window !== "undefined") {
      localStorage.removeItem("petopia.accessToken");
      localStorage.removeItem("petopia.refreshToken");
      window.dispatchEvent(new Event("petopia:session-expired"));
    }
    const message =
      error.response?.data?.message ||
      statusMessages[status] ||
      (status
        ? `The API request failed (${status}).`
        : "Unable to reach Petopia API.");
    return Promise.reject(
      new ApiError(message, {
        status,
        code: error.response?.data?.code,
        data: error.response?.data?.data,
        cause: error,
      }),
    );
  },
);
export const request = (method, path, data, config) =>
  api({ method, url: path, data, ...config });
export const query = (params = {}) => ({ params });
