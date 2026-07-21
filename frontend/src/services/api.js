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
  if (typeof error.response?.data === "string" && error.response.data.trim()) {
    return `Máy chủ trả về lỗi ${error.response.status}. Vui lòng kiểm tra backend đã restart đúng phiên bản mới.`;
  }
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.status) return `Có lỗi xảy ra từ máy chủ (HTTP ${error.response.status}).`;
  return "Không kết nối được backend. Vui lòng kiểm tra backend đang chạy.";
};

export default api;
