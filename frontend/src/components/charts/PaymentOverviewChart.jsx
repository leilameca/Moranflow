import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#6B705C', '#D6A4A4', '#0F0F0F']

export const PaymentOverviewChart = ({ overview }) => {
  const data = [
    { name: 'Paid', value: overview.paidProjects },
    { name: 'Partial', value: overview.partialProjects },
    { name: 'Pending', value: overview.pendingProjects },
  ]

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              borderRadius: 18,
              border: '1px solid rgba(15,15,15,0.08)',
              background: 'rgba(255,255,255,0.96)',
            }}
          />
          <Pie
            data={data}
            innerRadius={72}
            outerRadius={104}
            dataKey="value"
            paddingAngle={4}
            stroke="transparent"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
