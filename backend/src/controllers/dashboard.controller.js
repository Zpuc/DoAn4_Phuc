import { pool } from '../config/db.js'

export async function getDashboard(req, res) {
  const [[revenue]] = await pool.query(
    "SELECT COALESCE(SUM(total_amount), 0) AS total_revenue, COUNT(*) AS total_orders FROM orders WHERE status != 'da_huy'"
  )
  const [[confirmedOrders]] = await pool.query(
    "SELECT COUNT(*) AS confirmed_orders FROM orders WHERE status IN ('da_xac_nhan', 'dang_giao', 'da_giao')"
  )
  const [[products]] = await pool.query('SELECT COUNT(*) AS total_products FROM products WHERE is_active = TRUE')
  const [[customers]] = await pool.query("SELECT COUNT(*) AS total_users FROM users WHERE role = 'user'")

  // Monthly revenue analytics for charts
  const [monthlyRevenue] = await pool.query(`
    SELECT
      DATE_FORMAT(created_at, '%m/%Y') AS month_label,
      DATE_FORMAT(created_at, '%Y-%m') AS month_key,
      COALESCE(SUM(total_amount), 0) AS revenue,
      COUNT(*) AS order_count
    FROM orders
    WHERE status != 'da_huy'
    GROUP BY month_key, month_label
    ORDER BY month_key ASC
    LIMIT 12
  `)

  // Status breakdown
  const [statusStats] = await pool.query(`
    SELECT status, COUNT(*) AS count
    FROM orders
    GROUP BY status
  `)

  const [bestSellers] = await pool.query(`
    SELECT oi.product_id, oi.product_name, SUM(oi.quantity) AS quantity_sold, SUM(oi.line_total) AS total_sales
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'da_huy'
    GROUP BY oi.product_id, oi.product_name
    ORDER BY quantity_sold DESC
    LIMIT 5
  `)

  const [lowStock] = await pool.query(`
    SELECT id, sku, name, stock_quantity, price, condition_status
    FROM products
    WHERE is_active = TRUE AND stock_quantity <= 5
    ORDER BY stock_quantity ASC
    LIMIT 10
  `)

  res.json({
    summary: {
      total_revenue: revenue.total_revenue,
      total_orders: revenue.total_orders,
      confirmed_orders: confirmedOrders.confirmed_orders,
      total_products: products.total_products,
      total_users: customers.total_users
    },
    monthlyRevenue,
    statusStats,
    bestSellers,
    lowStock
  })
}