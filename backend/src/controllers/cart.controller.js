import { pool } from '../config/db.js'

export async function getCart(req, res) {
  const [rows] = await pool.query(
    `SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.old_price, p.image_url, p.grade, p.stock_quantity, p.condition_status
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [req.user.id]
  )
  res.json(rows)
}

export async function addToCart(req, res) {
  const { productId, quantity = 1 } = req.body
  const [product] = await pool.query('SELECT id, stock_quantity FROM products WHERE id = ? AND is_active = TRUE', [productId])
  if (!product[0]) return res.status(404).json({ message: 'Sản phẩm không tồn tại.' })

  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    [req.user.id, productId, Math.max(1, Number(quantity))]
  )

  res.json({ message: 'Đã thêm vào giỏ hàng.' })
}

export async function updateCartItem(req, res) {
  const { quantity } = req.body
  const qty = Number(quantity)
  if (qty <= 0) {
    await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId])
    return res.json({ message: 'Đã xóa sản phẩm khỏi giỏ.' })
  }

  await pool.query(
    'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
    [qty, req.user.id, req.params.productId]
  )
  res.json({ message: 'Đã cập nhật số lượng.' })
}

export async function removeCartItem(req, res) {
  await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId])
  res.json({ message: 'Đã xóa sản phẩm khỏi giỏ.' })
}

export async function clearCart(req, res) {
  await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id])
  res.json({ message: 'Đã làm trống giỏ hàng.' })
}
