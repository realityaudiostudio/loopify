import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Search, SlidersHorizontal,
  ShoppingBag, AlignJustify, Monitor,
  ReceiptText, Wallet, Tag,
  ChevronRight, MapPin, Plus,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWallet } from '../context/WalletContext'
import { signOut } from '../lib/auth'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import './DashboardPage.css'

/* ── Fallback data (shown while Supabase loads / if empty) ─── */
const FALLBACK_PRODUCTS = [
  { id: '1', name: 'Casio FX-991EX', category: 'Calculator',    daily_price: 5,  available_quantity: 3, rating: 4.8, image_url: null, emoji: '🧮' },
  { id: '2', name: 'Compact Umbrella', category: 'Rain Gear',   daily_price: 2,  available_quantity: 1, rating: 4.5, image_url: null, emoji: '☂️' },
  { id: '3', name: 'Lab Coat (M)',    category: 'Lab Equipment', daily_price: 8,  available_quantity: 5, rating: 4.9, image_url: null, emoji: '🥼' },
  { id: '4', name: 'Badminton Racket', category: 'Sports',      daily_price: 10, available_quantity: 2, rating: 4.7, image_url: null, emoji: '🏸' },
]
const FALLBACK_LOCKERS = [
  { id: 1, name: 'Library Ground Floor', distance: '120m away', available: 4 },
  { id: 2, name: 'Student Union Bldg',   distance: '350m away', available: 1 },
]

