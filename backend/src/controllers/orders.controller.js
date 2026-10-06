import { pool } from '../config/db.js'

export async function listOrders(req, res) {
  const values = []
  let sql = `
    SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE 1 = 1
  `
  if (req.query.status) {
    sql += ' AND o.status = ?'
    values.push(req.query.status)
  }
  sql += ' ORDER BY o.created_at DESC'
  const [rows] = await pool.query(sql, values)
  res.json(rows)
}

export async function listMyOrders(req, res) {
  const [orders] = await pool.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  )

  const orderIds = orders.map((o) => o.id)
  let itemsByOrderId = {}
  let logsByOrderId = {}

  if (orderIds.length > 0) {
    const [items] = await pool.query(
      `SELECT oi.*, p.image_url, p.grade
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})`,
      orderIds
    )
    items.forEach((item) => {
      if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = []
      itemsByOrderId[item.order_id].push(item)
    })

    const [logs] = await pool.query(
      `SELECT l.*, u.full_name AS operator_name
       FROM order_status_logs l
       LEFT JOIN users u ON u.id = l.changed_by_user_id
       WHERE l.order_id IN (${orderIds.map(() => '?').join(',')})
       ORDER BY l.created_at ASC`,
      orderIds
    )
    logs.forEach((log) => {
      if (!logsByOrderId[log.order_id]) logsByOrderId[log.order_id] = []
      logsByOrderId[log.order_id].push(log)
    })
  }

  const result = orders.map((order) => ({
    ...order,
    items: itemsByOrderId[order.id] || [],
    logs: logsByOrderId[order.id] || []
  }))

  res.json(result)
}

export async function getOrder(req, res) {
  const [orders] = await pool.query(
    `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone, u.address AS customer_address
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [req.params.id]
  )
  if (!orders[0]) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' })

  const [items] = await pool.query(
    `SELECT oi.*, p.image_url, p.grade
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [req.params.id]
  )

  const [logs] = await pool.query(
    `SELECT l.*, u.full_name AS operator_name
     FROM order_status_logs l
     LEFT JOIN users u ON u.id = l.changed_by_user_id
     WHERE l.order_id = ?
     ORDER BY l.created_at ASC`,
    [req.params.id]
  )

  res.json({ ...orders[0], items, logs })
}

