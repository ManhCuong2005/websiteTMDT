# BANHANG — Website bán thiết bị lọc nước

Dự án gồm phần **website + database** cho cửa hàng bán:

- Bút thử nước
- Lõi lọc nước
- Máy lọc nước

AI, hình ảnh thật và blockchain/Ganache/MetaMask được để dành cho giai đoạn sau. Cấu trúc hiện tại đã tách sẵn để bổ sung mà không cần viết lại phần web chính.

## Công nghệ

### Backend

- Java 21
- Spring Boot 3.5.16
- Spring Web, Spring Data JPA, Spring Security
- JWT tự ký HMAC-SHA256
- Flyway Migration
- PostgreSQL
- Maven bootstrap script đi kèm, không bắt buộc cài Maven trước

### Frontend

- React 19
- Vite 8
- React Router
- Axios
- CSS thuần, responsive, giao diện tiếng Việt

## Chức năng đã có

### Khách hàng

- Đăng ký và đăng nhập tài khoản
- Đăng nhập Google (cần tự cấu hình Google Client ID)
- Xem, tìm kiếm, lọc và sắp xếp sản phẩm
- Xem chi tiết sản phẩm và đánh giá
- Giỏ hàng theo tài khoản
- Tăng, giảm, xóa sản phẩm trong giỏ
- Áp dụng mã giảm giá
- Đặt hàng thanh toán COD
- Lưu và quản lý địa chỉ
- Xem lịch sử đơn hàng
- Hủy đơn đang chờ xác nhận
- Cập nhật thông tin cá nhân
- Đánh giá sản phẩm đã mua và đã giao

### Quản trị viên

- Dashboard tổng quan
- Quản lý danh mục
- Quản lý sản phẩm và tồn kho
- Quản lý mã giảm giá
- Quản lý đơn hàng và trạng thái giao hàng
- Quản lý, khóa/mở khóa người dùng
- Tự cập nhật thanh toán COD thành đã trả khi đơn được giao

## Cấu trúc thư mục

```text
banhang-project/
├── backend/             Spring Boot REST API
├── frontend/            React + Vite
├── database/            SQL tạo database, bảng và dữ liệu mẫu
├── docs/                Tài liệu kỹ thuật
├── check-environment.bat Kiểm tra môi trường Windows 11
├── setup-windows.bat    Thiết lập database lần đầu
├── run-backend.bat      Chạy backend
├── run-frontend.bat     Chạy frontend
└── run-all.bat          Chạy cả hai phần
```

# Chạy trên Windows 11

## 1. Điều kiện cần

Kiểm tra trong Command Prompt:

```bat
java -version
javac -version
node -v
npm -v
psql --version
```

Yêu cầu thực tế của project:

- Java/Javac 21
- Node.js phù hợp Vite 8
- npm
- PostgreSQL đang chạy ở cổng 5432
- `psql` đã có trong PATH

## 2. Giải nén project

Nên đặt tại đường dẫn không dấu, ví dụ:

```text
D:\Projects\banhang-project
```

## 3. Kiểm tra nhanh môi trường

Nhấp đúp:

```text
check-environment.bat
```

Các mục Java, Java compiler, Node.js, npm, PostgreSQL CLI và PostgreSQL server cần hiện `[OK]`.

## 4. Tạo database và lưu cấu hình

Nhấp đúp:

```text
setup-windows.bat
```

Nhập mật khẩu tài khoản PostgreSQL `postgres` của máy bạn.

Script sẽ:

1. Tạo database `banhang_db` nếu chưa tồn tại.
2. Tạo file local `config.local.bat` chứa cấu hình kết nối.
3. Không tạo bảng ngay; Flyway sẽ tự tạo bảng và dữ liệu mẫu khi backend chạy lần đầu.

> `config.local.bat` đã được thêm vào `.gitignore`, không đẩy file này lên GitHub.

## 5. Chạy toàn bộ project

Nhấp đúp:

```text
run-all.bat
```

Lần đầu:

- Backend sẽ tải Maven và các thư viện Java. Việc này có thể mất vài phút.
- Frontend sẽ chạy `npm install`. Việc này cũng cần Internet.
- Flyway sẽ tạo các bảng và dữ liệu mẫu.

