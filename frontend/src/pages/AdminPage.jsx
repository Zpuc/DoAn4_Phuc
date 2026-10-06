import { useEffect, useMemo, useState } from 'react'
import { Button as AntButton, Card, Table, Tag, message as antMessage, Modal } from 'antd'
import { Link } from 'react-router-dom'
import apiClient from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const emptyProduct = {
  categoryId: '1',
  sku: '',
  name: '',
  grade: 'HG 1/144',
  scale: '1/144',
  price: '',
  oldPrice: '',
  stockQuantity: 10,
  conditionStatus: 'con_hang',
  warrantyMonths: 12,
  warrantyPolicy: 'Bảo hành chính hãng Bandai 12 tháng, hỗ trợ đổi trả runner lỗi.',
  manufacturer: 'Bandai Spirits',
  seriesName: 'Mobile Suit Gundam',
  material: 'PS, ABS, PE',
  detailCount: 220,
  accessories: 'Beam Rifle, Shield, Beam Saber x2, Decal',
  assemblyType: 'Snap-fit (Không dùng keo)',
  origin: 'Nhật Bản',
  description: '',
  imageUrl: '',
  galleryImages: '',
  heightCm: '13.5',
  boxWeightG: '350',
  boxSize: '30 x 19 x 7 cm',
  releaseYear: 2024
}

const emptyVoucher = {
  code: '',
  description: '',
  discountPercent: 0,
  discountAmount: 0,
  minOrderAmount: 0,
  usageLimit: 100,
  isActive: true
}

const emptyArticle = {
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  categoryTag: 'Kỹ thuật ráp',
  relatedGrade: 'Tất cả',
  relatedProductId: ''
}

const emptyNewUser = {
  fullName: '',
  email: '',
  password: '',
  role: 'user'
}

const tabs = [
  { id: 'overview', label: '📊 Tổng quan & Biểu đồ' },
  { id: 'products', label: '📦 Quản lý sản phẩm' },
  { id: 'orders', label: '🧾 Quản lý đơn hàng' },
  { id: 'inventory', label: '🏭 Nhật ký kho hàng' },
  { id: 'users', label: '👤 Quản lý người dùng' },
  { id: 'vouchers', label: '🎟️ Quản lý Voucher' },
  { id: 'reviews', label: '⭐ Quản lý đánh giá' },
  { id: 'categories', label: '🗂️ Danh mục & Thương hiệu' },
  { id: 'articles', label: '📰 Quản lý bài viết' },
  { id: 'revenue', label: '💰 Thống kê doanh thu' }
]

const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'

// Status label helper
const statusLabel = (s) => {
  const map = { da_dat: 'Chờ duyệt', da_xac_nhan: 'Đã xác nhận', dang_giao: 'Đang giao', da_giao: 'Đã giao', da_huy: 'Đã hủy' }
  return map[s] || s
}
const statusColor = (s) => {
  const map = { da_dat: 'gold', da_xac_nhan: 'blue', dang_giao: 'purple', da_giao: 'green', da_huy: 'red' }
  return map[s] || 'default'
}

