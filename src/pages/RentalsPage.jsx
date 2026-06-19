import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Bell, Package, Calendar, Clock,
  MapPin, CreditCard, ChevronRight, Loader2,
  ReceiptText, RefreshCw, CheckCircle2, AlertCircle,
  XCircle, Hourglass, IndianRupee,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import './RentalsPage.css'

/* ── Status config ───────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: '#fffbeb', icon: Hourglass,    dot: '#f59e0b' },
  active:    { label: 'Active',    color: '#2563EB', bg: '#EEF2FF', icon: RefreshCw,    dot: '#2563EB' },
  due_soon:  { label: 'Due Soon',  color: '#ea580c', bg: '#fff7ed', icon: AlertCircle,  dot: '#ea580c' },
  overdue:   { label: 'Overdue',   color: '#dc2626', bg: '#fef2f2', icon: XCircle,      dot: '#dc2626' },
  returned:  { label: 'Returned',  color: '#22c55e', bg: '#f0fdf4', icon: CheckCircle2, dot: '#22c55e' },
  cancelled: { label: 'Cancelled', color: '#9ca3af', bg: '#f9fafb', icon: XCircle,      dot: '#9ca3af' },
}

/* ── Tab definitions ─────────────────────────────────────────── */
const TABS = [
  { id: 'all',     label: 'All' },
  { id: 'active',  label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'returned',label: 'Returned' },
]

/* ── Date formatter ──────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

/* ═══════════════════════════════════════════════════════════════ */
export default function RentalsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [rentals,   setRentals]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedRental, setSelectedRental] = useState(null)

  /* ── Fetch rentals ──────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return
    fetchRentals()
  }, [user])

  async function fetchRentals() {
    setLoading(true)
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        id, quantity, start_date, end_date, daily_price,
        deposit_amount, total_amount, status, pickup_location,
        notes, created_at,
        products (
          id, name, image_url,
          categories ( name )
        ),
        payments (
          id, amount, payment_method, status, transaction_ref, paid_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRentals(data.map(r => ({
        ...r,
        productName:     r.products?.name ?? 'Unknown',
        productImage:    r.products?.image_url ?? null,
        productCategory: r.products?.categories?.name ?? '',
        payment:         r.payments?.[0] ?? null,
      })))
    }
    setLoading(false)
  }

  /* ── Derived ─────────────────────────────────────────────────── */
  const filtered = activeTab === 'all'
    ? rentals
    : rentals.filter(r => {
        if (activeTab === 'active') return ['active', 'due_soon'].includes(r.status)
        return r.status === activeTab
      })

  const stats = {
    active:  rentals.filter(r => ['active', 'due_soon'].includes(r.status)).length,
    pending: rentals.filter(r => r.status === 'pending').length,
    total:   rentals.length,
    spent:   rentals.reduce((acc, r) => acc + (+r.total_amount || 0), 0),
  }

  /* ── Return rental (mark as returned) ──────────────────────── */
  async function markReturned(rentalId) {
    const { error } = await supabase
      .from('rentals')
      .update({ status: 'returned', updated_at: new Date().toISOString() })
      .eq('id', rentalId)

    if (!error) {
      setRentals(prev => prev.map(r =>
        r.id === rentalId ? { ...r, status: 'returned' } : r
      ))
      setSelectedRental(null)
    }
  }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="rl-page">

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <header className="rl-header">
        <span className="rl-header-title">My Rentals</span>
        <button className="rl-notif" onClick={() => navigate('/notifications')}>
          <Bell size={22} strokeWidth={1.8}/>
        </button>
      </header>

      {/* ══ STATS STRIP ═════════════════════════════════════════ */}
      <div className="rl-stats-strip">
        <div className="rl-stat">
          <span className="rl-stat-val rl-stat-blue">{stats.active}</span>
          <span className="rl-stat-label">Active</span>
        </div>
        <div className="rl-stat-divider"/>
        <div className="rl-stat">
          <span className="rl-stat-val rl-stat-amber">{stats.pending}</span>
          <span className="rl-stat-label">Pending</span>
        </div>
        <div className="rl-stat-divider"/>
        <div className="rl-stat">
          <span className="rl-stat-val">{stats.total}</span>
          <span className="rl-stat-label">Total</span>
        </div>
        <div className="rl-stat-divider"/>
        <div className="rl-stat">
          <span className="rl-stat-val rl-stat-green">₹{stats.spent.toFixed(0)}</span>
          <span className="rl-stat-label">Spent</span>
        </div>
      </div>

      {/* ══ TABS ════════════════════════════════════════════════ */}
      <div className="rl-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`rl-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ LIST ════════════════════════════════════════════════ */}
      <div className="rl-body">
        {loading ? (
          <div className="rl-loader">
            <Loader2 size={32} className="rl-spin" color="#2563EB"/>
            <p>Loading rentals…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rl-empty">
            <ReceiptText size={56} color="#c7d2fe" strokeWidth={1.2}/>
            <h3>No rentals yet</h3>
            <p>Browse products and start your first rental!</p>
            <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{width:'auto',padding:'0 28px'}}>
              Browse Products
            </button>
          </div>
        ) : (
          filtered.map(r => (
            <RentalCard
              key={r.id}
              rental={r}
              onClick={() => setSelectedRental(r)}
            />
          ))
        )}

        <div style={{ height: 80 }}/>
      </div>

      {/* ══ DETAIL DRAWER ═══════════════════════════════════════ */}
      {selectedRental && (
        <RentalDrawer
          rental={selectedRental}
          onClose={() => setSelectedRental(null)}
          onMarkReturned={markReturned}
        />
      )}

      {/* ══ BOTTOM NAV ══════════════════════════════════════════ */}
      <BottomNav active="rentals"/>
    </div>
  )
}

