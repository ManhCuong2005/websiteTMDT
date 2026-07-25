import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { money } from "../services/format";
import { errorMessage } from "../services/api";
import ProductVisual from "./ProductVisual";
import { Icon } from "./Icons";

export default function ProductCard({ product, recommendationReason }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const add = async () => {
    if (!user) return navigate("/dang-nhap", { state: { from: location.pathname } });
    try {
      await addItem(product.id, 1);
    } catch (error) {
      alert(errorMessage(error));
    }
  };

  const discount = product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  return (
    <article className="product-card">
      <Link to={`/san-pham/${product.slug}`} className="product-card-visual">
        <ProductVisual product={product} />
        {discount > 0 && <span className="discount-badge">-{discount}%</span>}
        {product.stockQuantity <= 0 && <span className="out-badge">Hết hàng</span>}
      </Link>
      <div className="product-card-body">
        {recommendationReason && <span className="recommendation-reason">{recommendationReason}</span>}
        <span className="eyebrow">{product.categoryName}</span>
        <Link className="product-title" to={`/san-pham/${product.slug}`}>{product.name}</Link>
        <div className="rating-line">
          <Icon name="star" size={15} /> {Number(product.averageRating || 0).toFixed(1)}
          <small>({product.reviewCount || 0})</small>
        </div>
        <div className="price-row">
          <div>
            <strong>{money(product.price)}</strong>
            {product.compareAtPrice && <del>{money(product.compareAtPrice)}</del>}
          </div>
          <button className="icon-button primary" onClick={add} disabled={product.stockQuantity <= 0} aria-label="Thêm vào giỏ">
            <Icon name="cart" />
          </button>
        </div>
      </div>
    </article>
  );
}
