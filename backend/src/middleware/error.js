export function notFound(req, res) {
  res.status(404).json({ message: `Không tìm thấy endpoint ${req.method} ${req.originalUrl}.` })
}

export function errorHandler(error, req, res, next) {
  console.error(error)
  if (res.headersSent) return next(error)

  const status = error.statusCode || (error.code === 'ER_DUP_ENTRY' ? 409 : 500)
  const message = error.code === 'ER_DUP_ENTRY' ? 'Dữ liệu bị trùng.' : error.message || 'Lỗi máy chủ.'
  res.status(status).json({ message })
}