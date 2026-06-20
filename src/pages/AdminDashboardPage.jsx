import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Box,
  DollarSign, Plus, RefreshCcw,
  Sparkles, XCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/auth'
import { supabase } from '../lib/supabase'
import './AdminDashboardPage.css'

const STAT_CARDS = [
  { id: 'revenue', label: 'Revenue', key: 'totalRevenue', prefix: '₹', icon: DollarSign, variant: 'primary' },
  { id: 'rentals', label: 'Rentals', key: 'totalRentals', icon: BarChart3, variant: 'surface' },
  { id: 'activeProducts', label: 'Active products', key: 'activeProducts', icon: Box, variant: 'secondary' },
  { id: 'pendingRentals', label: 'Pending rentals', key: 'pendingRentals', icon: Sparkles, variant: 'warning' },
]

const initialForm = {
  name: '',
  description: '',
  daily_price: '',
  total_quantity: '',
  available_quantity: '',
  pickup_location: '',
  image_url: '',
  is_active: true,
}

const STATUS_LABELS = {
  pending: 'Pending',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_COLORS = {
  pending: '#f59e0b',
  active: '#2563eb',
  completed: '#22c55e',
  cancelled: '#ef4444',
}

const allowedAdminEmail = 'onlinefacultystaff@gmail.com'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user, profile, isAdmin } = useAuth()
  const [stats, setStats] = useState({
    totalRentals: 0,
    totalRevenue: 0,
    activeProducts: 0,
    totalProducts: 0,
    pendingRentals: 0,
    activeRentals: 0,
  })
  const [products, setProducts] = useState([])
  const [recentRentals, setRecentRentals] = useState([])
  const [userProfiles, setUserProfiles] = useState({})
  const [form, setForm] = useState(initialForm)
  const [editingProductId, setEditingProductId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeModal, setActiveModal] = useState('')

  const userName = profile?.full_name || user?.email || 'Admin'

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([loadProducts(), loadStats(), loadRecentRentals()])
      setLoading(false)
    }
    init()
  }, [])

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setProducts(data ?? [])
  }

  async function loadStats() {
    const [rentalsResult, activeProductsResult, productsResult, pendingRentalsResult] = await Promise.all([
      supabase.from('rentals').select('total_amount, status', { head: false }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('rentals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    const revenue = (rentalsResult.data ?? []).reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
    const activeRentals = (rentalsResult.data ?? []).filter((item) => item.status === 'active').length

    setStats({
      totalRentals: rentalsResult.data?.length ?? 0,
      totalRevenue: revenue,
      activeProducts: activeProductsResult.count ?? 0,
      totalProducts: productsResult.count ?? 0,
      pendingRentals: pendingRentalsResult.count ?? 0,
      activeRentals,
    })
  }

  async function loadRecentRentals() {
    const { data } = await supabase
      .from('rentals')
      .select('id, quantity, total_amount, status, created_at, user_id, products(name)')
      .order('created_at', { ascending: false })
      .limit(8)

    const rentals = data ?? []
    setRecentRentals(rentals)

    const userIds = [...new Set(rentals.map((item) => item.user_id).filter(Boolean))]
    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name, college_email')
        .in('id', userIds)

      if (profileRows) {
        setUserProfiles(profileRows.reduce((acc, row) => ({ ...acc, [row.id]: row }), {}))
      }
    }
  }

  const activeProductRatio = useMemo(() => {
    const total = products.length
    return total ? Math.round((products.filter((item) => item.is_active).length / total) * 100) : 0
  }, [products])

  const statusDistribution = useMemo(() => {
    const totals = { pending: 0, active: 0, completed: 0, cancelled: 0 }
    recentRentals.forEach((item) => {
      totals[item.status] = (totals[item.status] || 0) + 1
    })
    const totalCount = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1
    return Object.entries(totals).map(([status, count]) => ({
      status,
      count,
      label: STATUS_LABELS[status],
      percent: Math.round((count / totalCount) * 100),
      color: STATUS_COLORS[status],
    }))
  }, [recentRentals])

  const topProductsByRevenue = useMemo(() => {
    const revenueByProduct = {}
    recentRentals.forEach((item) => {
      const name = item.products?.name || 'Unknown item'
      revenueByProduct[name] = (revenueByProduct[name] || 0) + Number(item.total_amount || 0)
    })
    return Object.entries(revenueByProduct)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4)
  }, [recentRentals])

  const rentalsWithProfiles = useMemo(
    () => recentRentals.map((rental) => ({
      ...rental,
      profile: userProfiles[rental.user_id],
    })),
    [recentRentals, userProfiles]
  )

  const summaryCards = useMemo(
    () => STAT_CARDS.map((card) => ({
      ...card,
      value: card.prefix ? `${card.prefix}${stats[card.key].toLocaleString('en-IN')}` : stats[card.key],
    })),
    [stats]
  )

  const openModal = (name) => setActiveModal(name)
  const closeModal = () => setActiveModal('')

  const openProductForm = (product = null) => {
    if (product) {
      setEditingProductId(product.id)
      setForm({
        name: product.name || '',
        description: product.description || '',
        daily_price: product.daily_price ?? '',
        total_quantity: product.total_quantity ?? '',
        available_quantity: product.available_quantity ?? '',
        pickup_location: product.pickup_location || '',
        image_url: product.image_url || '',
        is_active: product.is_active ?? true,
      })
    } else {
      setEditingProductId(null)
      setForm(initialForm)
    }
    setError('')
    openModal('productForm')
  }

  const handleInput = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSaveProduct() {
    if (!form.name || !form.daily_price || !form.total_quantity) {
      setError('Name, price, and total quantity are required.')
      return
    }

    const available = Number(form.available_quantity || form.total_quantity)
    if (available > Number(form.total_quantity)) {
      setError('Available quantity cannot exceed total quantity.')
      return
    }

    setIsSaving(true)
    const payload = {
      ...form,
      daily_price: Number(form.daily_price),
      total_quantity: Number(form.total_quantity),
      available_quantity: available,
      is_active: Boolean(form.is_active),
    }

    const query = editingProductId
      ? supabase.from('products').update(payload).eq('id', editingProductId).select('*').maybeSingle()
      : supabase.from('products')
          .insert([{ ...payload, created_by: user?.id }])
          .select('*')
          .maybeSingle()

    const { data, error } = await query

    if (error) {
      setError(error.message)
      setIsSaving(false)
      return
    }

    if (!data) {
      setError('Unable to save product. Please refresh and try again.')
      setIsSaving(false)
      return
    }

    await loadProducts()
    closeModal()
    setIsSaving(false)
  }

  async function handleToggleActive(product) {
    await supabase
      .from('products')
      .update({ is_active: !product.is_active, updated_at: new Date().toISOString() })
      .eq('id', product.id)
    await loadProducts()
  }

  const adminEmailWarning = !isAdmin && user?.email !== allowedAdminEmail
    ? 'This portal is restricted to the registered admin.'
    : ''

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div>
          <p className="admin-overline">CampusShare Admin</p>
          <h1 className="admin-heading">Hello, {userName}</h1>
          <p className="admin-subtitle">A focused command center for rental operations, inventory health, and user activity.</p>
        </div>
        <button className="btn-secondary admin-logout" onClick={async () => { await signOut(); navigate('/login') }}>
          Sign out
        </button>
      </header>

      <section className="admin-summary-grid">
        {summaryCards.map(({ id, label, value, icon: Icon, variant }) => (
          <article key={id} className={`admin-stat-card admin-card-${variant}`}>
            <div className="admin-card-icon"><Icon size={18} /></div>
            <div>
              <p className="admin-card-label">{label}</p>
              <h2>{value}</h2>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-action-grid">
        <button className="admin-action-card" onClick={() => openModal('products')}>
          <div>
            <p className="admin-action-title">Inventory panel</p>
            <p className="admin-action-copy">Browse products in a dedicated modal.</p>
          </div>
          <RefreshCcw size={18} />
        </button>
        <button className="admin-action-card" onClick={() => openModal('rentals')}>
          <div>
            <p className="admin-action-title">Recent rentals</p>
            <p className="admin-action-copy">See latest bookings with student details.</p>
          </div>
          <Sparkles size={18} />
        </button>
        <button className="admin-action-card admin-action-card--accent" onClick={() => openProductForm()}>
          <div>
            <p className="admin-action-title">Add product</p>
            <p className="admin-action-copy">Open a clean product form modal.</p>
          </div>
          <Plus size={18} />
        </button>
      </section>
      {loading && <div className="admin-loading">Refreshing dashboard…</div>}

      <section className="admin-panel-grid">
        <article className="chart-card chart-card--wide">
          <div className="chart-header">
            <div>
              <p className="chart-title">Booking status distribution</p>
              <p className="chart-copy">How the latest rentals are trending.</p>
            </div>
            <span>{recentRentals.length} entries</span>
          </div>
          <div className="chart-status-list">
            {statusDistribution.map((item) => (
              <div key={item.status} className="chart-status-row">
                <div className="chart-status-meta">
                  <span className="chart-status-bullet" style={{ background: item.color }} />
                  <span>{item.label}</span>
                </div>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${item.percent}%`, background: item.color }} />
                </div>
                <span className="chart-status-value">{item.count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="chart-card chart-card--stacked">
          <div className="chart-header">
            <div>
              <p className="chart-title">Active inventory</p>
              <p className="chart-copy">Percentage of live catalog items.</p>
            </div>
            <span>{activeProductRatio}% live</span>
          </div>
          <div className="pie-card">
            <svg viewBox="0 0 42 42" className="pie-chart" aria-hidden="true">
              <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
              <circle
                cx="21"
                cy="21"
                r="15.9155"
                fill="transparent"
                stroke="#2563eb"
                strokeWidth="8"
                strokeDasharray={`${activeProductRatio} ${100 - activeProductRatio}`}
                strokeDashoffset="25"
                strokeLinecap="round"
                transform="rotate(-90 21 21)"
              />
            </svg>
            <div className="pie-legend">
              <div className="pie-legend-item"><span className="pie-badge pie-badge--active" /> Live</div>
              <div className="pie-legend-item"><span className="pie-badge pie-badge--paused" /> Paused</div>
            </div>
          </div>
        </article>

        <article className="chart-card chart-card--stacked">
          <div className="chart-header">
            <div>
              <p className="chart-title">Top rental revenue</p>
              <p className="chart-copy">Highest-grossing recent products.</p>
            </div>
            <span>{topProductsByRevenue.length} items</span>
          </div>
          <div className="top-products-list">
            {topProductsByRevenue.length === 0 ? (
              <p className="admin-empty">No rental revenue yet.</p>
            ) : (
              topProductsByRevenue.map((item) => (
                <div key={item.name} className="top-product-row">
                  <div>
                    <p className="top-product-name">{item.name}</p>
                    <p className="top-product-copy">₹{item.revenue.toFixed(2)}</p>
                  </div>
                  <span className="top-product-badge">{Math.round((item.revenue / (stats.totalRevenue || 1)) * 100)}%</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {adminEmailWarning && (
        <div className="admin-alert">
          <XCircle size={18} /> {adminEmailWarning}
        </div>
      )}

      {activeModal === 'products' && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--large">
            <div className="modal-header">
              <div>
                <p className="modal-overline">Inventory</p>
                <h2 className="modal-title">Product catalog</h2>
              </div>
              <button className="modal-close" onClick={closeModal} aria-label="Close inventory modal">×</button>
            </div>
            <div className="modal-body modal-scroll">
              {products.length === 0 ? (
                <p className="admin-empty">No products configured yet.</p>
              ) : (
                <div className="modal-table">
                  {products.map((product) => (
                    <div key={product.id} className="modal-table-row">
                      <div>
                        <p className="modal-item-name">{product.name}</p>
                        <p className="modal-item-copy">₹{Number(product.daily_price).toFixed(2)} · {product.available_quantity}/{product.total_quantity}</p>
                      </div>
                      <div className="modal-actions">
                        <button className="btn-secondary btn-xs" onClick={() => openProductForm(product)}>Edit</button>
                        <button
                          className={`admin-pill ${product.is_active ? 'admin-pill--active' : 'admin-pill--inactive'}`}
                          onClick={() => handleToggleActive(product)}
                        >
                          {product.is_active ? 'Live' : 'Paused'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'rentals' && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--large">
            <div className="modal-header">
              <div>
                <p className="modal-overline">Rental history</p>
                <h2 className="modal-title">Recent rentals</h2>
              </div>
              <button className="modal-close" onClick={closeModal} aria-label="Close rentals modal">×</button>
            </div>
            <div className="modal-body modal-scroll">
              {rentalsWithProfiles.length === 0 ? (
                <p className="admin-empty">No recent rentals available.</p>
              ) : (
                <div className="modal-table">
                  {rentalsWithProfiles.map((rental) => (
                    <div key={rental.id} className="modal-table-row modal-table-row--wide">
                      <div>
                        <p className="modal-item-name">{rental.products?.name || 'Unknown product'}</p>
                        <p className="modal-item-copy">{rental.quantity} unit{rental.quantity === 1 ? '' : 's'} · ₹{Number(rental.total_amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="modal-item-copy">{rental.profile?.full_name || rental.profile?.college_email || 'Student'}</p>
                        <p className="modal-item-copy">{new Date(rental.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`admin-status-pill admin-status-pill--${rental.status}`}>{STATUS_LABELS[rental.status]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'productForm' && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--small">
            <div className="modal-header">
              <div>
                <p className="modal-overline">Product builder</p>
                <h2 className="modal-title">{editingProductId ? 'Update product' : 'Add product'}</h2>
              </div>
              <button className="modal-close" onClick={closeModal} aria-label="Close product form">×</button>
            </div>
            <div className="modal-body modal-form-body">
              <label className="input-label">Product name</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(event) => handleInput('name', event.target.value)}
                placeholder="Product title"
              />

              <label className="input-label">Daily price</label>
              <input
                className="input-field"
                type="number"
                min="0"
                step="0.01"
                value={form.daily_price}
                onChange={(event) => handleInput('daily_price', event.target.value)}
                placeholder="₹0.00"
              />

              <div className="admin-form-row admin-form-row--split">
                <div>
                  <label className="input-label">Total quantity</label>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    value={form.total_quantity}
                    onChange={(event) => handleInput('total_quantity', event.target.value)}
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="input-label">Available quantity</label>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    value={form.available_quantity}
                    onChange={(event) => handleInput('available_quantity', event.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>

              <label className="input-label">Pickup location</label>
              <input
                className="input-field"
                value={form.pickup_location}
                onChange={(event) => handleInput('pickup_location', event.target.value)}
                placeholder="Library counter, Block B"
              />

              <label className="input-label">Description</label>
              <textarea
                className="input-field admin-textarea"
                value={form.description}
                onChange={(event) => handleInput('description', event.target.value)}
                placeholder="Short product description"
              />

              <label className="admin-toggle-label">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => handleInput('is_active', event.target.checked)}
                />
                Active in catalog
              </label>

              <button className="btn-primary btn-full" onClick={handleSaveProduct} disabled={isSaving}>
                {isSaving ? 'Saving...' : editingProductId ? 'Update product' : 'Create product'}
              </button>

              {error && <p className="admin-error">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
