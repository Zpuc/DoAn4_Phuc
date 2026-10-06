const requestCounts = new Map()

export function rateLimiter({ windowMs = 60 * 1000, max = 120, message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    const now = Date.now()

    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
      return next()
    }

    const record = requestCounts.get(ip)
    if (now > record.resetTime) {
      record.count = 1
      record.resetTime = now + windowMs
      return next()
    }

    record.count += 1
    if (record.count > max) {
      return res.status(429).json({ message })
    }

    next()
  }
}
