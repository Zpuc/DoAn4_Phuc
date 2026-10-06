import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client.js'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import CartDrawer from '../components/CartDrawer.jsx'
import CheckoutModal from '../components/CheckoutModal.jsx'

const CATEGORIES = [
  'Tất cả',
  'Kỹ thuật ráp',
  'Review mô hình',
  'Cẩm nang chọn kit',
  'Kinh nghiệm chơi'
]

const GRADES = [
  { label: 'Tất cả Grade', value: 'all' },
  { label: 'HG (1/144)', value: 'HG' },
  { label: 'RG (1/144)', value: 'RG' },
  { label: 'MG (1/100)', value: 'MG' },
  { label: 'PG (1/60)', value: 'PG' },
  { label: 'SD Chibi', value: 'SD' }
]

export default function ArticlesPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('latest')

  const fetchArticles = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategory !== 'Tất cả') params.append('category', selectedCategory)
    if (selectedGrade !== 'all') params.append('grade', selectedGrade)
    if (searchQuery.trim()) params.append('search', searchQuery.trim())
    if (sortBy) params.append('sort', sortBy)

    apiClient
      .get(`/articles?${params.toString()}`)
      .then(({ data }) => setArticles(data || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchArticles()
  }, [selectedCategory, selectedGrade, sortBy])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchArticles()
  }

  const handleResetFilters = () => {
    setSelectedCategory('Tất cả')
    setSelectedGrade('all')
    setSearchQuery('')
    setSortBy('latest')
  }

  return (
    <div className="app-shell">
      <Navbar />

      <main style={{ padding: '60px 8vw 100px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        {/* Header section */}
        <div style={{ marginBottom: '36px' }}>
          <p className="eyebrow">AUTOBOT / GUNDAM BUILDER JOURNAL</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', margin: '0 0 12px', letterSpacing: '-0.05em' }}>
                Cẩm nang & Kinh nghiệm ráp Gunpla
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '680px', lineHeight: 1.6, margin: 0 }}>
                Kho tri thức builder chuyên sâu: kỹ thuật xử lý ghẻ nub marks, kẻ lằn chìm panel lining, đánh giá chi tiết từng dòng mô hình Bandai và cẩm nang chọn kit theo ngân sách.
              </p>
            </div>

            {/* Quick Search & Sort Bar */}
            <form
              onSubmit={handleSearchSubmit}
              style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '440px' }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Tìm theo tên mô hình, kỹ thuật..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 36px 12px 14px',
                    border: '1px solid var(--line)',
                    background: '#fff',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setTimeout(fetchArticles, 0)
                    }}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--muted)',
                      fontSize: '14px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <button type="submit" className="primary-button" style={{ padding: '12px 18px', fontSize: '13px' }}>
                Tìm kiếm
              </button>
            </form>
          </div>
        </div>

        {/* Filter Controls Box */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            padding: '20px 24px',
            marginBottom: '40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}
        >
          {/* Row 1: Filter by Category */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'DM Mono', fontWeight: 600, color: 'var(--muted)', minWidth: '130px', textTransform: 'uppercase' }}>
              📁 Thể loại bài:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12.5px',
                      fontFamily: 'inherit',
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? 'var(--dark)' : '#f5f3ef',
                      color: isActive ? '#fff' : 'var(--dark)',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--dark)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 2: Filter by Model Grade */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'DM Mono', fontWeight: 600, color: 'var(--accent)', minWidth: '130px', textTransform: 'uppercase' }}>
              🤖 Dòng mô hình:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {GRADES.map((g) => {
                const isActive = selectedGrade === g.value
                return (
                  <button
                    key={g.value}
                    onClick={() => setSelectedGrade(g.value)}
                    style={{
                      padding: '6px 13px',
                      fontSize: '12px',
                      fontFamily: 'DM Mono',
                      fontWeight: isActive ? 700 : 500,
                      background: isActive ? 'var(--accent)' : '#fff',
                      color: isActive ? '#fff' : 'var(--dark)',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--line)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {g.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 3: Sort selector & Status count */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px dashed var(--line)',
              paddingTop: '14px',
              fontSize: '12px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>
                Tìm thấy <b>{articles.length}</b> bài viết phù hợp
              </span>
              {(selectedCategory !== 'Tất cả' || selectedGrade !== 'all' || searchQuery.trim()) && (
                <button
                  onClick={handleResetFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    fontSize: '12px'
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--muted)', fontFamily: 'DM Mono' }}>Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  border: '1px solid var(--line)',
                  background: '#fff',
                  fontFamily: 'inherit'
                }}
              >
                <option value="latest">Mới nhất</option>
                <option value="views">Xem nhiều nhất</option>
                <option value="oldest">Cũ nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--muted)', background: '#fff', border: '1px solid var(--line)' }}>
            <p style={{ fontFamily: 'DM Mono', margin: 0 }}>Đang tải bài viết theo bộ lọc...</p>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', background: '#fff', border: '1px solid var(--line)' }}>
            <p style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>
              Không tìm thấy bài viết nào phù hợp
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 24px' }}>
              Hãy thử chọn thể loại khác hoặc xóa bớt tiêu chí lọc mô hình.
            </p>
            <button onClick={handleResetFilters} className="primary-button" style={{ padding: '10px 20px' }}>
              Đặt lại toàn bộ lọc
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '28px' }}>
            {articles.map((art) => (
              <article
                key={art.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Thumbnail image */}
                <div style={{ height: '220px', overflow: 'hidden', background: '#ece8e1', position: 'relative' }}>
                  <img
                    src={art.cover_image || 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=900&q=85'}
                    alt={art.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {art.related_grade && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.85)',
                        color: '#fff',
                        padding: '4px 9px',
                        fontSize: '11px',
                        fontFamily: 'DM Mono',
                        fontWeight: 700,
                        letterSpacing: '0.04em'
                      }}
                    >
                      {art.related_grade}
                    </span>
                  )}
                </div>

                {/* Article details */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'DM Mono', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {art.category_tag}
                      </span>
                      <small style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'DM Mono' }}>
                        👁 {art.views_count.toLocaleString('vi-VN')} lượt xem
                      </small>
                    </div>

                    <h2 style={{ fontSize: '18px', margin: '0 0 10px', lineHeight: 1.4 }}>
                      <Link to={`/cam-nang/${art.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {art.title}
                      </Link>
                    </h2>

                    <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
                      {art.excerpt}
                    </p>

                    {/* Associated Model Badge if linked to a product */}
                    {art.product_name && (
                      <div
                        style={{
                          marginBottom: '18px',
                          padding: '8px 12px',
                          background: '#faf9f5',
                          border: '1px dashed var(--line)',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          <span style={{ color: 'var(--accent)', fontSize: '13px' }}>🎯</span>
                          <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>Mô hình:</span>
                          <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {art.product_name}
                          </strong>
                        </div>
                        {art.product_price && (
                          <span style={{ fontFamily: 'DM Mono', color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {Number(art.product_price).toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '14px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted)' }}>
                      Tác giả: <b>{art.author_name}</b>
                    </span>
                    <Link
                      to={`/cam-nang/${art.slug}`}
                      style={{ fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
                    >
                      Đọc chi tiết →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
      <CheckoutModal />
    </div>
  )
}
