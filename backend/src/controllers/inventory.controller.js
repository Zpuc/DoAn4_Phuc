import { pool } from '../config/db.js'

export async function listInventoryLogs(req, res) {
  const [rows] = await pool.query(
    `SELECT l.*, p.name AS product_name, p.sku AS product_sku, u.full_name AS operator_name
     FROM product_inventory_logs l
     JOIN products p ON p.id = l.product_id
     LEFT JOIN users u ON u.id = l.created_by_user_id
     ORDER BY l.created_at DESC
     LIMIT 50`
  )
  res.json(rows)
}

export async function adjustStock(req, res) {
  const { productId, changeType, quantity, note } = req.body
  const numQty = Number(quantity)

  if (!Number.isInteger(numQty) || numQty === 0) {
    return res.status(400).json({ message: 'Số lượng thay đổi phải là số nguyên khác 0.' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [products] = await connection.query(
      'SELECT id, name, stock_quantity FROM products WHERE id = ? FOR UPDATE',
      [productId]
    )
    if (!products[0]) {
      await connection.rollback()
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })
    }

    const prevStock = products[0].stock_quantity
    const nextStock = Math.max(0, prevStock + numQty)

    await connection.query(
      `UPDATE products
       SET stock_quantity = ?,
           condition_status = CASE WHEN ? <= 0 THEN 'het_hang' ELSE 'con_hang' END
       WHERE id = ?`,
      [nextStock, nextStock, productId]
    )

    await connection.query(
      `INSERT INTO product_inventory_logs
        (product_id, change_type, quantity_change, previous_stock, current_stock, note, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [productId, changeType || 'dieu_chinh', numQty, prevStock, nextStock, note || 'Điều chỉnh thủ công', req.user.id]
    )

    await connection.commit()
    res.json({
      message: `Đã cập nhật tồn kho cho "${products[0].name}": ${prevStock} -> ${nextStock}`,
      currentStock: nextStock
    })
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}
