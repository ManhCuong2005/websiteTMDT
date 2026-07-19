import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import ProductCard from '../components/ProductCard'
import { Icon } from '../components/Icons'

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  useEffect(() => {
    Promise.all([api.get('/products/featured'), api.get('/categories')]).then(([p, c]) => {
      setProducts(p.data); setCategories(c.data)
    }).catch(() => {})
  }, [])
  const categorySymbol = (slug) => slug.includes('but') ? '⌁' : slug.includes('loi') ? '◉' : '◈'
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker">NGUỒN NƯỚC AN TÂM · CUỘC SỐNG KHỎE</span>
            <h1>Chăm sóc nguồn nước<br/><em>từ điều nhỏ nhất</em></h1>
            <p>Từ thiết bị kiểm tra nước, lõi lọc thay thế đến máy lọc hoàn chỉnh — lựa chọn dễ dàng, thông tin minh bạch.</p>
            <div className="hero-actions"><Link className="btn btn-primary" to="/san-pham">Khám phá sản phẩm <Icon name="chevron"/></Link><Link className="btn btn-soft" to="/san-pham?category=loi-loc-nuoc">Xem lõi lọc</Link></div>
            <div className="hero-stats"><div><b>10+</b><span>Sản phẩm mẫu</span></div><div><b>3</b><span>Nhóm giải pháp</span></div><div><b>COD</b><span>Thanh toán tiện lợi</span></div></div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orb"><div className="drop-shape">◆</div><div className="hero-machine"><span/><span/><span/><b>PURE</b></div><div className="hero-pen">TDS</div><div className="hero-filter">RO</div></div>
            <div className="floating-card card-quality"><Icon name="shield"/><span><b>Kiểm soát chất lượng</b><small>Thông tin rõ ràng</small></span></div>
            <div className="floating-card card-delivery"><Icon name="truck"/><span><b>Giao hàng nhanh</b><small>Miễn phí từ 500K</small></span></div>
          </div>
        </div>
      </section>

      <section className="benefit-bar"><div className="container benefit-grid"><div><Icon name="shield"/><span><b>Sản phẩm tin cậy</b><small>Thông tin và bảo hành rõ ràng</small></span></div><div><Icon name="truck"/><span><b>Giao hàng toàn quốc</b><small>Đóng gói cẩn thận</small></span></div><div><Icon name="package"/><span><b>Dễ chọn đúng loại</b><small>Phân loại theo nhu cầu</small></span></div><div><Icon name="user"/><span><b>Hỗ trợ tận tâm</b><small>Tư vấn trước và sau mua</small></span></div></div></section>

      <section className="section container">
        <div className="section-heading"><div><span className="eyebrow">DANH MỤC NỔI BẬT</span><h2>Giải pháp cho từng nhu cầu</h2></div><Link to="/san-pham">Xem tất cả →</Link></div>
        <div className="category-grid">{categories.map(category => <Link key={category.id} className={`category-card ${category.slug}`} to={`/san-pham?category=${category.slug}`}><div className="category-symbol">{categorySymbol(category.slug)}</div><div><h3>{category.name}</h3><p>{category.description}</p><span>Khám phá →</span></div></Link>)}</div>
      </section>

      <section className="section section-tint"><div className="container"><div className="section-heading"><div><span className="eyebrow">ĐƯỢC QUAN TÂM</span><h2>Sản phẩm nổi bật</h2></div><Link to="/san-pham">Xem toàn bộ →</Link></div><div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product}/>)}</div></div></section>

      <section className="section container"><div className="knowledge-banner"><div><span className="eyebrow">GỢI Ý NHỎ</span><h2>Khi nào nên thay lõi lọc?</h2><p>Kiểm tra định kỳ giúp máy hoạt động ổn định và đảm bảo chất lượng nước đầu ra. Lõi thô thường cần thay sau 3–9 tháng tùy nguồn nước và tần suất sử dụng.</p><Link className="btn btn-light" to="/san-pham?category=loi-loc-nuoc">Chọn lõi lọc phù hợp</Link></div><div className="knowledge-rings"><span/><span/><span/><b>H₂O</b></div></div></section>
    </>
  )
}
