import { Link } from 'react-router-dom'
export default function NotFoundPage() { return <div className="not-found"><b>404</b><h1>Không tìm thấy trang</h1><p>Đường dẫn bạn truy cập không tồn tại hoặc đã thay đổi.</p><Link className="btn btn-primary" to="/">Về trang chủ</Link></div> }