export async function listMyOrderDetail(req, res) {
  const [orders] = await pool.query(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  )
  if (!orders[0]) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' })

  const [items] = await pool.query(
    `SELECT oi.*, p.image_url, p.grade
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [req.params.id]
  )

  const [logs] = await pool.query(
    `SELECT l.*, u.full_name AS operator_name
     FROM order_status_logs l
     LEFT JOIN users u ON u.id = l.changed_by_user_id
     WHERE l.order_id = ?
     ORDER BY l.created_at ASC`,
    [req.params.id]
  )

  res.json({ ...orders[0], items, logs })
}

export async function createOrder(req, res) {
  const {
    shippingAddress,
    customerNote = null,
    paymentMethod = 'cod',
    voucherCode = null,
    discountAmount = 0,
    shippingFee = 0,
    items
  } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(422).json({ message: 'Giỏ hàng không có sản phẩm nào.' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    let subtotal = 0
    const resolvedItems = []

    // 1. Transaction FOR UPDATE to verify stock & lock rows
    for (const item of items) {
      const [rows] = await connection.query(
        'SELECT id, name, price, stock_quantity, condition_status FROM products WHERE id = ? AND is_active = TRUE FOR UPDATE',
        [item.productId]
      )
      const product = rows[0]
      if (!product) {
        const error = new Error(`Sản phẩm #${item.productId} không tồn tại hoặc đã ngừng kinh doanh.`)
        error.statusCode = 422
        throw error
      }
      const qty = Number(item.quantity)
      if (!Number.isInteger(qty) || qty < 1) {
        const error = new Error(`Số lượng cho sản phẩm ${product.name} không hợp lệ.`)
        error.statusCode = 422
        throw error
      }
      if (product.stock_quantity < qty) {
        const error = new Error(`Sản phẩm "${product.name}" hiện chỉ còn ${product.stock_quantity} bộ trong kho.`)
        error.statusCode = 422
        throw error
      }

      subtotal += Number(product.price) * qty
      resolvedItems.push({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: qty,
        prevStock: product.stock_quantity
      })
    }

    const finalDiscount = Math.max(0, Number(discountAmount) || 0)
    const finalShipping = Number(shippingFee) || 0
    const total = Math.max(0, subtotal - finalDiscount + finalShipping)
    const orderCode = `AB${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`

    // 2. Insert order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_code, user_id, status, payment_method, shipping_address, customer_note,
        voucher_code, discount_amount, subtotal, shipping_fee, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderCode,
        req.user.id,
        'da_dat',
        paymentMethod === 'banking' ? 'banking' : 'cod',
        shippingAddress,
        customerNote,
        voucherCode,
        finalDiscount,
        subtotal,
        finalShipping,
        total
      ]
    )

    const orderId = orderResult.insertId

    // 3. Insert order items & reduce inventory & log inventory
    for (const item of resolvedItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.productId, item.name, item.price, item.quantity]
      )

      const nextStock = item.prevStock - item.quantity
      await connection.query(
        `UPDATE products
         SET stock_quantity = ?,
             condition_status = CASE WHEN ? <= 0 THEN 'het_hang' ELSE condition_status END
         WHERE id = ?`,
        [nextStock, nextStock, item.productId]
      )

      // Audit log into product_inventory_logs
      await connection.query(
        `INSERT INTO product_inventory_logs
          (product_id, change_type, quantity_change, previous_stock, current_stock, note, created_by_user_id)
         VALUES (?, 'xuat_ban', ?, ?, ?, ?, ?)`,
        [item.productId, -item.quantity, item.prevStock, nextStock, `Xuất hàng cho đơn #${orderCode}`, req.user.id]
      )
    }

    // 4. Record order_status_logs
    await connection.query(
      `INSERT INTO order_status_logs (order_id, previous_status, new_status, note, changed_by_user_id)
       VALUES (?, NULL, 'da_dat', 'Khách hàng tạo đơn hàng', ?)`,
      [orderId, req.user.id]
    )

    // 5. If voucher applied, record into voucher_usages & increment times_used
    if (voucherCode) {
      const [vouchers] = await connection.query('SELECT id FROM vouchers WHERE code = ?', [voucherCode])
      if (vouchers[0]) {
        await connection.query(
          `INSERT INTO voucher_usages (voucher_id, user_id, order_id, discount_applied)
           VALUES (?, ?, ?, ?)`,
          [vouchers[0].id, req.user.id, orderId, finalDiscount]
        )
        await connection.query(
          'UPDATE vouchers SET times_used = times_used + 1 WHERE id = ?',
          [vouchers[0].id]
        )
      }
    }

    await connection.commit()
    res.status(201).json({
      id: orderId,
      orderCode,
      totalAmount: total,
      message: 'Đặt hàng thành công!'
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function updateOrderStatus(req, res) {
  const { status, note } = req.body
  const orderId = req.params.id

  const validStatuses = ['da_dat', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ.' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    const [orders] = await connection.query(
      'SELECT id, order_code, status FROM orders WHERE id = ? FOR UPDATE',
      [orderId]
    )
    if (!orders[0]) {
      await connection.rollback()
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' })
    }

    const prevStatus = orders[0].status
    const orderCode = orders[0].order_code

    // If changing to 'da_huy': restore stock and log inventory
    if (status === 'da_huy' && prevStatus !== 'da_huy') {
      const [items] = await connection.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      )
      for (const item of items) {
        const [prod] = await connection.query('SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE', [item.product_id])
        const prevStock = prod[0]?.stock_quantity || 0
        const nextStock = prevStock + item.quantity

        await connection.query(
          `UPDATE products
           SET stock_quantity = ?,
               condition_status = 'con_hang'
           WHERE id = ?`,
          [nextStock, item.product_id]
        )

        await connection.query(
          `INSERT INTO product_inventory_logs
            (product_id, change_type, quantity_change, previous_stock, current_stock, note, created_by_user_id)
           VALUES (?, 'huy_don_hoan_kho', ?, ?, ?, ?, ?)`,
          [item.product_id, item.quantity, prevStock, nextStock, `Hoàn kho do hủy đơn #${orderCode}`, req.user.id]
        )
      }
    }

    // Update status
    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId])

    // Record timeline log in order_status_logs
    await connection.query(
      `INSERT INTO order_status_logs (order_id, previous_status, new_status, note, changed_by_user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, prevStatus, status, note || `Cập nhật trạng thái sang ${status}`, req.user.id]
    )

    await connection.commit()
    res.json({ message: `Đã cập nhật trạng thái đơn hàng sang "${status}".` })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
