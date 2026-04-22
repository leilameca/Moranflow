import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { formatCurrency } from '../../utils/formatters.js'

export const ServicesChart = ({ data }) => (
  <div className="h-80 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={110}
          tick={{ fill: '#8d847d', fontSize: 12 }}
        />
        <Tooltip
          formatter={(value, key) =>
            key === 'totalRevenue' ? formatCurrency(value) : value
          }
          contentStyle={{
            borderRadius: 18,
            border: '1px solid rgba(15,15,15,0.08)',
            background: 'rgba(255,255,255,0.96)',
          }}
        />
        <Bar dataKey="totalRevenue" radius={[12, 12, 12, 12]} fill="#6B705C" />
      </BarChart>
    </ResponsiveContainer>
  </div>
)
