import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { Icon } from "../components/Icons";
import { dateTime } from "../services/format";
import UserAvatar from "../components/UserAvatar";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [serviceReviews, setServiceReviews] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/products/featured"), api.get("/categories"), api.get("/products/recommendations")])
      .then(([p, c, r]) => {
        setProducts(p.data);
        setCategories(c.data);
        setRecommendations(r.data);
      })
      .catch(() => {});
    api.get("/service-requests/reviews/featured", { params: { size: 3 } })
      .then((response) => setServiceReviews(Array.isArray(response.data) ? response.data : []))
      .catch(() => setServiceReviews([]));
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

  const journeySteps = [
    { number: "01", icon: "message", title: "Chia sẻ nhu cầu", desc: "Cho chúng tôi biết tình trạng nguồn nước, thiết bị hoặc dịch vụ bạn đang cần." },
    { number: "02", icon: "sparkles", title: "Nhận tư vấn phù hợp", desc: "Minh Phát đề xuất giải pháp rõ ràng theo nhu cầu và ngân sách thực tế." },
    { number: "03", icon: "calendar", title: "Chọn lịch thuận tiện", desc: "Đặt thời gian kỹ thuật viên đến kiểm tra, lắp đặt hoặc bảo trì tận nhà." },
    { number: "04", icon: "shield", title: "An tâm sử dụng", desc: "Theo dõi đơn hàng, lịch sử dịch vụ và nhận hỗ trợ xuyên suốt sau mua." },
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

      <section className="section process-section">
        <div className="container">
          <div className="section-heading process-heading">
            <div>
              <span className="eyebrow">QUY TRÌNH ĐƠN GIẢN</span>
              <h2>Từ nhu cầu đến nguồn nước an tâm</h2>
              <p>Một quy trình rõ ràng giúp bạn dễ lựa chọn, dễ đặt lịch và luôn biết bước tiếp theo.</p>
            </div>
            <Link className="text-link" to="/dat-lich">Bắt đầu đặt lịch <Icon name="chevron" size={16} /></Link>
          </div>
          <div className="journey-grid">
            {journeySteps.map((step) => (
              <article className="journey-card" key={step.number}>
                <span className="journey-number">{step.number}</span>
                <span className="journey-icon"><Icon name={step.icon} /></span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section proof-section">
        <div className="container proof-grid">
          <div className="proof-copy">
            <span className="eyebrow">ĐỒNG HÀNH DÀI LÂU</span>
            <h2>Không chỉ bán thiết bị,<br />chúng tôi chăm sóc cả quá trình sử dụng</h2>
            <p>Từ lúc lựa chọn sản phẩm đến kiểm tra, thay lõi và bảo trì định kỳ, mọi nhu cầu đều được tiếp nhận trên cùng một hệ thống.</p>
            <div className="proof-numbers">
              <div><b>7/7</b><span>Ngày hỗ trợ mỗi tuần</span></div>
              <div><b>4 bước</b><span>Quy trình minh bạch</span></div>
              <div><b>Tận nhà</b><span>Kiểm tra và lắp đặt</span></div>
            </div>
          </div>
          <div className="testimonial-stack">
            {serviceReviews.length > 0 ? serviceReviews.map((item, index) => (
              <article className={index === 1 ? "testimonial-card featured" : "testimonial-card"} key={item.id}>
                <div className="testimonial-top">
                  <UserAvatar
                    avatarUrl={item.customerAvatarUrl}
                    name={item.customerName}
                    size={38}
                    className="testimonial-user-avatar"
                  />
                  <div><b>{item.customerName}</b><small>{item.serviceType} · {dateTime(item.createdAt)}</small></div>
                  <span className="testimonial-stars">{"★".repeat(item.rating)}</span>
                </div>
                <p>“{item.content}”</p>
              </article>
            )) : (
              <article className="service-review-empty">
                <span><Icon name="star" /></span>
                <h3>Đánh giá dịch vụ thực tế</h3>
                <p>Đánh giá sẽ xuất hiện tại đây sau khi khách hàng xác nhận hoàn thành và chia sẻ trải nghiệm.</p>
                <Link to="/dat-lich">Đặt lịch trải nghiệm dịch vụ →</Link>
              </article>
            )}
            <Link className="all-service-reviews-link" to="/danh-gia-dich-vu">
              <span>
                <Icon name="message" size={17} />
                <b>Xem toàn bộ đánh giá dịch vụ</b>
              </span>
              <Icon name="chevron" size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section container home-final-cta">
        <div>
          <span className="eyebrow">BẠN CẦN HỖ TRỢ?</span>
          <h2>Bắt đầu với một nguồn nước tốt hơn ngay hôm nay</h2>
          <p>Khám phá thiết bị phù hợp hoặc đặt lịch để đội ngũ Minh Phát kiểm tra trực tiếp tại nhà.</p>
        </div>
        <div>
          <Link className="btn btn-light" to="/san-pham">Xem sản phẩm</Link>
          <Link className="btn btn-cta-outline" to="/dat-lich">Đặt lịch kỹ thuật viên</Link>
        </div>
      </section>
    </>
  );
}
