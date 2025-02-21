import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import DailyDashboard from './pages/DailyDashboard'
import MonthlyDashboard from './pages/MonthlyDashboard'
import YearlyDashboard from './pages/YearlyDashboard'
import Today from './pages/Today'

// Função utilitária para conversão de timestamp
function convertTimestampToDate(timestamp) {
  if (timestamp > 1700000000) {
    return new Date(timestamp * 1000)
  }
  return new Date(timestamp)
}

// Componente de Header de Navegação
function Header() {
  return (
    <header className="bg-blue-600 text-white p-4">
      <nav className="flex space-x-4">
        <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded">
          Hoje
        </Link>
        <Link to="/dashboard" className="hover:bg-blue-700 px-3 py-2 rounded">
          Dashboard de Vendas
        </Link>
        <Link to="/monthly" className="hover:bg-blue-700 px-3 py-2 rounded">
          Dashboard Mensal
        </Link>
        <Link to="/yearly" className="hover:bg-blue-700 px-3 py-2 rounded">
        Dashboard Anual
        </Link>
      </nav>
    </header>
  )
}

// Componente principal do aplicativo
function App() {
  return (
    <Router>
      <div>
        <Header />
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/dashboard" element={<DailyDashboard />} />
          <Route path="/monthly" element={<MonthlyDashboard />} />
          <Route path="/yearly" element={<YearlyDashboard />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
