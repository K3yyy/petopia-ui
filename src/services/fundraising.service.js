import { request, query } from "./api-client";
export const fundraisingService = {
  list: (params) => request("get", "/campaigns", null, query(params)),
  get: (id) => request("get", `/campaigns/${id}`),
  progress: (id) => request("get", `/campaigns/${id}/progress`),
  donations: (id) => request("get", `/campaigns/${id}/donations`),
  create: (body) => request("post", "/campaigns", body),
  update: (id, body) => request("patch", `/campaigns/${id}`, body),
  submit: (id) => request("post", `/campaigns/${id}/submit`),
  review: (id, status) =>
    request("patch", `/campaigns/${id}/review`, { status }),
};
