import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import ProductDetailPage from '../pages/ProductDetailPage.jsx'
import MyOrdersPage from '../pages/MyOrdersPage.jsx'
import ProfilePage from '../pages/ProfilePage.jsx'
import WishlistPage from '../pages/WishlistPage.jsx'
import ArticlesPage from '../pages/ArticlesPage.jsx'
import ArticleDetailPage from '../pages/ArticleDetailPage.jsx'
import AdminPage from '../pages/AdminPage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dang-nhap" element={<AuthPage />} />
      <Route path="/san-pham/:id" element={<ProductDetailPage />} />
      <Route path="/don-hang" element={<MyOrdersPage />} />
      <Route path="/ho-so" element={<ProfilePage />} />
      <Route path="/yeu-thich" element={<WishlistPage />} />
      <Route path="/cam-nang" element={<ArticlesPage />} />
      <Route path="/cam-nang/:slug" element={<ArticleDetailPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}