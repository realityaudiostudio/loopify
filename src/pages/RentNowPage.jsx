import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Bell, Calendar, Clock, MapPin, Shield,
  CreditCard, CheckCircle2, Loader2, AlertCircle,
  Package, Zap, IndianRupee, ChevronRight, X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useWallet } from '../context/WalletContext'
import './RentNowPage.css'

/* ── Payment methods (rendered as component to get live balance) */
function getPaymentMethods(walletBalance) {
  return [
    { id: 'wallet',     label: 'Campus Wallet',  icon: '🏦', desc: `Balance: ₹${(+walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { id: 'upi',        label: 'UPI / PhonePe',  icon: '📱', desc: 'Scan & pay in seconds' },
    { id: 'card',       label: 'Debit / Credit',  icon: '💳', desc: 'Visa, Mastercard, Rupay' },
    { id: 'netbanking', label: 'Net Banking',     icon: '🏛️', desc: 'All major banks' },
  ]
}

/* ── Duration options (hours) ────────────────────────────────── */
const DURATIONS = [
  { label: '1 hr',   hours: 1 },
  { label: '2 hrs',  hours: 2 },
  { label: '4 hrs',  hours: 4 },
  { label: '8 hrs',  hours: 8 },
  { label: '1 day',  hours: 24 },
  { label: '2 days', hours: 48 },
  { label: '3 days', hours: 72 },
  { label: '1 week', hours: 168 },
]

/* ── Fake transaction ID generator ──────────────────────────── */
function genTxnId() {
  return 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

/* ── Date helpers ────────────────────────────────────────────── */
function toDateStr(d) {
  return d.toISOString().split('T')[0]
}
function addHours(date, h) {
  return new Date(date.getTime() + h * 3600 * 1000)
}
function fmtDate(d) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtTime(d) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

/* ═══════════════════════════════════════════════════════════════ */
export default function RentNowPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { balance: walletBalance, deductFromWallet } = useWallet()

  /* ── product ────────────────────────────────────────────────── */
  const [product,  setProduct]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [pError,   setPError]   = useState(null)

  /* ── form state ─────────────────────────────────────────────── */
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0])
  const [payMethod,        setPayMethod]        = useState('wallet')
  const [notes,            setNotes]            = useState('')
  const [quantity,         setQuantity]         = useState(1)

  /* ── submission ─────────────────────────────────────────────── */
  const [submitting, setSubmitting] = useState(false)
  const [step,       setStep]       = useState('form') // 'form' | 'confirm' | 'processing' | 'success'
  const [rentalData, setRentalData] = useState(null)
  const [formError,  setFormError]  = useState(null)

  /* ── processing animation refs ──────────────────────────────── */
  const [processingStep, setProcessingStep] = useState(0)
  const processingRef = useRef(null)

  /* ── Fetch product ──────────────────────────────────────────── */
  useEffect(() => {
    if (!id) return
    fetchProduct()
  }, [id])

  async function fetchProduct() {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, description, daily_price, security_deposit,
        available_quantity, pickup_location, image_url, is_active,
        categories ( name )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      setPError('Product not found.')
    } else {
      setProduct({ ...data, category: data.categories?.name ?? '' })
    }
    setLoading(false)
  }

  /* ── Derived values ─────────────────────────────────────────── */
  const startDate   = new Date()
  const endDate     = addHours(startDate, selectedDuration.hours)
  const days        = Math.ceil(selectedDuration.hours / 24) || 1
  const rentalTotal = +(product?.daily_price * selectedDuration.hours * quantity).toFixed(2)
  const deposit     = +(product?.security_deposit ?? 0) * quantity
  const grandTotal  = +(rentalTotal + deposit).toFixed(2)

  /* ── Process fake payment & insert to Supabase ───────────────── */
  async function handleRentNow() {
    if (!user) { navigate('/login'); return }
    setFormError(null)
    setStep('processing')
    setProcessingStep(0)

    // Simulate processing steps with delays
    const steps = [
      'Verifying product availability…',
      'Initiating payment transaction…',
      'Processing ₹' + grandTotal + ' via ' + getPaymentMethods(walletBalance).find(m => m.id === payMethod)?.label + '…',
      'Confirming rental booking…',
      'Generating receipt…',
    ]
    setProcessingSteps(steps)

    // Simulate step-by-step processing
    for (let i = 0; i < steps.length; i++) {
      await delay(800 + Math.random() * 400)
      setProcessingStep(i + 1)
    }

    // Insert rental record
    const { data: rental, error: rentalErr } = await supabase
      .from('rentals')
      .insert({
        user_id:         user.id,
        product_id:      product.id,
        quantity,
        start_date:      toDateStr(startDate),
        end_date:        toDateStr(endDate),
        daily_price:     product.daily_price,
        deposit_amount:  deposit,
        total_amount:    grandTotal,
        status:          'active',
        pickup_location: product.pickup_location ?? '',
        notes:           notes || null,
      })
      .select()
      .single()

    if (rentalErr) {
      setFormError('Failed to create rental: ' + rentalErr.message)
      setStep('form')
      return
    }

    // Insert payment record (fake transaction)
    const txnRef = genTxnId()
    const { error: payErr } = await supabase
      .from('payments')
      .insert({
        rental_id:       rental.id,
        user_id:         user.id,
        amount:          grandTotal,
        payment_method:  payMethod,
        status:          'completed',
        transaction_ref: txnRef,
        paid_at:         new Date().toISOString(),
      })

    if (payErr) {
      console.warn('Payment insert failed:', payErr.message)
    }

    // If wallet payment, deduct from wallet
    if (payMethod === 'wallet') {
      const { error: deductErr } = await deductFromWallet({
        amount:      grandTotal,
        description: `Rental – ${product.name}`,
        txn_type:    'rental_debit',
        ref_id:      rental.id,
      })
      if (deductErr) {
        setFormError('Wallet deduction failed: ' + deductErr)
        setStep('form')
        return
      }
    }

    setRentalData({ ...rental, txnRef, payMethod })
    setStep('success')
  }

  /* ── helpers ─────────────────────────────────────────────────── */
  const [processingSteps, setProcessingSteps] = useState([])
  function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

  /* ── Loading ─────────────────────────────────────────────────── */
  if (loading) return (
    <div className="rn-page">
      <header className="rn-header">
        <button className="rn-back" onClick={() => navigate(-1)}><ArrowLeft size={22}/></button>
        <span className="rn-header-title">Rent Now</span>
        <div style={{width:36}}/>
      </header>
      <div className="rn-loader">
        <Loader2 size={32} className="rn-spin" color="#2563EB"/>
        <p>Loading…</p>
      </div>
    </div>
  )

  if (pError || !product) return (
    <div className="rn-page">
      <header className="rn-header">
        <button className="rn-back" onClick={() => navigate(-1)}><ArrowLeft size={22}/></button>
        <span className="rn-header-title">Rent Now</span>
        <div style={{width:36}}/>
      </header>
      <div className="rn-error-state">
        <AlertCircle size={48} color="#9ca3af"/>
        <p>{pError}</p>
        <button className="btn-primary" onClick={() => navigate(-1)} style={{width:'auto',padding:'0 28px'}}>Go Back</button>
      </div>
    </div>
  )

  /* ═══════════ SUCCESS SCREEN ═══════════ */
  if (step === 'success' && rentalData) {
    const method = getPaymentMethods(walletBalance).find(m => m.id === rentalData.payMethod)
    return (
      <div className="rn-page">
        <div className="rn-success-page">
          {/* Animated checkmark */}
          <div className="rn-success-anim">
            <div className="rn-success-ring"/>
            <CheckCircle2 size={56} color="#22c55e" strokeWidth={1.8}/>
          </div>

          <h1 className="rn-success-title">Booking Confirmed!</h1>
          <p className="rn-success-sub">Your rental is active. Pickup at the designated spot.</p>

          {/* Receipt card */}
          <div className="rn-receipt">
            <div className="rn-receipt-header">
              <span className="rn-receipt-badge">🧾 Receipt</span>
              <span className="rn-receipt-txn">#{rentalData.txnRef}</span>
            </div>

            <div className="rn-receipt-row">
              <span>Item</span>
              <span className="rn-receipt-val">{product.name}</span>
            </div>
            <div className="rn-receipt-row">
              <span>Duration</span>
              <span className="rn-receipt-val">{selectedDuration.label} × {quantity}</span>
            </div>
            <div className="rn-receipt-row">
              <span>Rental Period</span>
              <span className="rn-receipt-val">{fmtDate(startDate)} – {fmtDate(endDate)}</span>
            </div>
            <div className="rn-receipt-row">
              <span>Rental Cost</span>
              <span className="rn-receipt-val">₹{rentalTotal.toFixed(2)}</span>
            </div>
            <div className="rn-receipt-row">
              <span>Security Deposit</span>
              <span className="rn-receipt-val">₹{deposit.toFixed(2)}</span>
            </div>
            <div className="rn-receipt-divider"/>
            <div className="rn-receipt-row rn-receipt-total">
              <span>Total Charged</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="rn-receipt-row">
              <span>Payment via</span>
              <span className="rn-receipt-val">{method?.icon} {method?.label}</span>
            </div>
            <div className="rn-receipt-row">
              <span>Status</span>
              <span className="rn-status-paid">✓ Paid</span>
            </div>

            {/* Fake transaction banner */}
            <div className="rn-txn-banner">
              <IndianRupee size={14} color="#22c55e"/>
              <span>Transaction <strong>{rentalData.txnRef}</strong> completed successfully</span>
            </div>
          </div>

          <div className="rn-success-actions">
            <button className="btn-primary" onClick={() => navigate('/rentals')}>
              View My Rentals
            </button>
            <button className="btn-secondary" style={{marginTop:12}} onClick={() => navigate('/dashboard')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════ PROCESSING SCREEN ═══════════ */
  if (step === 'processing') {
    return (
      <div className="rn-page">
        <div className="rn-processing-page">
          <div className="rn-processing-anim">
            <Loader2 size={48} className="rn-spin" color="#2563EB"/>
          </div>
          <h2 className="rn-processing-title">Processing Payment</h2>
          <p className="rn-processing-sub">Please don't go back…</p>
          <div className="rn-processing-steps">
            {processingSteps.map((s, i) => (
              <div key={i} className={`rn-proc-step${processingStep > i ? ' done' : processingStep === i ? ' active' : ''}`}>
                <span className="rn-proc-dot">
                  {processingStep > i ? '✓' : processingStep === i ? '…' : '○'}
                </span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════ CONFIRM SCREEN ═══════════ */
  if (step === 'confirm') {
    const method = getPaymentMethods(walletBalance).find(m => m.id === payMethod)
    return (
      <div className="rn-page">
        <header className="rn-header">
          <button className="rn-back" onClick={() => setStep('form')}><ArrowLeft size={22}/></button>
          <span className="rn-header-title">Confirm Rental</span>
          <div style={{width:36}}/>
        </header>

        <div className="rn-body">
          <div className="rn-confirm-card">
            <div className="rn-confirm-icon">
              <Package size={32} color="#2563EB"/>
            </div>
            <h2 className="rn-confirm-name">{product.name}</h2>
            <p className="rn-confirm-cat">{product.category}</p>

            <div className="rn-confirm-rows">
              <div className="rn-confirm-row">
                <span><Clock size={14}/> Duration</span>
                <strong>{selectedDuration.label} × qty {quantity}</strong>
              </div>
              <div className="rn-confirm-row">
                <span><Calendar size={14}/> From</span>
                <strong>{fmtDate(startDate)}, {fmtTime(startDate)}</strong>
              </div>
              <div className="rn-confirm-row">
                <span><Calendar size={14}/> To</span>
                <strong>{fmtDate(endDate)}, {fmtTime(endDate)}</strong>
              </div>
              {product.pickup_location && (
                <div className="rn-confirm-row">
                  <span><MapPin size={14}/> Pickup</span>
                  <strong>{product.pickup_location}</strong>
                </div>
              )}
              <div className="rn-confirm-divider"/>
              <div className="rn-confirm-row">
                <span>Rental Cost</span>
                <strong>₹{rentalTotal.toFixed(2)}</strong>
              </div>
              <div className="rn-confirm-row">
                <span><Shield size={14}/> Deposit</span>
                <strong>₹{deposit.toFixed(2)}</strong>
              </div>
              <div className="rn-confirm-row rn-confirm-grand">
                <span>Grand Total</span>
                <strong>₹{grandTotal.toFixed(2)}</strong>
              </div>
            </div>

            <div className="rn-confirm-method">
              <span>{method?.icon}</span>
              <span>{method?.label}</span>
              <span className="rn-confirm-method-tag">Selected</span>
            </div>
          </div>

          <div className="rn-cta-wrap">
            <button className="btn-primary" onClick={handleRentNow}>
              <Zap size={18} fill="currentColor" strokeWidth={0}/>
              Confirm & Pay ₹{grandTotal.toFixed(2)}
            </button>
            <button className="btn-secondary" style={{marginTop:12}} onClick={() => setStep('form')}>
              Edit Details
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ═══════════ FORM SCREEN ═══════════ */
  return (
    <div className="rn-page">
      <header className="rn-header">
        <button className="rn-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} strokeWidth={2}/>
        </button>
        <span className="rn-header-title">Rent Now</span>
        <button className="rn-notif" onClick={() => navigate('/notifications')}>
          <Bell size={22} strokeWidth={1.8}/>
        </button>
      </header>

      <div className="rn-body">

        {/* ── Product summary ──────────────────────────────────── */}
        <div className="rn-product-strip">
          <div className="rn-product-img-wrap">
            {product.image_url
              ? <img src={product.image_url} alt={product.name} className="rn-product-img"/>
              : <Package size={28} color="#c7d2fe"/>
            }
          </div>
          <div className="rn-product-info">
            <p className="rn-product-name">{product.name}</p>
            <p className="rn-product-meta">
              {product.category && <span className="rn-chip">{product.category}</span>}
              <span className="rn-price-tag">₹{product.daily_price}/hr</span>
            </p>
          </div>
        </div>

        {/* ── Duration selector ────────────────────────────────── */}
        <div className="rn-section">
          <h2 className="rn-section-title"><Clock size={15}/> Select Duration</h2>
          <div className="rn-duration-grid">
            {DURATIONS.map((d) => (
              <button
                key={d.hours}
                className={`rn-dur-btn${selectedDuration.hours === d.hours ? ' selected' : ''}`}
                onClick={() => setSelectedDuration(d)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Quantity ─────────────────────────────────────────── */}
        <div className="rn-section">
          <h2 className="rn-section-title"><Package size={15}/> Quantity</h2>
          <div className="rn-qty-row">
            <button className="rn-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
            <span className="rn-qty-val">{quantity}</span>
            <button className="rn-qty-btn" onClick={() => setQuantity(q => Math.min(product.available_quantity, q + 1))}>+</button>
            <span className="rn-qty-hint">of {product.available_quantity} available</span>
          </div>
        </div>

        {/* ── Price summary ────────────────────────────────────── */}
        <div className="rn-price-summary">
          <div className="rn-ps-row">
            <span>₹{product.daily_price}/hr × {selectedDuration.hours}h × qty {quantity}</span>
            <span>₹{rentalTotal.toFixed(2)}</span>
          </div>
          <div className="rn-ps-row">
            <span><Shield size={12}/> Refundable deposit</span>
            <span>₹{deposit.toFixed(2)}</span>
          </div>
          <div className="rn-ps-divider"/>
          <div className="rn-ps-row rn-ps-total">
            <span>Total Payable</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* ── Pickup location ──────────────────────────────────── */}
        {product.pickup_location && (
          <div className="rn-location-strip">
            <MapPin size={16} color="#2563EB"/>
            <div>
              <p className="rn-loc-label">Pickup Location</p>
              <p className="rn-loc-val">{product.pickup_location}</p>
            </div>
          </div>
        )}

        {/* ── Notes ───────────────────────────────────────────── */}
        <div className="rn-section">
          <h2 className="rn-section-title">Notes (optional)</h2>
          <textarea
            className="rn-notes"
            placeholder="Any special instructions for the owner…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* ── Payment method ───────────────────────────────────── */}
        <div className="rn-section">
          <h2 className="rn-section-title"><CreditCard size={15}/> Payment Method</h2>
          <div className="rn-payment-list">
            {getPaymentMethods(walletBalance).map((m) => (
              <button
                key={m.id}
                className={`rn-pay-card${payMethod === m.id ? ' selected' : ''}`}
                onClick={() => setPayMethod(m.id)}
              >
                <span className="rn-pay-icon">{m.icon}</span>
                <div className="rn-pay-info">
                  <p className="rn-pay-label">{m.label}</p>
                  <p className="rn-pay-desc">{m.desc}</p>
                </div>
                <div className={`rn-pay-radio${payMethod === m.id ? ' checked' : ''}`}/>
              </button>
            ))}
          </div>
        </div>

        {formError && (
          <div className="rn-form-error">
            <AlertCircle size={16}/>
            <span>{formError}</span>
          </div>
        )}

        {/* ── CTA ──────────────────────────────────────────────── */}
        <div className="rn-cta-wrap">
          <button className="btn-primary" onClick={() => setStep('confirm')}>
            <Zap size={18} fill="currentColor" strokeWidth={0}/>
            Proceed to Confirm
            <ChevronRight size={18}/>
          </button>
        </div>

        <div style={{ height: 24 }}/>
      </div>
    </div>
  )
}
