import api from "./client.js";

export const conversationApi = {
  list: () => api.get("/conversations").then((r) => r.data),
  createOrGet: (userId) => api.post("/conversations", { userId }).then((r) => r.data),
  getMessages: (conversationId) =>
    api.get(`/conversations/${conversationId}/messages`).then((r) => r.data),
};

export const messageApi = {
  sendImage: (conversationId, file) => {
    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("image", file);
    return api
      .post("/messages/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
