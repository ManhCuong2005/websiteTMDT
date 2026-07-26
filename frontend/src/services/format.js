const currentLocale = () =>
  document.documentElement.lang === "en" ? "en-US" : "vi-VN";

export const money = (value = 0) => new Intl.NumberFormat(currentLocale(), {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
}).format(Number(value || 0));

export const dateTime = (value) => value
  ? new Intl.DateTimeFormat(currentLocale(), { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
  : "—";

export const statusLabel = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PACKING: "Đang đóng gói",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};
