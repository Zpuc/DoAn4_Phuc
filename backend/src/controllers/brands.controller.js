import { pool } from '../config/db.js'

export async function listBrands(req, res) {
  const [rows] = await pool.query('SELECT * FROM brands ORDER BY id ASC')
  res.json(rows)
}

export async function createBrand(req, res) {
  const { name, slug, country = 'Nhật Bản', description = null, logoUrl = null } = req.body
  const brandSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  const [existing] = await pool.query('SELECT id FROM brands WHERE slug = ?', [brandSlug])
  if (existing[0]) return res.status(409).json({ message: 'Thương hiệu với slug này đã tồn tại.' })

  const [result] = await pool.query(
    'INSERT INTO brands (name, slug, country, description, logo_url) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), brandSlug, country, description, logoUrl]
  )
  res.status(201).json({ id: result.insertId, message: 'Đã tạo thương hiệu mới!' })
}

export async function updateBrand(req, res) {
  const { name, slug, country, description, logoUrl, isActive } = req.body
  const [result] = await pool.query(
    'UPDATE brands SET name = ?, slug = ?, country = ?, description = ?, logo_url = ?, is_active = ? WHERE id = ?',
    [name?.trim(), slug, country, description, logoUrl, isActive ?? true, req.params.id]
  )
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy thương hiệu.' })
  res.json({ message: 'Đã cập nhật thương hiệu!' })
}

export async function deleteBrand(req, res) {
  try {
    const [result] = await pool.query('DELETE FROM brands WHERE id = ?', [req.params.id])
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy thương hiệu.' })
    res.json({ message: 'Đã xóa thương hiệu.' })
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: 'Không thể xóa vì có sản phẩm đang thuộc thương hiệu này.' })
    }
    throw err
  }
}
