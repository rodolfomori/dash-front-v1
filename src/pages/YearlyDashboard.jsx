import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
import {
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
} from '../utils/currencyUtils'

function YearlyDashboard() {
  const [yearlyData, setYearlyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState({
    meta: localStorage.getItem('yearlyMeta') || 'R$ 0,00',
    superMeta: localStorage.getItem('yearlySuperMeta') || 'R$ 0,00',
    ultraMeta: localStorage.getItem('yearlyUltraMeta') || 'R$ 0,00',
  })
  const [editingGoal, setEditingGoal] = useState(null)
  const [error, setError] = useState(null)

  // Definir o primeiro e último dia do ano atual
  const currentYear = new Date().getFullYear()
  const firstDayOfYear = `${currentYear}-01-01`
  const lastDayOfYear = `${currentYear}-12-31`

  // Calcular progresso baseado nos dias do ano
  const calculateProgress = useCallback(
    (currentAmount, goalAmount) => {
      const today = new Date()
      const startOfYear = new Date(currentYear, 0, 1)
      const endOfYear = new Date(currentYear, 11, 31)

      const totalDaysInYear =
        Math.ceil((endOfYear - startOfYear) / (1000 * 60 * 60 * 24)) + 1
      const elapsedDays = Math.ceil(
        (today - startOfYear) / (1000 * 60 * 60 * 24),
      )

      const expectedProgressPercentage = (elapsedDays / totalDaysInYear) * 100
      const actualProgressPercentage =
        goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0

      const difference = actualProgressPercentage - expectedProgressPercentage

      return {
        expectedProgress: expectedProgressPercentage.toFixed(2),
        actualProgress: actualProgressPercentage.toFixed(2),
        difference: difference.toFixed(2),
      }
    },
    [currentYear],
  )

  // Handlers para edição de metas
  const handleGoalChange = (type, value) => {
    setGoals((prev) => ({
      ...prev,
      [type]: formatCurrencyInput(value),
    }))
  }

  const saveGoal = (type) => {
    localStorage.setItem(
      `yearly${type.charAt(0).toUpperCase() + type.slice(1)}`,
      goals[type],
    )
    setEditingGoal(null)
  }

  const fetchYearlyData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.post(
        'http://localhost:3000/api/transactions',
        {
          ordered_at_ini: firstDayOfYear,
          ordered_at_end: lastDayOfYear,
        },
        {
          timeout: 30000,
          headers: {
            'X-Debug-Request': 'YearlyDashboard',
          },
        },
      )

      // Processar dados similar ao código anterior
      const monthlyDataMap = {}
      for (let month = 1; month <= 12; month++) {
        const monthStr = String(month).padStart(2, '0')
        monthlyDataMap[monthStr] = {
          month: monthStr,
          net_amount: 0,
          quantity: 0,
        }
      }

      response.data.data.forEach((transaction) => {
        const fullDate = new Date(transaction.dates.created_at * 1000)
        const monthStr = String(fullDate.getMonth() + 1).padStart(2, '0')

        const netAmount = Number(
          transaction?.calculation_details?.net_amount || 0,
        )

        if (monthlyDataMap[monthStr]) {
          monthlyDataMap[monthStr].net_amount += netAmount
          monthlyDataMap[monthStr].quantity += 1
        }
      })

      // Converter para array e ordenar
      const chartData = Object.values(monthlyDataMap).sort((a, b) =>
        a.month.localeCompare(b.month),
      )

      // Calcular totais
      const totalNetAmount = chartData.reduce(
        (sum, month) => sum + month.net_amount,
        0,
      )
      const totalQuantity = chartData.reduce(
        (sum, month) => sum + month.quantity,
        0,
      )

      setYearlyData({
        monthlyData: chartData,
        totals: {
          total_transactions: totalQuantity,
          total_net_amount: totalNetAmount,
        },
      })

      setLoading(false)
    } catch (error) {
      console.error('Erro na requisição:', error)
      setError(error)
      setLoading(false)
    }
  }, [firstDayOfYear, lastDayOfYear])

  // Buscar dados quando o componente monta
  useEffect(() => {
    fetchYearlyData()
  }, [fetchYearlyData])

  // Calcular progresso das metas
  const metaProgress = useMemo(() => {
    const currentAmount = yearlyData?.totals?.total_net_amount || 0
    return {
      meta: calculateProgress(currentAmount, parseCurrencyInput(goals.meta)),
      superMeta: calculateProgress(
        currentAmount,
        parseCurrencyInput(goals.superMeta),
      ),
      ultraMeta: calculateProgress(
        currentAmount,
        parseCurrencyInput(goals.ultraMeta),
      ),
    }
  }, [yearlyData, goals, calculateProgress])

  // Renderização dos dados
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Dashboard de Metas Anuais
          </h1>

          {/* Resumo de Vendas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Valor Total de Vendas
              </h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {formatCurrency(yearlyData?.totals?.total_net_amount || 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900">
                Quantidade Total de Vendas
              </h3>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {yearlyData?.totals?.total_transactions || 0}
              </p>
            </div>
          </div>

          {/* Metas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Meta */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Meta</h3>
                {editingGoal !== 'meta' ? (
                  <button
                    onClick={() => setEditingGoal('meta')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    onClick={() => saveGoal('meta')}
                    className="text-green-500 hover:text-green-700"
                  >
                    OK
                  </button>
                )}
              </div>
              {editingGoal === 'meta' ? (
                <input
                  type="text"
                  value={goals.meta}
                  onChange={(e) => handleGoalChange('meta', e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />
              ) : (
                <p className="text-2xl font-bold text-blue-600">{goals.meta}</p>
              )}
              <div className="mt-2">
                <p
                  className={`text-sm ${
                    metaProgress.meta.difference >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {metaProgress.meta.difference >= 0 ? '+' : ''}
                  {metaProgress.meta.difference}%
                  {metaProgress.meta.difference >= 0
                    ? ' adiantado'
                    : ' atrasado'}
                </p>
                <p className="text-xs text-gray-500">
                  Progresso: {metaProgress.meta.actualProgress}% (Esperado:{' '}
                  {metaProgress.meta.expectedProgress}%)
                </p>
              </div>
            </div>

            {/* Super Meta */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Super Meta
                </h3>
                {editingGoal !== 'superMeta' ? (
                  <button
                    onClick={() => setEditingGoal('superMeta')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    onClick={() => saveGoal('superMeta')}
                    className="text-green-500 hover:text-green-700"
                  >
                    OK
                  </button>
                )}
              </div>
              {editingGoal === 'superMeta' ? (
                <input
                  type="text"
                  value={goals.superMeta}
                  onChange={(e) =>
                    handleGoalChange('superMeta', e.target.value)
                  }
                  className="w-full border rounded px-2 py-1"
                />
              ) : (
                <p className="text-2xl font-bold text-blue-600">
                  {goals.superMeta}
                </p>
              )}
              <div className="mt-2">
                <p
                  className={`text-sm ${
                    metaProgress.superMeta.difference >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {metaProgress.superMeta.difference >= 0 ? '+' : ''}
                  {metaProgress.superMeta.difference}%
                  {metaProgress.superMeta.difference >= 0
                    ? ' adiantado'
                    : ' atrasado'}
                </p>
                <p className="text-xs text-gray-500">
                  Progresso: {metaProgress.superMeta.actualProgress}% (Esperado:{' '}
                  {metaProgress.superMeta.expectedProgress}%)
                </p>
              </div>
            </div>

            {/* Ultra Meta */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Ultra Meta
                </h3>
                {editingGoal !== 'ultraMeta' ? (
                  <button
                    onClick={() => setEditingGoal('ultraMeta')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    onClick={() => saveGoal('ultraMeta')}
                    className="text-green-500 hover:text-green-700"
                  >
                    OK
                  </button>
                )}
              </div>
              {editingGoal === 'ultraMeta' ? (
                <input
                  type="text"
                  value={goals.ultraMeta}
                  onChange={(e) =>
                    handleGoalChange('ultraMeta', e.target.value)
                  }
                  className="w-full border rounded px-2 py-1"
                />
              ) : (
                <p className="text-2xl font-bold text-blue-600">
                  {goals.ultraMeta}
                </p>
              )}
              <div className="mt-2">
                <p
                  className={`text-sm ${
                    metaProgress.ultraMeta.difference >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {metaProgress.ultraMeta.difference >= 0 ? '+' : ''}
                  {metaProgress.ultraMeta.difference}%
                  {metaProgress.ultraMeta.difference >= 0
                    ? ' adiantado'
                    : ' atrasado'}
                </p>
                <p className="text-xs text-gray-500">
                  Progresso: {metaProgress.ultraMeta.actualProgress}% (Esperado:{' '}
                  {metaProgress.ultraMeta.expectedProgress}%)
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-white rounded-lg shadow p-6 relative">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Vendas Mensais
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
                <BarChart data={yearlyData?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(monthStr) => {
                      const monthNames = [
                        'Jan',
                        'Fev',
                        'Mar',
                        'Abr',
                        'Mai',
                        'Jun',
                        'Jul',
                        'Ago',
                        'Set',
                        'Out',
                        'Nov',
                        'Dez',
                      ]
                      return monthNames[parseInt(monthStr) - 1]
                    }}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    stroke="#404b62"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis yAxisId="right" orientation="right" stroke="#059669" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Valor Líquido') return formatCurrency(value)
                      return `${value} vendas`
                    }}
                    labelFormatter={(monthStr) => {
                      const monthNames = [
                        'Janeiro',
                        'Fevereiro',
                        'Março',
                        'Abril',
                        'Maio',
                        'Junho',
                        'Julho',
                        'Agosto',
                        'Setembro',
                        'Outubro',
                        'Novembro',
                        'Dezembro',
                      ]
                      return monthNames[parseInt(monthStr) - 1]
                    }}
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
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default YearlyDashboard