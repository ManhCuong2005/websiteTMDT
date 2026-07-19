# Deploy backend va database len Railway

Frontend da deploy tren Vercel thi phan con lai nen tach thanh:

- Railway PostgreSQL: database managed.
- Railway backend service: Spring Boot trong thu muc `backend/`.
- Vercel frontend: cap nhat `VITE_API_URL` tro ve backend Railway.

## 1. Chuan bi code

Backend da doc port theo thu tu:

```text
PORT -> SERVER_PORT -> 8080
```

Railway tu cap `PORT`, nen khong can dat bien nay thu cong.

## 2. Tao project tren Railway

1. Vao Railway, tao project moi.
2. Chon `Deploy from GitHub repo`.
3. Chon repo cua project nay.
4. Neu Railway hoi root directory, chon:

```text
backend
```

5. Tao them mot PostgreSQL service trong cung project.

## 3. Cau hinh bien moi truong cho backend service

Trong backend service tren Railway, vao tab `Variables` va them cac bien sau.

Neu PostgreSQL service ten la `Postgres`, co the dung:

```env
DB_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=thay-bang-chuoi-bi-mat-dai-it-nhat-32-ky-tu
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
ADMIN_EMAIL=admin@banhang.vn
ADMIN_PASSWORD=doi-mat-khau-admin-that-manh
MAIL_ENABLED=false
GOOGLE_CLIENT_ID=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Neu PostgreSQL service cua ban co ten khac, thay `Postgres` bang dung ten service tren Railway.

Sau khi them/sua variables, Railway se yeu cau deploy lai de ap dung.

## 4. Public URL cho backend

Trong backend service:

1. Vao `Settings`.
2. Mo phan `Networking`.
3. Bam `Generate Domain`.
4. Kiem tra endpoint:

```text
https://your-backend.up.railway.app/api/health
```

Neu tra ve JSON co `status: "UP"` la backend da chay.

## 5. Cap nhat frontend tren Vercel

Trong Vercel project cua frontend, vao `Settings` -> `Environment Variables`, them hoac sua:

```env
VITE_API_URL=https://your-backend.up.railway.app/api
VITE_GOOGLE_CLIENT_ID=
```

Sau do redeploy frontend. Vite chi doc `VITE_*` luc build, nen sua env xong bat buoc deploy lai.

## 6. Database va migration

Khong can chay file SQL thu cong tren Railway. Backend dang bat Flyway:

```text
backend/src/main/resources/db/migration/
```

Lan chay dau, Flyway se tu tao schema va seed du lieu mau vao PostgreSQL Railway.

## 7. Viec can lam sau khi deploy thanh cong

- Doi `ADMIN_PASSWORD` thanh mat khau manh truoc lan deploy production dau tien.
- Dat `JWT_SECRET` rieng, dai va khong commit len Git.
- Them domain Vercel vao `CORS_ALLOWED_ORIGINS`.
- Neu dung Google Login, them Vercel domain vao Google Cloud Console va dien cung `GOOGLE_CLIENT_ID` cho backend + frontend.
- Neu dung upload anh, tao Cloudinary account va dien 3 bien `CLOUDINARY_*`.
