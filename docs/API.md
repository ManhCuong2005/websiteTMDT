# API chính

Base URL: `http://localhost:8080/api`

## Public

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `GET /categories`
- `GET /products`
- `GET /products/featured`
- `GET /products/{slug}`
- `GET /reviews/product/{productId}`

## Customer (Bearer Token)

- `GET /auth/me`
- `PUT /users/me`
- `GET|POST /users/me/addresses`
- `PUT|DELETE /users/me/addresses/{id}`
- `GET /cart`
- `POST /cart/items`
- `PUT|DELETE /cart/items/{id}`
- `POST /orders/validate-coupon`
- `POST /orders`
- `GET /orders/my`
- `GET /orders/{id}`
- `POST /orders/{id}/cancel`
- `POST /reviews/product/{productId}`

## Admin

- `GET /admin/dashboard`
- CRUD `/admin/categories`
- CRUD `/admin/products`
- CRUD `/admin/coupons`
- `GET /admin/orders`
- `PATCH /admin/orders/{id}/status`
- `GET /admin/users`
- `PATCH /admin/users/{id}/status`
