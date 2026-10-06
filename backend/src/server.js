import 'dotenv/config'
import app from './app.js'
import { checkDatabaseConnection } from './config/db.js'

const port = Number(process.env.PORT || 4000)

try {
  await checkDatabaseConnection()
  app.listen(port, () => console.log(`AUTOBOT API đang chạy tại http://localhost:${port}`))
} catch (error) {
  console.error('Không thể kết nối MySQL:', error.message)
  process.exit(1)
}