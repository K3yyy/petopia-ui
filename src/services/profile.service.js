import { query, request } from "./api-client";
export const profileService = {
  search: (name) =>
    request("get", "/profiles/search", null, query({ q: name })),
  me: () => request("get", "/profiles/me"),
  update: (body) => request("patch", "/profiles/me", body),
  verify: (body) => request("post", "/profiles/seller-verification", body),
  decide: (id, status) =>
    request("patch", `/profiles/${id}/verification`, { status }),
};
