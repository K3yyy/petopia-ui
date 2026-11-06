import { request, query } from "./api-client";
export const petService = {
  list: (params) => request("get", "/pets", null, query(params)),
  get: (id) => request("get", `/pets/${id}`),
  mine: (params) => request("get", "/pets/mine", null, query(params)),
  create: (body) => request("post", "/pets", body),
  update: (id, body) => request("patch", `/pets/${id}`, body),
  remove: (id) => request("delete", `/pets/${id}`),
};
