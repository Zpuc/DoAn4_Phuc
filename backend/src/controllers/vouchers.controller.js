import { pool } from '../config/db.js'

export async function listVouchers(req, res) {
  const [rows] = await pool.query('SELECT * FROM vouchers ORDER BY id DESC')
  res.json(rows)
}

export async function validateVoucher(req, res) {
  const { code, orderAmount = 0 } = req.query
  if (!code) return res.status(400).json({ message: 'Vui lòng cung cấp mã voucher.' })

  const [rows] = await pool.query('SELECT * FROM vouchers WHERE code = ? AND is_active = TRUE LIMIT 1', [code.trim().toUpperCase()])
  if (!rows[0]) return res.status(404).json({ message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' })

  const voucher = rows[0]
  const amount = Number(orderAmount)
  if (amount < Number(voucher.min_order_amount)) {
    return res.status(400).json({
      message: `Đơn hàng tối thiểu để áp dụng mã này là ${new Intl.NumberFormat('vi-VN').format(voucher.min_order_amount)}đ.`
    })
  }

  let discount = 0
  if (voucher.discount_percent > 0) {
    discount = Math.round((amount * voucher.discount_percent) / 100)
  } else if (voucher.discount_amount > 0) {
    discount = Number(voucher.discount_amount)
  }

  res.json({
    valid: true,
    code: voucher.code,
    description: voucher.description,
    discountAmount: discount
  })
}

export async function createVoucher(req, res) {
  const { code, description, discountPercent = 0, discountAmount = 0, minOrderAmount = 0, usageLimit = 100, isActive = true } = req.body
  const upperCode = code.trim().toUpperCase()

  const [existing] = await pool.query('SELECT id FROM vouchers WHERE code = ?', [upperCode])
  if (existing[0]) return res.status(409).json({ message: 'Mã voucher này đã tồn tại.' })

  const [result] = await pool.query(
    `INSERT INTO vouchers (code, description, discount_percent, discount_amount, min_order_amount, usage_limit, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [upperCode, description || null, Number(discountPercent), Number(discountAmount), Number(minOrderAmount), Number(usageLimit), isActive]
  )
  res.status(201).json({ id: result.insertId, message: 'Đã tạo mã giảm giá thành công!' })
}

export async function updateVoucher(req, res) {
  const { description, discountPercent, discountAmount, minOrderAmount, usageLimit, isActive } = req.body
  const [result] = await pool.query(
    `UPDATE vouchers SET description = ?, discount_percent = ?, discount_amount = ?, min_order_amount = ?, usage_limit = ?, is_active = ? WHERE id = ?`,
    [description || null, Number(discountPercent), Number(discountAmount), Number(minOrderAmount), Number(usageLimit), isActive, req.params.id]
  )
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy voucher.' })
  res.json({ message: 'Đã cập nhật voucher thành công!' })
}

export async function deleteVoucher(req, res) {
  const [result] = await pool.query('DELETE FROM vouchers WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy voucher.' })
  res.json({ message: 'Đã xóa voucher.' })
}

export async function listVoucherUsages(req, res) {
  const [rows] = await pool.query(
    `SELECT vu.*, v.code AS voucher_code, v.description AS voucher_description,
            u.full_name AS user_name, u.email AS user_email,
            o.order_code
     FROM voucher_usages vu
     JOIN vouchers v ON v.id = vu.voucher_id
     JOIN users u ON u.id = vu.user_id
     JOIN orders o ON o.id = vu.order_id
     ORDER BY vu.used_at DESC`
  )
  res.json(rows)
}
