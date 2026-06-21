import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Send, Download, QrCode, SplitSquareVertical,
  Plus, TrendingUp, ChevronRight, Loader2, RefreshCw,
  AlertCircle, X, IndianRupee, CheckCircle2, ArrowDownLeft,
  ArrowUpRight, Copy, Eye, EyeOff, Wallet,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWallet, TXN_META } from '../context/WalletContext'
import BottomNav from '../components/BottomNav'
import './WalletPage.css'

/* ── Top-up amount presets ───────────────────────────────────── */
const TOPUP_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

/* ── Top-up payment methods ──────────────────────────────────── */
const TOPUP_METHODS = [
  { id: 'upi',     label: 'UPI',         icon: '📱' },
  { id: 'card',    label: 'Card',         icon: '💳' },
  { id: 'netbank', label: 'Net Banking',  icon: '🏛️' },
]

/* ── Transaction filter tabs ─────────────────────────────────── */
const TXN_TABS = [
  { id: 'all',      label: 'All' },
  { id: 'rental',   label: 'Rentals' },
  { id: 'topup',    label: 'Deposits' },
  { id: 'refund',   label: 'Refunds' },
  { id: 'reward',   label: 'Rewards' },
]

/* ── Quick actions ───────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { id: 'send',    label: 'Send',    icon: Send,               color: '#2563EB', bg: '#EEF2FF' },
  { id: 'request', label: 'Request', icon: Download,           color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'scan',    label: 'Scan',    icon: QrCode,             color: '#BC4800', bg: '#FFF3E8' },
  { id: 'split',   label: 'Split',   icon: SplitSquareVertical, color: '#0369a1', bg: '#f0f9ff' },
]

/* ── Fake account details ────────────────────────────────────── */
const LINKED_ACCOUNT = { bank: 'SBI', last4: '7391' }

