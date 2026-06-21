import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, ChevronLeft, Loader2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import './ProductsPage.css'

export default function ProductsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  async function loadProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, daily_price, available_quantity, rating, image_url, pickup_location, categories(name)')
      .eq('is_active', true)
      .gt('available_quantity', 0)
      .order('rating', { ascending: false })
      .limit(30)

    if (!error && data) {
      setProducts(data.map((product) => ({
        ...product,
        category: Array.isArray(product.categories)
          ? product.categories[0]?.name ?? ''
          : product.categories?.name ?? '',
      })))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    loadProducts()
  }, [user])

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="pr-page">
      <header className="pr-header">
        <button className="pr-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
        <div>
          <p className="pr-subtitle">Browse inventory</p>
          <h1 className="pr-title">All Products</h1>
        </div>
        <button className="pr-notif" onClick={() => navigate('/notifications')} aria-label="Notifications">
          <Bell size={22} />
        </button>
      </header>

      <div className="pr-search-bar">
        <div className="pr-search-inner">
          <Search size={16} className="pr-search-icon" />
          <input
            type="search"
            placeholder="Search products or categories"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-search-input"
          />
        </div>
      </div>

      <div className="pr-body">
        {loading ? (
          <div className="pr-loading">
            <Loader2 size={32} className="pr-spin" />
            <p>Loading products…</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="pr-empty">
            <span>🔎</span>
            <h2>No products found</h2>
            <p>Try a different keyword or check back later.</p>
          </div>
        ) : (
          <div className="pr-grid">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                className="pr-card"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="pr-card-img-wrap">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="pr-card-img" />
                  ) : (
                    <div className="pr-card-placeholder">📦</div>
                  )}
                </div>
                <div className="pr-card-body">
                  <p className="pr-card-name">{product.name}</p>
                  <p className="pr-card-category">{product.category || 'General'}</p>
                  <div className="pr-card-meta">
                    <span className="pr-card-price">₹{product.daily_price}/hr</span>
                    <button className="pr-card-action" onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`) }}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="pr-card-stock">{product.available_quantity} available</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  )
}
