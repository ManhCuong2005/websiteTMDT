import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, page: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "newest";
  const page = Number(params.get("page") || 0);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get("/products", { params: { search: search || undefined, category: category || undefined, sort, page, size: 12 } })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <div className="page-section container">
      <div className="page-heading">
        <span className="eyebrow">CỬA HÀNG</span>
        <h1>Sản phẩm nước sạch</h1>
        <p>Chọn đúng thiết bị kiểm tra, lõi thay thế và máy lọc cho nhu cầu của bạn.</p>
      </div>

      <div className="catalog-layout">
        <aside className="filter-panel">
          <h3>Danh mục</h3>
          <button className={!category ? "active" : ""} onClick={() => update("category", "")}>Tất cả sản phẩm</button>
          {categories.map((c) => (
            <button key={c.id} className={category === c.slug ? "active" : ""} onClick={() => update("category", c.slug)}>
              {c.name}
            </button>
          ))}
        </aside>

        <section className="catalog-main">
          <div className="catalog-toolbar">
            <div><b>{data.totalElements}</b> sản phẩm {search && <>cho “{search}”</>}</div>
            <select value={sort} onChange={(e) => update("sort", e.target.value)}>
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>

          {loading ? (
            <div className="loading-grid">Đang tải sản phẩm...</div>
          ) : data.content.length ? (
            <div className="product-grid">{data.content.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          ) : (
            <div className="empty-state">
              <b>Không tìm thấy sản phẩm</b>
              <p>Thử đổi từ khóa hoặc danh mục khác.</p>
            </div>
          )}

          {data.totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: data.totalPages }, (_, i) => (
                <button key={i} className={i === data.page ? "active" : ""} onClick={() => update("page", String(i))}>{i + 1}</button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
