import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import DailyDashboard from './pages/DailyDashboard';
import MonthlyDashboard from './pages/MonthlyDashboard';
import YearlyDashboard from './pages/YearlyDashboard';
import Today from './pages/Today';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
        <Header />
        <ThemeToggle />
        <img src="/devclub-logo.png" alt="DevClub Logo" className="fixed bottom-4 left-4 w-16 h-16 opacity-50 inline dark:hidden" />
        <img src="/devclub-logo-w.png" alt="DevClub Logo" className="fixed bottom-4 left-4 w-16 h-16 opacity-50 hidden dark:inline" />
        <Routes>
          <Route path="/" element={<DailyDashboard />} />
          <Route path="/monthly" element={<MonthlyDashboard />} />
          <Route path="/yearly" element={<YearlyDashboard />} />
          <Route path="/today" element={<Today />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;