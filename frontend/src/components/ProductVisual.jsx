export default function ProductVisual({ product, className = '' }) {
  if (product?.imageUrl) return <img className={`product-visual ${className}`} src={product.imageUrl} alt={product.name} />
  const category = product?.categorySlug || ''
  const symbol = category.includes('but') ? '⌁' : category.includes('loi') ? '◉' : '◈'
  return (
    <div className={`product-placeholder ${category} ${className}`} aria-label={product?.name}>
      <span className="water-ring ring-one"/><span className="water-ring ring-two"/>
      <strong>{symbol}</strong><small>{product?.categoryName || 'Nước sạch'}</small>
    </div>
  )
}