export default function AdminPage() {
  const { user, logout } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [reviews, setReviews] = useState([])
  const [articles, setArticles] = useState([])
  const [dashboard, setDashboard] = useState({
    summary: { total_revenue: 0, total_orders: 0, confirmed_orders: 0, total_products: 0, total_users: 0 },
    monthlyRevenue: [],
    statusStats: [],
    bestSellers: [],
    lowStock: []
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [form, setForm] = useState(emptyProduct)
  const [editingProductId, setEditingProductId] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [productStockFilter, setProductStockFilter] = useState('all')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [inventoryLogs, setInventoryLogs] = useState([])
  const [adjustProductId, setAdjustProductId] = useState('')
  const [adjustType, setAdjustType] = useState('nhap_kho')
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustNote, setAdjustNote] = useState('')

  // Voucher state
  const [voucherForm, setVoucherForm] = useState(emptyVoucher)
  const [editingVoucherId, setEditingVoucherId] = useState(null)

  // Review state
  const [reviewFilter, setReviewFilter] = useState('all') // all, approved, pending

  // Article state
  const [articleForm, setArticleForm] = useState(emptyArticle)
  const [editingArticleId, setEditingArticleId] = useState(null)

  // Category & Brand state
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '' })
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [brandForm, setBrandForm] = useState({ name: '', slug: '', country: 'Nhật Bản', description: '', logoUrl: '' })
  const [editingBrandId, setEditingBrandId] = useState(null)

  // User state
  const [newUserForm, setNewUserForm] = useState(emptyNewUser)
  const [showNewUserForm, setShowNewUserForm] = useState(false)

  // Order detail modal & filters
  const [orderDetail, setOrderDetail] = useState(null)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')

  // Review filters
  const [reviewSearch, setReviewSearch] = useState('')
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all')

  // Voucher usages
  const [voucherUsages, setVoucherUsages] = useState([])
  const [showVoucherUsagesModal, setShowVoucherUsagesModal] = useState(false)
  const [voucherUsagesLoading, setVoucherUsagesLoading] = useState(false)

  // CSV Export utility
  const exportToCSV = (filename, rows, headers) => {
    if (!rows || !rows.length) {
      antMessage.warning('Không có dữ liệu để xuất!')
      return
    }
    const csvContent = '\uFEFF' + [
      headers.map(h => `"${(h.label || '').replace(/"/g, '""')}"`).join(','),
      ...rows.map(row =>
        headers.map(h => {
          let val = typeof h.key === 'function' ? h.key(row) : row[h.key]
          if (val === null || val === undefined) val = ''
          return `"${String(val).replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    antMessage.success(`Đã xuất file ${filename}.csv thành công!`)
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !productSearch.trim() ||
        p.name.toLowerCase().includes(productSearch.toLowerCase().trim()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase().trim()))

      const matchCategory =
        productCategoryFilter === 'all' ||
        String(p.category_id) === String(productCategoryFilter) ||
        (p.category_name && p.category_name.toLowerCase().includes(productCategoryFilter.toLowerCase()))

      const matchStock =
        productStockFilter === 'all' ||
        (productStockFilter === 'con_hang' && p.stock_quantity > 0) ||
        (productStockFilter === 'het_hang' && p.stock_quantity <= 0) ||
        (productStockFilter === 'sap_het' && p.stock_quantity > 0 && p.stock_quantity <= 5)

      return matchSearch && matchCategory && matchStock
    })
  }, [products, productSearch, productCategoryFilter, productStockFilter])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch =
        !orderSearch.trim() ||
        (o.order_code && o.order_code.toLowerCase().includes(orderSearch.toLowerCase().trim())) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(orderSearch.toLowerCase().trim())) ||
        (o.customer_phone && o.customer_phone.includes(orderSearch.trim()))
      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter
      return matchSearch && matchStatus
    })
  }, [orders, orderSearch, orderStatusFilter])

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchStatus =
        reviewFilter === 'all' ||
        (reviewFilter === 'approved' && r.is_approved) ||
        (reviewFilter === 'pending' && !r.is_approved)

      const matchRating =
        reviewRatingFilter === 'all' || String(r.rating) === String(reviewRatingFilter)

      const matchSearch =
        !reviewSearch.trim() ||
        (r.product_name && r.product_name.toLowerCase().includes(reviewSearch.toLowerCase().trim())) ||
        (r.user_name && r.user_name.toLowerCase().includes(reviewSearch.toLowerCase().trim())) ||
        (r.comment && r.comment.toLowerCase().includes(reviewSearch.toLowerCase().trim()))

      return matchStatus && matchRating && matchSearch
    })
  }, [reviews, reviewFilter, reviewRatingFilter, reviewSearch])

  // System notification counts
  const pendingOrdersCount = useMemo(() => orders.filter(o => o.status === 'da_dat').length, [orders])
  const pendingReviewsCount = useMemo(() => reviews.filter(r => !r.is_approved).length, [reviews])
  const lowStockCount = useMemo(() => products.filter(p => p.stock_quantity <= 5).length, [products])

  const loadData = async () => {
    try {
      const [productResponse, categoryResponse, orderResponse, userResponse, dashboardResponse, inventoryResponse, brandResponse] = await Promise.all([
        apiClient.get('/products?limit=100'),
        apiClient.get('/categories'),
        apiClient.get('/orders'),
        apiClient.get('/users'),
        apiClient.get('/dashboard'),
        apiClient.get('/inventory/logs').catch(() => ({ data: [] })),
        apiClient.get('/brands').catch(() => ({ data: [] }))
      ])

      setProducts(productResponse.data.data || [])
      setCategories(categoryResponse.data || [])
      setOrders(orderResponse.data || [])
      setUsers(userResponse.data || [])
      setDashboard(dashboardResponse.data || {})
      setInventoryLogs(inventoryResponse.data || [])
      setBrands(brandResponse.data || [])
    } catch {
      antMessage.error('Không tải được dữ liệu quản trị.')
    }
  }

  const loadVouchers = async () => {
    try {
      const { data } = await apiClient.get('/vouchers')
      setVouchers(data || [])
    } catch { /* ignore */ }
  }

  const loadReviews = async () => {
    try {
      const { data } = await apiClient.get('/reviews')
      setReviews(data || [])
    } catch { /* ignore */ }
  }

  const loadArticles = async () => {
    try {
      const { data } = await apiClient.get('/articles/all')
      setArticles(data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData()
      loadVouchers()
      loadReviews()
      loadArticles()
    }
  }, [user])

  // ==================== PRODUCT HANDLERS ====================
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const fullUrl = `http://localhost:4000${data.url}`
      setForm((prev) => ({ ...prev, imageUrl: fullUrl }))
      antMessage.success('Tải ảnh lên máy chủ thành công!')
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Tải ảnh thất bại.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEditProduct = (prod) => {
    setEditingProductId(prod.id)
    setForm({
      categoryId: String(prod.category_id || '1'),
      sku: prod.sku || '',
      name: prod.name || '',
      grade: prod.grade || 'HG 1/144',
      scale: prod.scale || '1/144',
      price: prod.price || '',
      oldPrice: prod.old_price || '',
      stockQuantity: prod.stock_quantity ?? 10,
      conditionStatus: prod.condition_status || 'con_hang',
      warrantyMonths: prod.warranty_months || 12,
      warrantyPolicy: prod.warranty_policy || '',
      manufacturer: prod.manufacturer || 'Bandai Spirits',
      seriesName: prod.series_name || 'Mobile Suit Gundam',
      material: prod.material || 'PS, ABS, PE',
      detailCount: prod.detail_count || '',
      accessories: prod.accessories || '',
      assemblyType: prod.assembly_type || 'Snap-fit (Không dùng keo)',
      origin: prod.origin || 'Nhật Bản',
      description: prod.description || '',
      imageUrl: prod.image_url || '',
      galleryImages: Array.isArray(prod.gallery_images)
        ? prod.gallery_images.join(' | ')
        : (prod.gallery_images || ''),
      heightCm: prod.height_cm || '',
      boxWeightG: prod.box_weight_g || '',
      boxSize: prod.box_size || '',
      releaseYear: prod.release_year || 2024
    })
    const formEl = document.getElementById('product-form-card')
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' })
    antMessage.info(`Đã nạp thông tin "${prod.name}" vào biểu mẫu`)
  }

  const handleCancelEdit = () => {
    setEditingProductId(null)
    setForm(emptyProduct)
    antMessage.info('Đã hủy chọn sản phẩm.')
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        ...form,
        categoryId: Number(form.categoryId),
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        stockQuantity: Number(form.stockQuantity),
        warrantyMonths: Number(form.warrantyMonths),
        detailCount: form.detailCount ? Number(form.detailCount) : null,
        heightCm: form.heightCm ? Number(form.heightCm) : null,
        boxWeightG: form.boxWeightG ? Number(form.boxWeightG) : null,
        releaseYear: form.releaseYear ? Number(form.releaseYear) : null,
        galleryImages: form.galleryImages
          ? String(form.galleryImages).split('|').map((item) => item.trim()).filter(Boolean)
          : []
      }

      if (editingProductId) {
        await apiClient.put(`/products/${editingProductId}`, payload)
        antMessage.success(`Đã cập nhật sản phẩm "${form.name}" thành công!`)
        setEditingProductId(null)
      } else {
        await apiClient.post('/products', payload)
        antMessage.success('Đã tạo và lưu sản phẩm mới vào MySQL thành công!')
      }

      setForm(emptyProduct)
      await loadData()
    } catch (error) {
      antMessage.error(error.response?.data?.message || 'Không thể lưu sản phẩm.')
    }
  }

  const removeProduct = async (id, name = 'sản phẩm này') => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa/ngừng bán "${name}"?`)) return
    try {
      await apiClient.delete(`/products/${id}`)
      antMessage.success(`Đã xóa/ngừng bán "${name}" thành công.`)
      await loadData()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Không thể xóa sản phẩm.')
    }
  }

  // ==================== ORDER HANDLERS ====================
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus })
      antMessage.success(`Đã cập nhật đơn hàng #${orderId} sang trạng thái: ${statusLabel(newStatus)}`)
      await loadData()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái đơn hàng.')
    }
  }

  const handleViewOrderDetail = async (orderId) => {
    setOrderDetailLoading(true)
    try {
      const { data } = await apiClient.get(`/orders/${orderId}`)
      setOrderDetail(data)
    } catch (err) {
      antMessage.error('Không thể tải chi tiết đơn hàng.')
    } finally {
      setOrderDetailLoading(false)
    }
  }

  const handlePrintInvoice = () => {
    if (!orderDetail) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      antMessage.error('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép popup để in hóa đơn.')
      return
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hóa đơn ${orderDetail.order_code}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 32px; color: #1a202c; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #2d3748; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { font-size: 22px; font-weight: 800; letter-spacing: 1px; color: #e53e3e; }
            .title { font-size: 16px; font-weight: 600; margin-top: 4px; }
            .code { font-family: monospace; font-size: 13px; color: #718096; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 13px; margin-bottom: 24px; padding: 12px; background: #f7fafc; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e0; padding: 8px 12px; }
            th { background: #edf2f7; text-align: left; }
            .right { text-align: right; }
            .center { text-align: center; }
            .totals { margin-left: auto; width: 320px; font-size: 13px; line-height: 2; }
            .grand-total { font-size: 16px; font-weight: 700; color: #e53e3e; border-top: 2px solid #2d3748; padding-top: 6px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #718096; border-top: 1px dashed #cbd5e0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">AUTOBOT GUNDAM STORE</div>
            <div class="title">HÓA ĐƠN BÁN HÀNG & PHIẾU GIAO NHẬN</div>
            <div class="code">Mã đơn: ${orderDetail.order_code} | Ngày đặt: ${new Date(orderDetail.created_at).toLocaleString('vi-VN')}</div>
          </div>
          <div class="grid">
            <div>
              <strong>THÔNG TIN KHÁCH HÀNG:</strong><br/>
              Họ tên: ${orderDetail.customer_name}<br/>
              Số điện thoại: ${orderDetail.customer_phone || 'N/A'}<br/>
              Email: ${orderDetail.customer_email}<br/>
              Địa chỉ nhận: ${orderDetail.shipping_address}
            </div>
            <div>
              <strong>THÔNG TIN ĐƠN HÀNG:</strong><br/>
              Hình thức thanh toán: ${orderDetail.payment_method === 'banking' ? 'Chuyển khoản' : 'Thanh toán khi nhận hàng (COD)'}<br/>
              Trạng thái: ${statusLabel(orderDetail.status)}<br/>
              ${orderDetail.voucher_code ? `Mã voucher áp dụng: <strong>${orderDetail.voucher_code}</strong><br/>` : ''}
              ${orderDetail.customer_note ? `Ghi chú: <em>${orderDetail.customer_note}</em>` : ''}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th class="center" style="width: 40px;">STT</th>
                <th>Sản phẩm Gunpla</th>
                <th class="right" style="width: 120px;">Đơn giá</th>
                <th class="center" style="width: 60px;">SL</th>
                <th class="right" style="width: 130px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${(orderDetail.items || []).map((it, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td><strong>${it.product_name}</strong> ${it.grade ? `<span style="color:#718096;font-size:11px;">(${it.grade})</span>` : ''}</td>
                  <td class="right">${money(it.unit_price)}</td>
                  <td class="center">${it.quantity}</td>
                  <td class="right"><strong>${money(it.line_total || it.unit_price * it.quantity)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div style="display:flex; justify-content:space-between;">
              <span>Tạm tính tiền hàng:</span>
              <strong>${money(orderDetail.subtotal)}</strong>
            </div>
            ${orderDetail.discount_amount > 0 ? `
              <div style="display:flex; justify-content:space-between; color:#e53e3e;">
                <span>Giảm giá (${orderDetail.voucher_code || 'Voucher'}):</span>
                <strong>-${money(orderDetail.discount_amount)}</strong>
              </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between;">
              <span>Phí vận chuyển:</span>
              <strong>${money(orderDetail.shipping_fee)}</strong>
            </div>
            <div class="grand-total" style="display:flex; justify-content:space-between;">
              <span>TỔNG THANH TOÁN:</span>
              <span>${money(orderDetail.total_amount)}</span>
            </div>
          </div>
          <div class="footer">
            Cảm ơn quý khách đã mua sắm tại AUTOBOT! Chúc bạn lắp ráp mô hình vui vẻ.<br/>
            Hotline hỗ trợ: 0987.654.321 — Website: autobot.vn
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // ==================== INVENTORY HANDLERS ====================
  const handleAdjustStock = async (e) => {
    e.preventDefault()
    if (!adjustProductId) {
      antMessage.warning('Vui lòng chọn sản phẩm.')
      return
    }
    try {
      const { data } = await apiClient.post('/inventory/adjust', {
        productId: Number(adjustProductId),
        changeType: adjustType,
        quantity: Number(adjustQty),
        note: adjustNote
      })
      antMessage.success(data.message || 'Đã điều chỉnh kho thành công!')
      setAdjustQty('')
      setAdjustNote('')
      await loadData()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Không thể điều chỉnh tồn kho.')
    }
  }

  // ==================== VOUCHER HANDLERS ====================
  const submitVoucher = async (e) => {
    e.preventDefault()
    try {
      if (editingVoucherId) {
        await apiClient.put(`/vouchers/${editingVoucherId}`, voucherForm)
        antMessage.success('Đã cập nhật voucher!')
        setEditingVoucherId(null)
      } else {
        await apiClient.post('/vouchers', voucherForm)
        antMessage.success('Đã tạo mã giảm giá mới!')
      }
      setVoucherForm(emptyVoucher)
      await loadVouchers()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Lỗi khi lưu voucher.')
    }
  }

  const editVoucher = (v) => {
    setEditingVoucherId(v.id)
    setVoucherForm({
      code: v.code,
      description: v.description || '',
      discountPercent: v.discount_percent || 0,
      discountAmount: v.discount_amount || 0,
      minOrderAmount: v.min_order_amount || 0,
      usageLimit: v.usage_limit || 100,
      isActive: v.is_active
    })
  }

  const deleteVoucher = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa voucher này?')) return
    try {
      await apiClient.delete(`/vouchers/${id}`)
      antMessage.success('Đã xóa voucher.')
      await loadVouchers()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Không thể xóa voucher.')
    }
  }

  const loadVoucherUsages = async () => {
    setVoucherUsagesLoading(true)
    try {
      const { data } = await apiClient.get('/vouchers/usages')
      setVoucherUsages(data || [])
      setShowVoucherUsagesModal(true)
    } catch {
      antMessage.error('Không thể tải lịch sử sử dụng voucher.')
    } finally {
      setVoucherUsagesLoading(false)
    }
  }

  // ==================== REVIEW HANDLERS ====================
  const handleApproveReview = async (id, isApproved) => {
    try {
      await apiClient.patch(`/reviews/${id}/approve`, { isApproved })
      antMessage.success(isApproved ? 'Đã duyệt đánh giá.' : 'Đã ẩn đánh giá.')
      await loadReviews()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Lỗi khi cập nhật đánh giá.')
    }
  }

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return
    try {
      await apiClient.delete(`/reviews/${id}`)
      antMessage.success('Đã xóa đánh giá.')
      await loadReviews()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Không thể xóa đánh giá.')
    }
  }

  // ==================== ARTICLE HANDLERS ====================
  const submitArticle = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...articleForm,
        relatedProductId: articleForm.relatedProductId ? Number(articleForm.relatedProductId) : null
      }
      if (editingArticleId) {
        await apiClient.put(`/articles/${editingArticleId}`, payload)
        antMessage.success('Đã cập nhật bài viết!')
        setEditingArticleId(null)
      } else {
        await apiClient.post('/articles', payload)
        antMessage.success('Đã xuất bản bài viết mới!')
      }
      setArticleForm(emptyArticle)
      await loadArticles()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Lỗi khi lưu bài viết.')
    }
  }

  const editArticle = (a) => {
    setEditingArticleId(a.id)
    setArticleForm({
      title: a.title || '',
      excerpt: a.excerpt || '',
      content: a.content || '',
      coverImage: a.cover_image || '',
      categoryTag: a.category_tag || 'Kỹ thuật ráp',
      relatedGrade: a.related_grade || 'Tất cả',
      relatedProductId: a.related_product_id || '',
      isPublished: a.is_published ?? true
    })
    document.getElementById('article-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const deleteArticle = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return
    try {
      await apiClient.delete(`/articles/${id}`)
      antMessage.success('Đã xóa bài viết.')
      await loadArticles()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Không thể xóa bài viết.')
    }
  }

  // ==================== CATEGORY HANDLERS ====================
  const submitCategory = async (e) => {
    e.preventDefault()
    try {
      if (editingCategoryId) {
        await apiClient.put(`/categories/${editingCategoryId}`, categoryForm)
        antMessage.success('Đã cập nhật danh mục!')
        setEditingCategoryId(null)
      } else {
        await apiClient.post('/categories', categoryForm)
        antMessage.success('Đã tạo danh mục mới!')
      }
      setCategoryForm({ name: '', slug: '', description: '' })
      await loadData()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Lỗi khi lưu danh mục.')
    }
  }

  const deleteCategory = async (id) => {
    if (!window.confirm('Xóa danh mục sẽ ảnh hưởng đến sản phẩm. Bạn chắc chắn?')) return
    try {
      await apiClient.delete(`/categories/${id}`)
      antMessage.success('Đã xóa danh mục.')
      await loadData()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Không thể xóa danh mục.')
    }
  }

  // ==================== BRAND HANDLERS ====================
  const submitBrand = async (e) => {
    e.preventDefault()
    try {
      if (editingBrandId) {
        await apiClient.put(`/brands/${editingBrandId}`, brandForm)
        antMessage.success('Đã cập nhật thương hiệu!')
        setEditingBrandId(null)
      } else {
        await apiClient.post('/brands', brandForm)
        antMessage.success('Đã tạo thương hiệu mới!')
      }
      setBrandForm({ name: '', slug: '', country: 'Nhật Bản', description: '', logoUrl: '' })
      await loadData()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Lỗi khi lưu thương hiệu.')
    }
  }

  const deleteBrand = async (id) => {
    if (!window.confirm('Xóa thương hiệu có thể ảnh hưởng đến sản phẩm. Bạn chắc chắn?')) return
    try {
      await apiClient.delete(`/brands/${id}`)
      antMessage.success('Đã xóa thương hiệu.')
      await loadData()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Không thể xóa thương hiệu.')
    }
  }

  // ==================== USER HANDLERS ====================
  const handleUpdateUser = async (userId, updates) => {
    try {
      await apiClient.put(`/users/${userId}`, updates)
      antMessage.success('Đã cập nhật tài khoản!')
      await loadData()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Lỗi khi cập nhật.')
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post('/users', newUserForm)
      antMessage.success('Đã tạo tài khoản mới!')
      setNewUserForm(emptyNewUser)
      setShowNewUserForm(false)
      await loadData()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Lỗi khi tạo tài khoản.')
    }
  }

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${name}"?`)) return
    try {
      await apiClient.delete(`/users/${userId}`)
      antMessage.success('Đã xóa tài khoản.')
      await loadData()
    } catch (err) {
      antMessage.error(err.response?.data?.message || 'Không thể xóa tài khoản.')
    }
  }

  // ==================== COMPUTED VALUES ====================
  const revenue = useMemo(() => Number(dashboard.summary?.total_revenue || 0), [dashboard])
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label?.replace(/^[^\s]+\s/, '') || 'Tổng quan'

  // ==================== TABLE COLUMNS ====================

  const inventoryColumns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (t) => new Date(t).toLocaleString('vi-VN')
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, r) => (
        <div>
          <strong>{r.product_name}</strong>{' '}
          <small style={{ color: 'var(--muted)' }}>({r.product_sku})</small>
        </div>
      )
    },
    {
      title: 'Loại biến động',
      dataIndex: 'change_type',
      key: 'change_type',
      width: 140,
      render: (type) => {
        const map = {
          nhap_kho: { text: 'Nhập kho', color: 'green' },
          xuat_ban: { text: 'Xuất bán', color: 'blue' },
          huy_don_hoan_kho: { text: 'Hoàn trả kho', color: 'purple' },
          dieu_chinh: { text: 'Điều chỉnh', color: 'orange' }
        }
        const info = map[type] || { text: type, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity_change',
      key: 'quantity_change',
      width: 100,
      render: (qty) => (
        <strong style={{ color: qty > 0 ? '#38a169' : '#e53e3e' }}>
          {qty > 0 ? `+${qty}` : qty}
        </strong>
      )
    },
    {
      title: 'Tồn: Trước → Sau',
      key: 'stock',
      width: 140,
      render: (_, r) => <span>{r.previous_stock} → <b>{r.current_stock}</b></span>
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note'
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 130,
      render: (n) => n || 'Hệ thống'
    }
  ]

  const productColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name, product) => (
        <div className="ant-product-name" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {product.image_url && (
            <img
              src={product.image_url}
              alt=""
              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '3px' }}
            />
          )}
          <div>
            <strong>{name}</strong>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
              {product.category_name} · {product.sku}
            </span>
          </div>
        </div>
      )
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      render: (price) => money(price)
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 120,
      render: (stock) => <Tag color={stock > 0 ? 'green' : 'red'}>{stock} bộ</Tag>
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      render: (_, product) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <AntButton
            type="default"
            size="small"
            style={{ borderColor: 'var(--ink)', fontWeight: 600 }}
            onClick={() => handleEditProduct(product)}
          >
            ✏️ Sửa
          </AntButton>
          <AntButton
            type="primary"
            danger
            size="small"
            onClick={() => removeProduct(product.id, product.name)}
          >
            🗑️ Xóa
          </AntButton>
        </div>
      )
    }
  ]

  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'order_code',
      key: 'order_code',
      render: (code, order) => (
        <a onClick={() => handleViewOrderDetail(order.id)} style={{ cursor: 'pointer', fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--accent)', textDecoration: 'underline' }}>
          {code}
        </a>
      )
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, order) => (
        <div className="ant-product-name">
          <strong>{order.customer_name}</strong>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
            {order.customer_phone} · {order.customer_email}
          </span>
        </div>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount, order) => (
        <div>
          <strong style={{ color: 'var(--accent)' }}>{money(amount)}</strong>
          {order.voucher_code && (
            <span style={{ display: 'block', fontSize: '10px', color: '#2b6cb0' }}>
              Voucher: {order.voucher_code}
            </span>
          )}
        </div>
      )
    },
    {
      title: 'Thanh toán',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (m) => <Tag color={m === 'banking' ? 'cyan' : 'default'}>{m === 'banking' ? 'Chuyển khoản' : 'COD'}</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, order) => (
        <select
          className="admin-status-select"
          value={status}
          onChange={(event) => handleUpdateOrderStatus(order.id, event.target.value)}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid var(--line)',
            background:
              status === 'da_giao'
                ? '#c6f6d5'
                : status === 'dang_giao'
                  ? '#e9d8fd'
                  : status === 'da_xac_nhan'
                    ? '#bee3f8'
                    : status === 'da_huy'
                      ? '#fed7d7'
                      : '#fefcbf'
          }}
        >
          <option value="da_dat">1. Chờ duyệt</option>
          <option value="da_xac_nhan">2. Đã xác nhận</option>
          <option value="dang_giao">3. Đang giao hàng</option>
          <option value="da_giao">4. Đã giao xong</option>
          <option value="da_huy">5. Đã hủy đơn</option>
        </select>
      )
    },
    {
      title: 'Chi tiết',
      key: 'detail',
      width: 90,
      render: (_, order) => (
        <AntButton type="link" size="small" onClick={() => handleViewOrderDetail(order.id)}>
          📋 Xem
        </AntButton>
      )
    }
  ]

  const userColumns = [
    { title: 'Họ tên', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone', render: (p) => p || 'Chưa cập nhật' },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => (
        <select
          value={role}
          onChange={(e) => handleUpdateUser(record.id, { fullName: record.full_name, role: e.target.value, isActive: record.is_active })}
          style={{ padding: '3px 6px', fontSize: '12px', border: '1px solid var(--line)', borderRadius: '3px' }}
        >
          <option value="user">Khách hàng</option>
          <option value="admin">Quản trị viên</option>
        </select>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive, record) => (
        <AntButton
          size="small"
          type={isActive ? 'default' : 'primary'}
          danger={isActive}
          onClick={() => handleUpdateUser(record.id, { fullName: record.full_name, role: record.role, isActive: !isActive })}
        >
          {isActive ? '🔒 Khóa' : '🔓 Mở khóa'}
        </AntButton>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (d) => new Date(d).toLocaleDateString('vi-VN')
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        record.id !== user?.id && (
          <AntButton size="small" danger type="text" onClick={() => handleDeleteUser(record.id, record.full_name)}>
            🗑️
          </AntButton>
        )
      )
    }
  ]

  const reviewColumns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {r.product_image && <img src={r.product_image} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 3 }} />}
          <div>
            <strong style={{ fontSize: '12px' }}>{r.product_name}</strong>
            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{r.product_sku}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Khách hàng',
      key: 'user',
      render: (_, r) => (
        <div>
          <strong>{r.user_name}</strong>
          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{r.user_email}</div>
        </div>
      )
    },
    {
      title: 'Đánh giá',
      key: 'rating',
      width: 100,
      render: (_, r) => <span style={{ fontSize: '14px' }}>{'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
    },
    {
      title: 'Nội dung',
      dataIndex: 'comment',
      key: 'comment',
      render: (c) => <span style={{ fontSize: '12px' }}>{c || <em style={{ color: 'var(--muted)' }}>Không có nội dung</em>}</span>
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      render: (_, r) => <Tag color={r.is_approved ? 'green' : 'orange'}>{r.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}</Tag>
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <AntButton size="small" type={r.is_approved ? 'default' : 'primary'} onClick={() => handleApproveReview(r.id, !r.is_approved)}>
            {r.is_approved ? '👁️ Ẩn' : '✅ Duyệt'}
          </AntButton>
          <AntButton size="small" danger onClick={() => handleDeleteReview(r.id)}>🗑️</AntButton>
        </div>
      )
    }
  ]

  const voucherColumns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', render: (c) => <Tag color="blue" style={{ fontFamily: 'DM Mono', fontWeight: 700 }}>{c}</Tag> },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', render: (d) => <span style={{ fontSize: '12px' }}>{d || '—'}</span> },
    {
      title: 'Giảm giá',
      key: 'discount',
      width: 130,
      render: (_, v) => v.discount_percent > 0 ? <Tag color="volcano">{v.discount_percent}%</Tag> : <Tag color="green">{money(v.discount_amount)}</Tag>
    },
    { title: 'Đơn tối thiểu', dataIndex: 'min_order_amount', key: 'min', width: 130, render: (a) => money(a) },
    {
      title: 'Sử dụng',
      key: 'usage',
      width: 100,
      render: (_, v) => <span>{v.times_used} / {v.usage_limit}</span>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 90,
      render: (a) => <Tag color={a ? 'green' : 'red'}>{a ? 'Hoạt động' : 'Tắt'}</Tag>
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (_, v) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <AntButton size="small" onClick={() => editVoucher(v)}>✏️</AntButton>
          <AntButton size="small" danger onClick={() => deleteVoucher(v.id)}>🗑️</AntButton>
        </div>
      )
    }
  ]

  const articleColumns = [
    {
      title: 'Bài viết',
      key: 'title',
      render: (_, a) => (
        <div>
          <strong>{a.title}</strong>
          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>/{a.slug}</div>
        </div>
      )
    },
    { title: 'Chuyên mục', dataIndex: 'category_tag', key: 'category_tag', width: 120, render: (c) => <Tag>{c}</Tag> },
    { title: 'Grade', dataIndex: 'related_grade', key: 'related_grade', width: 100 },
    { title: 'Lượt xem', dataIndex: 'views_count', key: 'views', width: 90, render: (v) => <strong>{v}</strong> },
    {
      title: 'Xuất bản',
      dataIndex: 'is_published',
      key: 'published',
      width: 90,
      render: (p) => <Tag color={p ? 'green' : 'orange'}>{p ? 'Công khai' : 'Nháp'}</Tag>
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (_, a) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <AntButton size="small" onClick={() => editArticle(a)}>✏️ Sửa</AntButton>
          <AntButton size="small" danger onClick={() => deleteArticle(a.id)}>🗑️</AntButton>
        </div>
      )
    }
  ]

  if (!user || user.role !== 'admin') {
    return (
      <main className="simple-page" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Link to="/" style={{ color: 'var(--muted)', fontSize: '13px' }}>
          ← Về trang chủ
        </Link>
        <h1 style={{ margin: '20px 0' }}>Khu vực quản trị AUTOBOT</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
          Bạn cần đăng nhập bằng tài khoản Quản trị viên (admin@autobot.local) để xem trang này.
        </p>
        <Link to="/dang-nhap" className="primary-button">
          Đăng nhập ngay ↗
        </Link>
      </main>
    )
  }

  // Monthly revenue chart maximum calculation for relative percentage heights
  const maxRevenue = Math.max(...(dashboard.monthlyRevenue || []).map((m) => Number(m.revenue)), 1)

  // =============================== INLINE FORM STYLES ===============================
  const formGroupStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }
  const inputStyle = { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--line)', fontFamily: 'inherit' }
  const sectionTitleStyle = { fontSize: '13px', fontFamily: 'DM Mono', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 14px', borderBottom: '1px solid var(--line)', paddingBottom: '6px' }

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <Link to="/">← Quay lại AUTOBOT Storefront</Link>
        <div>
          <span>👑 {user.fullName || user.email} (Quản trị viên)</span>
          <button onClick={() => { logout(); window.location.href = '/' }}>Đăng xuất</button>
        </div>
      </header>

      <div className="admin-dashboard">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span>AB</span>
            <div>
              <p className="eyebrow">AUTOBOT GUNDAM</p>
              <strong>Admin Panel</strong>
            </div>
          </div>
          <nav className="admin-nav">
            {tabs.map((tab) => {
              let badgeCount = 0
              if (tab.id === 'orders') badgeCount = pendingOrdersCount
              if (tab.id === 'reviews') badgeCount = pendingReviewsCount
              if (tab.id === 'inventory') badgeCount = lowStockCount
              return (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? 'active' : ''}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                >
                  <span>{tab.label}</span>
                  {badgeCount > 0 && (
                    <span
                      style={{
                        background: tab.id === 'orders' ? '#e53e3e' : tab.id === 'reviews' ? '#dd6b20' : '#d69e2e',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '10px',
                        lineHeight: '16px'
                      }}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        <section className="admin-content">
          <div className="admin-heading">
            <p className="eyebrow">AUTOBOT / ADMIN / {activeTabLabel.toUpperCase()}</p>
            <h1>{activeTab === 'overview' ? 'Dashboard & Thống kê kinh doanh' : activeTabLabel}</h1>
          </div>

          {/* ========================= OVERVIEW TAB ========================= */}
          {activeTab === 'overview' && (
            <>
              {/* URGENT ALERTS BANNER */}
              {(pendingOrdersCount > 0 || pendingReviewsCount > 0 || lowStockCount > 0) && (
                <div style={{ background: '#fffaf0', border: '1px solid #fbd38d', padding: '16px 20px', marginBottom: '24px', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ color: '#c05621', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🚨 TRUNG TÂM CẢNH BÁO & CẦN XỬ LÝ NGAY
                    </strong>
                    <span style={{ fontSize: '12px', color: '#744210' }}>Hệ thống tự động phát hiện</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    {pendingOrdersCount > 0 && (
                      <div style={{ background: '#fff', padding: '10px 14px', border: '1px solid #fed7d7', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#e53e3e', fontSize: '13px' }}>🧾 {pendingOrdersCount} đơn chờ duyệt</div>
                          <div style={{ fontSize: '11px', color: '#718096' }}>Khách hàng đang đợi xác nhận</div>
                        </div>
                        <AntButton size="small" type="primary" danger onClick={() => setActiveTab('orders')}>Xử lý →</AntButton>
                      </div>
                    )}
                    {pendingReviewsCount > 0 && (
                      <div style={{ background: '#fff', padding: '10px 14px', border: '1px solid #feebc8', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#dd6b20', fontSize: '13px' }}>⭐ {pendingReviewsCount} đánh giá chờ duyệt</div>
                          <div style={{ fontSize: '11px', color: '#718096' }}>Cần kiểm duyệt trước khi hiển thị</div>
                        </div>
                        <AntButton size="small" type="default" style={{ borderColor: '#dd6b20', color: '#dd6b20' }} onClick={() => setActiveTab('reviews')}>Duyệt →</AntButton>
                      </div>
                    )}
                    {lowStockCount > 0 && (
                      <div style={{ background: '#fff', padding: '10px 14px', border: '1px solid #fefcbf', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#b7791f', fontSize: '13px' }}>⚠️ {lowStockCount} sản phẩm tồn kho thấp</div>
                          <div style={{ fontSize: '11px', color: '#718096' }}>Còn lại dưới 5 bộ Gunpla</div>
                        </div>
                        <AntButton size="small" type="default" style={{ borderColor: '#b7791f', color: '#b7791f' }} onClick={() => setActiveTab('inventory')}>Nhập kho →</AntButton>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ACTION TOOLBAR IN OVERVIEW */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <AntButton
                  type="default"
                  onClick={() => exportToCSV('bao_cao_doanh_thu_autobot', dashboard.monthlyRevenue || [], [
                    { label: 'Tháng', key: 'month_label' },
                    { label: 'Doanh thu (VNĐ)', key: 'revenue' },
                    { label: 'Số đơn hàng', key: 'order_count' }
                  ])}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  📥 Xuất báo cáo doanh thu theo tháng (CSV)
                </AntButton>
              </div>

              {/* TOP STAT METRICS */}
              <div className="stats-grid">
                <div className="stat-card">
                  <span>Tổng doanh thu</span>
                  <strong>{money(revenue)}</strong>
                  <small>Đơn hàng hợp lệ</small>
                </div>
                <div className="stat-card">
                  <span>Đơn hoàn tất/xác nhận</span>
                  <strong>{dashboard.summary?.confirmed_orders || 0} / {dashboard.summary?.total_orders || 0}</strong>
                  <small>Đơn hàng</small>
                </div>
                <div className="stat-card">
                  <span>Sản phẩm kinh doanh</span>
                  <strong>{dashboard.summary?.total_products || 0}</strong>
                  <small>Đang hoạt động trên web</small>
                </div>
                <div className="stat-card">
                  <span>Khách hàng thành viên</span>
                  <strong>{dashboard.summary?.total_users || 0}</strong>
                  <small>Tài khoản khách</small>
                </div>
              </div>

              {/* MONTHLY REVENUE BAR CHART */}
              <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '24px', margin: '30px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--accent)' }}>BIỂU ĐỒ DOANH THU THEO THÁNG</span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '18px' }}>Doanh số bán hàng thực tế</h3>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Cập nhật tự động từ MySQL</span>
                </div>

                {dashboard.monthlyRevenue && dashboard.monthlyRevenue.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '24px',
                      height: '220px',
                      padding: '20px 10px 10px',
                      borderBottom: '2px solid var(--ink)',
                      overflowX: 'auto'
                    }}
                  >
                    {dashboard.monthlyRevenue.map((item, idx) => {
                      const heightPercent = Math.max(15, Math.round((Number(item.revenue) / maxRevenue) * 100))
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 1,
                            minWidth: '60px'
                          }}
                        >
                          <small style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                            {money(item.revenue)}
                          </small>
                          <div
                            style={{
                              width: '100%',
                              height: `${heightPercent}%`,
                              background: 'linear-gradient(180deg, var(--accent) 0%, var(--ink) 100%)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.4s ease'
                            }}
                            title={`Tháng ${item.month_label}: ${money(item.revenue)} (${item.order_count} đơn)`}
                          />
                          <span style={{ fontSize: '11px', fontFamily: 'DM Mono', marginTop: '8px', color: 'var(--ink)' }}>
                            T{item.month_label}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                            {item.order_count} đơn
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                    Chưa có đủ dữ liệu đơn hàng theo tháng.
                  </div>
                )}
              </div>

              {/* SPLIT TABLES */}
              <div className="admin-split">
                <div className="admin-table">
                  <h2>Top sản phẩm bán chạy nhất</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>SL bán</th>
                        <th>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboard.bestSellers || []).map((item) => (
                        <tr key={item.product_id}>
                          <td><strong>{item.product_name}</strong></td>
                          <td><Tag color="blue">{item.quantity_sold}</Tag></td>
                          <td>{money(item.total_sales || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-table">
                  <h2>Cảnh báo tồn kho thấp (≤ 5 bộ)</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Tồn kho</th>
                        <th>Giá bán</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboard.lowStock || []).map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.name}</strong> ({item.sku})</td>
                          <td>
                            <Tag color={item.stock_quantity === 0 ? 'red' : 'orange'}>
                              {item.stock_quantity === 0 ? 'Hết hàng' : `Còn ${item.stock_quantity}`}
                            </Tag>
                          </td>
                          <td>{money(item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ========================= PRODUCTS TAB ========================= */}
          {activeTab === 'products' && (
            <div className="admin-products-page">
              <form className="admin-form product-form" id="product-form-card" onSubmit={submitProduct} style={{ maxWidth: '100%' }}>
                <div className="product-form-heading">
                  <div>
                    <p className="form-kicker">
                      {editingProductId ? `ĐANG CHỌN XEM & CHỈNH SỬA SẢN PHẨM #${editingProductId}` : 'QUẢN LÝ SẢN PHẨM'}
                    </p>
                    <h2>
                      {editingProductId ? `✏️ Chi tiết sản phẩm: ${form.name || `#${editingProductId}`}` : 'Thêm sản phẩm mới vào kho'}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
                      {editingProductId
                        ? 'Tất cả các nhãn (label) bên dưới đã được nạp đầy đủ thông tin chi tiết của sản phẩm. Bạn có thể xem hoặc chỉnh sửa trực tiếp.'
                        : 'Điền đầy đủ thông số kỹ thuật bên dưới để đăng bán mô hình Gunpla mới lên hệ thống.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {editingProductId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{
                          padding: '8px 16px',
                          background: '#e2e8f0',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12.5px',
                          fontFamily: 'inherit',
                          fontWeight: 600,
                          borderRadius: '2px'
                        }}
                      >
                        ✕ Bỏ chọn / Thêm mới
                      </button>
                    )}
                    <a className="product-list-link" href="#product-list">
                      Xem danh sách sản phẩm ↓
                    </a>
                  </div>
                </div>

                {/* ACTIVE PRODUCT HIGHLIGHT CARD */}
                {editingProductId && (
                  <div
                    style={{
                      background: '#fffaf0',
                      border: '1px solid #fbd38d',
                      padding: '16px 20px',
                      marginBottom: '24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {form.imageUrl && (
                        <img
                          src={form.imageUrl}
                          alt=""
                          style={{ width: '56px', height: '56px', objectFit: 'cover', border: '1px solid var(--line)', borderRadius: '3px' }}
                        />
                      )}
                      <div>
                        <span style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                          MÔ HÌNH ĐANG ĐƯỢC CHỌN HIỂN THỊ
                        </span>
                        <h3 style={{ margin: '3px 0', fontSize: '16px', lineHeight: 1.3 }}>{form.name}</h3>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span>Mã SKU: <strong style={{ color: 'var(--dark)' }}>{form.sku}</strong></span>
                          <span>Giá bán: <strong style={{ color: 'var(--accent)' }}>{form.price ? money(form.price) : '0đ'}</strong></span>
                          <span>Tồn kho: <strong style={{ color: 'var(--dark)' }}>{form.stockQuantity} bộ</strong></span>
                          <span>Cấp độ: <strong style={{ color: 'var(--dark)' }}>{form.grade}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" className="primary-button" style={{ padding: '9px 18px', fontSize: '13px' }}>
                        Lưu cập nhật 💾
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{ padding: '9px 14px', background: '#e2e8f0', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 }}
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                )}

                {/* 1. THÔNG TIN NHẬN DIỆN CƠ BẢN */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={sectionTitleStyle}>
                    1. Thông tin nhận diện sản phẩm
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Tên sản phẩm mô hình <span style={{ color: 'red' }}>*</span></label>
                      <input required placeholder="VD: RG 1/144 MSN-04 Sazabi" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Mã SKU định danh <span style={{ color: 'red' }}>*</span></label>
                      <input required placeholder="VD: RG-SAZABI-001" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Danh mục phân loại Grade <span style={{ color: 'red' }}>*</span></label>
                      <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} style={{ width: '100%' }}>
                        <option value="">Chọn danh mục Grade</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{category.name} ({category.slug.toUpperCase()})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
                    <div>
                      <label style={labelStyle}>Cấp độ hiển thị (Grade)</label>
                      <input placeholder="VD: RG 1/144" value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Tỉ lệ mô hình (Scale)</label>
                      <input placeholder="VD: 1/144 hoặc 1/100" value={form.scale} onChange={(event) => setForm({ ...form, scale: event.target.value })} style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* 2. GIÁ BÁN & QUẢN TRỊ KHO */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={sectionTitleStyle}>2. Giá bán & Quản trị kho hàng</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Giá bán thực tế (VNĐ) <span style={{ color: 'red' }}>*</span></label>
                      <input required type="number" min="0" placeholder="VD: 1180000" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Giá gốc niêm yết (VNĐ)</label>
                      <input type="number" min="0" placeholder="VD: 1350000" value={form.oldPrice} onChange={(event) => setForm({ ...form, oldPrice: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Số lượng tồn kho (Bộ) <span style={{ color: 'red' }}>*</span></label>
                      <input required type="number" min="0" placeholder="VD: 15" value={form.stockQuantity} onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Trạng thái kinh doanh</label>
                      <select value={form.conditionStatus} onChange={(event) => setForm({ ...form, conditionStatus: event.target.value })} style={{ width: '100%' }}>
                        <option value="con_hang">Còn hàng</option>
                        <option value="het_hang">Hết hàng</option>
                        <option value="sap_co_hang">Sắp có hàng</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. THÔNG SỐ KỸ THUẬT & GUNDAM SPEC */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={sectionTitleStyle}>3. Thông số kỹ thuật mô hình Gunpla</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Hãng sản xuất</label>
                      <input placeholder="VD: Bandai Spirits" value={form.manufacturer} onChange={(event) => setForm({ ...form, manufacturer: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Dòng phim / Series Gundam</label>
                      <input placeholder="VD: Mobile Suit Gundam UC" value={form.seriesName} onChange={(event) => setForm({ ...form, seriesName: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Số mảnh chi tiết (Part count)</label>
                      <input type="number" placeholder="VD: 380 mảnh" value={form.detailCount} onChange={(event) => setForm({ ...form, detailCount: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Chất liệu nhựa</label>
                      <input placeholder="VD: PS, ABS, PE, PP" value={form.material} onChange={(event) => setForm({ ...form, material: event.target.value })} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '14px' }}>
                    <div>
                      <label style={labelStyle}>Phụ kiện & Vũ khí đi kèm</label>
                      <input placeholder="VD: Beam Rifle, Shield, Beam Saber x2, Decal" value={form.accessories} onChange={(event) => setForm({ ...form, accessories: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phương thức lắp ráp</label>
                      <input placeholder="VD: Snap-fit (Không dùng keo)" value={form.assemblyType} onChange={(event) => setForm({ ...form, assemblyType: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Xuất xứ sản xuất</label>
                      <input placeholder="VD: Nhật Bản" value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value })} style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* 4. ĐÓNG GÓI, KÍCH THƯỚC & BẢO HÀNH */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={sectionTitleStyle}>4. Đóng gói, Kích thước & Bảo hành</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Chiều cao hoàn thiện (cm)</label>
                      <input placeholder="VD: 18.0" value={form.heightCm} onChange={(event) => setForm({ ...form, heightCm: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Trọng lượng hộp (gram)</label>
                      <input placeholder="VD: 720" value={form.boxWeightG} onChange={(event) => setForm({ ...form, boxWeightG: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Kích thước hộp (box size)</label>
                      <input placeholder="VD: 39 x 31 x 11 cm" value={form.boxSize} onChange={(event) => setForm({ ...form, boxSize: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Năm phát hành Bandai</label>
                      <input type="number" placeholder="VD: 2024" value={form.releaseYear} onChange={(event) => setForm({ ...form, releaseYear: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Thời gian bảo hành (Tháng)</label>
                      <input type="number" placeholder="VD: 12" value={form.warrantyMonths} onChange={(event) => setForm({ ...form, warrantyMonths: event.target.value })} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <label style={labelStyle}>Chính sách bảo hành chi tiết</label>
                    <input placeholder="VD: Bảo hành chính hãng Bandai, hỗ trợ đổi trả runner lỗi trong 7 ngày" value={form.warrantyPolicy} onChange={(event) => setForm({ ...form, warrantyPolicy: event.target.value })} style={{ width: '100%' }} />
                  </div>
                </div>

                {/* 5. HÌNH ẢNH & MÔ TẢ CHI TIẾT */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={sectionTitleStyle}>5. Hình ảnh & Giới thiệu chi tiết</h4>
                  {/* MULTER UPLOAD */}
                  <div style={{ background: '#f7f6f2', padding: '16px', border: '1px solid var(--line)', marginBottom: '16px' }}>
                    <label style={labelStyle}>📤 Tải ảnh trực tiếp lên Server (Thư viện Multer):</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploadingImage} style={{ fontSize: '12px' }} />
                      {uploadingImage && <span style={{ fontSize: '12px', color: 'var(--accent)' }}>Đang tải ảnh lên...</span>}
                    </div>
                    {form.imageUrl && (
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={form.imageUrl} alt="Preview" style={{ width: '64px', height: '64px', objectFit: 'cover', border: '1px solid var(--line)', borderRadius: '3px' }} />
                        <small style={{ wordBreak: 'break-all', color: 'var(--muted)' }}>URL ảnh hiện tại: {form.imageUrl}</small>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Đường dẫn ảnh đại diện (Image URL)</label>
                      <input placeholder="https://..." value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Ảnh bộ sưu tập (ngăn cách bởi dấu |)</label>
                      <input placeholder="url1 | url2 | url3" value={form.galleryImages} onChange={(event) => setForm({ ...form, galleryImages: event.target.value })} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Mô tả tóm tắt tính năng & đặc điểm nổi bật của kit</label>
                    <textarea placeholder="Mô tả tóm tắt cấu trúc khung xương, biên độ cử động, gimmick mở giáp..." rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} style={{ width: '100%' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '18px' }}>
                  <button className="primary-button" type="submit" style={{ padding: '12px 28px', fontSize: '14px' }}>
                    {editingProductId ? 'Lưu thay đổi sản phẩm 💾' : 'Lưu & Đăng bán sản phẩm ↗'}
                  </button>
                  {editingProductId && (
                    <button type="button" onClick={handleCancelEdit} style={{ padding: '12px 22px', background: '#e2e8f0', color: 'var(--dark)', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600 }}>
                      ✕ Bỏ chọn (Thêm mới)
                    </button>
                  )}
                </div>
              </form>

              <section className="product-list-section" id="product-list">
                <Card
                  className="product-list-card"
                  title={
                    <div>
                      <span className="form-kicker">DATABASE MYSQL</span>
                      <strong>Danh sách sản phẩm trong kho ({filteredProducts.length} / {products.length})</strong>
                    </div>
                  }
                  extra={<Tag color="volcano">{filteredProducts.length} sản phẩm</Tag>}
                >
                  {/* SEARCH & FILTER BAR */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px', padding: '14px 16px', background: '#faf9f5', border: '1px solid var(--line)' }}>
                    <input
                      type="text"
                      placeholder="🔍 Tìm nhanh theo tên mô hình, mã SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{ flex: '1 1 240px', padding: '9px 14px', fontSize: '13px', border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit' }}
                    />
                    <select value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)} style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit' }}>
                      <option value="all">Tất cả danh mục Grade</option>
                      {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                    <select value={productStockFilter} onChange={(e) => setProductStockFilter(e.target.value)} style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit' }}>
                      <option value="all">Tất cả trạng thái kho</option>
                      <option value="con_hang">Còn hàng (trên 0 bộ)</option>
                      <option value="sap_het">Sắp hết (dưới 5 bộ)</option>
                      <option value="het_hang">Hết hàng (0 bộ)</option>
                    </select>
                    {(productSearch || productCategoryFilter !== 'all' || productStockFilter !== 'all') && (
                      <button type="button" onClick={() => { setProductSearch(''); setProductCategoryFilter('all'); setProductStockFilter('all') }} style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', padding: '0 4px' }}>Xóa lọc</button>
                    )}
                    <AntButton
                      onClick={() => exportToCSV('danh_sach_san_pham_gunpla', products, [
                        { label: 'ID', key: 'id' },
                        { label: 'SKU', key: 'sku' },
                        { label: 'Tên sản phẩm', key: 'name' },
                        { label: 'Danh mục', key: 'category_name' },
                        { label: 'Grade', key: 'grade' },
                        { label: 'Tỉ lệ', key: 'scale' },
                        { label: 'Giá bán (VNĐ)', key: 'price' },
                        { label: 'Tồn kho', key: 'stock_quantity' },
                        { label: 'Hãng sản xuất', key: 'manufacturer' }
                      ])}
                      style={{ fontSize: '12px' }}
                    >
                      📥 Xuất CSV
                    </AntButton>
                    <button type="button" className="primary-button" style={{ padding: '9px 16px', fontSize: '12px', marginLeft: 'auto' }} onClick={() => { setEditingProductId(null); setForm(emptyProduct); document.getElementById('product-form-card')?.scrollIntoView({ behavior: 'smooth' }) }}>
                      + Thêm sản phẩm mới
                    </button>
                  </div>

                  <div style={{ marginBottom: '14px', fontSize: '12.5px', color: '#4a5568', background: '#edf2f7', padding: '9px 14px', borderLeft: '4px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px' }}>💡</span>
                    <span><strong>Mẹo nhanh:</strong> Bấm vào bất kỳ dòng sản phẩm nào trong bảng dưới đây để tự động hiển thị đầy đủ thông tin vào các nhãn (label) và ô nhập ở biểu mẫu phía trên!</span>
                  </div>

                  <Table
                    rowKey="id"
                    columns={productColumns}
                    dataSource={filteredProducts}
                    onRow={(record) => ({
                      onClick: () => handleEditProduct(record),
                      style: { cursor: 'pointer', backgroundColor: record.id === editingProductId ? '#fffaf0' : undefined }
                    })}
                    pagination={{ pageSize: 10, showSizeChanger: false, showQuickJumper: true, showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} sản phẩm` }}
                    size="middle"
                  />
                </Card>
              </section>
            </div>
          )}

          {/* ========================= ORDERS TAB ========================= */}
          {activeTab === 'orders' && (
            <section className="admin-management-section">
              <Card
                className="management-card"
                title={`Quản lý toàn bộ đơn hàng (${filteredOrders.length}/${orders.length})`}
                extra={<Tag color="volcano">{filteredOrders.length} đơn</Tag>}
              >
                {/* ORDER SEARCH & FILTER TOOLBAR */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px', padding: '14px 16px', background: '#faf9f5', border: '1px solid var(--line)' }}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm nhanh theo mã đơn (ORD-...), tên khách, số điện thoại..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{ flex: '1 1 260px', padding: '9px 14px', fontSize: '13px', border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit' }}
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit' }}
                  >
                    <option value="all">Tất cả trạng thái đơn</option>
                    <option value="da_dat">1. Chờ duyệt (Chưa xử lý)</option>
                    <option value="da_xac_nhan">2. Đã xác nhận</option>
                    <option value="dang_giao">3. Đang giao hàng</option>
                    <option value="da_giao">4. Đã giao thành công</option>
                    <option value="da_huy">5. Đã hủy đơn</option>
                  </select>
                  {(orderSearch || orderStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => { setOrderSearch(''); setOrderStatusFilter('all') }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', padding: '0 4px' }}
                    >
                      Xóa lọc
                    </button>
                  )}
                  <AntButton
                    onClick={() => exportToCSV('danh_sach_don_hang_autobot', filteredOrders, [
                      { label: 'Mã đơn', key: 'order_code' },
                      { label: 'Khách hàng', key: 'customer_name' },
                      { label: 'Số điện thoại', key: 'customer_phone' },
                      { label: 'Email', key: 'customer_email' },
                      { label: 'Tổng tiền (VNĐ)', key: 'total_amount' },
                      { label: 'Trạng thái', key: (o) => statusLabel(o.status) },
                      { label: 'Thanh toán', key: 'payment_method' },
                      { label: 'Voucher', key: (o) => o.voucher_code || '' },
                      { label: 'Địa chỉ giao hàng', key: 'shipping_address' },
                      { label: 'Ngày đặt', key: (o) => new Date(o.created_at).toLocaleString('vi-VN') }
                    ])}
                    style={{ fontSize: '12px', marginLeft: 'auto' }}
                  >
                    📥 Xuất đơn hàng (CSV)
                  </AntButton>
                </div>

                <Table
                  rowKey="id"
                  columns={orderColumns}
                  dataSource={filteredOrders}
                  pagination={{ pageSize: 10, showSizeChanger: false, showQuickJumper: true, showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} đơn` }}
                  size="middle"
                />
              </Card>

              {/* ORDER DETAIL MODAL */}
              <Modal
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '24px' }}>
                    <span>{orderDetail ? `📋 Chi tiết đơn hàng: ${orderDetail.order_code}` : 'Chi tiết đơn hàng'}</span>
                    {orderDetail && (
                      <AntButton type="primary" size="small" onClick={handlePrintInvoice} style={{ background: '#2b6cb0', borderColor: '#2b6cb0' }}>
                        🖨️ In hóa đơn
                      </AntButton>
                    )}
                  </div>
                }
                open={!!orderDetail}
                onCancel={() => setOrderDetail(null)}
                footer={null}
                width={720}
              >
                {orderDetail && (
                  <div style={{ fontSize: '13px' }}>
                    {/* Order info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', padding: '16px', background: '#f7f6f2', border: '1px solid var(--line)' }}>
                      <div><strong>Khách hàng:</strong> {orderDetail.customer_name}</div>
                      <div><strong>Email:</strong> {orderDetail.customer_email}</div>
                      <div><strong>SĐT:</strong> {orderDetail.customer_phone || 'N/A'}</div>
                      <div><strong>Thanh toán:</strong> <Tag color={orderDetail.payment_method === 'banking' ? 'cyan' : 'default'}>{orderDetail.payment_method === 'banking' ? 'Chuyển khoản' : 'COD'}</Tag></div>
                      <div style={{ gridColumn: '1 / -1' }}><strong>Địa chỉ giao:</strong> {orderDetail.shipping_address}</div>
                      {orderDetail.customer_note && <div style={{ gridColumn: '1 / -1' }}><strong>Ghi chú:</strong> <em>{orderDetail.customer_note}</em></div>}
                    </div>

                    {/* Order items */}
                    <h4 style={sectionTitleStyle}>Sản phẩm trong đơn</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--ink)' }}>
                          <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: '11px' }}>Sản phẩm</th>
                          <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: '11px' }}>Đơn giá</th>
                          <th style={{ textAlign: 'center', padding: '8px 4px', fontSize: '11px' }}>SL</th>
                          <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: '11px' }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(orderDetail.items || []).map((item, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '8px 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {item.image_url && <img src={item.image_url} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 3 }} />}
                              <div>
                                <strong>{item.product_name}</strong>
                                {item.grade && <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{item.grade}</div>}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', padding: '8px 4px' }}>{money(item.unit_price)}</td>
                            <td style={{ textAlign: 'center', padding: '8px 4px' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 600 }}>{money(item.line_total || item.unit_price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Financial summary */}
                    <div style={{ textAlign: 'right', padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                      <div>Tạm tính: <strong>{money(orderDetail.subtotal)}</strong></div>
                      {orderDetail.discount_amount > 0 && <div style={{ color: '#e53e3e' }}>Giảm giá ({orderDetail.voucher_code}): <strong>-{money(orderDetail.discount_amount)}</strong></div>}
                      <div>Phí ship: <strong>{money(orderDetail.shipping_fee)}</strong></div>
                      <div style={{ fontSize: '16px', marginTop: '8px' }}>Tổng: <strong style={{ color: 'var(--accent)' }}>{money(orderDetail.total_amount)}</strong></div>
                    </div>

                    {/* Status timeline */}
                    {orderDetail.logs && orderDetail.logs.length > 0 && (
                      <>
                        <h4 style={{ ...sectionTitleStyle, marginTop: '20px' }}>Lịch sử trạng thái đơn hàng</h4>
                        <div style={{ position: 'relative', paddingLeft: '20px' }}>
                          {orderDetail.logs.map((log, i) => (
                            <div key={i} style={{ position: 'relative', paddingBottom: '16px', borderLeft: i < orderDetail.logs.length - 1 ? '2px solid var(--line)' : '2px solid transparent', paddingLeft: '16px' }}>
                              <div style={{ position: 'absolute', left: '-7px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: i === orderDetail.logs.length - 1 ? 'var(--accent)' : 'var(--line)' }} />
                              <div style={{ fontSize: '12px' }}>
                                <Tag color={statusColor(log.new_status)}>{statusLabel(log.new_status)}</Tag>
                                <span style={{ color: 'var(--muted)', marginLeft: '8px' }}>{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>
                                {log.note} {log.operator_name && <span style={{ color: 'var(--muted)' }}>— bởi {log.operator_name}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Modal>
            </section>
          )}

          {/* ========================= INVENTORY TAB ========================= */}
          {activeTab === 'inventory' && (
            <div className="admin-products-page">
              <form className="admin-form product-form" onSubmit={handleAdjustStock} style={{ marginBottom: '30px' }}>
                <div className="product-form-heading">
                  <div>
                    <p className="form-kicker">NHẬT KÝ & QUẢN TRỊ KHO (16 BẢNG)</p>
                    <h2>Điều chỉnh & Nhập xuất kho</h2>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <select required value={adjustProductId} onChange={(e) => setAdjustProductId(e.target.value)}>
                    <option value="">Chọn sản phẩm Gunpla</option>
                    {products.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.sku}) - Hiện còn {p.stock_quantity} bộ</option>))}
                  </select>
                  <select value={adjustType} onChange={(e) => setAdjustType(e.target.value)}>
                    <option value="nhap_kho">1. Nhập kho thêm (+SL)</option>
                    <option value="xuat_ban">2. Xuất bán ngoại tuyến (-SL)</option>
                    <option value="dieu_chinh">3. Điều chỉnh kiểm kê</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '15px', marginBottom: '15px' }}>
                  <input required type="number" placeholder="Số lượng (+/-)" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
                  <input placeholder="Lý do / Số hóa đơn / Ghi chú điều chỉnh..." value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} />
                </div>
                <button className="primary-button" type="submit">Lưu biến động kho vào MySQL ↗</button>
              </form>

              <section className="product-list-section">
                <Card className="product-list-card" title={<div><span className="form-kicker">BẢNG PRODUCT_INVENTORY_LOGS</span><strong>Nhật ký biến động nhập - xuất kho ({inventoryLogs.length} bản ghi gần nhất)</strong></div>} extra={<Tag color="volcano">{inventoryLogs.length} lượt biến động</Tag>}>
                  <Table rowKey="id" columns={inventoryColumns} dataSource={inventoryLogs} pagination={{ pageSize: 10, showSizeChanger: false }} size="middle" />
                </Card>
              </section>
            </div>
          )}

          {/* ========================= USERS TAB ========================= */}
          {activeTab === 'users' && (
            <section className="admin-management-section">
              <Card
                className="management-card"
                title={`Danh sách tài khoản hệ thống (${users.length})`}
                extra={
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tag color="volcano">{users.length} người dùng</Tag>
                    <AntButton
                      size="small"
                      onClick={() => exportToCSV('danh_sach_nguoi_dung_autobot', users, [
                        { label: 'ID', key: 'id' },
                        { label: 'Họ tên', key: 'full_name' },
                        { label: 'Email', key: 'email' },
                        { label: 'Số điện thoại', key: 'phone' },
                        { label: 'Vai trò', key: 'role' },
                        { label: 'Trạng thái', key: (u) => u.is_active ? 'Hoạt động' : 'Đã khóa' },
                        { label: 'Ngày tạo', key: (u) => new Date(u.created_at).toLocaleString('vi-VN') }
                      ])}
                    >
                      📥 Xuất CSV
                    </AntButton>
                    <AntButton type="primary" size="small" onClick={() => setShowNewUserForm(!showNewUserForm)}>
                      {showNewUserForm ? '✕ Đóng' : '+ Tạo tài khoản'}
                    </AntButton>
                  </div>
                }
              >
                {showNewUserForm && (
                  <form onSubmit={handleCreateUser} style={{ background: '#f7f6f2', padding: '16px', border: '1px solid var(--line)', marginBottom: '20px' }}>
                    <h4 style={sectionTitleStyle}>Tạo tài khoản mới</h4>
                    <div style={formGroupStyle}>
                      <div>
                        <label style={labelStyle}>Họ tên <span style={{ color: 'red' }}>*</span></label>
                        <input required style={inputStyle} placeholder="Nguyễn Văn A" value={newUserForm.fullName} onChange={e => setNewUserForm({ ...newUserForm, fullName: e.target.value })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Email <span style={{ color: 'red' }}>*</span></label>
                        <input required type="email" style={inputStyle} placeholder="email@example.com" value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Mật khẩu <span style={{ color: 'red' }}>*</span></label>
                        <input required type="password" style={inputStyle} placeholder="Tối thiểu 6 ký tự" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Vai trò</label>
                        <select style={inputStyle} value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}>
                          <option value="user">Khách hàng</option>
                          <option value="admin">Quản trị viên</option>
                        </select>
                      </div>
                    </div>
                    <button className="primary-button" type="submit" style={{ padding: '8px 20px', fontSize: '13px' }}>Tạo tài khoản ↗</button>
                  </form>
                )}
                <Table
                  rowKey="id"
                  columns={userColumns}
                  dataSource={users}
                  pagination={{ pageSize: 10, showSizeChanger: false, showQuickJumper: true, showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} người dùng` }}
                  size="middle"
                />
              </Card>
            </section>
          )}

          {/* ========================= VOUCHERS TAB ========================= */}
          {activeTab === 'vouchers' && (
            <div className="admin-products-page">
              <form className="admin-form product-form" onSubmit={submitVoucher}>
                <div className="product-form-heading">
                  <div>
                    <p className="form-kicker">{editingVoucherId ? `CHỈNH SỬA VOUCHER #${editingVoucherId}` : 'TẠO MÃ GIẢM GIÁ MỚI'}</p>
                    <h2>{editingVoucherId ? '✏️ Cập nhật Voucher' : '🎟️ Thêm mã giảm giá'}</h2>
                  </div>
                  {editingVoucherId && (
                    <button type="button" onClick={() => { setEditingVoucherId(null); setVoucherForm(emptyVoucher) }} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 }}>
                      ✕ Bỏ chọn / Tạo mới
                    </button>
                  )}
                </div>

                <div style={formGroupStyle}>
                  <div>
                    <label style={labelStyle}>Mã voucher <span style={{ color: 'red' }}>*</span></label>
                    <input required style={inputStyle} placeholder="VD: SALE20" value={voucherForm.code} onChange={e => setVoucherForm({ ...voucherForm, code: e.target.value })} disabled={!!editingVoucherId} />
                  </div>
                  <div>
                    <label style={labelStyle}>Mô tả</label>
                    <input style={inputStyle} placeholder="VD: Giảm 20% cho đơn từ 1 triệu" value={voucherForm.description} onChange={e => setVoucherForm({ ...voucherForm, description: e.target.value })} />
                  </div>
                </div>
                <div style={formGroupStyle}>
                  <div>
                    <label style={labelStyle}>Giảm theo %</label>
                    <input type="number" min="0" max="100" style={inputStyle} value={voucherForm.discountPercent} onChange={e => setVoucherForm({ ...voucherForm, discountPercent: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Giảm trực tiếp (VNĐ)</label>
                    <input type="number" min="0" style={inputStyle} value={voucherForm.discountAmount} onChange={e => setVoucherForm({ ...voucherForm, discountAmount: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Đơn hàng tối thiểu (VNĐ)</label>
                    <input type="number" min="0" style={inputStyle} value={voucherForm.minOrderAmount} onChange={e => setVoucherForm({ ...voucherForm, minOrderAmount: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Giới hạn lượt dùng</label>
                    <input type="number" min="1" style={inputStyle} value={voucherForm.usageLimit} onChange={e => setVoucherForm({ ...voucherForm, usageLimit: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <input type="checkbox" checked={voucherForm.isActive} onChange={e => setVoucherForm({ ...voucherForm, isActive: e.target.checked })} />
                    Kích hoạt voucher
                  </label>
                  <button className="primary-button" type="submit" style={{ padding: '10px 24px', marginLeft: 'auto' }}>
                    {editingVoucherId ? 'Lưu cập nhật 💾' : 'Tạo Voucher ↗'}
                  </button>
                </div>
              </form>

              <section className="product-list-section" style={{ marginTop: '30px' }}>
                <Card
                  className="product-list-card"
                  title={<div><span className="form-kicker">BẢNG VOUCHERS</span><strong>Danh sách mã giảm giá ({vouchers.length})</strong></div>}
                  extra={
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Tag color="volcano">{vouchers.length} voucher</Tag>
                      <AntButton
                        size="small"
                        onClick={() => exportToCSV('danh_sach_voucher_autobot', vouchers, [
                          { label: 'Mã', key: 'code' },
                          { label: 'Mô tả', key: 'description' },
                          { label: 'Giảm %', key: 'discount_percent' },
                          { label: 'Giảm VNĐ', key: 'discount_amount' },
                          { label: 'Đơn tối thiểu', key: 'min_order_amount' },
                          { label: 'Lượt dùng', key: 'times_used' },
                          { label: 'Giới hạn', key: 'usage_limit' },
                          { label: 'Trạng thái', key: (v) => v.is_active ? 'Hoạt động' : 'Tắt' }
                        ])}
                      >
                        📥 Xuất CSV
                      </AntButton>
                      <AntButton type="primary" size="small" onClick={loadVoucherUsages} loading={voucherUsagesLoading}>
                        📋 Lịch sử dùng mã
                      </AntButton>
                    </div>
                  }
                >
                  <Table rowKey="id" columns={voucherColumns} dataSource={vouchers} pagination={{ pageSize: 10 }} size="middle" />
                </Card>

                {/* VOUCHER USAGES MODAL */}
                <Modal
                  title="📋 Lịch sử khách hàng sử dụng Voucher (Bảng VOUCHER_USAGES)"
                  open={showVoucherUsagesModal}
                  onCancel={() => setShowVoucherUsagesModal(false)}
                  footer={null}
                  width={800}
                >
                  <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Tổng cộng: <strong>{voucherUsages.length}</strong> lượt sử dụng</span>
                    <AntButton
                      size="small"
                      onClick={() => exportToCSV('lich_su_dung_voucher', voucherUsages, [
                        { label: 'Mã voucher', key: 'voucher_code' },
                        { label: 'Mã đơn', key: 'order_code' },
                        { label: 'Khách hàng', key: 'user_name' },
                        { label: 'Email', key: 'user_email' },
                        { label: 'Giảm giá (VNĐ)', key: 'discount_amount' },
                        { label: 'Thời gian', key: (vu) => new Date(vu.used_at).toLocaleString('vi-VN') }
                      ])}
                    >
                      📥 Xuất CSV
                    </AntButton>
                  </div>
                  <Table
                    rowKey="id"
                    size="small"
                    dataSource={voucherUsages}
                    pagination={{ pageSize: 8 }}
                    columns={[
                      { title: 'Voucher', dataIndex: 'voucher_code', key: 'code', render: (c) => <Tag color="blue" style={{ fontFamily: 'DM Mono', fontWeight: 700 }}>{c}</Tag> },
                      { title: 'Mã đơn', dataIndex: 'order_code', key: 'order', render: (c) => <span style={{ fontFamily: 'DM Mono' }}>{c}</span> },
                      { title: 'Khách hàng', key: 'user', render: (_, vu) => <div><strong>{vu.user_name}</strong><div style={{ fontSize: '10px', color: 'var(--muted)' }}>{vu.user_email}</div></div> },
                      { title: 'Được giảm', dataIndex: 'discount_amount', key: 'discount', render: (a) => <strong style={{ color: '#e53e3e' }}>-{money(a)}</strong> },
                      { title: 'Thời gian dùng', dataIndex: 'used_at', key: 'used_at', render: (t) => new Date(t).toLocaleString('vi-VN') }
                    ]}
                  />
                </Modal>
              </section>
            </div>
          )}

          {/* ========================= REVIEWS TAB ========================= */}
          {activeTab === 'reviews' && (
            <section className="admin-management-section">
              <Card
                className="management-card"
                title={`Quản lý đánh giá sản phẩm (${filteredReviews.length}/${reviews.length})`}
                extra={
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tag color="volcano">{filteredReviews.length} đánh giá</Tag>
                    <AntButton
                      size="small"
                      onClick={() => exportToCSV('danh_sach_danh_gia_autobot', filteredReviews, [
                        { label: 'Sản phẩm', key: 'product_name' },
                        { label: 'SKU', key: 'product_sku' },
                        { label: 'Khách hàng', key: 'user_name' },
                        { label: 'Email', key: 'user_email' },
                        { label: 'Số sao', key: 'rating' },
                        { label: 'Nội dung', key: 'comment' },
                        { label: 'Trạng thái', key: (r) => r.is_approved ? 'Đã duyệt' : 'Chờ duyệt' },
                        { label: 'Ngày tạo', key: (r) => new Date(r.created_at).toLocaleString('vi-VN') }
                      ])}
                    >
                      📥 Xuất CSV
                    </AntButton>
                  </div>
                }
              >
                {/* REVIEW SEARCH & FILTER TOOLBAR */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px', padding: '14px 16px', background: '#faf9f5', border: '1px solid var(--line)' }}>
                  <input
                    type="text"
                    placeholder="🔍 Tìm theo tên mô hình, khách hàng, nội dung đánh giá..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    style={{ flex: '1 1 240px', padding: '9px 14px', fontSize: '13px', border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit' }}
                  />
                  <select
                    value={reviewFilter}
                    onChange={(e) => setReviewFilter(e.target.value)}
                    style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit' }}
                  >
                    <option value="all">Tất cả trạng thái duyệt ({reviews.length})</option>
                    <option value="approved">Đã duyệt công khai ({reviews.filter(r => r.is_approved).length})</option>
                    <option value="pending">Chờ duyệt ({reviews.filter(r => !r.is_approved).length})</option>
                  </select>
                  <select
                    value={reviewRatingFilter}
                    onChange={(e) => setReviewRatingFilter(e.target.value)}
                    style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid var(--line)', background: '#fff', fontFamily: 'inherit' }}
                  >
                    <option value="all">Tất cả số sao</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 sao</option>
                    <option value="4">⭐⭐⭐⭐ 4 sao</option>
                    <option value="3">⭐⭐⭐ 3 sao</option>
                    <option value="2">⭐⭐ 2 sao</option>
                    <option value="1">⭐ 1 sao</option>
                  </select>
                  {(reviewSearch || reviewFilter !== 'all' || reviewRatingFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => { setReviewSearch(''); setReviewFilter('all'); setReviewRatingFilter('all') }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', padding: '0 4px' }}
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>

                <Table rowKey="id" columns={reviewColumns} dataSource={filteredReviews} pagination={{ pageSize: 10, showSizeChanger: false }} size="middle" />
              </Card>
            </section>
          )}

          {/* ========================= CATEGORIES & BRANDS TAB ========================= */}
          {activeTab === 'categories' && (
            <div className="admin-products-page">
              {/* CATEGORIES */}
              <form className="admin-form product-form" onSubmit={submitCategory} style={{ marginBottom: '30px' }}>
                <div className="product-form-heading">
                  <div>
                    <p className="form-kicker">{editingCategoryId ? `CHỈNH SỬA DANH MỤC #${editingCategoryId}` : 'QUẢN LÝ DANH MỤC GRADE'}</p>
                    <h2>{editingCategoryId ? '✏️ Cập nhật danh mục' : '🗂️ Thêm danh mục mới'}</h2>
                  </div>
                  {editingCategoryId && (
                    <button type="button" onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: '', slug: '', description: '' }) }} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 }}>✕ Bỏ chọn</button>
                  )}
                </div>
                <div style={formGroupStyle}>
                  <div>
                    <label style={labelStyle}>Tên danh mục <span style={{ color: 'red' }}>*</span></label>
                    <input required style={inputStyle} placeholder="VD: High Grade" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Slug <span style={{ color: 'red' }}>*</span></label>
                    <input required style={inputStyle} placeholder="VD: hg" value={categoryForm.slug} onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Mô tả</label>
                    <input style={inputStyle} placeholder="Mô tả ngắn" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} />
                  </div>
                </div>
                <button className="primary-button" type="submit" style={{ padding: '10px 24px' }}>{editingCategoryId ? 'Lưu cập nhật' : 'Tạo danh mục ↗'}</button>
              </form>

              <Card className="product-list-card" title={`Danh mục hiện có (${categories.length})`} style={{ marginBottom: '30px' }}>
                <Table
                  rowKey="id"
                  dataSource={categories}
                  size="middle"
                  pagination={false}
                  columns={[
                    { title: 'Tên', dataIndex: 'name', key: 'name', render: (n) => <strong>{n}</strong> },
                    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (s) => <Tag>{s}</Tag> },
                    { title: 'Mô tả', dataIndex: 'description', key: 'desc', render: (d) => <span style={{ fontSize: '12px' }}>{d || '—'}</span> },
                    {
                      title: 'Thao tác', key: 'action', width: 140,
                      render: (_, c) => (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <AntButton size="small" onClick={() => { setEditingCategoryId(c.id); setCategoryForm({ name: c.name, slug: c.slug, description: c.description || '' }) }}>✏️</AntButton>
                          <AntButton size="small" danger onClick={() => deleteCategory(c.id)}>🗑️</AntButton>
                        </div>
                      )
                    }
                  ]}
                />
              </Card>

              {/* BRANDS */}
              <form className="admin-form product-form" onSubmit={submitBrand} style={{ marginBottom: '30px' }}>
                <div className="product-form-heading">
                  <div>
                    <p className="form-kicker">{editingBrandId ? `CHỈNH SỬA THƯƠNG HIỆU #${editingBrandId}` : 'QUẢN LÝ THƯƠNG HIỆU'}</p>
                    <h2>{editingBrandId ? '✏️ Cập nhật thương hiệu' : '🏷️ Thêm thương hiệu mới'}</h2>
                  </div>
                  {editingBrandId && (
                    <button type="button" onClick={() => { setEditingBrandId(null); setBrandForm({ name: '', slug: '', country: 'Nhật Bản', description: '', logoUrl: '' }) }} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 }}>✕ Bỏ chọn</button>
                  )}
                </div>
                <div style={formGroupStyle}>
                  <div>
                    <label style={labelStyle}>Tên thương hiệu <span style={{ color: 'red' }}>*</span></label>
                    <input required style={inputStyle} placeholder="VD: Bandai Spirits" value={brandForm.name} onChange={e => setBrandForm({ ...brandForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Slug</label>
                    <input style={inputStyle} placeholder="VD: bandai-spirits" value={brandForm.slug} onChange={e => setBrandForm({ ...brandForm, slug: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Quốc gia</label>
                    <input style={inputStyle} placeholder="Nhật Bản" value={brandForm.country} onChange={e => setBrandForm({ ...brandForm, country: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Mô tả</label>
                    <input style={inputStyle} placeholder="Mô tả ngắn" value={brandForm.description} onChange={e => setBrandForm({ ...brandForm, description: e.target.value })} />
                  </div>
                </div>
                <button className="primary-button" type="submit" style={{ padding: '10px 24px' }}>{editingBrandId ? 'Lưu cập nhật' : 'Tạo thương hiệu ↗'}</button>
              </form>

              <Card className="product-list-card" title={`Thương hiệu hiện có (${brands.length})`}>
                <Table
                  rowKey="id"
                  dataSource={brands}
                  size="middle"
                  pagination={false}
                  columns={[
                    { title: 'Tên', dataIndex: 'name', key: 'name', render: (n) => <strong>{n}</strong> },
                    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (s) => <Tag>{s}</Tag> },
                    { title: 'Quốc gia', dataIndex: 'country', key: 'country' },
                    {
                      title: 'Thao tác', key: 'action', width: 140,
                      render: (_, b) => (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <AntButton size="small" onClick={() => { setEditingBrandId(b.id); setBrandForm({ name: b.name, slug: b.slug, country: b.country || 'Nhật Bản', description: b.description || '', logoUrl: b.logo_url || '' }) }}>✏️</AntButton>
                          <AntButton size="small" danger onClick={() => deleteBrand(b.id)}>🗑️</AntButton>
                        </div>
                      )
                    }
                  ]}
                />
              </Card>
            </div>
          )}

          {/* ========================= ARTICLES TAB ========================= */}
          {activeTab === 'articles' && (
            <div className="admin-products-page">
              <form className="admin-form product-form" id="article-form" onSubmit={submitArticle}>
                <div className="product-form-heading">
                  <div>
                    <p className="form-kicker">{editingArticleId ? `CHỈNH SỬA BÀI VIẾT #${editingArticleId}` : 'TẠO BÀI VIẾT MỚI'}</p>
                    <h2>{editingArticleId ? '✏️ Cập nhật bài viết' : '📰 Xuất bản bài viết mới'}</h2>
                  </div>
                  {editingArticleId && (
                    <button type="button" onClick={() => { setEditingArticleId(null); setArticleForm(emptyArticle) }} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 }}>✕ Bỏ chọn / Tạo mới</button>
                  )}
                </div>

                <div style={formGroupStyle}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Tiêu đề bài viết <span style={{ color: 'red' }}>*</span></label>
                    <input required style={inputStyle} placeholder="VD: Hướng dẫn kỹ thuật Panel Lining" value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} />
                  </div>
                </div>
                <div style={formGroupStyle}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Mô tả ngắn (Excerpt) <span style={{ color: 'red' }}>*</span></label>
                    <input required style={inputStyle} placeholder="Tóm tắt nội dung bài viết..." value={articleForm.excerpt} onChange={e => setArticleForm({ ...articleForm, excerpt: e.target.value })} />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Nội dung bài viết <span style={{ color: 'red' }}>*</span></label>
                  <textarea required rows="8" style={{ ...inputStyle, minHeight: '160px' }} placeholder="Nội dung chi tiết bài viết..." value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content: e.target.value })} />
                </div>
                <div style={formGroupStyle}>
                  <div>
                    <label style={labelStyle}>Ảnh bìa (URL)</label>
                    <input style={inputStyle} placeholder="https://..." value={articleForm.coverImage} onChange={e => setArticleForm({ ...articleForm, coverImage: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Chuyên mục</label>
                    <select style={inputStyle} value={articleForm.categoryTag} onChange={e => setArticleForm({ ...articleForm, categoryTag: e.target.value })}>
                      <option>Kỹ thuật ráp</option>
                      <option>Kinh nghiệm chơi</option>
                      <option>Review mô hình</option>
                      <option>Cẩm nang chọn kit</option>
                      <option>Tin tức</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Grade liên quan</label>
                    <select style={inputStyle} value={articleForm.relatedGrade} onChange={e => setArticleForm({ ...articleForm, relatedGrade: e.target.value })}>
                      <option>Tất cả</option>
                      <option>HG 1/144</option>
                      <option>RG 1/144</option>
                      <option>MG 1/100</option>
                      <option>PG 1/60</option>
                      <option>SD</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Sản phẩm liên quan</label>
                    <select style={inputStyle} value={articleForm.relatedProductId} onChange={e => setArticleForm({ ...articleForm, relatedProductId: e.target.value })}>
                      <option value="">Không liên kết</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                {editingArticleId && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '12px' }}>
                    <input type="checkbox" checked={articleForm.isPublished ?? true} onChange={e => setArticleForm({ ...articleForm, isPublished: e.target.checked })} />
                    Xuất bản công khai
                  </label>
                )}
                <button className="primary-button" type="submit" style={{ padding: '10px 24px' }}>{editingArticleId ? 'Lưu cập nhật 💾' : 'Xuất bản bài viết ↗'}</button>
              </form>

              <section className="product-list-section" style={{ marginTop: '30px' }}>
                <Card className="product-list-card" title={<div><span className="form-kicker">BẢNG NEWS_ARTICLES</span><strong>Danh sách bài viết ({articles.length})</strong></div>} extra={<Tag color="volcano">{articles.length} bài viết</Tag>}>
                  <Table rowKey="id" columns={articleColumns} dataSource={articles} pagination={{ pageSize: 10 }} size="middle" />
                </Card>
              </section>
            </div>
          )}

          {/* ========================= REVENUE TAB ========================= */}
          {activeTab === 'revenue' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
                <AntButton
                  onClick={() => exportToCSV('top_san_pham_ban_chay_autobot', dashboard.bestSellers || [], [
                    { label: 'ID', key: 'product_id' },
                    { label: 'Tên sản phẩm', key: 'product_name' },
                    { label: 'Số lượng đã bán', key: 'quantity_sold' },
                    { label: 'Tổng doanh số (VNĐ)', key: 'total_sales' }
                  ])}
                >
                  📥 Xuất Top bán chạy (CSV)
                </AntButton>
                <AntButton
                  type="primary"
                  onClick={() => exportToCSV('bao_cao_doanh_thu_thang', dashboard.monthlyRevenue || [], [
                    { label: 'Tháng', key: 'month_label' },
                    { label: 'Doanh thu (VNĐ)', key: 'revenue' },
                    { label: 'Số đơn hoàn tất', key: 'order_count' }
                  ])}
                >
                  📥 Xuất doanh thu theo tháng (CSV)
                </AntButton>
              </div>

              <div className="admin-split">
                <div className="stat-card large">
                  <span>Tổng doanh thu toàn hệ thống</span>
                  <strong>{money(revenue)}</strong>
                  <small>{dashboard.summary?.confirmed_orders || 0} đơn đã giao/xác nhận</small>
                </div>
                <div className="admin-table">
                  <h2>Top sản phẩm tạo doanh số cao nhất</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>SL bán</th>
                        <th>Doanh số</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboard.bestSellers || []).map((item) => (
                        <tr key={item.product_id}>
                          <td><strong>{item.product_name}</strong></td>
                          <td>{item.quantity_sold} bộ</td>
                          <td><strong style={{ color: 'var(--accent)' }}>{money(item.total_sales || 0)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