/* ── Quick actions config ────────────────────────────────────── */
const QUICK_ACTIONS = [
  { id: 'rent',    label: 'Rent Product', Icon: ShoppingBag,  path: '/products', bg: '#EEF2FF', color: '#2563EB' },
  { id: 'queue',   label: 'Queue Status', Icon: AlignJustify, path: '/queue',    bg: '#F1F5F9', color: '#475569' },
  { id: 'vending', label: 'Vending',      Icon: Monitor,      path: '/vending',  bg: '#FFF3E8', color: '#BC4800' },
  { id: 'rentals', label: 'My Rentals',   Icon: ReceiptText,  path: '/rentals',  bg: '#F1F5F9', color: '#475569' },
  { id: 'wallet',  label: 'Wallet',       Icon: Wallet,       path: '/wallet',   bg: '#F1F5F9', color: '#475569' },
  { id: 'refer',   label: 'Refer & Earn', Icon: Tag,          path: '/refer',    bg: '#EEF2FF', color: '#2563EB' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { balance: walletBalance, rewardPoints } = useWallet()

  const [products, setProducts]           = useState(FALLBACK_PRODUCTS)
  const [lockers, setLockers]             = useState(FALLBACK_LOCKERS)
  const [activeRentals, setActiveRentals] = useState(0)
  const [searchQuery, setSearchQuery]     = useState('')
  const [notifCount]                      = useState(2)
  const [loadingProducts, setLoadingProducts] = useState(true)

  /* ── Supabase data loading ─────────────────────────────────── */
  useEffect(() => {
    loadProducts()
    if (user) {
      loadRentals()
    }
    loadLockers()
  }, [user])

  async function loadProducts() {
    setLoadingProducts(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, daily_price, available_quantity, rating, image_url, categories(name)')
      .eq('is_active', true)
      .gt('available_quantity', 0)
      .order('rating', { ascending: false })
      .limit(6)

    if (!error && data?.length) {
      setProducts(data.map((p) => ({
        ...p,
        category: p.categories?.name ?? '',
        emoji: null,
      })))
    }
    setLoadingProducts(false)
  }

  async function loadRentals() {
    const { count } = await supabase
      .from('rentals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['active', 'due_soon'])
    setActiveRentals(count ?? 0)
  }


  async function loadLockers() {
    const { data, error } = await supabase
      .from('lockers')
      .select('id, name, distance_label, available_slots')
      .eq('is_active', true)
      .order('available_slots', { ascending: false })
      .limit(4)

    if (!error && data?.length) {
      setLockers(data.map((l) => ({
        id:        l.id,
        name:      l.name,
        distance:  l.distance_label,
        available: l.available_slots,
      })))
    }
  }

  /* ── Derived values ────────────────────────────────────────── */
  const firstName =
    profile?.full_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    'Student'

  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    'Student'

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="db-page">

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <header className="db-header">
        <div className="db-header-left">
          <button
            className="db-avatar"
            onClick={() => navigate('/profile')}
            aria-label="View profile"
          >
            {firstName[0].toUpperCase()}
          </button>
          <div className="db-greet-wrap">
            <p className="db-greet-small">Welcome back,</p>
            <p className="db-greet-name">{fullName}</p>
          </div>
        </div>
        <button
          className="db-notif-btn"
          aria-label={`${notifCount} notifications`}
          onClick={() => navigate('/notifications')}
        >
          <Bell size={22} strokeWidth={1.8} />
          {notifCount > 0 && <span className="db-notif-dot">{notifCount}</span>}
        </button>
      </header>

      {/* ══ SEARCH BAR ══════════════════════════════════════════ */}
      <div className="db-search-bar">
        <div className="db-search-inner">
          <Search size={16} className="db-search-ico" />
          <input
            type="search"
            className="db-search-input"
            placeholder="Search products, lockers, vending…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search"
          />
        </div>
        <button className="db-filter-btn" aria-label="Filters">
          <SlidersHorizontal size={17} />
        </button>
      </div>

      {/* ══ SCROLLABLE BODY ════════════════════════════════════= */}
      <div className="db-body">

        {/* ── Campus Wallet Card ─────────────────────────────── */}
        <div className="wc-card" role="region" aria-label="Campus Wallet">
          <div className="wc-top">
            <span className="wc-title">CAMPUS WALLET</span>
            <span className="wc-badge">
              <span className="wc-badge-dot" />
              Plus Active
            </span>
          </div>
          <div className="wc-balance">₹{walletBalance.toLocaleString('en-IN')}</div>
          <div className="wc-bottom">
            <div className="wc-points-row">
              <span className="wc-star">⭐</span>
              <div>
                <p className="wc-pts-label">Reward Points</p>
                <p className="wc-pts-val">{rewardPoints.toLocaleString('en-IN')} pts</p>
              </div>
            </div>
            <button className="wc-topup" onClick={() => navigate('/wallet')}>
              Top Up
            </button>
          </div>
          {/* decorative circles */}
          <div className="wc-circle wc-circle-1" aria-hidden />
          <div className="wc-circle wc-circle-2" aria-hidden />
        </div>

        {/* ── Quick Actions ───────────────────────────────────── */}
        <section className="db-section">
          <h2 className="db-section-title">Quick Actions</h2>
          <div className="qa-grid">
            {QUICK_ACTIONS.map(({ id, label, Icon, path, bg, color }) => (
              <button
                key={id}
                className="qa-card"
                onClick={() => navigate(path)}
                aria-label={label}
              >
                <div className="qa-icon-wrap" style={{ background: bg }}>
                  <Icon size={22} color={color} strokeWidth={1.8} />
                </div>
                <span className="qa-label">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Popular Right Now ───────────────────────────────── */}
        <section className="db-section">
          <div className="db-section-row">
            <h2 className="db-section-title">Popular Right Now</h2>
            <button className="db-view-all" onClick={() => navigate('/products')}>
              View All
            </button>
          </div>

          {loadingProducts ? (
            <div className="db-product-scroll">
              {[1, 2].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="db-empty">
              <span>🔍</span><p>No products found</p>
            </div>
          ) : (
            <div className="db-product-scroll">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onRent={() => navigate(`/products/${p.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Nearby Lockers ──────────────────────────────────── */}
        <section className="db-section db-section-last">
          <h2 className="db-section-title">Nearby Lockers</h2>
          <div className="lk-list">
            {lockers.map((lk) => (
              <button key={lk.id} className="lk-card" onClick={() => navigate('/lockers')}>
                <div className="lk-icon-wrap">
                  {/* locker SVG icon */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                </div>
                <div className="lk-info">
                  <p className="lk-name">{lk.name}</p>
                  <p className="lk-dist">
                    <MapPin size={10} />
                    {lk.distance}
                  </p>
                </div>
                <div className="lk-right">
                  <span className={`lk-avail${lk.available <= 1 ? ' lk-avail-low' : ''}`}>
                    {lk.available} Available
                  </span>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>{/* end db-body */}

      {/* ══ BOTTOM NAV ══════════════════════════════════════════ */}
      <BottomNav active="home" />
    </div>
  )
}

/* ── Product Card ─────────────────────────────────────────────── */
function ProductCard({ product, onRent }) {
  return (
    <div className="pc-card" onClick={onRent} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onRent()}>
      <div className="pc-img-wrap">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="pc-img" />
          : <span className="pc-emoji">{product.emoji ?? '📦'}</span>
        }
        <div className="pc-avail-badge">
          <span className="pc-avail-dot" />Available
        </div>
      </div>
      <div className="pc-body">
        <p className="pc-name">{product.name}</p>
        <p className="pc-cat">{product.category}</p>
        <div className="pc-footer">
          <span className="pc-price">
            ₹{product.daily_price}<span className="pc-per">/hr</span>
          </span>
          <button
            className="pc-rent-btn"
            onClick={(e) => { e.stopPropagation(); onRent() }}
            aria-label={`Rent ${product.name}`}
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Skeleton loader ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="pc-card pc-skeleton">
      <div className="skel-img" />
      <div className="pc-body">
        <div className="skel-line skel-w80" />
        <div className="skel-line skel-w50" />
        <div className="skel-line skel-w60" />
      </div>
    </div>
  )
}
