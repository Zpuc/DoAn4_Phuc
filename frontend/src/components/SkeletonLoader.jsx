export function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card">
      <div className="product-image skeleton-box" style={{ height: '280px' }} />
      <div className="product-info" style={{ marginTop: '12px' }}>
        <div className="skeleton-line" style={{ width: '40%', height: '12px', marginBottom: '8px' }} />
        <div className="skeleton-line" style={{ width: '85%', height: '18px', marginBottom: '10px' }} />
        <div className="skeleton-line" style={{ width: '50%', height: '16px' }} />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="simple-page product-detail-page skeleton-detail">
      <div className="skeleton-line" style={{ width: '120px', height: '16px', marginBottom: '24px' }} />
      <div className="detail-layout">
        <div className="detail-gallery skeleton-box" style={{ minHeight: '420px' }} />
        <div className="detail-info">
          <div className="skeleton-line" style={{ width: '30%', height: '14px', marginBottom: '12px' }} />
          <div className="skeleton-line" style={{ width: '80%', height: '36px', marginBottom: '20px' }} />
          <div className="skeleton-line" style={{ width: '45%', height: '28px', marginBottom: '24px' }} />
          <div className="skeleton-line" style={{ width: '100%', height: '80px', marginBottom: '24px' }} />
          <div className="skeleton-box" style={{ width: '100%', height: '48px' }} />
        </div>
      </div>
    </div>
  )
}
