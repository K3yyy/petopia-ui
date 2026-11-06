import { request, query } from "./api-client";
export const lostFoundService = {
  list: (params) => request("get", "/reports", null, query(params)),
  get: (id) => request("get", `/reports/${id}`),
  create: (body) => request("post", "/reports", body),
  update: (id, body) => request("patch", `/reports/${id}`, body),
  status: (id, status) => request("patch", `/reports/${id}/status`, { status }),
  remove: (id) => request("delete", `/reports/${id}`),
  image: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return request("post", `/reports/${id}/image`, form);
  },
};
