import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../utils/currencyUtils';

const COLORS = ['#8A2BE2', '#00FF00', '#FF4500', '#1E90FF', '#FFD700', '#FF1493'];

function Today() {
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTodayData = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.post('http://localhost:3000/api/transactions', {
        ordered_at_ini: today,
        ordered_at_end: today
      });

      const hourlyData = Array(24).fill().map((_, index) => ({
        hour: index,
        sales: 0,
        value: 0,
        affiliateValue: 0
      }));

      let totalSales = 0;
      let totalValue = 0;
      let totalAffiliateValue = 0;
      const productSales = {};

      response.data.data.forEach(transaction => {
        const hour = new Date(transaction.dates.created_at * 1000).getHours();
        const netAmount = Number(transaction?.calculation_details?.net_amount || 0);
        const affiliateValue = Number(transaction?.calculation_details?.net_affiliate_value || 0);

        hourlyData[hour].sales += 1;
        hourlyData[hour].value += netAmount;
        hourlyData[hour].affiliateValue += affiliateValue;

        totalSales += 1;
        totalValue += netAmount;
        totalAffiliateValue += affiliateValue;

        const productName = transaction.product.name;
        if (!productSales[productName]) {
          productSales[productName] = { quantity: 0, value: 0 };
        }
        productSales[productName].quantity += 1;
        productSales[productName].value += netAmount;
      });

      const productData = Object.entries(productSales).map(([name, data]) => ({
        name,
        quantity: data.quantity,
        value: data.value
      }));

      setTodayData({
        hourlyData,
        totalSales,
        totalValue,
        totalAffiliateValue,
        productData
      });

      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayData();
    const interval = setInterval(fetchTodayData, 5 * 60 * 1000); // Atualiza a cada 5 minutos
    return () => clearInterval(interval);
  }, [fetchTodayData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary dark:border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-primary dark:text-secondary mb-8">Dashboard de Hoje</h1>

        {/* Resumo do dia */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark">Valor Total de Vendas</h3>
            <p className="mt-2 text-3xl font-bold text-accent1 dark:text-accent2">
              {formatCurrency(todayData.totalValue)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark">Quantidade de Vendas</h3>
            <p className="mt-2 text-3xl font-bold text-accent3 dark:text-accent4">
              {todayData.totalSales}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark">Valor de Afiliações</h3>
            <p className="mt-2 text-3xl font-bold text-secondary dark:text-primary">
              {formatCurrency(todayData.totalAffiliateValue)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark">Ticket Médio</h3>
            <p className="mt-2 text-3xl font-bold text-accent4 dark:text-accent3">
              {formatCurrency(todayData.totalSales > 0 ? todayData.totalValue / todayData.totalSales : 0)}
            </p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Progressão por Hora */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">Progressão por Hora</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={todayData.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="value" name="Valor (R$)" stroke="#8884d8" />
                  <Line yAxisId="right" type="monotone" dataKey="sales" name="Vendas" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vendas por Produto */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">Vendas por Produto</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={todayData.productData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {todayData.productData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quantidade de Vendas por Produto */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">Quantidade de Vendas por Produto</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={todayData.productData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Valor de Afiliações por Hora */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">Valor de Afiliações por Hora</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={todayData.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="affiliateValue" name="Valor de Afiliação" fill="#ffa500" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Today;