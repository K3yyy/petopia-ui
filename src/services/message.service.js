import { request, query } from "./api-client";
export const messageService = {
  conversations: () => request("get", "/messages/conversations"),
  unread: () => request("get", "/messages/unread-count"),
  conversation: (userId, params) =>
    request("get", `/messages/${userId}`, null, query(params)),
  send: (body) => request("post", "/messages", body),
  read: (id) => request("patch", `/messages/${id}/read`),
  remove: (id) => request("delete", `/messages/${id}`),
};
