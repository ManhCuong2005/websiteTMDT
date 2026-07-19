import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../services/api'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { money } from '../services/format'

const emptyForm = { recipientName: '', recipientPhone: '', addressLine: '', ward: '', district: '', province: '', couponCode: '', note: '', saveAddress: true }

export default function CheckoutPage() {
  const { cart, setCart } = useCart(); const { user } = useAuth(); const navigate = useNavigate()
  const [form, setForm] = useState({ ...emptyForm, recipientName: user?.fullName || '', recipientPhone: user?.phone || '' })
  const [addresses, setAddresses] = useState([]); const [coupon, setCoupon] = useState(null); const [placing, setPlacing] = useState(false)
  useEffect(() => { api.get('/users/me/addresses').then(r => { setAddresses(r.data); const d = r.data.find(a => a.defaultAddress) || r.data[0]; if (d) chooseAddress(d) }).catch(() => {}) }, [])
  useEffect(() => { if (!cart.items.length) navigate('/gio-hang') }, [cart.items.length])
  const chooseAddress = (a) => setForm(f => ({ ...f, recipientName: a.recipientName, recipientPhone: a.phone, addressLine: a.addressLine, ward: a.ward || '', district: a.district || '', province: a.province }))
  const change = e => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const validateCoupon = async () => {
    if (!form.couponCode.trim()) return setCoupon(null)
    try { const res = (await api.post('/orders/validate-coupon', { code: form.couponCode, subtotal: cart.subtotal })).data; setCoupon(res); if (!res.valid) alert(res.message) }
    catch (e) { alert(errorMessage(e)) }
  }
  const discount = coupon?.valid ? Number(coupon.discountAmount) : 0
  const shipping = Number(cart.subtotal) >= 500000 ? 0 : 30000
  const total = Number(cart.subtotal) - discount + shipping
  const submit = async e => {
    e.preventDefault(); setPlacing(true)
    try { const order = (await api.post('/orders', form)).data; setCart({ items: [], totalItems: 0, subtotal: 0 }); alert(`Đặt hàng thành công: ${order.orderCode}`); navigate('/don-hang') }
    catch (err) { alert(errorMessage(err)) } finally { setPlacing(false) }
  }
  return (
    <div className="page-section container"><div className="page-heading left"><span className="eyebrow">THANH TOÁN</span><h1>Hoàn tất đơn hàng</h1></div><form className="checkout-layout" onSubmit={submit}><section className="checkout-form"><div className="panel"><div className="panel-heading"><span>1</span><h2>Thông tin nhận hàng</h2></div>{addresses.length > 0 && <div className="saved-addresses">{addresses.map(a => <button type="button" key={a.id} onClick={() => chooseAddress(a)}><b>{a.recipientName}</b><small>{a.phone} · {a.addressLine}, {a.province}</small></button>)}</div>}<div className="form-grid two"><label>Họ tên người nhận<input required name="recipientName" value={form.recipientName} onChange={change}/></label><label>Số điện thoại<input required name="recipientPhone" value={form.recipientPhone} onChange={change}/></label></div><label>Địa chỉ cụ thể<input required name="addressLine" value={form.addressLine} onChange={change} placeholder="Số nhà, tên đường..."/></label><div className="form-grid three"><label>Phường/Xã<input name="ward" value={form.ward} onChange={change}/></label><label>Quận/Huyện<input name="district" value={form.district} onChange={change}/></label><label>Tỉnh/Thành phố<input required name="province" value={form.province} onChange={change}/></label></div><label className="checkbox-label"><input type="checkbox" name="saveAddress" checked={form.saveAddress} onChange={change}/> Lưu địa chỉ cho lần mua sau</label></div><div className="panel"><div className="panel-heading"><span>2</span><h2>Phương thức thanh toán</h2></div><div className="payment-option selected"><input type="radio" checked readOnly/><div><b>Thanh toán khi nhận hàng (COD)</b><small>Bạn thanh toán tiền mặt khi nhận và kiểm tra kiện hàng.</small></div></div></div><div className="panel"><div className="panel-heading"><span>3</span><h2>Ghi chú</h2></div><textarea name="note" value={form.note} onChange={change} placeholder="Thời gian nhận hàng, lưu ý giao hàng..."/></div></section><aside className="order-summary checkout-summary"><h2>Đơn hàng của bạn</h2><div className="checkout-items">{cart.items.map(item => <div key={item.id}><span>{item.productName} × {item.quantity}</span><b>{money(item.lineTotal)}</b></div>)}</div><div><span>Tạm tính</span><b>{money(cart.subtotal)}</b></div><div><span>Phí giao hàng</span><b>{shipping ? money(shipping) : 'Miễn phí'}</b></div><div className="coupon-row"><input name="couponCode" value={form.couponCode} onChange={change} placeholder="Mã giảm giá"/><button type="button" onClick={validateCoupon}>Áp dụng</button></div>{coupon?.valid && <div className="coupon-success">{coupon.message}: -{money(discount)}</div>}<div className="summary-total"><span>Tổng thanh toán</span><b>{money(total)}</b></div><button className="btn btn-primary full" disabled={placing}>{placing ? 'Đang tạo đơn...' : 'Đặt hàng COD'}</button><small className="legal-note">Bằng việc đặt hàng, bạn đồng ý với chính sách mua hàng của website.</small></aside></form></div>
  )
}
