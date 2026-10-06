import { pool } from '../config/db.js'

export async function listArticles(req, res) {
  const { category, grade, search, sort = 'latest' } = req.query

  const conditions = ['a.is_published = TRUE']
  const params = []

  if (category && category !== 'all' && category !== 'Tất cả') {
    conditions.push('a.category_tag = ?')
    params.push(category)
  }

  if (grade && grade !== 'all' && grade !== 'Tất cả') {
    // If user filters for e.g. 'HG', match 'HG 1/144' or articles set to 'Tất cả' or related_grade containing that grade
    conditions.push('(a.related_grade LIKE ? OR a.related_grade = "Tất cả")')
    params.push(`%${grade}%`)
  }

  if (search && search.trim()) {
    conditions.push('(a.title LIKE ? OR a.excerpt LIKE ? OR p.name LIKE ?)')
    const searchTerm = `%${search.trim()}%`
    params.push(searchTerm, searchTerm, searchTerm)
  }

  let orderBy = 'a.created_at DESC'
  if (sort === 'views') {
    orderBy = 'a.views_count DESC, a.created_at DESC'
  } else if (sort === 'oldest') {
    orderBy = 'a.created_at ASC'
  }

  const query = `
    SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image, a.category_tag, a.related_grade,
           a.views_count, a.created_at,
           u.full_name AS author_name,
           p.id AS product_id, p.name AS product_name, p.price AS product_price,
           p.image_url AS product_image, p.grade AS product_grade, p.sku AS product_sku
    FROM news_articles a
    JOIN users u ON u.id = a.author_id
    LEFT JOIN products p ON p.id = a.related_product_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
  `

  const [rows] = await pool.query(query, params)
  res.json(rows)
}

// Admin: List ALL articles including unpublished
export async function listAllArticles(req, res) {
  const [rows] = await pool.query(
    `SELECT a.*, u.full_name AS author_name,
            p.name AS product_name
     FROM news_articles a
     JOIN users u ON u.id = a.author_id
     LEFT JOIN products p ON p.id = a.related_product_id
     ORDER BY a.created_at DESC`
  )
  res.json(rows)
}

export async function getArticleFilters(req, res) {
  const [categories] = await pool.query(
    'SELECT DISTINCT category_tag FROM news_articles WHERE is_published = TRUE ORDER BY category_tag ASC'
  )
  const [grades] = await pool.query(
    'SELECT DISTINCT related_grade FROM news_articles WHERE is_published = TRUE ORDER BY related_grade ASC'
  )

  res.json({
    categories: ['Tất cả', ...categories.map((c) => c.category_tag)],
    grades: ['Tất cả', 'HG 1/144', 'RG 1/144', 'MG 1/100', 'PG 1/60', 'SD']
  })
}

export async function getArticle(req, res) {
  const { slug } = req.params

  const [rows] = await pool.query(
    `SELECT a.*, u.full_name AS author_name,
            p.id AS product_id, p.name AS product_name, p.price AS product_price,
            p.old_price AS product_old_price, p.image_url AS product_image,
            p.grade AS product_grade, p.sku AS product_sku, p.stock_quantity AS product_stock
     FROM news_articles a
     JOIN users u ON u.id = a.author_id
     LEFT JOIN products p ON p.id = a.related_product_id
     WHERE a.slug = ? AND a.is_published = TRUE`,
    [slug]
  )

  if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy bài viết.' })

  // Increment view count in background
  pool.query('UPDATE news_articles SET views_count = views_count + 1 WHERE id = ?', [rows[0].id]).catch(() => {})

  res.json(rows[0])
}

export async function createArticle(req, res) {
  const {
    title,
    excerpt,
    content,
    coverImage,
    categoryTag = 'Kỹ thuật ráp',
    relatedGrade = 'Tất cả',
    relatedProductId = null
  } = req.body

  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-4)}`

  const [result] = await pool.query(
    `INSERT INTO news_articles (author_id, related_product_id, title, slug, excerpt, content, cover_image, category_tag, related_grade)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      relatedProductId || null,
      title.trim(),
      slug,
      excerpt.trim(),
      content.trim(),
      coverImage || null,
      categoryTag,
      relatedGrade
    ]
  )

  res.status(201).json({ id: result.insertId, slug, message: 'Đã xuất bản bài viết thành công.' })
}

export async function updateArticle(req, res) {
  const { title, excerpt, content, coverImage, categoryTag, relatedGrade, relatedProductId, isPublished } = req.body

  const [result] = await pool.query(
    `UPDATE news_articles SET title = ?, excerpt = ?, content = ?, cover_image = ?, category_tag = ?, related_grade = ?, related_product_id = ?, is_published = ? WHERE id = ?`,
    [
      title?.trim(),
      excerpt?.trim(),
      content?.trim(),
      coverImage || null,
      categoryTag || 'Kỹ thuật ráp',
      relatedGrade || 'Tất cả',
      relatedProductId || null,
      isPublished ?? true,
      req.params.id
    ]
  )
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy bài viết.' })
  res.json({ message: 'Đã cập nhật bài viết!' })
}

export async function deleteArticle(req, res) {
  const [result] = await pool.query('DELETE FROM news_articles WHERE id = ?', [req.params.id])
  if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy bài viết.' })
  res.json({ message: 'Đã xóa bài viết.' })
}
