import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middleware/error.js'
import { rateLimiter } from './middleware/rateLimiter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(helmet({ crossOriginResourcePolicy: false }))

// Cho phép tất cả các cổng localhost (5173, 5174, 5175,...) và các URL trong CLIENT_URL
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }
    const envOrigins = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim())
    if (envOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(null, true)
  },
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))
app.use(rateLimiter({ windowMs: 60 * 1000, max: 200 }))

// Serve static uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

app.use('/api', routes)
app.use(notFound)
app.use(errorHandler)

export default app