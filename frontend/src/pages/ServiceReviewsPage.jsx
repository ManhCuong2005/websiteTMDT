import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { dateTime } from "../services/format";
import { Icon } from "../components/Icons";
import UserAvatar from "../components/UserAvatar";

const sortOptions = [
  ["newest", "Mới nhất"],
  ["oldest", "Cũ nhất"],
  ["rating_desc", "Số sao: cao đến thấp"],
  ["rating_asc", "Số sao: thấp đến cao"],
];

export default function ServiceReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rating = searchParams.get("rating") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(0, Number(searchParams.get("page") || 0));
  const [data, setData] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
    averageRating: 0,
    ratingCounts: {},
    first: true,
    last: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get("/service-requests/reviews", {
        params: {
          rating: rating || undefined,
          sort,
          page,
          size: 9,
        },
      })
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [rating, sort, page]);

  const totalReviews = Object.values(data.ratingCounts || {}).reduce(
    (total, count) => total + Number(count || 0),
    0,
  );

  const pages = useMemo(() => {
    const total = Number(data.totalPages || 0);
    if (total <= 1) return [];
    const start = Math.max(0, Math.min(page - 2, total - 5));
    return Array.from(
      { length: Math.min(5, total) },
      (_, index) => start + index,
    );
  }, [data.totalPages, page]);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === "" ||
        value === null ||
        value === undefined ||
        (value === 0 && key === "page")
      ) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="service-reviews-page">
      <section className="service-reviews-hero">
        <div className="container">
          <div>
            {/* <span className="eyebrow">TRẢI NGHIỆM ĐÃ XÁC THỰC</span> */}
            <h1>Đánh giá dịch vụ Minh Phát</h1>
            <p>
              Mỗi đánh giá đến từ một yêu cầu đã được kỹ thuật viên thực hiện và
              khách hàng xác nhận hoàn thành.
            </p>
          </div>
          <Link className="btn btn-primary" to="/dat-lich">
            <Icon name="calendar" size={17} /> Đặt lịch dịch vụ
          </Link>
        </div>
      </section>

      <section className="container reviews-summary-section">
        <div className="reviews-overview">
          <div className="reviews-score-large">
            <strong>{Number(data.averageRating || 0).toFixed(1)}</strong>
            <span
              className="average-rating-stars"
              aria-label={`${Number(data.averageRating || 0).toFixed(1)} / 5`}
              style={{
                "--rating-width": `${Math.min(100, Math.max(0, Number(data.averageRating || 0) * 20))}%`,
              }}
            >
              <i>★★★★★</i>
              <b aria-hidden="true">★★★★★</b>
            </span>
            <small>{totalReviews} đánh giá đã xác thực</small>
          </div>
          <div className="rating-distribution">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = Number(data.ratingCounts?.[stars] || 0);
              const width = totalReviews ? (count / totalReviews) * 100 : 0;
              return (
                <button
                  key={stars}
                  className={String(stars) === rating ? "active" : ""}
                  onClick={() =>
                    updateQuery({
                      rating: String(stars) === rating ? "" : stars,
                      page: 0,
                    })
                  }
                >
                  <span>{stars} ★</span>
                  <i>
                    <b style={{ width: `${width}%` }} />
                  </i>
                  <small>{count}</small>
                </button>
              );
            })}
          </div>
          <div className="reviews-trust-note">
            <Icon name="shield" size={24} />
            <div>
              <b>Đánh giá từ khách hàng thật</b>
              <p>
                Chỉ khách đã xác nhận dịch vụ hoàn thành mới có thể gửi đánh
                giá.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container reviews-content-section">
        <div className="reviews-toolbar">
          <div>
            <span>Hiển thị</span>
            <b>{rating ? `Đánh giá ${rating} sao` : "Tất cả đánh giá"}</b>
            <small>{data.totalElements || 0} kết quả</small>
          </div>
          <div className="reviews-filter-actions">
            <label>
              Lọc theo số sao
              <select
                value={rating}
                onChange={(event) =>
                  updateQuery({ rating: event.target.value, page: 0 })
                }
              >
                <option value="">Tất cả số sao</option>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <option key={stars} value={stars}>
                    {stars} sao
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sắp xếp
              <select
                value={sort}
                onChange={(event) =>
                  updateQuery({ sort: event.target.value, page: 0 })
                }
              >
                {sortOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error && <div className="empty-state error-state">{error}</div>}
        {!error && loading ? (
          <div className="reviews-loading-grid">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} />
            ))}
          </div>
        ) : !error && !data.content?.length ? (
          <div className="empty-state service-reviews-empty">
            <Icon name="message" size={34} />
            <h2>Chưa có đánh giá phù hợp</h2>
            <p>Hãy thử chọn mức sao khác hoặc xem tất cả đánh giá.</p>
            {rating && (
              <button
                className="btn btn-soft"
                onClick={() => updateQuery({ rating: "", page: 0 })}
              >
                Xem tất cả đánh giá
              </button>
            )}
          </div>
        ) : (
          !error && (
            <>
              <div className="all-service-reviews-grid">
                {data.content.map((review) => (
                  <article className="public-service-review" key={review.id}>
                    <header>
                      <UserAvatar
                        avatarUrl={review.customerAvatarUrl}
                        name={review.customerName}
                        size={48}
                      />
                      <div>
                        <b>{review.customerName}</b>
                        <small>{review.customerEmailMasked}</small>
                      </div>
                      <span className="verified-review-badge">
                        <Icon name="shield" size={13} /> Đã xác thực
                      </span>
                    </header>
                    <div className="public-review-rating">
                      <span>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                      <b>{Number(review.rating).toFixed(1)}</b>
                    </div>
                    <p>“{review.content}”</p>
                    <footer>
                      <span>
                        <Icon name="tool" size={14} /> {review.serviceType}
                      </span>
                      <time>{dateTime(review.createdAt)}</time>
                    </footer>
                  </article>
                ))}
              </div>

              {data.totalPages > 1 && (
                <nav
                  className="reviews-pagination"
                  aria-label="Phân trang đánh giá"
                >
                  <button
                    disabled={data.first}
                    onClick={() => updateQuery({ page: page - 1 })}
                  >
                    ← Trang trước
                  </button>
                  <div>
                    {pages.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        className={pageNumber === page ? "active" : ""}
                        onClick={() => updateQuery({ page: pageNumber })}
                      >
                        {pageNumber + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={data.last}
                    onClick={() => updateQuery({ page: page + 1 })}
                  >
                    Trang sau →
                  </button>
                </nav>
              )}
            </>
          )
        )}
      </section>
    </div>
  );
}
