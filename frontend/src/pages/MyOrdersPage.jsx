import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import CheckoutModal from '../components/CheckoutModal.jsx'

const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'

const statusLabels = {
  da_dat: { text: 'Chờ xác nhận', color: '#dd6b20', bg: '#fefcbf' },
  da_xac_nhan: { text: 'Đã xác nhận', color: '#2b6cb0', bg: '#bee3f8' },
  dang_giao: { text: 'Đang giao hàng', color: '#805ad5', bg: '#e9d8fd' },
  da_giao: { text: 'Giao thành công', color: '#22543d', bg: '#c6f6d5' },
  da_huy: { text: 'Đã hủy', color: '#742a2a', bg: '#fed7d7' }
}

export default function MyOrdersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/dang-nhap')
      return
    }

    apiClient
      .get('/orders/my')
      .then(({ data }) => setOrders(data || []))
      .catch((err) => setError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng.'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  return (
    <div className="app-shell">
      <Navbar />

      <main style={{ padding: '60px 8vw 100px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <p className="eyebrow">AUTOBOT / TÀI KHOẢN CỦA TÔI</p>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: '0 0 8px', letterSpacing: '-0.05em' }}>
            Lịch sử đơn hàng
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Theo dõi tiến trình xử lý, nhật ký trạng thái và vận chuyển các kit Gundam của bạn.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            Đang tải dữ liệu đơn hàng...
          </div>
        ) : error ? (
          <div style={{ background: '#fff5f5', color: '#c53030', padding: '16px', borderLeft: '4px solid #e53e3e' }}>
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📦</span>
            <h3>Bạn chưa có đơn hàng nào</h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
              Hãy chọn ngay cho mình một mẫu Gunpla ưng ý và trải nghiệm lắp ráp ngay hôm nay!
            </p>
            <Link to="/#shop" className="primary-button">
              Khám phá sản phẩm ↗
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {orders.map((order) => {
              const statusInfo = statusLabels[order.status] || { text: order.status, color: '#4a5568', bg: '#edf2f7' }

              return (
                <article
                  key={order.id}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--line)',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(20, 32, 42, 0.04)'
                  }}
                >
                  {/* ORDER HEADER */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--line)',
                      paddingBottom: '16px',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: 'DM Mono', fontSize: '12px', color: 'var(--muted)' }}>MÃ ĐƠN HÀNG:</span>{' '}
                      <strong style={{ fontFamily: 'DM Mono', fontSize: '15px' }}>{order.order_code}</strong>
                      <span style={{ color: 'var(--muted)', margin: '0 8px' }}>·</span>
                      <small style={{ color: 'var(--muted)' }}>
                        {new Date(order.created_at).toLocaleString('vi-VN')}
                      </small>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '4px',
                          color: statusInfo.color,
                          background: statusInfo.bg,
                          textTransform: 'uppercase'
                        }}
                      >
                        ● {statusInfo.text}
                      </span>
                    </div>
                  </div>

                  {/* ORDER ITEMS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                    {(order.items || []).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '8px 0',
                          borderBottom: '1px dashed #f0ede6'
                        }}
                      >
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=85'}
                          alt={item.product_name}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', background: '#eae6df' }}
                        />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>
                            {item.product_name}
                          </h4>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            {money(item.unit_price)} × {item.quantity}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>
                          {money(item.line_total || item.unit_price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* STATUS TIMELINE LOGS (FROM order_status_logs) */}
                  {order.logs && order.logs.length > 0 && (
                    <div style={{ background: '#fcfbf8', border: '1px solid var(--line)', padding: '14px', marginBottom: '18px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'DM Mono', color: 'var(--accent)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        TIẾN TRÌNH XỬ LÝ ĐƠN HÀNG (TIMELINE LOGS):
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {order.logs.map((log) => (
                          <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px' }}>
                            <span style={{ color: 'var(--accent)', fontSize: '11px' }}>●</span>
                            <div style={{ flex: 1 }}>
                              <strong>{log.note || `Trạng thái: ${log.new_status}`}</strong>
                              {log.operator_name && <small style={{ color: 'var(--muted)', marginLeft: '6px' }}>({log.operator_name})</small>}
                            </div>
                            <small style={{ color: 'var(--muted)', fontFamily: 'DM Mono' }}>
                              {new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                              {new Date(log.created_at).toLocaleDateString('vi-VN')}
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ORDER FOOTER / TOTAL */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      background: '#f9f8f5',
                      padding: '16px',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '420px', lineHeight: 1.5 }}>
                      <strong>Địa chỉ giao:</strong> {order.shipping_address}<br />
                      {order.customer_note && <span><strong>Ghi chú:</strong> {order.customer_note}<br /></span>}
                      <strong>Thanh toán:</strong> {order.payment_method === 'banking' ? 'Chuyển khoản QR' : 'COD (Tiền mặt)'}
                      {order.voucher_code && <span> · Mã: <b>{order.voucher_code}</b> (-{money(order.discount_amount)})</span>}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>Tổng thanh toán:</span>
                      <strong style={{ fontSize: '20px', color: 'var(--accent)' }}>
                        {money(order.total_amount)}
                      </strong>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </div>
  )
}
