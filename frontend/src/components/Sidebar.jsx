import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, User, LogOut, UserCog } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Panou',    roles: null },
  { to: '/pacienti',    icon: Users,   label: 'Pacienți', roles: null },
  { to: '/utilizatori', icon: UserCog, label: 'Echipă',   roles: ['ADMIN'] },
]

export default function Sidebar() {
  const { tenant, role, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = tenant?.name
    ? tenant.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'C'

  return (
    <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 flex-shrink-0 no-print">
      {/* Lab logo */}
      <div className="mb-6">
        {tenant?.logoUrl ? (
          <img
            src={tenant.logoUrl}
            alt={tenant.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.filter(item => !item.roles || item.roles.includes(role)).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) =>
              `w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
              }`
            }
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-1">
        <NavLink
          to="/profil"
          title="Profil"
          className={({ isActive }) =>
            `w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`
          }
        >
          <User size={20} />
        </NavLink>
        <button
          onClick={handleLogout}
          title="Deconectare"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  )
}
