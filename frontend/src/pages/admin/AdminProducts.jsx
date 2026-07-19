import { useEffect, useState } from "react";
import api, { errorMessage } from "../../services/api";
import { money } from "../../services/format";

const empty = {
  categoryId: "",
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: 0,
  lowStockThreshold: 5,
  unit: "sản phẩm",
  imageUrl: "",
  active: true,
  featured: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const load = () =>
    api
      .get("/admin/products", {
        params: { search: search || undefined, size: 100 },
      })
      .then((r) => setProducts(r.data.content));
  useEffect(() => {
    load();
    api.get("/admin/categories").then((r) => setCategories(r.data));
  }, []);
  const edit = (p) => {
    setEditing(p.id);
    setForm({
      categoryId: p.categoryId,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      shortDescription: p.shortDescription || "",
      description: p.description || "",
      price: p.price,
      compareAtPrice: p.compareAtPrice || "",
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      unit: p.unit,
      imageUrl: p.imageUrl || "",
      active: p.active,
      featured: p.featured,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const reset = () => {
    setEditing(null);
    setForm(empty);
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Hình ảnh không được vượt quá 5 MB");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadingImage(true);

      const response = await api.post("/admin/images/upload", formData);

      setForm((currentForm) => ({
        ...currentForm,
        imageUrl: response.data.url,
      }));
    } catch (error) {
      console.error("Lỗi tải ảnh:", error);
      alert(errorMessage(error));
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      stockQuantity: Number(form.stockQuantity),
      lowStockThreshold: Number(form.lowStockThreshold),
    };
    try {
      editing
        ? await api.put(`/admin/products/${editing}`, payload)
        : await api.post("/admin/products", payload);
      reset();
      load();
    } catch (err) {
      alert(errorMessage(err));
    }
  };
  const remove = async (id) => {
    if (confirm("Ẩn sản phẩm này khỏi cửa hàng?")) {
      await api.delete(`/admin/products/${id}`);
      load();
    }
  };
  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">QUẢN LÝ DANH MỤC HÀNG</span>
          <h1>Sản phẩm</h1>
        </div>
      </div>
      <section className="admin-panel admin-form-panel">
        <h2>{editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
        <form onSubmit={submit}>
          <div className="form-grid three">
            <label>
              Danh mục
              <select
                required
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                <option value="">Chọn danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tên sản phẩm
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              SKU
              <input
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </label>
          </div>
          <div className="form-grid two">
            <label>
              Slug (có thể để trống)
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </label>
            <label>
              Đơn vị
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </label>
          </div>
          <label>
            Mô tả ngắn
            <input
              value={form.shortDescription}
              onChange={(e) =>
                setForm({ ...form, shortDescription: e.target.value })
              }
            />
          </label>
          <label>
            Mô tả chi tiết
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <div className="form-grid four">
            <label>
              Giá bán
              <input
                type="number"
                min="1"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label>
              Giá gạch
              <input
                type="number"
                min="0"
                value={form.compareAtPrice}
                onChange={(e) =>
                  setForm({ ...form, compareAtPrice: e.target.value })
                }
              />
            </label>
            <label>
              Tồn kho
              <input
                type="number"
                min="0"
                required
                value={form.stockQuantity}
                onChange={(e) =>
                  setForm({ ...form, stockQuantity: e.target.value })
                }
              />
            </label>
            <label>
              Ngưỡng cảnh báo
              <input
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(e) =>
                  setForm({ ...form, lowStockThreshold: e.target.value })
                }
              />
            </label>
          </div>
          <div className="product-image-upload">
            <label>
              Hình ảnh sản phẩm
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={uploadImage}
                disabled={uploadingImage}
              />
            </label>

            {uploadingImage && (
              <p className="upload-message">
                Đang tải hình ảnh lên Cloudinary...
              </p>
            )}

            {form.imageUrl && (
              <div className="image-preview">
                <img src={form.imageUrl} alt="Xem trước sản phẩm" />

                <div>
                  <p>Hình ảnh đã tải lên thành công.</p>

                  <button
                    type="button"
                    className="danger-link"
                    onClick={() =>
                      setForm({
                        ...form,
                        imageUrl: "",
                      })
                    }
                  >
                    Bỏ hình ảnh
                  </button>
                </div>
              </div>
            )}

            <label>
              Hoặc nhập URL hình ảnh
              <input
                value={form.imageUrl}
                placeholder="https://res.cloudinary.com/..."
                onChange={(event) =>
                  setForm({
                    ...form,
                    imageUrl: event.target.value,
                  })
                }
              />
            </label>
          </div>

          <div className="inline-checks">
            <label>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />{" "}
              Đang bán
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
              />{" "}
              Nổi bật
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary">
              {editing ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </button>
            {editing && (
              <button type="button" className="btn btn-soft" onClick={reset}>
                Hủy sửa
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="admin-panel">
        <div className="table-toolbar">
          <h2>Danh sách sản phẩm</h2>
          <div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên hoặc SKU"
            />
            <button onClick={load}>Tìm</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.name}</b>
                    <small>{p.sku}</small>
                  </td>
                  <td>{p.categoryName}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    <span
                      className={
                        p.stockQuantity <= p.lowStockThreshold
                          ? "warning-text"
                          : ""
                      }
                    >
                      {p.stockQuantity}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        p.active
                          ? "status status-delivered"
                          : "status status-cancelled"
                      }
                    >
                      {p.active ? "Đang bán" : "Đã ẩn"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button onClick={() => edit(p)}>Sửa</button>
                    <button
                      className="danger-link"
                      onClick={() => remove(p.id)}
                    >
                      Ẩn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
