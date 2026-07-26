import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { money } from '../services/format'
import { errorMessage } from '../services/api'
import ProductVisual from '../components/ProductVisual'
import { Icon } from '../components/Icons'
import { useLanguage } from '../contexts/LanguageContext'

export default function CartPage() {
  const { cart, updateItem, removeItem, busy } = useCart()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const shipping = Number(cart.subtotal) >= 500000 ? 0 : 30000
  const update = async (item, quantity) => {
    try { await updateItem(item.id, quantity) } catch (e) { alert(errorMessage(e)) }
  }
  const remove = async (id) => { if (confirm(t('Xóa sản phẩm khỏi giỏ hàng?'))) await removeItem(id) }
  if (!user) return <div className="page-section container"><div className="empty-state"><Icon name="cart" size={48}/><h1>Đăng nhập để xem giỏ hàng</h1><p>Giỏ hàng được lưu theo tài khoản của bạn.</p><Link className="btn btn-primary" to="/dang-nhap">Đăng nhập ngay</Link></div></div>
  if (!cart.items.length) return <div className="page-section container"><div className="empty-state"><Icon name="cart" size={48}/><h1>Giỏ hàng đang trống</h1><p>Khám phá các sản phẩm chăm sóc nguồn nước của chúng tôi.</p><Link className="btn btn-primary" to="/san-pham">Tiếp tục mua sắm</Link></div></div>
  return (
    <div className="page-section container"><div className="page-heading left"><span className="eyebrow">GIỎ HÀNG</span><h1>Sản phẩm đã chọn</h1></div><div className="cart-layout"><section className="cart-list">{cart.items.map(item => <article className="cart-item" key={item.id}><div className="cart-image"><ProductVisual product={{ name: item.productName, slug: item.productSlug, imageUrl: item.productImageUrl }}/></div><div className="cart-product"><Link to={`/san-pham/${item.productSlug}`}>{item.productName}</Link><small>Còn {item.stockQuantity} sản phẩm</small><strong>{money(item.unitPrice)}</strong></div><div className="quantity-control"><button disabled={busy || item.quantity <= 1} onClick={() => update(item, item.quantity - 1)}><Icon name="minus"/></button><span>{item.quantity}</span><button disabled={busy || item.quantity >= item.stockQuantity} onClick={() => update(item, item.quantity + 1)}><Icon name="plus"/></button></div><b className="line-total">{money(item.lineTotal)}</b><button className="remove-button" onClick={() => remove(item.id)}><Icon name="trash"/></button></article>)}</section><aside className="order-summary"><h2>Tóm tắt đơn hàng</h2><div><span>Tạm tính ({cart.totalItems} sản phẩm)</span><b>{money(cart.subtotal)}</b></div><div><span>Phí giao hàng dự kiến</span><b>{shipping ? money(shipping) : 'Miễn phí'}</b></div><div className="summary-note">Mã giảm giá sẽ được áp dụng ở bước thanh toán.</div><div className="summary-total"><span>Tổng dự kiến</span><b>{money(Number(cart.subtotal) + shipping)}</b></div><button className="btn btn-primary full" onClick={() => navigate('/thanh-toan')}>Tiến hành thanh toán</button><Link className="continue-link" to="/san-pham">← Tiếp tục mua sắm</Link></aside></div></div>
  )
}