/* ── Rental Card ─────────────────────────────────────────────── */
function RentalCard({ rental, onClick }) {
  const cfg = STATUS_CONFIG[rental.status] ?? STATUS_CONFIG.pending
  const StatusIcon = cfg.icon

  return (
    <button className="rl-card" onClick={onClick}>
      {/* Image / icon */}
      <div className="rl-card-img-wrap">
        {rental.productImage
          ? <img src={rental.productImage} alt={rental.productName} className="rl-card-img"/>
          : <Package size={28} color="#c7d2fe"/>
        }
      </div>

      {/* Info */}
      <div className="rl-card-info">
        <div className="rl-card-top">
          <p className="rl-card-name">{rental.productName}</p>
          <div className="rl-card-status" style={{ background: cfg.bg, color: cfg.color }}>
            <span className="rl-card-status-dot" style={{ background: cfg.dot }}/>
            {cfg.label}
          </div>
        </div>
        <p className="rl-card-cat">{rental.productCategory}</p>
        <div className="rl-card-dates">
          <span><Calendar size={11}/> {fmtDate(rental.start_date)}</span>
          <span className="rl-card-dates-sep">→</span>
          <span>{fmtDate(rental.end_date)}</span>
        </div>
        <div className="rl-card-bottom">
          <span className="rl-card-amount">₹{(+rental.total_amount).toFixed(2)}</span>
          {rental.payment?.status === 'completed' && (
            <span className="rl-card-paid">✓ Paid</span>
          )}
          <ChevronRight size={14} color="#9ca3af" style={{marginLeft:'auto'}}/>
        </div>
      </div>
    </button>
  )
}

