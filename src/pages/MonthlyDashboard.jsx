import React, { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

function MonthlyDashboard() {
  const [monthlyData, setMonthlyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState({
    meta: localStorage.getItem('monthlyMeta') || 'R$ 0,00',
    superMeta: localStorage.getItem('monthlySuperMeta') || 'R$ 0,00',
    ultraMeta: localStorage.getItem('monthlyUltraMeta') || 'R$ 0,00',
  })
  const [editingGoal, setEditingGoal] = useState(null)
  const [error, setError] = useState(null)

  // Definir o primeiro e último dia do mês atual
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(
    2,
    '0',
  )}-01`
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0)
    .toISOString()
    .split('T')[0]

  // Calcular progresso baseado nos dias do mês
  const calculateProgress = useCallback(
    (currentAmount, goalAmount) => {
      const today = new Date()
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
      const endOfMonth = new Date(currentYear, currentMonth, 0)

      const totalDaysInMonth =
        Math.ceil((endOfMonth - startOfMonth) / (1000 * 60 * 60 * 24)) + 1
      const elapsedDays = Math.ceil(
        (today - startOfMonth) / (1000 * 60 * 60 * 24),
      )

      const expectedProgressPercentage = (elapsedDays / totalDaysInMonth) * 100
      const actualProgressPercentage =
        goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0

      const difference = actualProgressPercentage - expectedProgressPercentage

      return {
        expectedProgress: expectedProgressPercentage.toFixed(2),
        actualProgress: actualProgressPercentage.toFixed(2),
        difference: difference.toFixed(2),
      }
    },
    [currentYear, currentMonth],
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
      `monthly${type.charAt(0).toUpperCase() + type.slice(1)}`,
      goals[type],
    )
    setEditingGoal(null)
  }

  const fetchMonthlyData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.post(
        'http://localhost:3000/api/transactions',
        {
          ordered_at_ini: firstDayOfMonth,
          ordered_at_end: lastDayOfMonth,
        },
        {
          timeout: 30000,
          headers: {
            'X-Debug-Request': 'MonthlyDashboard',
          },
        },
      )

      // Criar mapa de dados diários
      const dailyDataMap = {} // Inicializar todos os dias do mês com zeros
      const start = new Date(firstDayOfMonth)
      const end = new Date(lastDayOfMonth)
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
      response.data.data.forEach((transaction) => {
        const fullDate = new Date(transaction.dates.created_at * 1000)
        const transactionDate = fullDate.toISOString().split('T')[0]

        const netAmount = Number(
          transaction?.calculation_details?.net_amount || 0,
        )
        const affiliateValue = Number(
          transaction?.calculation_details?.net_affiliate_value || 0,
        )

        if (dailyDataMap[transactionDate]) {
          dailyDataMap[transactionDate].net_amount += netAmount
          dailyDataMap[transactionDate].quantity += 1
          dailyDataMap[transactionDate].affiliate_value += affiliateValue
        }
      })

      // Converter para array e ordenar
      const chartData = Object.values(dailyDataMap)
        .filter(
          (day) =>
            day.net_amount > 0 || day.quantity > 0 || day.affiliate_value > 0,
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))

      // Calcular totais
      const totalNetAmount = chartData.reduce(
        (sum, day) => sum + day.net_amount,
        0,
      )
      const totalQuantity = chartData.reduce(
        (sum, day) => sum + day.quantity,
        0,
      )
      const totalAffiliateValue = chartData.reduce(
        (sum, day) => sum + day.affiliate_value,
        0,
      )

      // Atualizar estado imediatamente
      setMonthlyData({
        dailyData: chartData,
        totals: {
          total_transactions: totalQuantity,
          total_net_amount: totalNetAmount,
          total_net_affiliate_value: totalAffiliateValue,
        },
      })

      // Forçar atualização do estado de carregamento
      setLoading(false)
    } catch (error) {
      console.error('Erro na requisição:', error)
      setError(error)
      setLoading(false)
    }
  }, [firstDayOfMonth, lastDayOfMonth])

  // Buscar dados quando o componente monta
  useEffect(() => {
    fetchMonthlyData()
  }, [fetchMonthlyData])

  // Calcular progresso das metas
  const metaProgress = useMemo(() => {
    const currentAmount = monthlyData?.totals?.total_net_amount || 0
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
  }, [monthlyData, goals, calculateProgress])

  // Renderização dos dados
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-primary dark:text-secondary mb-8">
          Dashboard de Metas Mensais
        </h1>

        {/* Resumo Mensal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark">
              Valor Total de Vendas
            </h3>
            <p className="mt-2 text-3xl font-bold text-accent1 dark:text-accent2">
              {formatCurrency(monthlyData?.totals?.total_net_amount || 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark">
              Quantidade de Vendas
            </h3>
            <p className="mt-2 text-3xl font-bold text-accent3 dark:text-accent4">
              {monthlyData?.totals?.total_transactions || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark">
              Valor de Afiliações
            </h3>
            <p className="mt-2 text-3xl font-bold text-secondary dark:text-primary">
              {formatCurrency(
                monthlyData?.totals?.total_net_affiliate_value || 0,
              )}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark">
              Ticket Médio
            </h3>
            <p className="mt-2 text-3xl font-bold text-accent4 dark:text-accent3">
              {formatCurrency(
                monthlyData?.totals?.total_net_amount &&
                  monthlyData?.totals?.total_transactions
                  ? monthlyData.totals.total_net_amount /
                      monthlyData.totals.total_transactions
                  : 0,
              )}
            </p>
          </div>
        </div>

        {/* Metas e Progresso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {['meta', 'superMeta', 'ultraMeta'].map((metaType) => (
            <div
              key={metaType}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-text-light dark:text-text-dark">
                  {metaType === 'meta'
                    ? 'Meta'
                    : metaType === 'superMeta'
                    ? 'Super Meta'
                    : 'Ultra Meta'}
                </h3>
                {editingGoal !== metaType ? (
                  <button
                    onClick={() => setEditingGoal(metaType)}
                    className="text-primary dark:text-secondary hover:text-secondary dark:hover:text-primary"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    onClick={() => saveGoal(metaType)}
                    className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                  >
                    OK
                  </button>
                )}
              </div>
              {editingGoal === metaType ? (
                <input
                  type="text"
                  value={goals[metaType]}
                  onChange={(e) => handleGoalChange(metaType, e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark"
                />
              ) : (
                <p className="text-2xl font-bold text-accent1 dark:text-accent2">
                  {goals[metaType]}
                </p>
              )}
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-primary dark:bg-secondary h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(
                        metaProgress[metaType].actualProgress,
                        100,
                      )}%`,
                    }}
                  ></div>
                </div>
                <p
                  className={`text-sm mt-1 ${
                    metaProgress[metaType].difference >= 0
                      ? 'text-green-500 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {metaProgress[metaType].difference >= 0 ? '+' : ''}
                  {metaProgress[metaType].difference}%
                  {metaProgress[metaType].difference >= 0
                    ? ' adiantado'
                    : ' atrasado'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico de Barras */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">
              Vendas Diárias
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(dateStr) => new Date(dateStr).getDate()}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    stroke="#404b62"
                    tickFormatter={formatCurrency}
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
                    labelFormatter={(dateStr) =>
                      new Date(dateStr).toLocaleDateString('pt-BR')
                    }
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="net_amount"
                    name="Valor Líquido"
                    fill="#2563EB"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="quantity"
                    name="Quantidade"
                    fill="#059669"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="affiliate_value"
                    name="Valor de Afiliação"
                    fill="#F97316"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Linha */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-4">
              Progressão Mensal
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(dateStr) => new Date(dateStr).getDate()}
                  />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(dateStr) =>
                      new Date(dateStr).toLocaleDateString('pt-BR')
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="net_amount"
                    name="Valor Líquido"
                    stroke="#2563EB"
                  />
                  <Line
                    type="monotone"
                    dataKey="affiliate_value"
                    name="Valor de Afiliação"
                    stroke="#F97316"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlyDashboard
