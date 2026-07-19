import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("banhang_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("banhang_token");
      localStorage.removeItem("banhang_user");
      window.dispatchEvent(new Event("banhang-auth-expired"));
    }
    return Promise.reject(error);
  },
);

export const errorMessage = (error) => {
  const details = error.response?.data?.details;
  if (details && typeof details === "object") return Object.values(details)[0];
  return error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.";
};

export default api;