/* ── Rental Detail Drawer ────────────────────────────────────── */
function RentalDrawer({ rental, onClose, onMarkReturned }) {
  const cfg = STATUS_CONFIG[rental.status] ?? STATUS_CONFIG.pending
  const StatusIcon = cfg.icon
  const isActive = ['active', 'due_soon'].includes(rental.status)

  return (
    <>
      {/* backdrop */}
      <div className="rl-backdrop" onClick={onClose}/>

      {/* sheet */}
      <div className="rl-drawer">
        {/* drag handle */}
        <div className="rl-drawer-handle"/>

        {/* header */}
        <div className="rl-drawer-header">
          <h2 className="rl-drawer-title">Rental Details</h2>
          <button className="rl-drawer-close" onClick={onClose}>
            <XCircle size={22} strokeWidth={1.8}/>
          </button>
        </div>

        <div className="rl-drawer-body">

          {/* Product */}
          <div className="rl-drawer-product">
            <div className="rl-drawer-prod-img">
              {rental.productImage
                ? <img src={rental.productImage} alt={rental.productName} className="rl-drawer-img"/>
                : <Package size={28} color="#c7d2fe"/>
              }
            </div>
            <div>
              <p className="rl-drawer-prod-name">{rental.productName}</p>
              <p className="rl-drawer-prod-cat">{rental.productCategory}</p>
            </div>
            <div className="rl-drawer-status-pill" style={{ background: cfg.bg, color: cfg.color }}>
              <StatusIcon size={13}/>
              {cfg.label}
            </div>
          </div>

          {/* Rental info rows */}
          <div className="rl-drawer-rows">
            <DrawerRow icon={<Calendar size={14}/>} label="Start Date"       val={fmtDate(rental.start_date)}/>
            <DrawerRow icon={<Calendar size={14}/>} label="End Date"         val={fmtDate(rental.end_date)}/>
            <DrawerRow icon={<Package size={14}/>}  label="Quantity"         val={`${rental.quantity} unit${rental.quantity > 1 ? 's' : ''}`}/>
            {rental.pickup_location && (
              <DrawerRow icon={<MapPin size={14}/>}   label="Pickup Location" val={rental.pickup_location}/>
            )}
            <DrawerRow icon={<Clock size={14}/>}    label="Booked On"       val={fmtDateTime(rental.created_at)}/>
          </div>

          {/* Price breakdown */}
          <div className="rl-drawer-price-box">
            <p className="rl-drawer-price-title">Price Breakdown</p>
            <div className="rl-drawer-price-row">
              <span>Daily Rate</span>
              <span>₹{rental.daily_price}/hr</span>
            </div>
            <div className="rl-drawer-price-row">
              <span>Deposit (refundable)</span>
              <span>₹{(+rental.deposit_amount).toFixed(2)}</span>
            </div>
            <div className="rl-drawer-price-divider"/>
            <div className="rl-drawer-price-row rl-drawer-price-total">
              <span>Total</span>
              <span>₹{(+rental.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment info */}
          {rental.payment && (
            <div className="rl-drawer-payment-box">
              <div className="rl-drawer-txn-header">
                <IndianRupee size={14} color="#22c55e"/>
                <span className="rl-drawer-txn-label">Transaction Details</span>
                <span className={`rl-drawer-txn-status ${rental.payment.status}`}>
                  {rental.payment.status === 'completed' ? '✓ Paid' : rental.payment.status}
                </span>
              </div>
              <div className="rl-drawer-price-row">
                <span>Method</span>
                <span style={{textTransform:'capitalize'}}>{rental.payment.payment_method?.replace('_',' ')}</span>
              </div>
              <div className="rl-drawer-price-row">
                <span>Transaction ID</span>
                <span className="rl-drawer-txn-id">{rental.payment.transaction_ref}</span>
              </div>
              {rental.payment.paid_at && (
                <div className="rl-drawer-price-row">
                  <span>Paid At</span>
                  <span>{fmtDateTime(rental.payment.paid_at)}</span>
                </div>
              )}
              {/* Fake transaction banner */}
              <div className="rl-txn-banner">
                <CreditCard size={13}/>
                <span>₹{(+rental.payment.amount).toFixed(2)} debited from your account</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {rental.notes && (
            <div className="rl-drawer-notes">
              <p className="rl-drawer-notes-label">Notes</p>
              <p className="rl-drawer-notes-val">{rental.notes}</p>
            </div>
          )}

          {/* Actions */}
          {isActive && (
            <button
              className="btn-primary"
              style={{ background: '#22c55e' }}
              onClick={() => onMarkReturned(rental.id)}
            >
              <CheckCircle2 size={18}/>
              Mark as Returned
            </button>
          )}
        </div>
      </div>
    </>
  )
}

/* ── Helper row ──────────────────────────────────────────────── */
function DrawerRow({ icon, label, val }) {
  return (
    <div className="rl-drawer-row">
      <span className="rl-drawer-row-icon">{icon}</span>
      <span className="rl-drawer-row-label">{label}</span>
      <span className="rl-drawer-row-val">{val}</span>
    </div>
  )
}
