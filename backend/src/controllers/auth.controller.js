import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db.js'

function signUser(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  )
}

export async function login(req, res) {
  const { email, password } = req.body
  const [rows] = await pool.query('SELECT id, full_name, email, password_hash, role, phone, address, is_active FROM users WHERE email = ? LIMIT 1', [email])
  const user = rows[0]
  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' })
  }
  res.json({
    token: signUser(user),
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, phone: user.phone, address: user.address }
  })
}

export async function register(req, res) {
  const { fullName, email, password, phone = null, address = null } = req.body
  const passwordHash = await bcrypt.hash(password, 12)
  const role = 'user'
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
    [fullName, email, passwordHash, phone, address, role]
  )
  const user = { id: result.insertId, full_name: fullName, email, role, phone, address }
  res.status(201).json({
    token: signUser(user),
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role, phone, address }
  })
}

export async function getProfile(req, res) {
  const [rows] = await pool.query('SELECT id, full_name, email, phone, address, role, created_at FROM users WHERE id = ?', [req.user.id])
  if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' })
  res.json(rows[0])
}

export async function updateProfile(req, res) {
  const { fullName, phone, address, currentPassword, newPassword } = req.body
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  const user = rows[0]
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' })

  let nextHash = user.password_hash
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.' })
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' })
    }
    nextHash = await bcrypt.hash(newPassword, 12)
  }

  await pool.query(
    'UPDATE users SET full_name = ?, phone = ?, address = ?, password_hash = ? WHERE id = ?',
    [fullName || user.full_name, phone || user.phone, address || user.address, nextHash, req.user.id]
  )

  const updatedUser = {
    id: user.id,
    fullName: fullName || user.full_name,
    email: user.email,
    role: user.role,
    phone: phone || user.phone,
    address: address || user.address
  }

  res.json({
    message: 'Cập nhật thông tin thành công.',
    user: updatedUser
  })
}