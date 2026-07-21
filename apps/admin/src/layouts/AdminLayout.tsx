import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn, initials } from '@/lib/utils';

// SVG icon set — consistent 20x20 Heroicons outline style
const Icons = {
  overview: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path d="M13 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path d="M3 17a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  ),
  artists: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <circle cx="10" cy="10" r="8" />
      <path d="M10 6v4l3 3" strokeLinecap="round" />
    </svg>
  ),
  requests: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path d="M3 4h14M3 8h14M3 12h8" strokeLinecap="round" />
    </svg>
  ),
  appointments: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <rect x="3" y="4" width="14" height="14" rx="2" />
      <path d="M7 2v4M13 2v4M3 9h14" strokeLinecap="round" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path d="M3 3h14l-1.5 9H4.5L3 3Z" />
      <path d="M7 16a1 1 0 1 0 2 0 1 1 0 0 0-2 0ZM13 16a1 1 0 1 0 2 0 1 1 0 0 0-2 0Z" />
    </svg>
  ),
  invites: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <rect x="2" y="5" width="16" height="11" rx="2" />
      <path d="M2 7l8 5 8-5" strokeLinecap="round" />
    </svg>
  ),
  signout: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path d="M13 10H3m0 0 3-3m-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" strokeLinecap="round" />
      <path d="M13 7l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const NAV = [
  { to: '/dashboard',    icon: Icons.overview,     label: 'Overview' },
  { to: '/users',        icon: Icons.users,         label: 'Users' },
  { to: '/artists',      icon: Icons.artists,       label: 'Artists' },
  { to: '/requests',     icon: Icons.requests,      label: 'Look Requests' },
  { to: '/appointments', icon: Icons.appointments,  label: 'Appointments' },
  { to: '/products',     icon: Icons.products,      label: 'Products' },
  { to: '/invites',      icon: Icons.invites,       label: 'Invites' },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col border-r border-gray-200 bg-white flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold tracking-tight text-gray-900">SuperGlam</span>
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Admin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                )
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        {user && (
          <div className="px-3 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {initials(user.display_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{user.display_name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Sign out"
              >
                {Icons.signout}
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