/* ── Date formatter ──────────────────────────────────────────── */
function fmtTxnDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  const now = new Date()
  const diff = now - date
  if (diff < 86400000) {
    return 'Today, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }
  if (diff < 172800000) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function genTxnId() {
  return 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase()
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

/* ═══════════════════════════════════════════════════════════════ */
export default function WalletPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const {
    wallet, balance, rewardPoints,
    transactions, loading, txnLoading,
    fetchWallet, fetchTransactions,
    topupWallet, deductFromWallet,
  } = useWallet()

  const [txnTab,        setTxnTab]        = useState('all')
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [showTopup,     setShowTopup]     = useState(false)
  const [showWithdraw,  setShowWithdraw]  = useState(false)

  /* ── Refresh ────────────────────────────────────────────────── */
  const handleRefresh = () => {
    fetchWallet()
    fetchTransactions()
  }

  /* ── Filter transactions ────────────────────────────────────── */
  const filtered = transactions.filter(t => {
    if (txnTab === 'all')    return true
    if (txnTab === 'rental') return t.type?.includes('rental') || t.type?.includes('deposit')
    if (txnTab === 'topup')  return t.type === 'topup' || t.type === 'transfer_in'
    if (txnTab === 'refund') return t.type?.includes('refund')
    if (txnTab === 'reward') return t.type === 'reward'
    return true
  })

  /* ── Balance trend (fake) ───────────────────────────────────── */
  const trend = '+2.4%'

  return (
    <div className="wl-page">

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <header className="wl-header">
        <span className="wl-header-title">My Wallet</span>
        <div className="wl-header-actions">
          <button className="wl-hdr-btn" onClick={handleRefresh} aria-label="Refresh">
            <RefreshCw size={18} strokeWidth={2}/>
          </button>
          <button className="wl-hdr-btn" onClick={() => navigate('/notifications')} aria-label="Notifications">
            <Bell size={20} strokeWidth={1.8}/>
          </button>
        </div>
      </header>

      {/* ══ SCROLLABLE BODY ═════════════════════════════════════ */}
      <div className="wl-body">

        {/* ── Wallet Card ──────────────────────────────────────── */}
        <div className="wl-card">
          {/* decorative blobs */}
          <div className="wl-card-blob wl-blob-1"/>
          <div className="wl-card-blob wl-blob-2"/>

          {/* top row */}
          <div className="wl-card-top">
            <span className="wl-card-label">AVAILABLE BALANCE</span>
            <div className="wl-trend-badge">
              <TrendingUp size={12}/> {trend}
            </div>
          </div>

          {/* balance */}
          <div className="wl-card-balance-row">
            {loading ? (
              <Loader2 size={28} className="wl-spin" color="#fff"/>
            ) : (
              <span className="wl-balance">
                {balanceHidden ? '₹ ••••••' : `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </span>
            )}
            <button className="wl-eye-btn" onClick={() => setBalanceHidden(v => !v)}>
              {balanceHidden ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>

          {/* divider */}
          <div className="wl-card-divider"/>

          {/* bottom row */}
          <div className="wl-card-bottom">
            {/* linked account */}
            <div className="wl-linked">
              <div className="wl-linked-icon">🏛️</div>
              <div className="wl-linked-info">
                <p className="wl-linked-label">Linked Account</p>
                <p className="wl-linked-val">{LINKED_ACCOUNT.bank} ****{LINKED_ACCOUNT.last4}</p>
              </div>
            </div>

            {/* action buttons */}
            <div className="wl-card-btns">
              <button className="wl-add-btn" onClick={() => setShowTopup(true)}>
                <Plus size={16} strokeWidth={2.5}/>
                Add Money
              </button>
              <button className="wl-withdraw-btn" onClick={() => setShowWithdraw(true)}>
                <ArrowUpRight size={16}/>
                Withdraw
              </button>
            </div>
          </div>

          {/* reward points chip */}
          <div className="wl-reward-chip">
            <span>⭐</span>
            <span>{(rewardPoints ?? 0).toLocaleString('en-IN')} Reward Points</span>
            <ChevronRight size={14}/>
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────────────── */}
        <div className="wl-quick-actions">
          {QUICK_ACTIONS.map(({ id, label, icon: Icon, color, bg }) => (
            <button key={id} className="wl-qa-btn" onClick={() => {}}>
              <div className="wl-qa-icon" style={{ background: bg }}>
                <Icon size={22} color={color} strokeWidth={1.8}/>
              </div>
              <span className="wl-qa-label">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Transactions ─────────────────────────────────────── */}
        <div className="wl-txn-section">
          <div className="wl-txn-header">
            <span className="wl-txn-title">Recent Transactions</span>
            <button className="wl-view-all" onClick={() => setTxnTab('all')}>
              View All
            </button>
          </div>

          {/* tabs */}
          <div className="wl-txn-tabs">
            {TXN_TABS.map(t => (
              <button
                key={t.id}
                className={`wl-txn-tab${txnTab === t.id ? ' active' : ''}`}
                onClick={() => setTxnTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* list */}
          {txnLoading ? (
            <div className="wl-txn-loader">
              <Loader2 size={24} className="wl-spin" color="#2563EB"/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="wl-txn-empty">
              <Wallet size={44} color="#c7d2fe" strokeWidth={1.2}/>
              <p>No transactions yet</p>
              <span>Add money or make a rental to see activity</span>
            </div>
          ) : (
            <div className="wl-txn-list">
              {filtered.map(t => (
                <TxnRow key={t.id} txn={t}/>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: 80 }}/>
      </div>

      {/* ══ BOTTOM NAV ══════════════════════════════════════════ */}
      <BottomNav active="wallet"/>

      {/* ══ TOP-UP MODAL ════════════════════════════════════════ */}
      {showTopup && (
        <TopupModal
          onClose={() => setShowTopup(false)}
          onSuccess={() => { setShowTopup(false); handleRefresh() }}
          topupWallet={topupWallet}
        />
      )}
      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => { setShowWithdraw(false); handleRefresh() }}
          balance={balance}
          deductFromWallet={deductFromWallet}
        />
      )}
    </div>
  )
}

/* ── Withdraw Modal ─────────────────────────────────────────── */
function WithdrawModal({ onClose, onSuccess, balance, deductFromWallet }) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const numAmount = parseFloat(amount) || 0
  const isValid = numAmount >= 10 && numAmount <= balance

  async function handleWithdraw() {
    if (!isValid) {
      setError(balance <= 0 ? 'No available balance to withdraw.' : 'Enter a valid amount within your balance.')
      return
    }
    setError('')
    setLoading(true)
    const { error: withdrawError } = await deductFromWallet({
      amount: numAmount,
      description: 'Withdrawn from wallet',
      txn_type: 'transfer_out',
      ref_id: null,
    })
    setLoading(false)
    if (withdrawError) {
      setError(withdrawError)
      return
    }
    onSuccess()
  }

  return (
    <>
      <div className="wl-modal-backdrop" onClick={onClose}/>
      <div className="wl-modal wl-withdraw-modal">
        <div className="wl-modal-handle"/>
        <div className="wl-modal-header">
          <h3 className="wl-modal-title">Withdraw Funds</h3>
          <button className="wl-modal-close" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="wl-modal-body">
          <p className="wl-modal-section-label">Available balance</p>
          <div className="wl-modal-balance">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>

          <div className="wl-topup-custom">
            <span className="wl-topup-rs">₹</span>
            <input
              type="number"
              className="wl-topup-input"
              placeholder="Enter withdraw amount"
              min={10}
              max={balance}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError('') }}
            />
          </div>

          {error && (
            <div className="wl-modal-err">
              <AlertCircle size={14}/> {error}
            </div>
          )}

          <button
            className="btn-primary"
            disabled={!isValid || loading}
            onClick={handleWithdraw}
          >
            {loading ? 'Processing…' : `Withdraw ₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          </button>

          <p className="wl-withdraw-note">
            Withdrawals are simulated in this demo app. Your balance will be reduced immediately.
          </p>
        </div>
      </div>
    </>
  )
}

/* ── Transaction Row ─────────────────────────────────────────── */
function TxnRow({ txn }) {
  const meta = TXN_META[txn.type] ?? { label: txn.type, icon: '💫', color: '#6b7280', sign: '' }
  const isCredit = txn.amount > 0
  const absAmount = Math.abs(txn.amount)

  return (
    <div className="wl-txn-row">
      <div className="wl-txn-icon-wrap" style={{ background: isCredit ? '#f0fdf4' : '#fef2f2' }}>
        <span className="wl-txn-icon">{meta.icon}</span>
      </div>
      <div className="wl-txn-info">
        <p className="wl-txn-label">{txn.description ?? meta.label}</p>
        <p className="wl-txn-date">
          {fmtTxnDate(txn.created_at)}
          {txn.type && <span className="wl-txn-type-chip">{meta.label}</span>}
        </p>
      </div>
      <div className="wl-txn-amount-col">
        <span className={`wl-txn-amount ${isCredit ? 'credit' : 'debit'}`}>
          {isCredit ? '+' : '-'}₹{absAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
        {txn.balance_after != null && (
          <span className="wl-txn-bal">Bal: ₹{(+txn.balance_after).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        )}
      </div>
    </div>
  )
}

/* ── Top-up Modal ────────────────────────────────────────────── */
function TopupModal({ onClose, onSuccess, topupWallet }) {
  const [amount,      setAmount]      = useState('')
  const [method,      setMethod]      = useState('upi')
  const [step,        setStep]        = useState('form') // form | processing | success
  const [procStep,    setProcStep]    = useState(0)
  const [txnRef,      setTxnRef]      = useState('')
  const [errMsg,      setErrMsg]      = useState('')
  const [customAmt,   setCustomAmt]   = useState(false)

  const numAmount = parseFloat(amount) || 0
  const isValid   = numAmount >= 10 && numAmount <= 50000

  const procSteps = [
    'Connecting to payment gateway…',
    `Initiating ₹${numAmount} via ${TOPUP_METHODS.find(m => m.id === method)?.label}…`,
    'Verifying transaction…',
    'Crediting to campus wallet…',
    'Done!',
  ]

  async function handlePay() {
    if (!isValid) return
    setErrMsg('')
    setStep('processing')
    setProcStep(0)
    const ref = genTxnId()
    setTxnRef(ref)

    for (let i = 0; i < procSteps.length; i++) {
      await delay(700 + Math.random() * 300)
      setProcStep(i + 1)
    }

    const { error } = await topupWallet({
      amount: numAmount,
      description: `Added via ${TOPUP_METHODS.find(m => m.id === method)?.label}`,
    })

    if (error) {
      setErrMsg(error)
      setStep('form')
    } else {
      setStep('success')
    }
  }

  return (
    <>
      <div className="wl-modal-backdrop" onClick={onClose}/>
      <div className="wl-modal">
        <div className="wl-modal-handle"/>

        {/* Success */}
        {step === 'success' && (
          <div className="wl-modal-success">
            <div className="wl-modal-success-anim">
              <div className="wl-modal-ring"/>
              <CheckCircle2 size={52} color="#22c55e" strokeWidth={1.8}/>
            </div>
            <h2>₹{numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Added!</h2>
            <p>Your wallet has been topped up successfully.</p>
            <div className="wl-modal-txn-ref">
              <IndianRupee size={13} color="#22c55e"/>
              <span>Transaction: <strong>{txnRef}</strong></span>
            </div>
            <button className="btn-primary" onClick={onSuccess}>Done</button>
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="wl-modal-processing">
            <Loader2 size={44} className="wl-spin" color="#2563EB"/>
            <h3>Processing Payment</h3>
            <div className="wl-modal-proc-steps">
              {procSteps.map((s, i) => (
                <div key={i} className={`wl-modal-proc-step${procStep > i ? ' done' : procStep === i ? ' active' : ''}`}>
                  <span>{procStep > i ? '✓' : procStep === i ? '…' : '○'}</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        {step === 'form' && (
          <>
            <div className="wl-modal-header">
              <h3 className="wl-modal-title">Add Money</h3>
              <button className="wl-modal-close" onClick={onClose}><X size={20}/></button>
            </div>

            <div className="wl-modal-body">
              {/* amount presets */}
              <p className="wl-modal-section-label">Select Amount</p>
              <div className="wl-topup-grid">
                {TOPUP_AMOUNTS.map(a => (
                  <button
                    key={a}
                    className={`wl-topup-chip${+amount === a && !customAmt ? ' selected' : ''}`}
                    onClick={() => { setAmount(String(a)); setCustomAmt(false) }}
                  >
                    ₹{a.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* custom amount */}
              <div className="wl-topup-custom">
                <span className="wl-topup-rs">₹</span>
                <input
                  type="number"
                  className="wl-topup-input"
                  placeholder="Enter custom amount"
                  value={customAmt ? amount : ''}
                  min={10}
                  max={50000}
                  onFocus={() => setCustomAmt(true)}
                  onChange={e => { setAmount(e.target.value); setCustomAmt(true) }}
                />
              </div>

              {/* method */}
              <p className="wl-modal-section-label" style={{marginTop:16}}>Payment Method</p>
              <div className="wl-modal-methods">
                {TOPUP_METHODS.map(m => (
                  <button
                    key={m.id}
                    className={`wl-modal-method${method === m.id ? ' selected' : ''}`}
                    onClick={() => setMethod(m.id)}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                    <div className={`wl-modal-radio${method === m.id ? ' checked' : ''}`}/>
                  </button>
                ))}
              </div>

              {errMsg && (
                <div className="wl-modal-err">
                  <AlertCircle size={14}/> {errMsg}
                </div>
              )}

              <button
                className="btn-primary"
                disabled={!isValid}
                onClick={handlePay}
                style={{marginTop:20}}
              >
                <IndianRupee size={16}/>
                Pay ₹{isValid ? numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
              </button>

              <p className="wl-modal-note">
                🔒 Secured by 256-bit encryption. Funds available instantly.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
