import { request } from "./api-client";
export const petMediaService = {
  list: (id) => request("get", `/pets/${id}/media`),
  upload: (id, file) => {
    const form = new FormData();
    form.append("file", file);
    return request("post", `/pets/${id}/media`, form);
  },
  remove: (id) => request("delete", `/pet-media/${id}`),
  primary: (id) => request("patch", `/pet-media/${id}/primary`),
};
