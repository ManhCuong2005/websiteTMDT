import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../services/api'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { money } from '../services/format'
import { useLanguage } from '../contexts/LanguageContext'
import {
  forgetPendingTransaction,
  prepareGanacheWallet,
  rememberPendingTransaction,
  sendOrderPayment,
  shortHash,
} from '../services/blockchain'

const emptyForm = {
  recipientName: '',
  recipientPhone: '',
  addressLine: '',
  ward: '',
  district: '',
  province: '',
  couponCode: '',
  note: '',
  saveAddress: true,
}

export default function CheckoutPage() {
  const { cart, setCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [form, setForm] = useState({
    ...emptyForm,
    recipientName: user?.fullName || '',
    recipientPhone: user?.phone || '',
  })
  const [addresses, setAddresses] = useState([])
  const [coupon, setCoupon] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [cryptoConfig, setCryptoConfig] = useState(null)
  const [walletAddress, setWalletAddress] = useState('')

  useEffect(() => {
    api.get('/users/me/addresses').then((response) => {
      setAddresses(response.data)
      const selected = response.data.find((item) => item.defaultAddress) || response.data[0]
      if (selected) chooseAddress(selected)
    }).catch(() => {})
    api.get('/orders/crypto/config').then((response) => setCryptoConfig(response.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!cart.items.length) navigate('/gio-hang')
  }, [cart.items.length, navigate])

  const chooseAddress = (address) => setForm((current) => ({
    ...current,
    recipientName: address.recipientName,
    recipientPhone: address.phone,
    addressLine: address.addressLine,
    ward: address.ward || '',
    district: address.district || '',
    province: address.province,
  }))

  const change = (event) => setForm({
    ...form,
    [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
  })

  const validateCoupon = async () => {
    if (!form.couponCode.trim()) return setCoupon(null)
    try {
      const response = await api.post('/orders/validate-coupon', {
        code: form.couponCode,
        subtotal: cart.subtotal,
      })
      setCoupon(response.data)
      if (!response.data.valid) alert(response.data.message)
    } catch (error) {
      alert(errorMessage(error))
    }
  }

  const discount = coupon?.valid ? Number(coupon.discountAmount) : 0
  const shipping = Number(cart.subtotal) >= 500000 ? 0 : 30000
  const total = Number(cart.subtotal) - discount + shipping
  const expectedEth = cryptoConfig
    ? (total / Number(cryptoConfig.conversionRateVnd)).toFixed(6)
    : null

  const connectWallet = async () => {
    try {
      const address = await prepareGanacheWallet(cryptoConfig)
      setWalletAddress(address)
      return address
    } catch (error) {
      alert(error.message)
      return null
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setPlacing(true)
    let createdOrder = null

    try {
      let payer = walletAddress
      if (paymentMethod === 'ETH') {
        payer = await prepareGanacheWallet(cryptoConfig)
        setWalletAddress(payer)
      }

      createdOrder = (await api.post('/orders', { ...form, paymentMethod })).data

      if (paymentMethod === 'ETH') {
        const transactionHash = await sendOrderPayment(createdOrder, cryptoConfig, payer)
        rememberPendingTransaction(createdOrder.id, transactionHash)
        await api.post(`/orders/${createdOrder.id}/crypto-payment/confirm`, { transactionHash })
        forgetPendingTransaction(createdOrder.id)
        alert(`Thanh toán ETH thành công!\nĐơn: ${createdOrder.orderCode}\nGiao dịch: ${shortHash(transactionHash)}`)
      } else {
        alert(`${t('Đặt hàng thành công')}: ${createdOrder.orderCode}`)
      }
      setCart({ items: [], totalItems: 0, subtotal: 0 })
      navigate('/don-hang')
    } catch (error) {
      if (createdOrder) {
        const message = error?.response ? errorMessage(error) : error.message
        alert(`Đơn ${createdOrder.orderCode} đã được tạo nhưng chưa xác nhận thanh toán ETH.\n${message}\nBạn có thể tiếp tục tại trang Đơn hàng.`)
        setCart({ items: [], totalItems: 0, subtotal: 0 })
        navigate('/don-hang')
      } else {
        alert(error?.response ? errorMessage(error) : error.message)
      }
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="page-section container">
      <div className="page-heading left">
        <span className="eyebrow">THANH TOÁN</span>
        <h1>Hoàn tất đơn hàng</h1>
      </div>
      <form className="checkout-layout" onSubmit={submit}>
        <section className="checkout-form">
          <div className="panel">
            <div className="panel-heading"><span>1</span><h2>Thông tin nhận hàng</h2></div>
            {addresses.length > 0 && (
              <div className="saved-addresses">
                {addresses.map((address) => (
                  <button type="button" key={address.id} onClick={() => chooseAddress(address)}>
                    <b>{address.recipientName}</b>
                    <small>{address.phone} · {address.addressLine}, {address.province}</small>
                  </button>
                ))}
              </div>
            )}
            <div className="form-grid two">
              <label>Họ tên người nhận<input required name="recipientName" value={form.recipientName} onChange={change} /></label>
              <label>Số điện thoại<input required name="recipientPhone" value={form.recipientPhone} onChange={change} /></label>
            </div>
            <label>Địa chỉ cụ thể<input required name="addressLine" value={form.addressLine} onChange={change} placeholder="Số nhà, tên đường..." /></label>
            <div className="form-grid three">
              <label>Phường/Xã<input name="ward" value={form.ward} onChange={change} /></label>
              <label>Quận/Huyện<input name="district" value={form.district} onChange={change} /></label>
              <label>Tỉnh/Thành phố<input required name="province" value={form.province} onChange={change} /></label>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" name="saveAddress" checked={form.saveAddress} onChange={change} />
              Lưu địa chỉ cho lần mua sau
            </label>
          </div>

          <div className="panel">
            <div className="panel-heading"><span>2</span><h2>Phương thức thanh toán</h2></div>
            <label className={`payment-option ${paymentMethod === 'COD' ? 'selected' : ''}`}>
              <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
              <div><b>Thanh toán khi nhận hàng (COD)</b><small>Thanh toán tiền mặt khi nhận và kiểm tra kiện hàng.</small></div>
            </label>
            <label className={`payment-option crypto-option ${paymentMethod === 'ETH' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="ETH"
                checked={paymentMethod === 'ETH'}
                disabled={!cryptoConfig?.enabled}
                onChange={() => setPaymentMethod('ETH')}
              />
              <div>
                <b>Thanh toán ETH qua MetaMask</b>
                <small>Ganache Local · Chain ID {cryptoConfig?.chainId || 1337} · Khoảng {expectedEth || '—'} ETH</small>
              </div>
            </label>
            {paymentMethod === 'ETH' && (
              <div className="crypto-checkout-box">
                <p>ETH sẽ được gửi qua smart contract tới ví cửa hàng. Tỷ giá demo: 1 ETH = {money(cryptoConfig?.conversionRateVnd)}.</p>
                <button type="button" className="btn btn-outline" onClick={connectWallet}>
                  {walletAddress ? `Đã kết nối ${shortHash(walletAddress, 8, 6)}` : 'Kết nối MetaMask'}
                </button>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-heading"><span>3</span><h2>Ghi chú</h2></div>
            <textarea name="note" value={form.note} onChange={change} placeholder="Thời gian nhận hàng, lưu ý giao hàng..." />
          </div>
        </section>

        <aside className="order-summary checkout-summary">
          <h2>Đơn hàng của bạn</h2>
          <div className="checkout-items">
            {cart.items.map((item) => (
              <div key={item.id}><span>{item.productName} × {item.quantity}</span><b>{money(item.lineTotal)}</b></div>
            ))}
          </div>
          <div><span>Tạm tính</span><b>{money(cart.subtotal)}</b></div>
          <div><span>Phí giao hàng</span><b>{shipping ? money(shipping) : 'Miễn phí'}</b></div>
          <div className="coupon-row">
            <input name="couponCode" value={form.couponCode} onChange={change} placeholder="Mã giảm giá" />
            <button type="button" onClick={validateCoupon}>Áp dụng</button>
          </div>
          {coupon?.valid && <div className="coupon-success">{coupon.message}: -{money(discount)}</div>}
          <div className="summary-total"><span>Tổng thanh toán</span><b>{money(total)}</b></div>
          {paymentMethod === 'ETH' && <div className="crypto-total">≈ {expectedEth || '—'} ETH</div>}
          <button className="btn btn-primary full" disabled={placing || (paymentMethod === 'ETH' && !cryptoConfig?.enabled)}>
            {placing ? 'Đang xử lý...' : paymentMethod === 'ETH' ? 'Thanh toán bằng MetaMask' : 'Đặt hàng COD'}
          </button>
          <small className="legal-note">Bằng việc đặt hàng, bạn đồng ý với chính sách mua hàng của website.</small>
        </aside>
      </form>
    </div>
  )
}
