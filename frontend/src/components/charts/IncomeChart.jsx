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
          formatter={(value) => formatCurrency(value)}
          labelStyle={{ color: '#0f0f0f', fontWeight: 600 }}
          contentStyle={{
            borderRadius: 18,
            border: '1px solid rgba(15,15,15,0.08)',
            background: 'rgba(255,255,255,0.96)',
          }}
        />
        <Area type="monotone" dataKey="income" stroke="#0F0F0F" strokeWidth={2.5} fill="url(#incomeGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
)
