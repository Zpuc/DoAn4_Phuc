import jwt from 'jsonwebtoken'

export function authenticate(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập.' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' })
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' })
    }
    next()
  }
}