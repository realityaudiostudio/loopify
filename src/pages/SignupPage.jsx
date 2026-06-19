import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  ArrowRight, ArrowLeft, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { signUp } from '../lib/auth'
import './SignupPage.css'

/* ── Password strength checker ─────────────────────────────── */
function getStrength(pw) {
  let score = 0
  if (pw.length >= 8)              score++
  if (/[A-Z]/.test(pw))           score++
  if (/[0-9]/.test(pw))           score++
  if (/[^A-Za-z0-9]/.test(pw))   score++
  return score   // 0-4
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e']

/* ── Field-level validators ─────────────────────────────────── */
const validators = {
  fullName: (v) => {
    if (!v.trim())                           return 'Full name is required.'
    if (v.trim().split(' ').length < 2)      return 'Please enter your first and last name.'
    if (v.trim().length < 3)                 return 'Name is too short.'
    return null
  },
  email: (v) => {
    if (!v)                                  return 'College email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.'
    return null
  },
  phone: (v) => {
    if (!v)                                  return 'Phone number is required.'
    if (!/^\+?[0-9]{10,15}$/.test(v.replace(/\s/g, '')))
                                             return 'Enter a valid phone number (10-15 digits).'
    return null
  },
  password: (v) => {
    if (!v)                                  return 'Password is required.'
    if (v.length < 8)                        return 'Password must be at least 8 characters.'
    if (!/[A-Z]/.test(v))                   return 'Include at least one uppercase letter.'
    if (!/[0-9]/.test(v))                   return 'Include at least one number.'
    return null
  },
  confirmPassword: (v, pw) => {
    if (!v)                                  return 'Please confirm your password.'
    if (v !== pw)                            return 'Passwords do not match.'
    return null
  },
}

export default function SignupPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [showPw, setShowPw]         = useState(false)
  const [showCPw, setShowCPw]       = useState(false)
  const [errors, setErrors]         = useState({})
  const [touched, setTouched]       = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)

  /* ── Derived ─────────────────────────────────────────────── */
  const strength      = getStrength(form.password)
  const strengthLabel = form.password ? STRENGTH_LABELS[strength] : ''
  const strengthColor = form.password ? STRENGTH_COLORS[strength] : 'transparent'

  const FIELDS = ['fullName', 'email', 'phone', 'password', 'confirmPassword']
  const completedCount = FIELDS.filter((f) => {
    const err =
      f === 'confirmPassword'
        ? validators.confirmPassword(form[f], form.password)
        : validators[f]?.(form[f])
    return form[f] && !err
  }).length
  const progress = Math.round((completedCount / FIELDS.length) * 100)

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleChange = (field) => (e) => {
    const val = e.target.value
    setForm((prev) => ({ ...prev, [field]: val }))
    setServerError('')

    if (touched[field]) {
      const err =
        field === 'confirmPassword'
          ? validators.confirmPassword(val, form.password)
          : validators[field]?.(val)
      setErrors((prev) => ({ ...prev, [field]: err }))
    }
  }

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const err =
      field === 'confirmPassword'
        ? validators.confirmPassword(form[field], form.password)
        : validators[field]?.(form[field])
    setErrors((prev) => ({ ...prev, [field]: err }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    // Touch all fields and validate
    const allTouched = Object.fromEntries(FIELDS.map((f) => [f, true]))
    setTouched(allTouched)

    const newErrors = {}
    FIELDS.forEach((f) => {
      const err =
        f === 'confirmPassword'
          ? validators.confirmPassword(form[f], form.password)
          : validators[f]?.(form[f])
      if (err) newErrors[f] = err
    })
    setErrors(newErrors)
    if (Object.keys(newErrors).length) return

    setLoading(true)
    const { data, error } = await signUp({
      fullName: form.fullName.trim(),
      email:    form.email.trim().toLowerCase(),
      phone:    form.phone.trim(),
      password: form.password,
    })
    setLoading(false)

    if (error) {
      const msg =
        error.message.includes('already registered') ||
        error.message.includes('User already registered')
          ? 'An account with this email already exists. Try logging in.'
          : error.message.includes('Password should be')
          ? 'Password does not meet Supabase requirements. Use 8+ chars with letters and numbers.'
          : error.message
      setServerError(msg)
      return
    }

    // Supabase sends a confirmation email — show success state
    setSuccess(true)
  }

  /* ── Success screen ──────────────────────────────────────── */
  if (success) {
    return (
      <div className="signup-page page-enter">
        <div className="signup-success">
          <div className="signup-success-icon">
            <CheckCircle2 size={56} color="#22c55e" strokeWidth={1.5} />
          </div>
          <h1 className="headline-lg-mobile">Check your inbox!</h1>
          <p className="body-md signup-success-sub">
            We sent a verification link to <strong>{form.email}</strong>.
            Click the link to activate your account and then log in.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate('/login')}
          >
            Go to Login <ArrowRight size={18} />
          </button>
          <p className="signup-resend body-sm">
            Didn't receive it? Check your spam folder or{' '}
            <button
              className="link-btn"
              onClick={async () => {
                setSuccess(false)
                setForm({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
                setTouched({})
                setErrors({})
              }}
            >
              try again
            </button>.
          </p>
        </div>
      </div>
    )
  }

  /* ── Form screen ─────────────────────────────────────────── */
  return (
    <div className="signup-page page-enter">

      {/* ── Back + Brand ── */}
      <div className="signup-top-bar">
        <button
          className="signup-back-btn"
          onClick={() => navigate('/login')}
          aria-label="Back to login"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="brand-logo-wrap">
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
          <span className="brand-name" style={{ fontSize: 17 }}>CampusShare</span>
        </div>
      </div>

      {/* ── Heading ── */}
      <div className="signup-heading">
        <h1 className="headline-lg-mobile">Create account</h1>
        <p className="body-sm signup-sub">
          Join your campus community. Fill in your details below.
        </p>
      </div>

      {/* ── Progress bar ── */}
      <div className="signup-progress-wrap" aria-label={`${progress}% complete`}>
        <div className="signup-progress-track">
          <div
            className="signup-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="signup-progress-label">{progress}% complete</span>
      </div>

      {/* ── Server error ── */}
      {serverError && (
        <div className="server-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      {/* ── Form ── */}
      <form className="signup-form" onSubmit={handleSubmit} noValidate>

        {/* Full Name */}
        <Field
          id="signup-fullname"
          label="Full Name"
          icon={<User size={18} />}
          type="text"
          placeholder="Alan Turing"
          value={form.fullName}
          onChange={handleChange('fullName')}
          onBlur={handleBlur('fullName')}
          error={errors.fullName}
          autoComplete="name"
        />

        {/* College Email */}
        <Field
          id="signup-email"
          label="College Email"
          icon={<Mail size={18} />}
          type="email"
          placeholder="student@college.edu"
          value={form.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          error={errors.email}
          autoComplete="email"
          inputMode="email"
        />

        {/* Phone */}
        <Field
          id="signup-phone"
          label="Phone Number"
          icon={<Phone size={18} />}
          type="tel"
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={handleChange('phone')}
          onBlur={handleBlur('phone')}
          error={errors.phone}
          autoComplete="tel"
          inputMode="tel"
        />

        {/* Password */}
        <div className="input-group">
          <label className="input-label" htmlFor="signup-password">Password</label>
          <div className="input-wrapper">
            <span className="input-icon"><Lock size={18} /></span>
            <input
              id="signup-password"
              type={showPw ? 'text' : 'password'}
              className={`input-field has-action${errors.password ? ' has-error' : ''}`}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={form.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="input-action"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Strength meter */}
          {form.password && (
            <div className="pw-strength-wrap">
              <div className="pw-strength-bars">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="pw-strength-bar"
                    style={{
                      background: n <= strength ? strengthColor : 'var(--outline-variant)',
                    }}
                  />
                ))}
              </div>
              <span className="pw-strength-label" style={{ color: strengthColor }}>
                {strengthLabel}
              </span>
            </div>
          )}
          {errors.password && (
            <p className="input-error-msg"><AlertCircle size={13} />{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="input-group">
          <label className="input-label" htmlFor="signup-confirm-password">
            Confirm Password
          </label>
          <div className="input-wrapper">
            <span className="input-icon"><Lock size={18} /></span>
            <input
              id="signup-confirm-password"
              type={showCPw ? 'text' : 'password'}
              className={`input-field has-action${errors.confirmPassword ? ' has-error' : ''}${
                form.confirmPassword && !errors.confirmPassword ? ' is-valid' : ''
              }`}
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="input-action"
              onClick={() => setShowCPw((v) => !v)}
              aria-label={showCPw ? 'Hide password' : 'Show password'}
            >
              {showCPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="input-error-msg">
              <AlertCircle size={13} />{errors.confirmPassword}
            </p>
          )}
          {form.confirmPassword && !errors.confirmPassword && (
            <p className="input-success-msg">
              <CheckCircle2 size={13} />Passwords match
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          id="signup-submit-btn"
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ marginTop: 4 }}
        >
          {loading
            ? <span className="login-spinner" aria-hidden />
            : <>Create Account <ArrowRight size={18} /></>
          }
        </button>

        {/* Login link */}
        <p className="signup-login-row body-sm">
          Already have an account?{' '}
          <button type="button" className="link-btn" onClick={() => navigate('/login')}>
            Log in
          </button>
        </p>

        {/* Terms */}
        <p className="login-terms label-sm">
          By creating an account, you agree to our{' '}
          <button type="button" className="link-btn" style={{ fontSize: 12 }}>Terms</button>
          {' '}&amp;{' '}
          <button type="button" className="link-btn" style={{ fontSize: 12 }}>Privacy Policy</button>.
        </p>
      </form>
    </div>
  )
}

/* ── Reusable Field sub-component ────────────────────────────── */
function Field({ id, label, icon, error, ...inputProps }) {
  return (
    <div className="input-group">
      <label className="input-label" htmlFor={id}>{label}</label>
      <div className="input-wrapper">
        <span className="input-icon">{icon}</span>
        <input
          id={id}
          className={`input-field${error ? ' has-error' : ''}`}
          {...inputProps}
        />
      </div>
      {error && (
        <p className="input-error-msg"><AlertCircle size={13} />{error}</p>
      )}
    </div>
  )
}
