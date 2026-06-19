import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const WalletContext = createContext(null)

/* ── Transaction type icons / labels ──────────────────────────── */
export const TXN_META = {
  rental_debit:    { label: 'Rental Payment',       icon: '🛒', color: '#dc2626', sign: '-' },
  deposit_debit:   { label: 'Security Deposit',      icon: '🔒', color: '#ea580c', sign: '-' },
  deposit_refund:  { label: 'Deposit Refund',        icon: '🔄', color: '#22c55e', sign: '+' },
  topup:           { label: 'Added to Wallet',       icon: '💳', color: '#22c55e', sign: '+' },
  reward:          { label: 'Reward Points',         icon: '⭐', color: '#f59e0b', sign: '+' },
  refund:          { label: 'Rental Refund',         icon: '↩️', color: '#22c55e', sign: '+' },
  transfer_in:     { label: 'Money Received',        icon: '📥', color: '#22c55e', sign: '+' },
  transfer_out:    { label: 'Money Sent',            icon: '📤', color: '#dc2626', sign: '-' },
}

export function WalletProvider({ children }) {
  const { user } = useAuth()

  const [wallet,       setWallet]       = useState(null)   // { id, balance, reward_points }
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [txnLoading,   setTxnLoading]   = useState(false)

  /* ── Fetch / refresh wallet ─────────────────────────────────── */
  const fetchWallet = useCallback(async () => {
    if (!user) { setWallet(null); setLoading(false); return }
    const { data } = await supabase
      .from('wallets')
      .select('id, balance, reward_points, updated_at')
      .eq('user_id', user.id)
      .single()
    setWallet(data ?? null)
    setLoading(false)
  }, [user])

  /* ── Fetch transactions ─────────────────────────────────────── */
  const fetchTransactions = useCallback(async (limit = 30) => {
    if (!user) return
    setTxnLoading(true)
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    setTransactions(data ?? [])
    setTxnLoading(false)
  }, [user])

  useEffect(() => {
    fetchWallet()
    fetchTransactions()
  }, [fetchWallet, fetchTransactions])

  /* ── Deduct from wallet (used by RentNowPage) ───────────────── */
  const deductFromWallet = useCallback(async ({ amount, description, txn_type = 'rental_debit', ref_id = null }) => {
    if (!user || !wallet) return { error: 'No wallet found' }
    if (wallet.balance < amount) return { error: 'Insufficient balance' }

    // Update balance
    const newBalance = +(wallet.balance - amount).toFixed(2)
    const { error: updateErr } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (updateErr) return { error: updateErr.message }

    // Record transaction
    await supabase.from('wallet_transactions').insert({
      user_id:     user.id,
      wallet_id:   wallet.id,
      type:        txn_type,
      amount:      -amount,
      balance_after: newBalance,
      description,
      ref_id,
    })

    setWallet(w => ({ ...w, balance: newBalance }))
    fetchTransactions()
    return { error: null }
  }, [user, wallet, fetchTransactions])

  /* ── Top-up wallet ──────────────────────────────────────────── */
  const topupWallet = useCallback(async ({ amount, description = 'Added to Wallet', method = 'upi' }) => {
    if (!user || !wallet) return { error: 'No wallet found' }

    const newBalance = +(wallet.balance + amount).toFixed(2)
    const { error: updateErr } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (updateErr) return { error: updateErr.message }

    await supabase.from('wallet_transactions').insert({
      user_id:     user.id,
      wallet_id:   wallet.id,
      type:        'topup',
      amount:      +amount,
      balance_after: newBalance,
      description,
      ref_id:      null,
    })

    setWallet(w => ({ ...w, balance: newBalance }))
    fetchTransactions()
    return { error: null }
  }, [user, wallet, fetchTransactions])

  /* ── Add reward points ──────────────────────────────────────── */
  const addRewardPoints = useCallback(async (points) => {
    if (!user || !wallet) return
    const newPoints = (wallet.reward_points ?? 0) + points
    await supabase
      .from('wallets')
      .update({ reward_points: newPoints })
      .eq('user_id', user.id)
    setWallet(w => ({ ...w, reward_points: newPoints }))
  }, [user, wallet])

  const value = {
    wallet,
    transactions,
    loading,
    txnLoading,
    balance:       wallet?.balance ?? 0,
    rewardPoints:  wallet?.reward_points ?? 0,
    fetchWallet,
    fetchTransactions,
    deductFromWallet,
    topupWallet,
    addRewardPoints,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be inside <WalletProvider>')
  return ctx
}
