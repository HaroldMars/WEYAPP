import api from "./client.js";

export const userApi = {
  list: (search = "") => api.get("/users", { params: { search } }).then((r) => r.data),
  getById: (id) => api.get(`/users/${id}`).then((r) => r.data),
  updateProfile: (data) => api.put("/users/me", data).then((r) => r.data),
  updateAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api
      .post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
