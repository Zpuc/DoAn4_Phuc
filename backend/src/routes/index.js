import { Router } from 'express'
import { body, param } from 'express-validator'
import { login, register, getProfile, updateProfile } from '../controllers/auth.controller.js'
import * as products from '../controllers/products.controller.js'
import * as categories from '../controllers/categories.controller.js'
import * as orders from '../controllers/orders.controller.js'
import * as users from '../controllers/users.controller.js'
import * as reviews from '../controllers/reviews.controller.js'
import * as vouchers from '../controllers/vouchers.controller.js'
import * as cart from '../controllers/cart.controller.js'
import * as wishlist from '../controllers/wishlist.controller.js'
import * as addresses from '../controllers/addresses.controller.js'
import * as inventory from '../controllers/inventory.controller.js'
import * as articles from '../controllers/articles.controller.js'
import * as brands from '../controllers/brands.controller.js'
import { getDashboard } from '../controllers/dashboard.controller.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { upload } from '../middleware/upload.js'

const router = Router()
const idRule = param('id').isInt({ min: 1 }).withMessage('ID không hợp lệ.')
const productRules = [
  body('categoryId').isInt({ min: 1 }),
  body('sku').trim().notEmpty().isLength({ max: 50 }),
  body('name').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stockQuantity').isInt({ min: 0 }),
  body('warrantyMonths').optional().isInt({ min: 0 })
]

// 1. Health & Upload
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'autobot-api', tablesCount: 16 }))
router.post('/upload', authenticate, authorize('admin'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Không có file ảnh nào được tải lên.' })
  const fileUrl = `/uploads/${req.file.filename}`
  res.json({ url: fileUrl, message: 'Upload ảnh thành công!' })
})

// 2. Auth & Profile
router.post('/auth/login', [body('email').isEmail(), body('password').isLength({ min: 6 }), validate], login)
router.post('/auth/register', [
  body('fullName').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  validate
], register)
router.get('/auth/profile', authenticate, getProfile)
router.put('/auth/profile', authenticate, [
  body('fullName').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  validate
], updateProfile)

// 3. User Addresses (Sổ địa chỉ)
router.get('/addresses', authenticate, addresses.listAddresses)
router.post('/addresses', authenticate, [
  body('recipientName').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('addressLine').trim().notEmpty(),
  validate
], addresses.addAddress)
router.put('/addresses/:id/default', authenticate, idRule, validate, addresses.setDefaultAddress)
router.delete('/addresses/:id', authenticate, idRule, validate, addresses.deleteAddress)

// 4. Products & Brands
router.get('/products', products.listProducts)
router.get('/products/:id', [idRule, validate], products.getProduct)
router.post('/products', authenticate, authorize('admin'), [...productRules, validate], products.createProduct)
router.put('/products/:id', authenticate, authorize('admin'), [idRule, ...productRules, validate], products.updateProduct)
router.delete('/products/:id', authenticate, authorize('admin'), [idRule, validate], products.deleteProduct)

// Brands CRUD (Admin)
router.get('/brands', brands.listBrands)
router.post('/brands', authenticate, authorize('admin'), [body('name').trim().notEmpty(), validate], brands.createBrand)
router.put('/brands/:id', authenticate, authorize('admin'), [idRule, body('name').trim().notEmpty(), validate], brands.updateBrand)
router.delete('/brands/:id', authenticate, authorize('admin'), [idRule, validate], brands.deleteBrand)

// 5. Wishlists (Kit yêu thích của builder)
router.get('/wishlist', authenticate, wishlist.getWishlist)
router.post('/wishlist/:productId', authenticate, wishlist.toggleWishlist)
router.delete('/wishlist/:productId', authenticate, wishlist.removeFromWishlist)

// 6. Reviews
router.get('/products/:id/reviews', [idRule, validate], reviews.listProductReviews)
router.post('/products/:id/reviews', authenticate, [
  idRule,
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim(),
  validate
], reviews.createReview)

// Reviews Admin (Quản lý tất cả đánh giá)
router.get('/reviews', authenticate, authorize('admin'), reviews.listAllReviews)
router.patch('/reviews/:id/approve', authenticate, authorize('admin'), [idRule, body('isApproved').isBoolean(), validate], reviews.approveReview)
router.delete('/reviews/:id', authenticate, authorize('admin'), [idRule, validate], reviews.deleteReview)

