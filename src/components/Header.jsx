import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-secondary text-primary' : '';
  };

  return (
    <header className="bg-primary text-white dark:bg-gray-800">
      <nav className="container mx-auto px-6 py-4">
        <ul className="flex space-x-4">
        <li>
            <Link
              to="/today"
              className={`px-4 py-2 rounded hover:bg-secondary hover:text-primary transition-colors ${isActive('/today')}`}
            >
              Hoje
            </Link>
          </li>
          <li>
            <Link
              to="/"
              className={`px-4 py-2 rounded hover:bg-secondary hover:text-primary transition-colors ${isActive('/')}`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/monthly"
              className={`px-4 py-2 rounded hover:bg-secondary hover:text-primary transition-colors ${isActive('/monthly')}`}
            >
              Dados Mensais
            </Link>
          </li>
          <li>
            <Link
              to="/yearly"
              className={`px-4 py-2 rounded hover:bg-secondary hover:text-primary transition-colors ${isActive('/yearly')}`}
            >
              Dados Anuais
            </Link>
          </li>
  
        </ul>
      </nav>
    </header>
  );
}