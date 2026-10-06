import { pool } from '../config/db.js'

export async function getWishlist(req, res) {
  const [rows] = await pool.query(
    `SELECT w.id AS wishlist_id, w.created_at AS added_at,
            p.*, c.name AS category_name, b.name AS brand_name
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     WHERE w.user_id = ? AND p.is_active = TRUE
     ORDER BY w.created_at DESC`,
    [req.user.id]
  )
  res.json(rows)
}

export async function toggleWishlist(req, res) {
  const productId = req.params.productId
  const userId = req.user.id

  const [existing] = await pool.query(
    'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  )

  if (existing.length > 0) {
    await pool.query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId])
    return res.json({ added: false, message: 'Đã xóa khỏi danh sách yêu thích.' })
  }

  await pool.query('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [userId, productId])
  res.status(201).json({ added: true, message: 'Đã thêm vào danh sách yêu thích!' })
}

export async function removeFromWishlist(req, res) {
  await pool.query(
    'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
    [req.user.id, req.params.productId]
  )
  res.json({ message: 'Đã xóa khỏi danh sách yêu thích.' })
}
