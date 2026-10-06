import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import CheckoutModal from '../components/CheckoutModal.jsx'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Form states
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Address Book states
  const [addresses, setAddresses] = useState([])
  const [newRecipient, setNewRecipient] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newAddressLine, setNewAddressLine] = useState('')
  const [newCity, setNewCity] = useState('TP. Hồ Chí Minh')
  const [newIsDefault, setNewIsDefault] = useState(false)
  const [addressMessage, setAddressMessage] = useState('')

  const loadProfile = async () => {
    try {
      const [profileRes, addressesRes] = await Promise.all([
        apiClient.get('/auth/profile'),
        apiClient.get('/addresses')
      ])
      setProfile(profileRes.data)
      setFullName(profileRes.data.full_name || '')
      setPhone(profileRes.data.phone || '')
      setAddress(profileRes.data.address || '')
      setAddresses(addressesRes.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin hồ sơ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/dang-nhap')
      return
    }
    loadProfile()
  }, [user, navigate])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      const payload = { fullName, phone, address }
      if (newPassword) {
        payload.currentPassword = currentPassword
        payload.newPassword = newPassword
      }

      const { data } = await apiClient.put('/auth/profile', payload)
      setMessage(data.message || 'Cập nhật thành công!')
      setCurrentPassword('')
      setNewPassword('')
      const currentUser = JSON.parse(localStorage.getItem('autobot_user') || '{}')
      localStorage.setItem('autobot_user', JSON.stringify({ ...currentUser, fullName, phone, address }))
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật hồ sơ.')
    }
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    setAddressMessage('')
    try {
      await apiClient.post('/addresses', {
        recipientName: newRecipient,
        phone: newPhone,
        addressLine: newAddressLine,
        city: newCity,
        isDefault: newIsDefault
      })
      setAddressMessage('✓ Đã lưu địa chỉ mới vào sổ địa chỉ!')
      setNewRecipient('')
      setNewPhone('')
      setNewAddressLine('')
      setNewIsDefault(false)
      const { data } = await apiClient.get('/addresses')
      setAddresses(data || [])
    } catch (err) {
      setAddressMessage(err.response?.data?.message || 'Không thể thêm địa chỉ.')
    }
  }

  const handleSetDefault = async (addressId) => {
    try {
      await apiClient.put(`/addresses/${addressId}/default`)
      const { data } = await apiClient.get('/addresses')
      setAddresses(data || [])
      setAddressMessage('✓ Đã đặt làm địa chỉ mặc định.')
    } catch {
      // ignore
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Xóa địa chỉ này?')) return
    try {
      await apiClient.delete(`/addresses/${addressId}`)
      setAddresses((prev) => prev.filter((a) => a.id !== addressId))
    } catch {
      // ignore
    }
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main style={{ padding: '60px 8vw 100px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <p className="eyebrow">AUTOBOT / TÀI KHOẢN</p>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: '0 0 12px', letterSpacing: '-0.05em' }}>
          Hồ sơ builder & Sổ địa chỉ
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '32px' }}>
          Quản lý thông tin cá nhân, danh sách địa chỉ giao hàng và đổi mật khẩu bảo vệ tài khoản.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            Đang tải dữ liệu hồ sơ...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* THÔNG TIN CÁ NHÂN */}
            <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '36px', boxShadow: '0 2px 8px rgba(20, 32, 42, 0.04)' }}>
              <h2 style={{ fontSize: '20px', margin: '0 0 20px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                Thông tin tài khoản
              </h2>

              {message && (
                <div style={{ background: '#f0fff4', color: '#276749', padding: '12px 16px', marginBottom: '20px', borderLeft: '4px solid #38a169', fontSize: '13px' }}>
                  ✓ {message}
                </div>
              )}
              {error && (
                <div style={{ background: '#fff5f5', color: '#c53030', padding: '12px 16px', marginBottom: '20px', borderLeft: '4px solid #e53e3e', fontSize: '13px' }}>
                  ✕ {error}
                </div>
              )}

              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', font: '11px DM Mono', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Email đăng ký (Không thể thay đổi)
                  </label>
                  <input
                    disabled
                    value={profile?.email || ''}
                    style={{ width: '100%', padding: '10px 12px', background: '#f7f6f2', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'not-allowed' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', font: '11px DM Mono', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Họ và tên
                  </label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', background: '#fff' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', font: '11px DM Mono', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Số điện thoại
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xx xxx xxx"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', font: '11px DM Mono', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Vai trò
                    </label>
                    <input
                      disabled
                      value={profile?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Khách hàng thành viên'}
                      style={{ width: '100%', padding: '10px 12px', background: '#f7f6f2', border: '1px solid var(--line)', color: 'var(--muted)' }}
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--line)', paddingTop: '20px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '15px', margin: '0 0 6px' }}>Đổi mật khẩu (Tùy chọn)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                    <div>
                      <label style={{ display: 'block', font: '11px DM Mono', marginBottom: '6px' }}>Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', background: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', font: '11px DM Mono', marginBottom: '6px' }}>Mật khẩu mới</label>
                      <input
                        type="password"
                        minLength="6"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', background: '#fff' }}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="primary-button">
                  Lưu thay đổi hồ sơ ↗
                </button>
              </form>
            </div>

            {/* SỔ ĐỊA CHỈ (USER_ADDRESSES TABLE) */}
            <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '36px', boxShadow: '0 2px 8px rgba(20, 32, 42, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                <h2 style={{ fontSize: '20px', margin: 0 }}>
                  Sổ địa chỉ nhận hàng ({addresses.length})
                </h2>
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'DM Mono' }}>BẢNG: USER_ADDRESSES</span>
              </div>

              {addressMessage && (
                <div style={{ background: '#f0fff4', color: '#276749', padding: '10px 14px', marginBottom: '16px', fontSize: '13px' }}>
                  {addressMessage}
                </div>
              )}

              {/* LIST SAVED ADDRESSES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {addresses.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Bạn chưa có địa chỉ phụ nào được lưu.</p>
                ) : (
                  addresses.map((addr) => (
                    <div
                      key={addr.id}
                      style={{
                        padding: '16px',
                        border: `1px solid ${addr.is_default ? 'var(--accent)' : 'var(--line)'}`,
                        background: addr.is_default ? '#fdfcf9' : '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong>{addr.recipient_name}</strong> · <span style={{ color: 'var(--muted)' }}>{addr.phone}</span>
                        {addr.is_default && (
                          <span style={{ marginLeft: '10px', fontSize: '10px', background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: '2px' }}>
                            MẶC ĐỊNH
                          </span>
                        )}
                        <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#4a5568' }}>
                          {addr.address_line}, {addr.city}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!addr.is_default && (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(addr.id)}
                            style={{ fontSize: '11px', padding: '4px 8px', background: 'none', border: '1px solid var(--line)' }}
                          >
                            Đặt mặc định
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          style={{ fontSize: '11px', padding: '4px 8px', color: '#c53030', background: 'none', border: 0 }}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* FORM THÊM ĐỊA CHỈ MỚI */}
              <div style={{ background: '#f8f7f2', padding: '20px', border: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 14px' }}>+ Thêm địa chỉ mới</h3>
                <form onSubmit={handleAddAddress}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <input
                      required
                      placeholder="Tên người nhận"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      style={{ padding: '8px 10px', border: '1px solid var(--line)', background: '#fff' }}
                    />
                    <input
                      required
                      placeholder="Số điện thoại"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      style={{ padding: '8px 10px', border: '1px solid var(--line)', background: '#fff' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <input
                      required
                      placeholder="Địa chỉ (Số nhà, tên đường, phường/xã)"
                      value={newAddressLine}
                      onChange={(e) => setNewAddressLine(e.target.value)}
                      style={{ padding: '8px 10px', border: '1px solid var(--line)', background: '#fff' }}
                    />
                    <input
                      placeholder="Tỉnh/Thành phố"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      style={{ padding: '8px 10px', border: '1px solid var(--line)', background: '#fff' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newIsDefault}
                        onChange={(e) => setNewIsDefault(e.target.checked)}
                      />
                      Đặt làm địa chỉ nhận hàng mặc định
                    </label>

                    <button type="submit" className="primary-button" style={{ padding: '8px 16px' }}>
                      Thêm địa chỉ ↗
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </div>
  )
}
