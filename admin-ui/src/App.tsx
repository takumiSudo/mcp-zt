import { NavLink, Route, Routes } from 'react-router-dom';
import Catalog from './pages/Catalog';
import ToolDetail from './pages/ToolDetail';
import Audit from './pages/Audit';

const navItems = [
  { to: '/', label: 'Catalog' },
  { to: '/audit', label: 'Audit' },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold text-primary">MCP Zero Trust Admin</h1>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition hover:bg-primary/10 ${
                    isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/tools/:toolId" element={<ToolDetail />} />
          <Route path="/audit" element={<Audit />} />
        </Routes>
      </main>
    </div>
  );
}
