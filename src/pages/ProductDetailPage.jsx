import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Bell, Heart, Star, MapPin,
  ChevronRight, ChevronDown, ChevronUp,
  Zap, Package, AlertCircle, Loader2,
  Clock, Shield, RotateCcw,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './ProductDetailPage.css'

export default function ProductDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [product,   setProduct]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [wishlisted, setWishlisted] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [imgError,  setImgError]  = useState(false)

  /* ── Fetch product from Supabase ───────────────────────────── */
  useEffect(() => {
    if (!id) return
    fetchProduct()
    checkWishlist()
  }, [id])

  async function fetchProduct() {
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        daily_price,
        security_deposit,
        total_quantity,
        available_quantity,
        rating,
        rating_count,
        pickup_location,
        image_url,
        is_active,
        categories ( name )
      `)
      .eq('id', id)
      .single()

    if (err || !data) {
      setError('Product not found or has been removed.')
    } else {
      setProduct({ ...data, category: data.categories?.name ?? '' })
    }
    setLoading(false)
  }

  async function checkWishlist() {
    if (!user) return
    const { data } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', id)
      .single()
    setWishlisted(!!data)
  }

  async function toggleWishlist() {
    if (!user) { navigate('/login'); return }
    if (wishlisted) {
      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id)
    } else {
      await supabase
        .from('wishlists')
        .insert({ user_id: user.id, product_id: id })
    }
    setWishlisted((v) => !v)
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  const isAvailable = product && product.available_quantity > 0 && product.is_active
  const availText   = product
    ? product.available_quantity > 0
      ? `${product.available_quantity} Available Now`
      : 'Out of Stock'
    : ''

  /* ── Loading state ─────────────────────────────────────────── */
  if (loading) return (
    <div className="pd-page">
      <header className="pd-header">
        <button className="pd-back" onClick={() => navigate(-1)}><ArrowLeft size={22}/></button>
        <span className="pd-header-title">CampusShare</span>
        <button className="pd-notif"><Bell size={22} strokeWidth={1.8}/></button>
      </header>
      <div className="pd-loader">
        <Loader2 size={32} className="pd-spin" color="#2563EB"/>
        <p>Loading product…</p>
      </div>
    </div>
  )

  /* ── Error state ─────────────────────────────────────────────── */
  if (error || !product) return (
    <div className="pd-page">
      <header className="pd-header">
        <button className="pd-back" onClick={() => navigate(-1)}><ArrowLeft size={22}/></button>
        <span className="pd-header-title">CampusShare</span>
        <button className="pd-notif"><Bell size={22} strokeWidth={1.8}/></button>
      </header>
      <div className="pd-error-state">
        <AlertCircle size={48} color="#9ca3af" strokeWidth={1.5}/>
        <h3>Product Not Found</h3>
        <p>{error}</p>
        <button className="btn-primary" onClick={() => navigate('/products')} style={{width:'auto',padding:'0 28px'}}>
          Browse Products
        </button>
      </div>
    </div>
  )

  /* ── Main render ─────────────────────────────────────────────── */
  return (
    <div className="pd-page">

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <header className="pd-header">
        <button
          className="pd-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={22} strokeWidth={2}/>
        </button>
        <span className="pd-header-title">CampusShare</span>
        <button
          className="pd-notif"
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
        >
          <Bell size={22} strokeWidth={1.8}/>
        </button>
      </header>

      {/* ══ SCROLL BODY ═════════════════════════════════════════ */}
      <div className="pd-body">

        {/* ── Hero Image ─────────────────────────────────────── */}
        <div className="pd-hero">
          {product.image_url && !imgError ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="pd-hero-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="pd-hero-placeholder">
              <Package size={72} color="#c7d2fe" strokeWidth={1.2}/>
            </div>
          )}

          {/* Availability badge */}
          <div className={`pd-avail-badge${!isAvailable ? ' unavail' : ''}`}>
            <span className="pd-avail-dot"/>
            {availText}
          </div>
        </div>

        {/* ── Title Row ──────────────────────────────────────── */}
        <div className="pd-title-row">
          <h1 className="pd-name">{product.name}</h1>
          <button
            className={`pd-wish-btn${wishlisted ? ' wishlisted' : ''}`}
            onClick={toggleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={20}
              strokeWidth={2}
              fill={wishlisted ? '#ef4444' : 'none'}
              color={wishlisted ? '#ef4444' : '#9ca3af'}
            />
          </button>
        </div>

        {/* ── Rating + Category ──────────────────────────────── */}
        <div className="pd-meta-row">
          <Star size={14} fill="#f59e0b" color="#f59e0b"/>
          <span className="pd-rating">{product.rating?.toFixed(1) ?? '—'}</span>
          {product.rating_count > 0 && (
            <span className="pd-rating-count">({product.rating_count} Rentals)</span>
          )}
          {product.category && (
            <>
              <span className="pd-meta-dot">·</span>
              <span className="pd-category-chip">{product.category}</span>
            </>
          )}
        </div>

        {/* ── Price Card ─────────────────────────────────────── */}
        <div className="pd-price-card">
          <div className="pd-price-left">
            <p className="pd-price-label">Rental Price</p>
            <p className="pd-price-val">
              ₹{product.daily_price}
              <span className="pd-price-unit">/hr</span>
            </p>
          </div>
          {product.security_deposit > 0 && (
            <div className="pd-price-right">
              <p className="pd-deposit-label">Refundable Deposit</p>
              <p className="pd-deposit-val">₹{product.security_deposit}</p>
            </div>
          )}
        </div>

        {/* ── Description ────────────────────────────────────── */}
        {product.description && (
          <div className="pd-section">
            <h2 className="pd-section-title">Description</h2>
            <p className="pd-description">{product.description}</p>
          </div>
        )}

        {/* ── Pickup Location ────────────────────────────────── */}
        {product.pickup_location && (
          <button className="pd-location-card" onClick={() => {}}>
            <div className="pd-location-icon">
              <MapPin size={18} color="#2563EB" strokeWidth={2}/>
            </div>
            <div className="pd-location-info">
              <p className="pd-location-name">{product.pickup_location}</p>
              <p className="pd-location-sub">
                <span style={{fontSize:13}}>🚶</span> 2 mins walking distance
              </p>
            </div>
            <ChevronRight size={18} color="#9ca3af"/>
          </button>
        )}

        {/* ── Rental Info chips ──────────────────────────────── */}
        <div className="pd-info-chips">
          <div className="pd-info-chip">
            <Clock size={15} color="#2563EB"/>
            <span>Hourly rental</span>
          </div>
          <div className="pd-info-chip">
            <Shield size={15} color="#22c55e"/>
            <span>Deposit refunded</span>
          </div>
          <div className="pd-info-chip">
            <RotateCcw size={15} color="#f59e0b"/>
            <span>Easy returns</span>
          </div>
        </div>

        {/* ── Rental Terms Accordion ─────────────────────────── */}
        <div className="pd-accordion">
          <button
            className="pd-accordion-header"
            onClick={() => setTermsOpen((v) => !v)}
            aria-expanded={termsOpen}
          >
            <div className="pd-accordion-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#374151" strokeWidth="1.8" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <span className="pd-accordion-label">Rental Terms &amp; Conditions</span>
            {termsOpen
              ? <ChevronUp size={18} color="#6b7280"/>
              : <ChevronDown size={18} color="#6b7280"/>
            }
          </button>

          {termsOpen && (
            <div className="pd-accordion-body">
              <ul className="pd-terms-list">
                <li>The renter is responsible for any damage to the item during the rental period.</li>
                <li>Return the product to the designated pickup location within the agreed time.</li>
                <li>Refundable deposit will be returned within 24 hours of verified return.</li>
                <li>Late returns incur an additional ₹{product.daily_price}/hr charge.</li>
                <li>Lost items must be compensated at full replacement value.</li>
                <li>Products must be returned in the same condition as received.</li>
              </ul>
            </div>
          )}
        </div>

        {/* bottom spacer for sticky button */}
        <div style={{ height: 100 }}/>
      </div>

      {/* ══ STICKY CTA ══════════════════════════════════════════ */}
      <div className="pd-cta-bar">
        <button
          className={`pd-rent-btn${!isAvailable ? ' pd-rent-disabled' : ''}`}
          disabled={!isAvailable}
          onClick={() => navigate(`/rent/${product.id}`)}
        >
          <Zap size={18} fill="currentColor" strokeWidth={0}/>
          {isAvailable ? 'Rent Now' : 'Out of Stock'}
        </button>
      </div>

    </div>
  )
}
