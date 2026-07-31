import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import { AdminRoute, ProtectedRoute, StaffRoute } from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ServiceBookingPage from './pages/ServiceBookingPage'
import ServiceHistoryPage from './pages/ServiceHistoryPage'
import ServiceReviewsPage from './pages/ServiceReviewsPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import RegisterPage from './pages/RegisterPage'
import AccountPage from './pages/AccountPage'
import OrdersPage from './pages/OrdersPage'
import StaffTasksPage from './pages/staff/StaffTasksPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminServiceRequests from './pages/admin/AdminServiceRequests'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminUsers from './pages/admin/AdminUsers'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout/>}>
        <Route index element={<HomePage/>}/>
        <Route path="san-pham" element={<ProductsPage/>}/>
        <Route path="san-pham/:slug" element={<ProductDetailPage/>}/>
        <Route path="gio-hang" element={<CartPage/>}/>
        <Route path="dat-lich" element={<ProtectedRoute><ServiceBookingPage/></ProtectedRoute>}/>
        <Route path="lich-su-dat-lich" element={<ProtectedRoute><ServiceHistoryPage/></ProtectedRoute>}/>
        <Route path="danh-gia-dich-vu" element={<ServiceReviewsPage/>}/>
        <Route path="thanh-toan" element={<ProtectedRoute><CheckoutPage/></ProtectedRoute>}/>
        <Route path="dang-nhap" element={<LoginPage/>}/>
        <Route path="quen-mat-khau" element={<ForgotPasswordPage/>}/>
        <Route path="dang-ky" element={<RegisterPage/>}/>
        <Route path="don-hang" element={<ProtectedRoute><OrdersPage/></ProtectedRoute>}/>
        <Route path="tai-khoan" element={<ProtectedRoute><AccountPage/></ProtectedRoute>}/>
      </Route>
      <Route path="staff" element={<StaffRoute><StaffTasksPage/></StaffRoute>}/>
      <Route path="admin" element={<AdminRoute><AdminLayout/></AdminRoute>}>
        <Route index element={<Navigate to="dashboard" replace/>}/>
        <Route path="dashboard" element={<AdminDashboard/>}/>
        <Route path="products" element={<AdminProducts/>}/>
        <Route path="categories" element={<AdminCategories/>}/>
        <Route path="orders" element={<AdminOrders/>}/>
        <Route path="service-requests" element={<AdminServiceRequests/>}/>
        <Route path="coupons" element={<AdminCoupons/>}/>
        <Route path="users" element={<AdminUsers/>}/>
      </Route>
      <Route path="*" element={<NotFoundPage/>}/>
    </Routes>
  )
}