// 7. Vouchers (Public: list & validate)
router.get('/vouchers', vouchers.listVouchers)
router.get('/vouchers/validate', vouchers.validateVoucher)

// Vouchers CRUD (Admin)
router.post('/vouchers', authenticate, authorize('admin'), [body('code').trim().notEmpty(), validate], vouchers.createVoucher)
router.put('/vouchers/:id', authenticate, authorize('admin'), [idRule, validate], vouchers.updateVoucher)
router.delete('/vouchers/:id', authenticate, authorize('admin'), [idRule, validate], vouchers.deleteVoucher)
router.get('/vouchers/usages', authenticate, authorize('admin'), vouchers.listVoucherUsages)

// 8. Persistent Cart (Server sync)
router.get('/cart', authenticate, cart.getCart)
router.post('/cart', authenticate, [body('productId').isInt({ min: 1 }), body('quantity').optional().isInt({ min: 1 }), validate], cart.addToCart)
router.put('/cart/:productId', authenticate, [body('quantity').isInt({ min: 0 }), validate], cart.updateCartItem)
router.delete('/cart/:productId', authenticate, cart.removeCartItem)
router.delete('/cart', authenticate, cart.clearCart)

// 9. Categories
router.get('/categories', categories.listCategories)
router.post('/categories', authenticate, authorize('admin'), [body('name').trim().notEmpty(), body('slug').trim().notEmpty(), validate], categories.createCategory)
router.put('/categories/:id', authenticate, authorize('admin'), [idRule, body('name').trim().notEmpty(), body('slug').trim().notEmpty(), validate], categories.updateCategory)
router.delete('/categories/:id', authenticate, authorize('admin'), [idRule, validate], categories.deleteCategory)

// 10. Orders
router.get('/orders', authenticate, authorize('admin'), orders.listOrders)
router.get('/orders/my', authenticate, orders.listMyOrders)
router.get('/orders/my/:id', authenticate, [idRule, validate], orders.listMyOrderDetail)
router.get('/orders/:id', authenticate, authorize('admin'), [idRule, validate], orders.getOrder)
router.post('/orders', authenticate, [body('shippingAddress').trim().notEmpty(), body('items').isArray({ min: 1 }), validate], orders.createOrder)
router.patch('/orders/:id/status', authenticate, authorize('admin'), [idRule, body('status').isIn(['da_dat', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy']), validate], orders.updateOrderStatus)

// 11. Inventory Management & Stock Auditing (Admin)
router.get('/inventory/logs', authenticate, authorize('admin'), inventory.listInventoryLogs)
router.post('/inventory/adjust', authenticate, authorize('admin'), [
  body('productId').isInt({ min: 1 }),
  body('quantity').isInt(),
  validate
], inventory.adjustStock)

// 12. Articles & Gunpla Builder Guides
router.get('/articles', articles.listArticles)
router.get('/articles/all', authenticate, authorize('admin'), articles.listAllArticles)
router.get('/articles/filters', articles.getArticleFilters)
router.get('/articles/:slug', articles.getArticle)
router.post('/articles', authenticate, authorize('admin'), [
  body('title').trim().notEmpty(),
  body('excerpt').trim().notEmpty(),
  body('content').trim().notEmpty(),
  validate
], articles.createArticle)
router.put('/articles/:id', authenticate, authorize('admin'), [idRule, body('title').trim().notEmpty(), validate], articles.updateArticle)
router.delete('/articles/:id', authenticate, authorize('admin'), [idRule, validate], articles.deleteArticle)

// 13. Users & Dashboard (Admin)
router.get('/users', authenticate, authorize('admin'), users.listUsers)
router.post('/users', authenticate, authorize('admin'), [body('fullName').trim().notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 }), body('role').isIn(['admin', 'user']), validate], users.createUser)
router.put('/users/:id', authenticate, authorize('admin'), [idRule, body('fullName').trim().notEmpty(), body('role').isIn(['admin', 'user']), body('isActive').isBoolean(), validate], users.updateUser)
router.delete('/users/:id', authenticate, authorize('admin'), [idRule, validate], users.deleteUser)
router.get('/dashboard', authenticate, authorize('admin'), getDashboard)

export default router