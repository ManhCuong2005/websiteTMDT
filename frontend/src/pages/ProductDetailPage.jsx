import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { errorMessage } from '../services/api'
import { money, dateTime } from '../services/format'
import ProductVisual from '../components/ProductVisual'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/Icons'

const defaultReview = { rating: 5, title: '', content: '' }
const defaultEligibility = {
  canReview: false,
  message: 'Đăng nhập để kiểm tra quyền đánh giá sản phẩm này.',
}

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [review, setReview] = useState(defaultReview)
  const [reviewEligibility, setReviewEligibility] = useState(defaultEligibility)
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  const loadReviews = (id) =>
    api.get(`/reviews/product/${id}`).then((r) => setReviews(r.data)).catch(() => {})

  const loadEligibility = async (id) => {
    setCheckingEligibility(true)
    try {
      const response = await api.get(`/reviews/product/${id}/eligibility`)
      setReviewEligibility(response.data)
    } catch {
      setReviewEligibility(defaultEligibility)
    } finally {
      setCheckingEligibility(false)
    }
  }

  useEffect(() => {
    api
      .get(`/products/${slug}`)
      .then((r) => {
        setProduct(r.data)
        setReview(defaultReview)
        setReviewEligibility(defaultEligibility)
        loadReviews(r.data.id)
        loadEligibility(r.data.id)
      })
      .catch(() => navigate('/san-pham'))
  }, [slug, navigate])

  useEffect(() => {
    if (product) loadEligibility(product.id)
  }, [user?.id])

  if (!product) return <div className="page-section container">Đang tải...</div>

  const add = async () => {
    if (!user) return navigate('/dang-nhap')
    try {
      await addItem(product.id, quantity)
      alert('Đã thêm vào giỏ hàng')
    } catch (e) {
      alert(errorMessage(e))
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!reviewEligibility.canReview) {
      alert(reviewEligibility.message)
      return
    }
    try {
      await api.post(`/reviews/product/${product.id}`, review)
      setReview(defaultReview)
      loadReviews(product.id)
    } catch (err) {
      alert(errorMessage(err))
      loadEligibility(product.id)
    }
  }

  return (
    <div className="page-section container">
      <div className="breadcrumbs">
        <Link to="/">Trang chủ</Link> / <Link to="/san-pham">Sản phẩm</Link> / <span>{product.name}</span>
      </div>
      <div className="product-detail-grid">
        <div className="detail-visual"><ProductVisual product={product} /></div>
        <div className="detail-info">
          <span className="eyebrow">{product.categoryName}</span>
          <h1>{product.name}</h1>
          <div className="detail-rating">
            <span>★</span> {Number(product.averageRating).toFixed(1)} · {product.reviewCount} đánh giá · SKU: {product.sku}
          </div>
          <p className="detail-short">{product.shortDescription}</p>
          <div className="detail-price">{money(product.price)} {product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}</div>
          <div className={product.stockQuantity > 0 ? 'stock available' : 'stock'}>
            {product.stockQuantity > 0 ? `Còn ${product.stockQuantity} ${product.unit}` : 'Tạm hết hàng'}
          </div>
          <div className="buy-row">
            <div className="quantity-control">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Icon name="minus" /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}><Icon name="plus" /></button>
            </div>
            <button className="btn btn-primary grow" disabled={product.stockQuantity <= 0} onClick={add}>
              <Icon name="cart" /> Thêm vào giỏ hàng
            </button>
          </div>
          <div className="detail-perks">
            <div><Icon name="truck" /><span><b>Miễn phí giao hàng</b><small>Đơn từ 500.000đ</small></span></div>
            <div><Icon name="shield" /><span><b>Đảm bảo thông tin</b><small>Tồn kho cập nhật theo hệ thống</small></span></div>
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        <h2>Mô tả sản phẩm</h2>
        <p>{product.description || 'Thông tin chi tiết đang được cập nhật.'}</p>
      </div>

      <section className="review-section">
        <div className="review-heading">
          <h2>Đánh giá khách hàng</h2>
          <div className="review-score">
            <b>{Number(product.averageRating).toFixed(1)}</b>
            <span>★★★★★</span>
            <small>{product.reviewCount} đánh giá</small>
          </div>
        </div>

        {reviewEligibility.canReview ? (
          <form className="review-form" onSubmit={submitReview}>
            <h3>Viết đánh giá</h3>
            <div className="form-grid two">
              <label>Số sao
                <select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
                </select>
              </label>
              <label>Tiêu đề
                <input value={review.title} onChange={(e) => setReview({ ...review, title: e.target.value })} placeholder="Ấn tượng của bạn" />
              </label>
            </div>
            <label>Nội dung
              <textarea required value={review.content} onChange={(e) => setReview({ ...review, content: e.target.value })} placeholder="Chia sẻ trải nghiệm sau khi sử dụng..." />
            </label>
            <button className="btn btn-primary">Gửi đánh giá</button>
          </form>
        ) : (
          <div className="review-readonly-note">
            {checkingEligibility ? 'Đang kiểm tra quyền đánh giá...' : reviewEligibility.message}
          </div>
        )}

        <div className="review-list">
          {reviews.length ? reviews.map((item) => (
            <article key={item.id} className="review-item">
              <div className="avatar">{item.userName?.charAt(0)}</div>
              <div>
                <div className="review-meta">
                  <b>{item.userName}</b>
                  <span>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                  <small>{dateTime(item.createdAt)}</small>
                </div>
                {item.title && <h4>{item.title}</h4>}
                <p>{item.content}</p>
              </div>
            </article>
          )) : <div className="empty-state compact">Chưa có đánh giá nào.</div>}
        </div>
      </section>
    </div>
  )
}
