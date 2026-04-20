import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Parse from './pages/Parse.jsx';
import History from './pages/History.jsx';

function NavItem({ to, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        'px-3 py-1.5 rounded-md text-sm transition ' +
        (isActive
          ? 'bg-accent text-black font-semibold'
          : 'text-muted hover:bg-[#1f1f1f] hover:text-text')
      }
    >
      {children}
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="min-h-full">
      <header className="border-b border-border bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent text-black grid place-items-center font-extrabold">R</div>
            <div>
              <div className="font-semibold">Robot Progress</div>
              <div className="text-xs text-muted">Daily tracking dashboard</div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <NavItem to="/" end>Dashboard</NavItem>
            <NavItem to="/parse">Paste / Parse</NavItem>
            <NavItem to="/history">History</NavItem>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/parse" element={<Parse />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}
