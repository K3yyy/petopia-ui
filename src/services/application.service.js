import { request, query } from "./api-client";
export const applicationService = {
  mine: (params) => request("get", "/applications", null, query(params)),
  forPet: (id, params) =>
    request("get", `/pets/${id}/applications/list`, null, query(params)),
  get: (id) => request("get", `/applications/${id}`),
  apply: (id, message) =>
    request("post", `/pets/${id}/applications`, { message }),
  status: (id, status) =>
    request("patch", `/applications/${id}/status`, { status }),
};
