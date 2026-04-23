import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatCurrency } from '../../utils/formatters.js'

export const IncomeChart = ({ data }) => (
  <div className="h-80 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#D6A4A4" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#D6A4A4" stopOpacity={0.12} />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0F0F0F" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#0F0F0F" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(15,15,15,0.06)" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#8d847d', fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#8d847d', fontSize: 12 }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          formatter={(value, name) => [
            formatCurrency(value),
            {
              income: 'Income',
              expenses: 'Expenses',
              netProfit: 'Net profit',
            }[name] || name,
          ]}
          labelStyle={{ color: '#0f0f0f', fontWeight: 600 }}
          contentStyle={{
            borderRadius: 18,
            border: '1px solid rgba(15,15,15,0.08)',
            background: 'rgba(255,255,255,0.96)',
          }}
        />
        <Area type="monotone" dataKey="income" stroke="#D6A4A4" strokeWidth={2.5} fill="url(#incomeGradient)" />
        <Area type="monotone" dataKey="expenses" stroke="#0F0F0F" strokeWidth={2} fill="url(#expenseGradient)" />
        <Area type="monotone" dataKey="netProfit" stroke="#6B705C" strokeWidth={2.4} fillOpacity={0} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
)
