import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { money } from '../services/format'
import { errorMessage } from '../services/api'
import ProductVisual from '../components/ProductVisual'
import { Icon } from '../components/Icons'
import { useLanguage } from '../contexts/LanguageContext'

function CartQuantityControl({ item, busy, onUpdate }) {
  const maxQuantity = Math.min(item.stockQuantity, 1000)
  const [value, setValue] = useState(String(item.quantity))

  useEffect(() => {
    setValue(String(item.quantity))
  }, [item.quantity])

  const commit = async () => {
    const parsedValue = Number(value)
    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      setValue(String(item.quantity))
      return
    }

    if (parsedValue > 1000) {
      alert('Nếu bạn có nhu cầu mua số lượng lớn, hãy liên hệ với chúng tôi qua Zalo nhé.')
    }

    const normalizedValue = parsedValue > 1000 ? 999 : parsedValue
    const nextQuantity = Math.min(normalizedValue, maxQuantity)
    setValue(String(nextQuantity))
    if (nextQuantity !== item.quantity) {
      const updated = await onUpdate(item, nextQuantity)
      if (!updated) setValue(String(item.quantity))
    }
  }

  return (
    <div className="quantity-control">
      <button
        type="button"
        aria-label="Giảm số lượng"
        disabled={busy || item.quantity <= 1}
        onClick={() => onUpdate(item, item.quantity - 1)}
      >
        <Icon name="minus"/>
      </button>
      <input
        type="number"
        inputMode="numeric"
        min="1"
        max={maxQuantity}
        step="1"
        value={value}
        disabled={busy}
        aria-label={`Số lượng ${item.productName}`}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            setValue(String(item.quantity))
            event.currentTarget.blur()
          }
        }}
      />
      <button
        type="button"
        aria-label="Tăng số lượng"
        disabled={busy || item.quantity >= maxQuantity}
        onClick={() => onUpdate(item, item.quantity + 1)}
      >
        <Icon name="plus"/>
      </button>
    </div>
  )
}

export default function CartPage() {
  const { cart, updateItem, removeItem, busy } = useCart()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const shipping = Number(cart.subtotal) >= 500000 ? 0 : 30000
  const update = async (item, quantity) => {
    try {
      await updateItem(item.id, quantity)
      return true
    } catch (e) {
      alert(errorMessage(e))
      return false
    }
  }
  const remove = async (id) => { if (confirm(t('Xóa sản phẩm khỏi giỏ hàng?'))) await removeItem(id) }
  if (!user) return <div className="page-section container"><div className="empty-state"><Icon name="cart" size={48}/><h1>Đăng nhập để xem giỏ hàng</h1><p>Giỏ hàng được lưu theo tài khoản của bạn.</p><Link className="btn btn-primary" to="/dang-nhap">Đăng nhập ngay</Link></div></div>
  if (!cart.items.length) return <div className="page-section container"><div className="empty-state"><Icon name="cart" size={48}/><h1>Giỏ hàng đang trống</h1><p>Khám phá các sản phẩm chăm sóc nguồn nước của chúng tôi.</p><Link className="btn btn-primary" to="/san-pham">Tiếp tục mua sắm</Link></div></div>
  return (
    <div className="page-section container"><div className="page-heading left"><span className="eyebrow">GIỎ HÀNG</span><h1>Sản phẩm đã chọn</h1></div><div className="cart-layout"><section className="cart-list">{cart.items.map(item => <article className="cart-item" key={item.id}><div className="cart-image"><ProductVisual product={{ name: item.productName, slug: item.productSlug, imageUrl: item.productImageUrl }}/></div><div className="cart-product"><Link to={`/san-pham/${item.productSlug}`}>{item.productName}</Link><small>Còn {item.stockQuantity} sản phẩm</small><strong>{money(item.unitPrice)}</strong></div><CartQuantityControl item={item} busy={busy} onUpdate={update}/><b className="line-total">{money(item.lineTotal)}</b><button className="remove-button" onClick={() => remove(item.id)}><Icon name="trash"/></button></article>)}</section><aside className="order-summary"><h2>Tóm tắt đơn hàng</h2><div><span>Tạm tính ({cart.totalItems} sản phẩm)</span><b>{money(cart.subtotal)}</b></div><div><span>Phí giao hàng dự kiến</span><b>{shipping ? money(shipping) : 'Miễn phí'}</b></div><div className="summary-note">Mã giảm giá sẽ được áp dụng ở bước thanh toán.</div><div className="summary-total"><span>Tổng dự kiến</span><b>{money(Number(cart.subtotal) + shipping)}</b></div><button className="btn btn-primary full" onClick={() => navigate('/thanh-toan')}>Tiến hành thanh toán</button><Link className="continue-link" to="/san-pham">← Tiếp tục mua sắm</Link></aside></div></div>
  )
}
