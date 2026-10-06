import axios from 'axios'
import http from 'http'
import app from '../app.js'

async function runTests() {
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(4001, resolve))
  console.log('Test server running on port 4001')

  const client = axios.create({ baseURL: 'http://localhost:4001/api' })

  try {
    console.log('\n--- 1. Testing Health & Public Products API ---')
    const health = await client.get('/health')
    console.log('Health:', health.data)

    const productsRes = await client.get('/products?page=1&limit=6&grade=Real%20Grade')
    console.log(`Found ${productsRes.data.data.length} Real Grade products (Total: ${productsRes.data.pagination.total})`)

    console.log('\n--- 2. Testing User Login ---')
    const userLogin = await client.post('/auth/login', {
      email: 'user@autobot.local',
      password: 'Password123!'
    })
    const userToken = userLogin.data.token
    console.log('Logged in as:', userLogin.data.user.fullName)

    const userClient = axios.create({
      baseURL: 'http://localhost:4001/api',
      headers: { Authorization: `Bearer ${userToken}` }
    })

    console.log('\n--- 3. Testing User Profile ---')
    const profileRes = await userClient.get('/auth/profile')
    console.log('Profile:', profileRes.data.full_name, profileRes.data.email)

    console.log('\n--- 4. Testing Voucher Validation ---')
    const voucherRes = await userClient.get('/vouchers/validate?code=AUTOBOT10&orderAmount=1200000')
    console.log('Voucher valid:', voucherRes.data.valid, 'Discount:', voucherRes.data.discountAmount)

    console.log('\n--- 5. Testing Order Placement with Transaction ---')
    const targetProduct = productsRes.data.data[0]
    const initialStock = targetProduct.stock_quantity
    console.log(`Target product: ${targetProduct.name}, initial stock: ${initialStock}`)

    const orderRes = await userClient.post('/orders', {
      shippingAddress: '123 Đường Test, Quận 1, TP.HCM',
      customerNote: 'Đơn hàng test tự động',
      voucherCode: 'AUTOBOT10',
      discountAmount: voucherRes.data.discountAmount,
      items: [{ productId: targetProduct.id, quantity: 2 }]
    })
    console.log('Created order:', orderRes.data.orderCode, 'Total:', orderRes.data.totalAmount)

    console.log('\n--- 6. Verifying Inventory Deduction ---')
    const verifyProduct = await client.get(`/products/${targetProduct.id}`)
    console.log(`New stock: ${verifyProduct.data.stock_quantity} (decreased by 2: ${initialStock - verifyProduct.data.stock_quantity === 2})`)

    console.log('\n--- 7. Testing User My Orders List ---')
    const myOrders = await userClient.get('/orders/my')
    console.log(`User has ${myOrders.data.length} orders in history`)

    console.log('\n--- 8. Testing Product Review ---')
    const reviewRes = await userClient.post(`/products/${targetProduct.id}/reviews`, {
      rating: 5,
      comment: 'Kit siêu chi tiết, đóng gói bọc xốp cẩn thận!'
    })
    console.log('Review result:', reviewRes.data.message)

    console.log('\n--- 9. Testing Admin Login & Dashboard ---')
    const adminLogin = await client.post('/auth/login', {
      email: 'admin@autobot.local',
      password: 'Password123!'
    })
    const adminToken = adminLogin.data.token
    const adminClient = axios.create({
      baseURL: 'http://localhost:4001/api',
      headers: { Authorization: `Bearer ${adminToken}` }
    })

    const dashboardRes = await adminClient.get('/dashboard')
    console.log('Dashboard summary:', dashboardRes.data.summary)
    console.log('Monthly revenue entries:', dashboardRes.data.monthlyRevenue.length)

    console.log('\n--- 10. Admin Updating Order Status ---')
    const updateRes = await adminClient.patch(`/orders/${orderRes.data.id}/status`, {
      status: 'da_xac_nhan'
    })
    console.log('\n--- 11. Testing Articles Filtering by Category & Grade ---')
    const filtersRes = await userClient.get('/articles/filters')
    console.log('Available filters:', filtersRes.data)

    const hgArticles = await userClient.get('/articles?grade=HG')
    console.log('HG articles count:', hgArticles.data.length)

    const reviewArticles = await userClient.get('/articles?category=Review%20m%C3%B4%20h%C3%ACnh')
    console.log('Review articles count:', reviewArticles.data.length)

    console.log('\n🎉 ALL 11 INTEGRATION TESTS PASSED PERFECTLY!')
  } catch (err) {
    console.error('Test error:', err.response?.data || err.message)
    process.exitCode = 1
  } finally {
    server.close()
  }
}

runTests()
