import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '../utils/currencyUtils'

function DailyDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(() => {
    const baseDate = new Date()
    const sevenDaysAgo = new Date(baseDate)
    sevenDaysAgo.setDate(baseDate.getDate() - 7)

    const isToday = new Date()

    const todayStr = sevenDaysAgo.toISOString().split('T')[0]
    const today = isToday.toISOString().split('T')[0]

    return {
      start: todayStr,
      end: today,
    }
  })

  const convertTimestampToDate = (timestamp) => {
    if (timestamp > 1700000000) {
      return new Date(timestamp * 1000).toISOString().split('T')[0]
    }
    return new Date(timestamp).toISOString().split('T')[0]
  }

  const fetchData = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true)
      const response = await axios.post(
        'http://localhost:3000/api/transactions',
        {
          ordered_at_ini: startDate,
          ordered_at_end: endDate,
        },
      )

      console.log('Dados recebidos do backend:', response.data)

      const dailyDataMap = {}
      let totalAffiliateValue = 0

      // Inicializar o mapa de dados diários
      const start = new Date(startDate)
      const end = new Date(endDate)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        dailyDataMap[dateStr] = {
          date: dateStr,
          net_amount: 0,
          quantity: 0,
          affiliate_value: 0,
        }
      }

      // Processar transações
      if (Array.isArray(response.data.data)) {
        response.data.data.forEach((transaction) => {
          const transactionDate = new Date(transaction.dates.created_at * 1000)
            .toISOString()
            .split('T')[0]
          const affiliateValue =
            transaction.calculation_details?.net_affiliate_value || 0

          if (dailyDataMap[transactionDate]) {
            dailyDataMap[transactionDate].net_amount +=
              transaction.calculation_details.net_amount
            dailyDataMap[transactionDate].quantity += 1
            dailyDataMap[transactionDate].affiliate_value += affiliateValue
          }

          totalAffiliateValue += affiliateValue
        })
      }

      const chartData = Object.values(dailyDataMap)
      console.log('Dados processados:', chartData)
      console.log('Total de valor de afiliações:', totalAffiliateValue)

      setData({
        dailyData: chartData,
        totals: {
          total_transactions: response.data.totals.total_transactions,
          total_net_amount: response.data.totals.total_net_amount,
          total_net_affiliate_value: totalAffiliateValue,
        },
      })

      setLoading(false)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(dateRange.start, dateRange.end)
  }, [dateRange, fetchData])

  const handleRefreshData = () => {
    fetchData(dateRange.start, dateRange.end)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  }

  const handleDateChange = (type, value) => {
    setDateRange((prev) => {
      const newRange = { ...prev, [type]: value }
      if (new Date(newRange.start) <= new Date(newRange.end)) {
        return newRange
      }
      return prev
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Diário de Vendas
          </h1>
          <button
            onClick={handleRefreshData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Atualizar Dados
          </button>
        </div>

        <div className="flex gap-4 items-center mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">
              Valor Líquido Total
            </h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {formatCurrency(data?.totals?.total_net_amount || 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">
              Quantidade de Vendas
            </h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {data?.totals?.total_transactions || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">
              Valor de Afiliações
            </h3>

            <p className="mt-2 text-3xl font-bold text-orange-500">
              {formatCurrency(data?.totals?.total_net_affiliate_value || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 relative">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Vendas por Dia
          </h3>
          <div className="h-96 relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">Carregando dados...</p>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.dailyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#2563EB"
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <YAxis yAxisId="right" orientation="right" stroke="#059669" />
                <Tooltip
                  formatter={(value, name) => {
                    if (
                      name === 'Valor Líquido' ||
                      name === 'Valor de Afiliação'
                    )
                      return formatCurrency(value)
                    return `${value} vendas`
                  }}
                  labelFormatter={formatDate}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="net_amount"
                  name="Valor Líquido"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Bar
                  yAxisId="right"
                  dataKey="quantity"
                  name="Quantidade"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Bar
                  yAxisId="left"
                  dataKey="affiliate_value"
                  name="Valor de Afiliação"
                  fill="#F97316" // Cor laranja
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyDashboard
