import { pool } from '../config/db.js'

export async function listAddresses(req, res) {
  const [rows] = await pool.query(
    'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
    [req.user.id]
  )
  res.json(rows)
}

export async function addAddress(req, res) {
  const { recipientName, phone, addressLine, city = 'TP. Hồ Chí Minh', isDefault = false } = req.body

  if (isDefault) {
    await pool.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id])
  }

  const [result] = await pool.query(
    `INSERT INTO user_addresses (user_id, recipient_name, phone, address_line, city, is_default)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, recipientName.trim(), phone.trim(), addressLine.trim(), city.trim(), Boolean(isDefault)]
  )

  res.status(201).json({ id: result.insertId, message: 'Đã lưu địa chỉ nhận hàng.' })
}

export async function setDefaultAddress(req, res) {
  await pool.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id])
  const [result] = await pool.query(
    'UPDATE user_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy địa chỉ.' })
  res.json({ message: 'Đã đặt làm địa chỉ mặc định.' })
}

export async function deleteAddress(req, res) {
  const [result] = await pool.query(
    'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy địa chỉ.' })
  res.json({ message: 'Đã xóa địa chỉ.' })
}
