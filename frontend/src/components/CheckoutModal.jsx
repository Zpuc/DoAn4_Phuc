import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import apiClient from '../api/client.js'

const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'

export default function CheckoutModal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, totalAmount, clear, isCheckoutOpen, setIsCheckoutOpen, showToast } = useCart()

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')

  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [voucherError, setVoucherError] = useState('')
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isCheckoutOpen) return null

  const shippingFee = totalAmount >= 1500000 || totalAmount === 0 ? 0 : 30000
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0
  const finalTotal = Math.max(0, totalAmount - discountAmount + shippingFee)

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return
    setIsApplyingVoucher(true)
    setVoucherError('')
    try {
      const { data } = await apiClient.get('/vouchers/validate', {
        params: { code: voucherCode.trim(), orderAmount: totalAmount }
      })
      setAppliedVoucher(data)
      showToast(`Áp dụng mã ${data.code} thành công: -${money(data.discountAmount)}`)
    } catch (err) {
      setAppliedVoucher(null)
      setVoucherError(err.response?.data?.message || 'Mã giảm giá không hợp lệ.')
    } finally {
      setIsApplyingVoucher(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setIsCheckoutOpen(false)
      showToast('Vui lòng đăng nhập trước khi hoàn tất đặt hàng.')
      navigate('/dang-nhap')
      return
    }

    if (items.length === 0) {
      setErrorMessage('Giỏ hàng của bạn đang trống.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const payload = {
        shippingAddress: address,
        customerNote: `Người nhận: ${fullName} - SĐT: ${phone}${note ? ` | Ghi chú: ${note}` : ''}`,
        paymentMethod,
        voucherCode: appliedVoucher ? appliedVoucher.code : null,
        discountAmount,
        shippingFee,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity
        }))
      }

      const { data } = await apiClient.post('/orders', payload)
      await clear()
      setIsCheckoutOpen(false)
      showToast(`🎉 Đặt hàng thành công! Mã đơn: ${data.orderCode}`)
      navigate('/don-hang')
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="overlay" onClick={() => setIsCheckoutOpen(false)}>
      <div
        className="checkout-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto', width: 'min(580px, 95%)' }}
      >
        <button className="modal-close" onClick={() => setIsCheckoutOpen(false)}>
          ×
        </button>

        <p className="eyebrow">CHECKOUT / AUTOBOT</p>
        <h2>Hoàn tất đơn hàng</h2>
        <p className="modal-note">
          Vui lòng kiểm tra kỹ thông tin giao hàng và chọn hình thức thanh toán thuận tiện nhất.
        </p>

        {errorMessage && (
          <div style={{ background: '#fff5f5', color: '#c53030', padding: '10px 14px', marginBottom: '18px', borderLeft: '3px solid #e53e3e', fontSize: '13px' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <label>
              Họ và tên người nhận
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </label>
            <label>
              Số điện thoại
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xx xxx xxx"
              />
            </label>
          </div>

          <label>
            Địa chỉ nhận hàng (Số nhà, đường, phường/xã, quận/huyện)
            <textarea
              required
              rows="2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM"
            />
          </label>

          <label>
            Ghi chú giao hàng (Tùy chọn)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Giao giờ hành chính, gọi trước khi đến..."
            />
          </label>

          {/* VOUCHER INPUT */}
          <div style={{ margin: '16px 0', padding: '14px', background: '#ece7de', border: '1px solid var(--line)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
              Mã giảm giá / Voucher
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="VD: AUTOBOT10, GUNDAM50K"
                style={{ flex: 1, background: '#fff', padding: '6px 10px', border: '1px solid var(--line)', textTransform: 'uppercase' }}
              />
              <button
                type="button"
                className="primary-button"
                style={{ padding: '6px 16px' }}
                onClick={handleApplyVoucher}
                disabled={isApplyingVoucher}
              >
                {isApplyingVoucher ? 'Kiểm tra...' : 'Áp dụng'}
              </button>
            </div>
            {voucherError && <small style={{ color: '#c53030', display: 'block', marginTop: '6px' }}>{voucherError}</small>}
            {appliedVoucher && (
              <div style={{ color: '#2b6cb0', fontSize: '12px', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span>✓ {appliedVoucher.description}</span>
                <strong>-{money(appliedVoucher.discountAmount)}</strong>
              </div>
            )}
            <small style={{ color: 'var(--muted)', fontSize: '10px', display: 'block', marginTop: '6px' }}>
              Gợi ý mã hot: <code>AUTOBOT10</code> (Giảm 10% từ 1 triệu), <code>GUNDAM50K</code> (Giảm 50k từ 500k)
            </small>
          </div>

          {/* PAYMENT METHOD */}
          <div style={{ margin: '16px 0' }}>
            <span style={{ fontSize: '11px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--ink)', display: 'block', marginBottom: '8px' }}>
              Phương thức thanh toán
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  border: `1px solid ${paymentMethod === 'cod' ? 'var(--accent)' : 'var(--line)'}`,
                  background: paymentMethod === 'cod' ? '#fff' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="pm"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span style={{ fontSize: '12px' }}>📦 Trả tiền khi nhận (COD)</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  border: `1px solid ${paymentMethod === 'banking' ? 'var(--accent)' : 'var(--line)'}`,
                  background: paymentMethod === 'banking' ? '#fff' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="pm"
                  value="banking"
                  checked={paymentMethod === 'banking'}
                  onChange={() => setPaymentMethod('banking')}
                />
                <span style={{ fontSize: '12px' }}>🏦 Chuyển khoản QR</span>
              </label>
            </div>

            {paymentMethod === 'banking' && (
              <div style={{ marginTop: '10px', padding: '12px', background: '#e2e8f0', fontSize: '12px', lineHeight: 1.6 }}>
                <strong>Thông tin tài khoản AUTOBOT Store:</strong><br />
                - Ngân hàng: <b>MB Bank (Quân Đội)</b><br />
                - Số tài khoản: <b>99998888AUTOBOT</b><br />
                - Chủ tài khoản: <b>AUTOBOT GUNDAM STORE</b><br />
                - Nội dung CK: <b>Họ tên + SĐT đặt hàng</b>
              </div>
            )}
          </div>

          {/* ORDER PRICING SUMMARY */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px', margin: '20px 0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
              <span>{money(totalAmount)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#c53030', marginBottom: '6px' }}>
                <span>Giảm giá voucher</span>
                <span>-{money(discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span>Phí vận chuyển</span>
              <span>{shippingFee === 0 ? <strong style={{ color: '#38a169' }}>Miễn phí</strong> : money(shippingFee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 700, borderTop: '1px dashed var(--line)', paddingTop: '10px' }}>
              <span>Tổng thanh toán</span>
              <strong style={{ color: 'var(--accent)' }}>{money(finalTotal)}</strong>
            </div>
          </div>

          <button className="primary-button full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang tạo đơn hàng...' : `Xác nhận đặt hàng (${money(finalTotal)}) ↗`}
          </button>
        </form>
      </div>
    </div>
  )
}
