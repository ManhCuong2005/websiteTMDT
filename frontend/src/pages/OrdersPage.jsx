import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../services/api'
import { dateTime, money, statusLabel } from '../services/format'
import { Icon } from '../components/Icons'

const orderSteps = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED']
const filters = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'PACKING', label: 'Đang đóng gói' },
  { value: 'SHIPPING', label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

const statusNote = {
  PENDING: 'Đơn hàng đã được ghi nhận và đang chờ cửa hàng xác nhận.',
  CONFIRMED: 'Cửa hàng đã xác nhận đơn và đang chuẩn bị xử lý.',
  PACKING: 'Sản phẩm đang được kiểm tra, đóng gói trước khi bàn giao vận chuyển.',
  SHIPPING: 'Đơn hàng đang trên đường giao tới địa chỉ nhận hàng.',
  DELIVERED: 'Đơn hàng đã được giao thành công.',
  CANCELLED: 'Đơn hàng đã bị hủy và không tiếp tục xử lý.',
}

function currentStepIndex(status) {
  if (status === 'CANCELLED') return -1
  return orderSteps.indexOf(status)
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = (await api.get('/orders/my')).data
      setOrders(data)
      setSelectedId((current) => current || data[0]?.id || null)
    } catch (err) {
      alert(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => loadOrders(true), 8000)
    return () => clearInterval(timer)
  }, [])

  const filteredOrders = useMemo(() => {
    if (filter === 'ALL') return orders
    return orders.filter((order) => order.status === filter)
  }, [orders, filter])

  const selectedOrder = useMemo(() => {
    return filteredOrders.find((order) => order.id === selectedId) || filteredOrders[0] || null
  }, [selectedId, filteredOrders])

  const cancelOrder = async (order) => {
    if (!confirm(`Bạn chắc chắn muốn hủy đơn ${order.orderCode}?`)) return

    setBusyId(order.id)
    try {
      const next = (await api.post(`/orders/${order.id}/cancel`, {
        reason: 'Khách hàng hủy từ trang theo dõi đơn hàng',
      })).data
      setOrders((current) => current.map((item) => item.id === next.id ? next : item))
    } catch (err) {
      alert(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-section container">
      <div className="page-heading left order-tracking-heading">
        <span className="eyebrow">THEO DÕI ĐƠN HÀNG</span>
        <h1>Đơn hàng của tôi</h1>
        <p>Xem trạng thái xử lý, thông tin giao hàng và chi tiết sản phẩm trong từng đơn.</p>
      </div>

      {loading ? (
        <div className="panel order-loading">Đang tải đơn hàng...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <Icon name="package" size={44} />
          <h1>Bạn chưa có đơn hàng nào</h1>
          <p>Những đơn hàng đã đặt sẽ xuất hiện tại đây để bạn theo dõi tiến trình giao hàng.</p>
          <Link className="btn btn-primary" to="/san-pham">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="orders-layout">
          <aside className="orders-sidebar">
            <div className="order-filter-tabs">
              {filters.map((item) => (
                <button
                  key={item.value}
                  className={filter === item.value ? 'active' : ''}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="orders-list">
              {filteredOrders.length ? filteredOrders.map((order) => (
                <button
                  key={order.id}
                  className={selectedOrder?.id === order.id ? 'active' : ''}
                  onClick={() => setSelectedId(order.id)}
                >
                  <span>
                    <b>#{order.orderCode}</b>
                    <small>{dateTime(order.createdAt)}</small>
                  </span>
                  <strong>{money(order.total)}</strong>
                  <em className={`status status-${order.status.toLowerCase()}`}>
                    {statusLabel[order.status]}
                  </em>
                </button>
              )) : (
                <div className="empty-state compact">Không có đơn hàng ở trạng thái này.</div>
              )}
            </div>
          </aside>

          {selectedOrder && (
            <section className="order-detail-panel">
              <div className="order-detail-top">
                <div>
                  <span className="eyebrow">MÃ ĐƠN</span>
                  <h2>#{selectedOrder.orderCode}</h2>
                  <p>{statusNote[selectedOrder.status]}</p>
                </div>
                <span className={`status status-${selectedOrder.status.toLowerCase()}`}>
                  {statusLabel[selectedOrder.status]}
                </span>
              </div>

              <div className={selectedOrder.status === 'CANCELLED' ? 'order-timeline cancelled' : 'order-timeline'}>
                {orderSteps.map((step, index) => {
                  const activeIndex = currentStepIndex(selectedOrder.status)
                  const done = activeIndex >= index
                  return (
                    <div key={step} className={done ? 'done' : ''}>
                      <span>{index + 1}</span>
                      <b>{statusLabel[step]}</b>
                    </div>
                  )
                })}
              </div>

              <div className="order-info-grid">
                <article>
                  <Icon name="truck" />
                  <div>
                    <b>Thông tin nhận hàng</b>
                    <span>{selectedOrder.recipientName} · {selectedOrder.recipientPhone}</span>
                    <small>{selectedOrder.shippingAddress}</small>
                  </div>
                </article>
                <article>
                  <Icon name="shield" />
                  <div>
                    <b>Thanh toán</b>
                    <span>COD · {selectedOrder.paymentStatus}</span>
                    <small>Thanh toán khi nhận và kiểm tra hàng.</small>
                  </div>
                </article>
              </div>

              <div className="order-detail-products">
                <h3>Sản phẩm trong đơn</h3>
                {selectedOrder.items.map((item) => (
                  <div key={item.id}>
                    <div className="order-product-thumb">
                      {item.productImageUrl ? <img src={item.productImageUrl} alt={item.productName} /> : <Icon name="package" />}
                    </div>
                    <span>
                      <b>{item.productName}</b>
                      <small>SKU: {item.productSku || '—'} · SL: {item.quantity}</small>
                    </span>
                    <strong>{money(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>

              <div className="order-price-box">
                <div><span>Tạm tính</span><b>{money(selectedOrder.subtotal)}</b></div>
                <div><span>Giảm giá</span><b>-{money(selectedOrder.discountAmount)}</b></div>
                <div><span>Phí giao hàng</span><b>{money(selectedOrder.shippingFee)}</b></div>
                <div className="total"><span>Tổng thanh toán</span><b>{money(selectedOrder.total)}</b></div>
              </div>

              <div className="order-detail-actions">
                <Link className="btn btn-outline" to="/san-pham">Tiếp tục mua hàng</Link>
                {selectedOrder.status === 'PENDING' && (
                  <button
                    className="btn btn-danger-small"
                    disabled={busyId === selectedOrder.id}
                    onClick={() => cancelOrder(selectedOrder)}
                  >
                    {busyId === selectedOrder.id ? 'Đang hủy...' : 'Hủy đơn'}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
