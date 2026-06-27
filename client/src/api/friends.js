import api from "./client.js";

export const friendApi = {
  list: () => api.get("/friends").then((r) => r.data),
  listIncomingRequests: () => api.get("/friends/requests").then((r) => r.data),
  sendRequest: (userId) => api.post("/friends/request", { userId }).then((r) => r.data),
  acceptRequest: (requestId) => api.post(`/friends/requests/${requestId}/accept`).then((r) => r.data),
  declineRequest: (requestId) => api.post(`/friends/requests/${requestId}/decline`).then((r) => r.data),
};
