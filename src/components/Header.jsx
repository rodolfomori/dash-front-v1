import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-700' : '';
  };

  return (
    <header className="bg-blue-600 text-white">
      <nav className="container mx-auto px-6 py-4">
        <ul className="flex space-x-4">
          <li>
            <Link
              to="/"
              className={`px-4 py-2 rounded hover:bg-blue-700 transition-colors ${isActive('/')}`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/monthly-goal"
              className={`px-4 py-2 rounded hover:bg-blue-700 transition-colors ${isActive('/monthly-goal')}`}
            >
              Meta Mensal
            </Link>
          </li>
          <li>
            <Link
              to="/yearly-goal"
              className={`px-4 py-2 rounded hover:bg-blue-700 transition-colors ${isActive('/yearly-goal')}`}
            >
              Meta Anual
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}