import { pool } from '../config/db.js'

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : value ?? null)
const normalizeGallery = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join('|')
  if (typeof value === 'string') return value.trim() || null
  return value ?? null
}

export async function listProducts(req, res) {
  const { search = '', categoryId, grade, minPrice, maxPrice, inStock, sort = 'featured', page = 1, limit = 12 } = req.query
  const values = []
  const where = ['p.is_active = TRUE']

  if (search) {
    where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.series_name LIKE ?)')
    values.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (categoryId) {
    where.push('p.category_id = ?')
    values.push(categoryId)
  }
  if (grade && grade !== 'Tất cả') {
    where.push('(p.grade LIKE ? OR c.name LIKE ?)')
    values.push(`%${grade}%`, `%${grade}%`)
  }
  if (minPrice) {
    where.push('p.price >= ?')
    values.push(Number(minPrice))
  }
  if (maxPrice) {
    where.push('p.price <= ?')
    values.push(Number(maxPrice))
  }
  if (inStock === 'true') {
    where.push('p.stock_quantity > 0')
  } else if (inStock === 'false') {
    where.push('p.stock_quantity = 0')
  }

  let orderSql = 'p.created_at DESC'
  if (sort === 'low' || sort === 'price_asc') {
    orderSql = 'p.price ASC'
  } else if (sort === 'high' || sort === 'price_desc') {
    orderSql = 'p.price DESC'
  } else if (sort === 'name') {
    orderSql = 'p.name ASC'
  } else if (sort === 'featured') {
    orderSql = 'p.id ASC'
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 100)
  const safePage = Math.max(Number(page) || 1, 1)
  const offset = (safePage - 1) * safeLimit
  const whereSql = where.join(' AND ')

  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count,
      (SELECT COALESCE(AVG(r.rating), 5) FROM reviews r WHERE r.product_id = p.id) AS avg_rating
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE ${whereSql}
    ORDER BY ${orderSql}
    LIMIT ? OFFSET ?`,
    [...values, safeLimit, offset]
  )

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id = p.category_id WHERE ${whereSql}`, values)
  const total = countRows[0].total
  const totalPages = Math.ceil(total / safeLimit) || 1

  res.json({
    data: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages
    }
  })
}

export async function getProduct(req, res) {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name,
      (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count,
      (SELECT COALESCE(AVG(r.rating), 5) FROM reviews r WHERE r.product_id = p.id) AS avg_rating
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.id = ?`,
    [req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })

  const [reviews] = await pool.query(
    `SELECT r.*, u.full_name AS user_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC`,
    [req.params.id]
  )

  res.json({ ...rows[0], reviews })
}

export async function createProduct(req, res) {
  const {
    categoryId,
    sku,
    name,
    grade,
    scale,
    price,
    oldPrice,
    stockQuantity = 0,
    conditionStatus = 'con_hang',
    warrantyMonths = 12,
    warrantyPolicy,
    manufacturer,
    seriesName,
    material,
    detailCount,
    accessories,
    assemblyType,
    origin,
    description = null,
    imageUrl = null,
    galleryImages,
    heightCm,
    boxWeightG,
    boxSize,
    releaseYear,
    isActive = true
  } = req.body

  const [result] = await pool.query(
    `INSERT INTO products (
      category_id, sku, name, grade, scale, price, old_price, stock_quantity, condition_status,
      warranty_months, warranty_policy, manufacturer, series_name, material, detail_count, accessories,
      assembly_type, origin, description, image_url, gallery_images, height_cm, box_weight_g, box_size,
      release_year, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      categoryId,
      normalizeText(sku),
      normalizeText(name),
      normalizeText(grade),
      normalizeText(scale),
      price,
      oldPrice ?? null,
      stockQuantity,
      conditionStatus,
      warrantyMonths,
      normalizeText(warrantyPolicy),
      normalizeText(manufacturer),
      normalizeText(seriesName),
      normalizeText(material),
      detailCount ?? null,
      normalizeText(accessories),
      normalizeText(assemblyType),
      normalizeText(origin),
      normalizeText(description),
      normalizeText(imageUrl),
      normalizeGallery(galleryImages),
      heightCm ?? null,
      boxWeightG ?? null,
      normalizeText(boxSize),
      releaseYear ?? null,
      isActive
    ]
  )
  res.status(201).json({ id: result.insertId, message: 'Đã tạo sản phẩm thành công.' })
}

export async function updateProduct(req, res) {
  const {
    categoryId,
    sku,
    name,
    grade,
    scale,
    price,
    oldPrice,
    stockQuantity,
    conditionStatus,
    warrantyMonths = 12,
    warrantyPolicy,
    manufacturer,
    seriesName,
    material,
    detailCount,
    accessories,
    assemblyType,
    origin,
    description,
    imageUrl,
    galleryImages,
    heightCm,
    boxWeightG,
    boxSize,
    releaseYear,
    isActive = true
  } = req.body

  const [result] = await pool.query(
    `UPDATE products SET
      category_id = ?, sku = ?, name = ?, grade = ?, scale = ?, price = ?, old_price = ?, stock_quantity = ?, condition_status = ?,
      warranty_months = ?, warranty_policy = ?, manufacturer = ?, series_name = ?, material = ?, detail_count = ?, accessories = ?,
      assembly_type = ?, origin = ?, description = ?, image_url = ?, gallery_images = ?, height_cm = ?, box_weight_g = ?, box_size = ?, release_year = ?, is_active = ?
      WHERE id = ?`,
    [
      categoryId,
      normalizeText(sku),
      normalizeText(name),
      normalizeText(grade),
      normalizeText(scale),
      price,
      oldPrice ?? null,
      stockQuantity,
      conditionStatus,
      warrantyMonths,
      normalizeText(warrantyPolicy),
      normalizeText(manufacturer),
      normalizeText(seriesName),
      normalizeText(material),
      detailCount ?? null,
      normalizeText(accessories),
      normalizeText(assemblyType),
      normalizeText(origin),
      normalizeText(description),
      normalizeText(imageUrl),
      normalizeGallery(galleryImages),
      heightCm ?? null,
      boxWeightG ?? null,
      normalizeText(boxSize),
      releaseYear ?? null,
      isActive,
      req.params.id
    ]
  )
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })
  res.json({ message: 'Đã cập nhật sản phẩm thành công.' })
}

export async function deleteProduct(req, res) {
  const [result] = await pool.query('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })
  res.json({ message: 'Đã ngừng kinh doanh sản phẩm.' })
}