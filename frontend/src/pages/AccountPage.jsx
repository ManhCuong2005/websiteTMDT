import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { dateTime, money, statusLabel } from "../services/format";
import { Icon } from "../components/Icons";

export default function AccountPage() {
  const { user, setUser, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    avatarUrl: user.avatarUrl || "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [addressForm, setAddressForm] = useState({
    recipientName: user.fullName || "",
    phone: user.phone || "",
    addressLine: "",
    ward: "",
    district: "",
    province: "",
    defaultAddress: false,
  });

  const loadOrders = () =>
    api
      .get("/orders/my")
      .then((r) => setOrders(r.data))
      .catch(() => {});
  const loadAddresses = () =>
    api
      .get("/users/me/addresses")
      .then((r) => setAddresses(r.data))
      .catch(() => {});
  useEffect(() => {
    loadOrders();
    loadAddresses();
  }, []);

  const syncUser = (next) => {
    setUser(next);
    localStorage.setItem("banhang_user", JSON.stringify(next));
    setProfile({
      fullName: next.fullName || "",
      phone: next.phone || "",
      avatarUrl: next.avatarUrl || "",
    });
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Chi chap nhan anh JPG, PNG hoac WEBP");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Hinh anh khong duoc vuot qua 5 MB");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadingAvatar(true);
      const next = (await api.post("/users/me/avatar", formData)).data;
      syncUser(next);
    } catch (error) {
      alert(errorMessage(error));
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const next = (await api.put("/users/me", profile)).data;
      syncUser(next);
      alert("Đã cập nhật thông tin");
    } catch (err) {
      alert(errorMessage(err));
    }
  };
  const addAddress = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users/me/addresses", addressForm);
      setAddressForm({
        recipientName: user.fullName || "",
        phone: user.phone || "",
        addressLine: "",
        ward: "",
        district: "",
        province: "",
        defaultAddress: false,
      });
      loadAddresses();
    } catch (err) {
      alert(errorMessage(err));
    }
  };
  const cancel = async (id) => {
    if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
    try {
      await api.post(`/orders/${id}/cancel`, {
        reason: "Khách hàng thay đổi nhu cầu",
      });
      loadOrders();
    } catch (err) {
      alert(errorMessage(err));
    }
  };
  const removeAddress = async (id) => {
    if (confirm("Xóa địa chỉ này?")) {
      await api.delete(`/users/me/addresses/${id}`);
      loadAddresses();
    }
  };
  const handleLogout = () => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (!confirmed) return;
    logout();
  };

  return (
    <div className="page-section container">
      <div className="account-header">
        <div className="large-avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName || "Avatar"} />
          ) : (
            user.fullName?.charAt(0) || "U"
          )}
        </div>
        <div>
          <span className="eyebrow">TÀI KHOẢN CỦA TÔI</span>
          <h1>{user.fullName}</h1>
          <p>{user.email}</p>
        </div>
      </div>
      <div className="account-layout">
        <aside className="account-tabs">
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
          >
            Đơn hàng của tôi
          </button>
          <button
            className={tab === "profile" ? "active" : ""}
            onClick={() => setTab("profile")}
          >
            Thông tin cá nhân
          </button>
          <button
            className={tab === "addresses" ? "active" : ""}
            onClick={() => setTab("addresses")}
          >
            Sổ địa chỉ
          </button>
          <button
            className={tab === "settings" ? "active" : ""}
            onClick={() => setTab("settings")}
          >
            Cài đặt
          </button>
        </aside>
        <section className="account-panel">
          {tab === "orders" && (
            <>
              <h2>Lịch sử đơn hàng</h2>
              {orders.length ? (
                <div className="order-cards">
                  {orders.map((order) => (
                    <article className="order-card" key={order.id}>
                      <div className="order-card-head">
                        <div>
                          <b>#{order.orderCode}</b>
                          <small>{dateTime(order.createdAt)}</small>
                        </div>
                        <span
                          className={`status status-${order.status.toLowerCase()}`}
                        >
                          {statusLabel[order.status]}
                        </span>
                      </div>
                      <div className="order-products">
                        {order.items.map((item) => (
                          <div key={item.id}>
                            <span>
                              {item.productName} × {item.quantity}
                            </span>
                            <b>{money(item.lineTotal)}</b>
                          </div>
                        ))}
                      </div>
                      <div className="order-card-foot">
                        <span>
                          Giao tới: {order.recipientName} ·{" "}
                          {order.shippingAddress}
                        </span>
                        <div>
                          <strong>{money(order.total)}</strong>
                          {order.status === "PENDING" && (
                            <button
                              className="btn btn-danger-small"
                              onClick={() => cancel(order.id)}
                            >
                              Hủy đơn
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact">
                  Bạn chưa có đơn hàng nào.
                </div>
              )}
            </>
          )}
          {tab === "profile" && (
            <>
              <h2>Thông tin cá nhân</h2>
              <form className="profile-form" onSubmit={saveProfile}>
                <div className="profile-avatar-card">
                  <div className="profile-avatar-preview">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Avatar" />
                    ) : (
                      <span>{profile.fullName?.charAt(0) || "U"}</span>
                    )}
                  </div>
                  <div className="profile-avatar-content">
                    <b>Avatar</b>
                    <p>
                      Tai khoan Google se tu dung anh Google neu co. Ban van co
                      the tai avatar khac len bat cu luc nao.
                    </p>
                    <label className="avatar-upload-button">
                      {uploadingAvatar
                        ? "Dang tai anh..."
                        : "Chon anh va cap nhat"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={uploadAvatar}
                        disabled={uploadingAvatar}
                      />
                    </label>
                    {profile.avatarUrl && (
                      <button
                        type="button"
                        className="danger-link"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            avatarUrl: "",
                          })
                        }
                      >
                        Bo avatar
                      </button>
                    )}
                  </div>
                </div>
                <label>
                  Họ và tên
                  <input
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile({ ...profile, fullName: e.target.value })
                    }
                  />
                </label>
                <label>
                  Email
                  <input disabled value={user.email} />
                </label>
                <label>
                  Số điện thoại
                  <input
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                  />
                </label>
                <button className="btn btn-primary">Lưu thay đổi</button>
              </form>
            </>
          )}
          {tab === "settings" && (
            <>
              <h2>Cài đặt</h2>
              <div className="settings-list">
                <div className="settings-row">
                  <div>
                    <b>Ngôn ngữ</b>
                    <p>Chọn ngôn ngữ hiển thị cho toàn bộ website.</p>
                  </div>
                  <select
                    className="language-select"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    aria-label="Ngôn ngữ"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="settings-row">
                  <div>
                    <b>Giao diện tối</b>
                    <p>
                      {isDark
                        ? "Đang dùng giao diện tối."
                        : "Đang dùng giao diện sáng."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={isDark ? "theme-switch active" : "theme-switch"}
                    onClick={toggleTheme}
                    role="switch"
                    aria-checked={isDark}
                    aria-label="Chuyển giao diện sáng hoặc tối"
                  >
                    <span>{isDark ? "Tối" : "Sáng"}</span>
                  </button>
                </div>
                <div className="settings-row settings-row-danger">
                  <div>
                    <b>Đăng xuất</b>
                    <p>Nhấn để đăng xuất khỏi tài khoản hiện tại.</p>
                  </div>
                  <button
                    type="button"
                    className="settings-logout-button"
                    onClick={handleLogout}
                  >
                    <Icon name="logout" size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </>
          )}
          {tab === "addresses" && (
            <>
              <h2>Sổ địa chỉ</h2>
              <div className="address-list">
                {addresses.map((a) => (
                  <article key={a.id}>
                    <div>
                      <b>
                        {a.recipientName}{" "}
                        {a.defaultAddress && (
                          <span className="default-badge">Mặc định</span>
                        )}
                      </b>
                      <p>{a.phone}</p>
                      <span>
                        {a.addressLine},{" "}
                        {[a.ward, a.district, a.province]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                    <button onClick={() => removeAddress(a.id)}>Xóa</button>
                  </article>
                ))}
              </div>
              <form className="address-form" onSubmit={addAddress}>
                <h3>Thêm địa chỉ</h3>
                <div className="form-grid two">
                  <label>
                    Người nhận
                    <input
                      required
                      value={addressForm.recipientName}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          recipientName: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Điện thoại
                    <input
                      required
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          phone: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  Địa chỉ
                  <input
                    required
                    value={addressForm.addressLine}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        addressLine: e.target.value,
                      })
                    }
                  />
                </label>
                <div className="form-grid three">
                  <label>
                    Phường/Xã
                    <input
                      value={addressForm.ward}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, ward: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Quận/Huyện
                    <input
                      value={addressForm.district}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          district: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Tỉnh/Thành phố
                    <input
                      required
                      value={addressForm.province}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          province: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={addressForm.defaultAddress}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        defaultAddress: e.target.checked,
                      })
                    }
                  />{" "}
                  Đặt làm địa chỉ mặc định
                </label>
                <button className="btn btn-primary">Thêm địa chỉ</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
