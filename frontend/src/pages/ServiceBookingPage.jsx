import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { Icon } from "../components/Icons";
import { useAuth } from "../contexts/AuthContext";

const serviceOptions = [
  "Lắp đặt máy lọc",
  "Kiểm tra nguồn nước",
  "Thay lõi lọc",
  "Sửa chữa máy lọc",
  "Bảo trì định kỳ",
];

export default function ServiceBookingPage() {
  const { user } = useAuth();
  const [serviceForm, setServiceForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    serviceType: serviceOptions[0],
    preferredTime: "",
    note: "",
  });
  const [serviceStatus, setServiceStatus] = useState({ loading: false, message: "", error: "" });

  useEffect(() => {
    if (!user) return;
    setServiceForm((current) => ({
      ...current,
      fullName: current.fullName || user.fullName || "",
      phone: current.phone || user.phone || "",
    }));
    api.get("/users/me/addresses")
      .then((response) => {
        const addresses = Array.isArray(response.data) ? response.data : [];
        const address = addresses.find((item) => item.defaultAddress) || addresses[0];
        if (!address) return;
        const fullAddress = [address.addressLine, address.ward, address.district, address.province]
          .filter(Boolean)
          .join(", ");
        setServiceForm((current) => ({
          ...current,
          address: current.address || fullAddress,
          phone: current.phone || address.phone || user.phone || "",
          fullName: current.fullName || address.recipientName || user.fullName || "",
        }));
      })
      .catch(() => {});
  }, [user]);

  const updateServiceForm = (key, value) => {
    setServiceForm((current) => ({ ...current, [key]: value }));
  };

  const submitServiceRequest = async (event) => {
    event.preventDefault();
    setServiceStatus({ loading: true, message: "", error: "" });
    try {
      await api.post("/service-requests", serviceForm);
      setServiceStatus({
        loading: false,
        message: "Đã gửi yêu cầu. Minh Phát sẽ liên hệ xác nhận lịch trong thời gian sớm nhất.",
        error: "",
      });
      setServiceForm((current) => ({ ...current, preferredTime: "", note: "" }));
    } catch (error) {
      setServiceStatus({ loading: false, message: "", error: errorMessage(error) });
    }
  };

  return (
    <div className="page-section container">
      <div className="page-heading">
        <span className="eyebrow">DỊCH VỤ TẬN NHÀ</span>
        <h1>Đặt lịch kỹ thuật viên</h1>
        <p>Gửi yêu cầu kiểm tra, sửa chữa, lắp đặt hoặc bảo trì. Admin sẽ thấy yêu cầu này trong màn hình quản trị.</p>
      </div>

      <div className="service-booking-layout">
        <aside className="service-booking-side">
          <article>
            <Icon name="tool" />
            <h3>Lắp đặt và sửa chữa</h3>
            <p>Kỹ thuật viên kiểm tra tình trạng thực tế trước khi xử lý.</p>
          </article>
          <article>
            <Icon name="droplet" />
            <h3>Tư vấn nguồn nước</h3>
            <p>Gợi ý lõi lọc và thiết bị phù hợp với nhu cầu gia đình.</p>
          </article>
          <article>
            <Icon name="calendar" />
            <h3>Theo dõi tiến độ</h3>
            <p>Admin cập nhật trạng thái: đã liên hệ, đã hẹn lịch, hoàn tất.</p>
          </article>
        </aside>

        <form className="service-booking-form service-booking-page-form" onSubmit={submitServiceRequest}>
          <div>
            <span className="eyebrow">THÔNG TIN ĐẶT LỊCH</span>
            <h3>{user ? "Kiểm tra lại thông tin trước khi gửi" : "Đăng nhập để đặt lịch"}</h3>
            <p>{user ? "Thông tin tài khoản và địa chỉ mặc định sẽ được điền sẵn nếu có." : "Bạn cần đăng nhập để hệ thống lưu yêu cầu và admin xử lý."}</p>
          </div>

          <div className="service-form-grid">
            <label>
              Họ và tên
              <input
                required
                value={serviceForm.fullName}
                onChange={(event) => updateServiceForm("fullName", event.target.value)}
                placeholder="Nguyễn Văn A"
                disabled={!user || serviceStatus.loading}
              />
            </label>
            <label>
              Số điện thoại
              <input
                required
                value={serviceForm.phone}
                onChange={(event) => updateServiceForm("phone", event.target.value)}
                placeholder="0977..."
                disabled={!user || serviceStatus.loading}
              />
            </label>
            <label>
              Dịch vụ cần hỗ trợ
              <select
                value={serviceForm.serviceType}
                onChange={(event) => updateServiceForm("serviceType", event.target.value)}
                disabled={!user || serviceStatus.loading}
              >
                {serviceOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Thời gian mong muốn
              <input
                value={serviceForm.preferredTime}
                onChange={(event) => updateServiceForm("preferredTime", event.target.value)}
                placeholder="Ví dụ: Sáng thứ 7"
                disabled={!user || serviceStatus.loading}
              />
            </label>
            <label className="wide">
              Địa chỉ
              <input
                required
                value={serviceForm.address}
                onChange={(event) => updateServiceForm("address", event.target.value)}
                placeholder="Số nhà, phường/xã, quận/huyện, tỉnh/thành"
                disabled={!user || serviceStatus.loading}
              />
            </label>
            <label className="wide">
              Ghi chú
              <textarea
                value={serviceForm.note}
                onChange={(event) => updateServiceForm("note", event.target.value)}
                placeholder="Mô tả tình trạng máy, nguồn nước hoặc yêu cầu thêm..."
                disabled={!user || serviceStatus.loading}
              />
            </label>
          </div>

          {serviceStatus.message && <div className="form-success">{serviceStatus.message}</div>}
          {serviceStatus.error && <div className="form-error">{serviceStatus.error}</div>}

          <div className="service-form-actions">
            {user ? (
              <button className="btn btn-primary" disabled={serviceStatus.loading}>
                {serviceStatus.loading ? "Đang gửi..." : "Gửi yêu cầu đặt lịch"}
              </button>
            ) : (
              <Link className="btn btn-primary" to="/dang-nhap">Đăng nhập để đặt lịch</Link>
            )}
            <a className="btn btn-soft" href="tel:0977148627">Gọi hotline</a>
          </div>
        </form>
      </div>
    </div>
  );
}
