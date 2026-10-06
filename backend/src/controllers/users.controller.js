import bcrypt from 'bcryptjs'
import { pool } from '../config/db.js'

export async function listUsers(req, res) {
  const [rows] = await pool.query('SELECT id, full_name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC')
  res.json(rows)
}

export async function createUser(req, res) {
  const { fullName, email, password, role = 'user' } = req.body
  const hash = await bcrypt.hash(password, 12)
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [fullName, email, hash, role]
  )
  res.status(201).json({ id: result.insertId, message: 'Đã tạo tài khoản.' })
}

export async function updateUser(req, res) {
  const { fullName, role, isActive } = req.body
  const [result] = await pool.query(
    'UPDATE users SET full_name = ?, role = ?, is_active = ? WHERE id = ?',
    [fullName, role, isActive, req.params.id]
  )
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' })
  res.json({ message: 'Đã cập nhật tài khoản.' })
}

export async function deleteUser(req, res) {
  const userId = req.params.id
  // Prevent deleting self
  if (Number(userId) === req.user.id) {
    return res.status(400).json({ message: 'Bạn không thể xóa chính tài khoản của mình.' })
  }
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId])
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' })
    res.json({ message: 'Đã xóa tài khoản.' })
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Không thể xóa vì tài khoản có dữ liệu liên quan (đơn hàng, bài viết...). Hãy khóa tài khoản thay vì xóa.' })
    }
    throw err
  }
}