import api from "./client.js";

export const conversationApi = {
  list: () => api.get("/conversations").then((r) => r.data),
  createOrGet: (userId) => api.post("/conversations", { userId }).then((r) => r.data),
  createGroup: (name, memberIds) =>
    api.post("/conversations/group", { name, memberIds }).then((r) => r.data),
  getDetails: (conversationId) => api.get(`/conversations/${conversationId}`).then((r) => r.data),
  getSharedMedia: (conversationId) => api.get(`/conversations/${conversationId}/media`).then((r) => r.data),
  getMessages: (conversationId) =>
    api.get(`/conversations/${conversationId}/messages`).then((r) => r.data),
  deleteMessage: (conversationId, messageId, mode) =>
    api
      .delete(`/conversations/${conversationId}/messages/${messageId}`, { data: { mode } })
      .then((r) => r.data),
  updateGroupInfo: (conversationId, { name, avatarFile }) => {
    const formData = new FormData();
    if (name !== undefined) formData.append("name", name);
    if (avatarFile) formData.append("avatar", avatarFile);
    return api
      .put(`/conversations/${conversationId}/group`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  addMember: (conversationId, userId) =>
    api.post(`/conversations/${conversationId}/members`, { userId }).then((r) => r.data),
  removeMember: (conversationId, userId) =>
    api.delete(`/conversations/${conversationId}/members/${userId}`).then((r) => r.data),
  promoteToAdmin: (conversationId, userId) =>
    api.post(`/conversations/${conversationId}/admins/${userId}`).then((r) => r.data),
  demoteAdmin: (conversationId, userId) =>
    api.delete(`/conversations/${conversationId}/admins/${userId}`).then((r) => r.data),
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
