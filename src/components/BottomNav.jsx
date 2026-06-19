import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, AlignJustify, Wallet, User } from 'lucide-react'
import './BottomNav.css'

const NAV_ITEMS = [
  { id: 'home',    label: 'Home',    Icon: Home,          path: '/dashboard' },
  { id: 'rentals', label: 'Rentals', Icon: ShoppingBag,   path: '/rentals'   },
  { id: 'queue',   label: 'Queue',   Icon: AlignJustify,  path: '/queue'     },
  { id: 'wallet',  label: 'Wallet',  Icon: Wallet,        path: '/wallet'    },
  { id: 'profile', label: 'Profile', Icon: User,          path: '/profile'   },
]

export default function BottomNav({ active }) {
  const navigate = useNavigate()
  const location = useLocation()

  const current =
    active ||
    NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))?.id ||
    'home'

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(({ id, label, Icon, path }) => {
        const isActive = current === id
        /* Profile item gets a filled pill when active (matches reference) */
        const isProfileActive = isActive && id === 'profile'

        return (
          <button
            key={id}
            className={`bottom-nav-item${isActive ? ' active' : ''}${isProfileActive ? ' active-pill' : ''}`}
            onClick={() => navigate(path)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="bottom-nav-icon-wrap">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            </div>
            <span className="bottom-nav-label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
