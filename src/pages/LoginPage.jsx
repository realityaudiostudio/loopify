import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { signIn } from '../lib/auth'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()

  const [form, setForm]           = useState({ email: '', password: '' })
  const [showPassword, setShowPw] = useState(false)
  const [errors, setErrors]       = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]     = useState(false)

  /* ── Validation ───────────────────────────────────────────── */
  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'College email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid college email address.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 6)
      e.password = 'Password must be at least 6 characters.'
    return e
  }

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
    if (serverError) setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setServerError('')

    const { error } = await signIn({ email: form.email, password: form.password })

    setLoading(false)

    if (error) {
      // Map Supabase error messages to friendly text
      const msg =
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message === 'Email not confirmed'
          ? 'Please verify your email before logging in.'
          : error.message

      setServerError(msg)
      return
    }

    navigate('/dashboard')
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="login-page page-enter">
      {/* Brand */}
      <div className="login-brand">
        <div className="brand-logo-wrap">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
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
          <span className="brand-name">CampusShare</span>
        </div>
      </div>

      {/* Heading */}
      <div className="login-heading">
        <h1 className="headline-lg-mobile">Welcome back</h1>
        <p className="body-md login-sub">
          Enter your details to access your campus resources.
        </p>
      </div>

      {/* Server-level error banner */}
      {serverError && (
        <div className="server-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form */}
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="input-group">
          <label className="input-label" htmlFor="login-email">
            College Email / ID
          </label>
          <div className="input-wrapper">
            <span className="input-icon"><Mail size={18}/></span>
            <input
              id="login-email"
              type="email"
              className={`input-field${errors.email ? ' has-error' : ''}`}
              placeholder="student@college.edu"
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
              inputMode="email"
            />
          </div>
          {errors.email && (
            <p className="input-error-msg"><AlertCircle size={13}/>{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="input-group">
          <label className="input-label" htmlFor="login-password">
            Password
          </label>
          <div className="input-wrapper">
            <span className="input-icon"><Lock size={18}/></span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className={`input-field has-action${errors.password ? ' has-error' : ''}`}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange('password')}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="input-action"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
          {errors.password && (
            <p className="input-error-msg"><AlertCircle size={13}/>{errors.password}</p>
          )}
        </div>

        {/* Forgot */}
        <div className="login-forgot">
          <button
            type="button"
            className="link-btn"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot Password?
          </button>
        </div>

        {/* CTA */}
        <button
          id="login-submit-btn"
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading
            ? <span className="login-spinner" aria-hidden/>
            : <> Login <ArrowRight size={18}/> </>
          }
        </button>

        {/* Sign up */}
        <p className="login-signup-row body-sm">
          Don't have an account?{' '}
          <button type="button" className="link-btn" onClick={() => navigate('/signup')}>
            Sign up
          </button>
        </p>

        {/* Terms */}
        <p className="login-terms label-sm">
          By logging in, you agree to our{' '}
          <button type="button" className="link-btn" style={{fontSize:'12px'}}>Terms</button>
          {' '}&amp;{' '}
          <button type="button" className="link-btn" style={{fontSize:'12px'}}>Privacy Policy</button>.
        </p>
      </form>
    </div>
  )
}
