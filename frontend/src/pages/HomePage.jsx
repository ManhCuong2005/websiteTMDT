import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { Icon } from "../components/Icons";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/products/featured"), api.get("/categories"), api.get("/products/recommendations")])
      .then(([p, c, r]) => {
        setProducts(p.data);
        setCategories(c.data);
        setRecommendations(r.data);
      })
      .catch(() => {});
  }, []);

  const categorySymbol = (slug) => {
    if (slug.includes("but")) return "TDS";
    if (slug.includes("loi")) return "RO";
    return "H2O";
  };

  const serviceCards = [
    { icon: "tool", title: "Lắp đặt máy lọc", desc: "Kỹ thuật viên đến tận nhà, kiểm tra vị trí và lắp đặt gọn gàng." },
    { icon: "droplet", title: "Kiểm tra nguồn nước", desc: "Đo nhanh TDS, tư vấn lõi lọc phù hợp với tình trạng nước thực tế." },
    { icon: "calendar", title: "Bảo trì định kỳ", desc: "Nhắc lịch thay lõi, vệ sinh máy và kiểm tra rò rỉ để dùng bền hơn." },
  ];

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker">NGUỒN NƯỚC AN TÂM · DỊCH VỤ TẬN NHÀ</span>
            <h1>Chăm sóc nguồn nước<br /><em>từ thiết bị đến lắp đặt</em></h1>
            <p>Minh Phát giúp bạn chọn đúng bút thử nước, lõi lọc, máy lọc và đặt thợ kiểm tra, lắp đặt, bảo trì ngay tại nhà.</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/san-pham">Khám phá sản phẩm <Icon name="chevron" /></Link>
              <Link className="btn btn-soft" to="/dat-lich">Đặt lịch dịch vụ</Link>
            </div>
            <div className="hero-stats">
              <div><b>24h</b><span>Tiếp nhận yêu cầu</span></div>
              <div><b>3</b><span>Nhóm giải pháp</span></div>
              <div><b>COD</b><span>Thanh toán tiện lợi</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orb">
              <div className="drop-shape">MP</div>
              <div className="hero-machine"><span /><span /><span /><b>PURE</b></div>
              <div className="hero-pen">TDS</div>
              <div className="hero-filter">RO</div>
            </div>
            <div className="floating-card card-quality"><Icon name="shield" /><span><b>Kiểm soát chất lượng</b><small>Thông tin rõ ràng</small></span></div>
            <div className="floating-card card-delivery"><Icon name="truck" /><span><b>Thợ đến tận nhà</b><small>Lắp đặt và bảo trì</small></span></div>
          </div>
        </div>
      </section>

      <section className="benefit-bar">
        <div className="container benefit-grid">
          <div><Icon name="shield" /><span><b>Sản phẩm tin cậy</b><small>Thông tin và bảo hành rõ ràng</small></span></div>
          <div><Icon name="truck" /><span><b>Giao hàng toàn quốc</b><small>Đóng gói cẩn thận</small></span></div>
          <div><Icon name="tool" /><span><b>Lắp đặt tận nơi</b><small>Đặt lịch nhanh qua hệ thống</small></span></div>
          <div><Icon name="user" /><span><b>Hỗ trợ tận tâm</b><small>Tư vấn trước và sau mua</small></span></div>
        </div>
      </section>

      <section className="section container">
        <div className="service-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DỊCH VỤ TẬN NHÀ</span>
              <h2>Kiểm tra, sửa chữa và lắp đặt</h2>
              <p>Phù hợp khi bạn cần lắp máy mới, thay lõi lọc, kiểm tra chất lượng nước hoặc xử lý máy chảy yếu, rò rỉ.</p>
            </div>
            <Link className="btn btn-primary service-cta" to="/dat-lich">Mở trang đặt lịch</Link>
          </div>
          <div className="service-grid">
            {serviceCards.map((service) => (
              <article className="service-card" key={service.title}>
                <span className="service-icon"><Icon name={service.icon} /></span>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div><span className="eyebrow">DANH MỤC NỔI BẬT</span><h2>Giải pháp cho từng nhu cầu</h2></div>
          <Link to="/san-pham">Xem tất cả →</Link>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category.id} className={`category-card ${category.slug}`} to={`/san-pham?category=${category.slug}`}>
              <div className="category-symbol">{categorySymbol(category.slug)}</div>
              <div><h3>{category.name}</h3><p>{category.description}</p><span>Khám phá →</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          {recommendations?.products?.length > 0 && <div className="recommendations-block">
            <div className="recommendation-heading">
              <span className="recommendation-icon"><Icon name="star" size={18} /></span>
              <div><span className="eyebrow">GỢI Ý THÔNG MINH</span><h2>Gợi ý dành cho bạn</h2><p>{recommendations.subtitle}</p></div>
            </div>
            <div className="product-grid recommendation-grid">
              {recommendations.products.map(({ product, reason }) => <ProductCard key={product.id} product={product} recommendationReason={reason} />)}
            </div>
          </div>}
          <div className="section-heading">
            <div><span className="eyebrow">ĐƯỢC QUAN TÂM</span><h2>Sản phẩm nổi bật</h2></div>
            <Link to="/san-pham">Xem toàn bộ →</Link>
          </div>
          <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </div>
      </section>

      <section className="section container">
        <div className="knowledge-banner">
          <div>
            <span className="eyebrow">GỢI Ý NHỎ</span>
            <h2>Khi nào nên thay lõi lọc?</h2>
            <p>Kiểm tra định kỳ giúp máy hoạt động ổn định và đảm bảo chất lượng nước đầu ra. Lõi thô thường cần thay sau 3-9 tháng tùy nguồn nước và tần suất sử dụng.</p>
            <Link className="btn btn-light" to="/san-pham?category=loi-loc-nuoc">Chọn lõi lọc phù hợp</Link>
          </div>
          <div className="knowledge-rings"><span /><span /><span /><b>H2O</b></div>
        </div>
      </section>
    </>
  );
}