Sau khi hai cửa sổ terminal báo chạy thành công, mở:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:8080/api/health
```

## 6. Tài khoản admin mặc định

```text
Email:    admin@banhang.vn
Mật khẩu: Admin@123
```

Sau khi triển khai thật, hãy thay đổi mật khẩu này bằng biến môi trường `ADMIN_PASSWORD` trước lần chạy đầu tiên hoặc sửa trực tiếp trong database.

## 7. Chạy riêng từng phần

Backend:

```text
run-backend.bat
```

Frontend:

```text
run-frontend.bat
```

Hoặc mở terminal thủ công:

```bat
cd backend
mvnw.cmd spring-boot:run
```

```bat
cd frontend
npm install
npm run dev
```

# Database

Các file SQL:

```text
database/00_create_database.sql
database/01_schema.sql
database/02_seed_data.sql
```

Backend dùng chính các migration tương ứng tại:

```text
backend/src/main/resources/db/migration/
```

Không cần chạy thủ công `01_schema.sql` và `02_seed_data.sql` khi Flyway đang bật. Chỉ cần tạo database rỗng, backend sẽ tự áp dụng migration.

Nếu muốn xóa sạch để chạy lại từ đầu:

```sql
DROP DATABASE banhang_db;
CREATE DATABASE banhang_db WITH ENCODING 'UTF8' TEMPLATE template0;
```

Sau đó chạy backend lại.

# Cấu hình Google Login

Đăng nhập email/mật khẩu chạy ngay mà không cần cấu hình thêm. Google Login cần OAuth Client ID của riêng bạn.

## Backend

Mở `config.local.bat` và cập nhật:

```bat
set "GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com"
```

## Frontend

Tạo file:

```text
frontend/.env.local
```

Nội dung:

```env
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

Trong Google Cloud Console, thêm JavaScript origin:

```text
http://localhost:5173
```

Khởi động lại backend và frontend sau khi sửa cấu hình.

# Cổng sử dụng

| Dịch vụ | Cổng |
|---|---:|
| React/Vite | 5173 |
| Spring Boot | 8080 |
| PostgreSQL | 5432 |

Nếu cổng bị chiếm:

```bat
netstat -ano | findstr :8080
netstat -ano | findstr :5173
```

# Lỗi thường gặp

## `password authentication failed for user postgres`

Chạy lại `setup-windows.bat` và nhập đúng mật khẩu PostgreSQL.

## `database banhang_db does not exist`

Mở Command Prompt tại thư mục project và chạy:

```bat
set PGPASSWORD=MAT_KHAU_POSTGRES
psql -U postgres -d postgres -f database\00_create_database.sql
```

## Backend đứng ở lúc tải Maven

Kiểm tra Internet. Script Maven chỉ tải ở lần đầu, sau đó dùng bản đã lưu trong:

```text
%USERPROFILE%\.m2\banhang-wrapper
```

## Frontend báo lỗi package

Xóa thư mục `frontend\node_modules`, rồi chạy lại:

```bat
cd frontend
npm install
npm run dev
```

## CORS hoặc frontend không gọi được API

Đảm bảo frontend chạy ở `http://localhost:5173` và backend ở `http://localhost:8080`.

# Dữ liệu mẫu

Migration có sẵn:

- 3 danh mục
- 10 sản phẩm
- 3 mã giảm giá

Mã dùng thử:

```text
CHAOMUNG
GIAM50K
LOILOC15
```

# Giai đoạn bổ sung sau

- Thay URL hoặc upload hình ảnh sản phẩm lên Cloudinary/S3
- Dịch vụ AI Python/FastAPI cho gợi ý sản phẩm
- Bảng dữ liệu hành vi người dùng phục vụ học máy
- Ganache + MetaMask + Solidity + ethers.js
- Lưu transaction hash blockchain trong PostgreSQL

# Đăng nhập bằng gương mặt

Tính năng dùng InsightFace `buffalo_s` chạy cục bộ:

- SCRFD phát hiện và lấy 5 điểm mốc gương mặt.
- ArcFace tạo embedding 512 chiều; không dùng UMAP/KNN và không lưu ảnh.
- Template được mã hóa AES-GCM trước khi lưu PostgreSQL.
- Đăng nhập yêu cầu email, ảnh nhìn thẳng và một thử thách quay đầu/tiến gần.
- Token thử thách dùng một lần, hết hạn sau 2 phút; khóa 15 phút sau 5 lần sai.
- Mật khẩu và Google vẫn là phương thức đăng nhập dự phòng.

Các file model và Python cục bộ nằm trong `face-service/` và đã được `.gitignore`.
Trên máy mới, cài Python 3.11 vào `face-service\.python`, tải gói
`buffalo_s.zip` từ InsightFace vào `face-service\models`, sau đó chạy:

```bat
setup-face-service.bat
run-all.bat
```

Ba dịch vụ mặc định:

```text
Face service: http://127.0.0.1:8001
Backend:      http://localhost:8080
Frontend:     http://localhost:5173
```

Đăng ký gương mặt tại `Tài khoản > Cài đặt`. Trên trang đăng nhập, nhập email
trước rồi chọn `Đăng nhập bằng gương mặt`. Camera trình duyệt hoạt động trên
`localhost` hoặc HTTPS.

Biến môi trường tùy chọn:

```text
FACE_SERVICE_URL=http://127.0.0.1:8001
FACE_DATA_SECRET=mot-khoa-rieng-dai-va-ngau-nhien
FACE_MATCH_THRESHOLD=0.45
```

Trong môi trường triển khai thật, bắt buộc đặt `FACE_DATA_SECRET` riêng, dùng
HTTPS và thay kiểm tra chuyển động cơ bản bằng giải pháp PAD/liveness chuyên dụng.
