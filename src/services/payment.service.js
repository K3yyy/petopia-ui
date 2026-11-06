import { request, query } from "./api-client";
export const paymentService = {
  create: (body) => request("post", "/payments", body),
  get: (id) => request("get", `/payments/${id}`),
  mine: (params) => request("get", "/payments/mine", null, query(params)),
  seller: (params) => request("get", "/payments/seller", null, query(params)),
  verify: (id) => request("post", `/payments/${id}/verify`),
  confirmCash: (id) => request("post", `/payments/${id}/confirm-cash`),
};
