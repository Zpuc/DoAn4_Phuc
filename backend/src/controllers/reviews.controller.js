import { pool } from '../config/db.js'

export async function listProductReviews(req, res) {
  const [rows] = await pool.query(
    `SELECT r.*, u.full_name AS user_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC`,
    [req.params.id]
  )
  res.json(rows)
}

export async function createReview(req, res) {
  const { rating, comment } = req.body
  const productId = req.params.id

  const numRating = Number(rating)
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5 sao.' })
  }

  const [result] = await pool.query(
    'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
    [productId, req.user.id, numRating, comment ? comment.trim() : null]
  )

  res.status(201).json({ id: result.insertId, message: 'Đã gửi đánh giá thành công!' })
}

// ===== ADMIN: Quản lý tất cả đánh giá =====

export async function listAllReviews(req, res) {
  const [rows] = await pool.query(
    `SELECT r.*, u.full_name AS user_name, u.email AS user_email,
            p.name AS product_name, p.sku AS product_sku, p.image_url AS product_image
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     JOIN products p ON p.id = r.product_id
     ORDER BY r.created_at DESC`
  )
  res.json(rows)
}

export async function approveReview(req, res) {
  const { isApproved } = req.body
  const [result] = await pool.query(
    'UPDATE reviews SET is_approved = ? WHERE id = ?',
    [isApproved, req.params.id]
  )
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy đánh giá.' })
  res.json({ message: isApproved ? 'Đã duyệt đánh giá.' : 'Đã ẩn đánh giá.' })
}

export async function deleteReview(req, res) {
  const [result] = await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy đánh giá.' })
  res.json({ message: 'Đã xóa đánh giá.' })
}
