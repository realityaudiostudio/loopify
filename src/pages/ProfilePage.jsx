import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Pencil, GraduationCap, CheckCircle2,
  PiggyBank, Medal, ChevronRight,
  Bell as BellIcon, ShieldCheck, CreditCard,
  HelpCircle, LogOut, Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { signOut, updateProfile } from '../lib/auth'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'
import './ProfilePage.css'

/* ── Menu items ─────────────────────────────────────────────── */
const MENU_ITEMS = [
  { id: 'notifications', label: 'Notifications',   Icon: BellIcon,     path: '/notifications' },
  { id: 'privacy',       label: 'Privacy',         Icon: ShieldCheck,  path: '/privacy'       },
  { id: 'payment',       label: 'Payment Methods', Icon: CreditCard,   path: '/payment'       },
  { id: 'help',          label: 'Help Center',     Icon: HelpCircle,   path: '/help'          },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const fileRef = useRef(null)

  /* ── Local state ─────────────────────────────────────────── */
  const [avatarUrl, setAvatarUrl]           = useState(null)
  const [uploading, setUploading]           = useState(false)
  const [stats, setStats]                   = useState({
    rentalsCompleted: 0,
    moneySaved:       0,
    rewardsEarned:    0,
  })
  const [logoutLoading, setLogoutLoading]   = useState(false)

  /* ── Pull data from Supabase ─────────────────────────────── */
  useEffect(() => {
    if (!user) return
    loadAvatar()
    loadStats()
  }, [user])

  async function loadAvatar() {
    // Use profile row avatar_url first
    if (profile?.avatar_url) { setAvatarUrl(profile.avatar_url); return }

    // Otherwise check storage
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${user.id}/avatar`)
    if (data?.publicUrl) setAvatarUrl(data.publicUrl + '?t=' + Date.now())
  }

  async function loadStats() {
    // Completed rentals count
    const { count: completed } = await supabase
      .from('rentals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'returned')

    // Wallet data for money saved & rewards
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance, reward_points')
      .eq('user_id', user.id)
      .single()

    setStats({
      rentalsCompleted: completed ?? 0,
      moneySaved:       wallet?.balance       ?? 0,
      rewardsEarned:    wallet?.reward_points ?? 0,
    })
  }

  /* ── Avatar upload ───────────────────────────────────────── */
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2 MB.')
      return
    }

    setUploading(true)
    const path = `${user.id}/avatar`

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (upErr) { alert('Upload failed: ' + upErr.message); setUploading(false); return }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = data.publicUrl + '?t=' + Date.now()
    setAvatarUrl(url)

    // Save to profile row
    await updateProfile(user.id, { avatar_url: url })
    refreshProfile()
    setUploading(false)
  }

  /* ── Logout ──────────────────────────────────────────────── */
  async function handleLogout() {
    setLogoutLoading(true)
    await signOut()
    navigate('/login')
  }

  /* ── Display helpers ─────────────────────────────────────── */
  const fullName    = profile?.full_name    || user?.user_metadata?.full_name || 'Student'
  const collegeName = profile?.college_name || 'Campus University'
  const studentId   = profile?.student_id   || 'CS2024'
  const initials    = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="pf-page">

      {/* ══ HEADER ══════════════════════════════════════════ */}
      <header className="pf-header">
        <div className="pf-header-brand">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden>
            <rect width="36" height="36" rx="10" fill="#2563EB"/>
            <circle cx="18" cy="18" r="5" fill="white"/>
            <circle cx="18" cy="7"  r="2.5" fill="white"/>
            <circle cx="18" cy="29" r="2.5" fill="white"/>
            <circle cx="7"  cy="18" r="2.5" fill="white"/>
            <circle cx="29" cy="18" r="2.5" fill="white"/>
            <circle cx="10.5" cy="10.5" r="2" fill="white" opacity=".6"/>
            <circle cx="25.5" cy="10.5" r="2" fill="white" opacity=".6"/>
            <circle cx="10.5" cy="25.5" r="2" fill="white" opacity=".6"/>
            <circle cx="25.5" cy="25.5" r="2" fill="white" opacity=".6"/>
          </svg>
          <span className="pf-brand-name">CampusShare</span>
        </div>
        <button
          className="pf-notif-btn"
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
        >
          <Bell size={22} strokeWidth={1.8} />
        </button>
      </header>

      {/* ══ SCROLLABLE BODY ════════════════════════════════= */}
      <div className="pf-body">

        {/* ── Avatar + Name ─────────────────────────────── */}
        <div className="pf-identity">
          <div className="pf-avatar-wrap">
            {uploading ? (
              <div className="pf-avatar pf-avatar-loading">
                <Loader2 size={28} className="pf-spin" />
              </div>
            ) : avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="pf-avatar pf-avatar-img" />
            ) : (
              <div className="pf-avatar pf-avatar-initials">{initials}</div>
            )}

            {/* Edit button */}
            <button
              className="pf-avatar-edit"
              aria-label="Change profile photo"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Pencil size={13} strokeWidth={2.5} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="pf-file-input"
              onChange={handleAvatarChange}
              aria-hidden
            />
          </div>

          <h1 className="pf-name">{fullName}</h1>
          <p className="pf-college">
            <GraduationCap size={14} strokeWidth={1.8} />
            {collegeName} &bull; {studentId}
          </p>
        </div>

        {/* ── Stats ─────────────────────────────────────── */}
        {/* Big stat — Rentals Completed */}
        <div className="pf-stat-big">
          <CheckCircle2 size={32} color="#2563EB" strokeWidth={1.8} />
          <span className="pf-stat-big-val">{stats.rentalsCompleted}</span>
          <span className="pf-stat-big-lbl">RENTALS COMPLETED</span>
        </div>

        {/* Small stats row */}
        <div className="pf-stats-row">
          <div className="pf-stat-small">
            <PiggyBank size={28} color="#22c55e" strokeWidth={1.6} />
            <span className="pf-stat-small-val">
              ₹{stats.moneySaved.toLocaleString('en-IN')}
            </span>
            <span className="pf-stat-small-lbl">MONEY SAVED</span>
          </div>
          <div className="pf-stat-small">
            <Medal size={28} color="#f59e0b" strokeWidth={1.6} />
            <span className="pf-stat-small-val">{stats.rewardsEarned}</span>
            <span className="pf-stat-small-lbl">REWARDS EARNED</span>
          </div>
        </div>

        {/* ── Menu ──────────────────────────────────────── */}
        <div className="pf-menu">
          {MENU_ITEMS.map(({ id, label, Icon, path }, idx) => (
            <button
              key={id}
              className={`pf-menu-item${idx < MENU_ITEMS.length - 1 ? ' pf-menu-divider' : ''}`}
              onClick={() => navigate(path)}
            >
              <div className="pf-menu-icon-wrap">
                <Icon size={18} strokeWidth={1.8} color="#374151" />
              </div>
              <span className="pf-menu-label">{label}</span>
              <ChevronRight size={18} color="#9ca3af" />
            </button>
          ))}
        </div>

        {/* ── Logout ────────────────────────────────────── */}
        <button
          className="pf-logout-btn"
          onClick={handleLogout}
          disabled={logoutLoading}
          aria-label="Log out"
        >
          {logoutLoading
            ? <Loader2 size={18} className="pf-spin" />
            : (
              <>
                <LogOut size={18} strokeWidth={2} />
                Logout
              </>
            )
          }
        </button>

      </div>{/* end pf-body */}

      <BottomNav active="profile" />
    </div>
  )
}
