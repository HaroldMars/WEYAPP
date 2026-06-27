import api from "./client.js";

export const postApi = {
  list: (params = {}) => api.get("/posts", { params }).then((r) => r.data),
  create: (text, file) => {
    const formData = new FormData();
    if (text) formData.append("text", text);
    if (file) formData.append("image", file);
    return api
      .post("/posts", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  toggleLike: (postId) => api.post(`/posts/${postId}/like`).then((r) => r.data),
  addComment: (postId, text) => api.post(`/posts/${postId}/comments`, { text }).then((r) => r.data),
  delete: (postId) => api.delete(`/posts/${postId}`).then((r) => r.data),
};
