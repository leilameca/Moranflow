import { RefreshCcw, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import logo from '../../assets/logo.png'
import { IncomeChart } from '../../components/charts/IncomeChart.jsx'
import { PaymentOverviewChart } from '../../components/charts/PaymentOverviewChart.jsx'
import { ServicesChart } from '../../components/charts/ServicesChart.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { MetricCard } from '../../components/ui/MetricCard.jsx'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { useLanguage } from '../../hooks/useLanguage.js'
import { moranApi } from '../../services/moranApi.js'
import { formatCurrency } from '../../utils/formatters.js'

export const DashboardPage = () => {
  const { copy, locale } = useLanguage()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await moranApi.getDashboard()
      setDashboard(response)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await moranApi.getDashboard()

        if (!cancelled) {
          setDashboard(response)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || 'Could not load dashboard')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    boot()

    return () => {
      cancelled = true
    }
  }, [])

  const metrics = dashboard?.metrics || {
    activeClients: 0,
    projectsInProgress: 0,
    monthIncome: 0,
    monthExpenses: 0,
    monthNetProfit: 0,
    pendingAmount: 0,
  }

  const extraMetrics =
    locale === 'es'
      ? [
          {
            key: 'monthExpenses',
            label: 'Gastos del mes',
            helper: 'Todos los gastos registrados durante el mes actual.',
          },
          {
            key: 'monthNetProfit',
            label: 'Ganancia neta',
            helper: 'Cobrado del mes menos gastos del mismo periodo.',
          },
        ]
      : [
          {
            key: 'monthExpenses',
            label: 'Expenses this month',
            helper: 'All expenses registered during the current month.',
          },
          {
            key: 'monthNetProfit',
            label: 'Net profit',
            helper: 'Collected this month minus expenses from the same period.',
          },
        ]

  const heroItems = [
    copy.dashboard.hero.snapshotItems[0],
    copy.dashboard.hero.snapshotItems[1],
    copy.dashboard.hero.snapshotItems[2],
    copy.dashboard.hero.snapshotItems[3],
  ]

  const heroValues = [
    metrics.activeClients,
    metrics.projectsInProgress,
    formatCurrency(metrics.monthIncome),
    formatCurrency(metrics.pendingAmount),
  ]

  const financialHighlights =
    locale === 'es'
      ? [
          [copy.dashboard.hero.monthCollected, metrics.monthIncome],
          ['Gastos del mes', metrics.monthExpenses],
          ['Ganancia neta', metrics.monthNetProfit],
          [copy.dashboard.hero.pendingBalance, metrics.pendingAmount],
        ]
      : [
          [copy.dashboard.hero.monthCollected, metrics.monthIncome],
          ['Expenses this month', metrics.monthExpenses],
          ['Net profit', metrics.monthNetProfit],
          [copy.dashboard.hero.pendingBalance, metrics.pendingAmount],
        ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={copy.dashboard.header.eyebrow}
        title={copy.dashboard.header.title}
        description={copy.dashboard.header.description}
        actions={
          <Button variant="subtle" className="w-full sm:w-auto" onClick={loadDashboard} disabled={loading}>
            <RefreshCcw size={16} />
            {copy.common.refresh}
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <div className="relative overflow-hidden bg-[var(--moran-ink)] px-6 py-7 text-white sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[rgba(214,164,164,0.18)] blur-3xl" />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-[126px] items-center rounded-[22px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 py-2">
                <img src={logo} alt="Moran Studio logo" className="h-full w-full object-contain" />
              </div>
              <span className="editorial-kicker !bg-[rgba(214,164,164,0.18)] !text-[#f3d7d7] before:!bg-[#f3d7d7]">
                {copy.dashboard.hero.kicker}
              </span>
            </div>
            <h2 className="font-display mt-6 max-w-xl text-4xl leading-none sm:text-5xl">
              {copy.dashboard.hero.title}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[rgba(255,255,255,0.72)] sm:text-[15px]">
              {copy.dashboard.hero.description}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {financialHighlights.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.06)] px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[rgba(255,255,255,0.58)]">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-semibold">{formatCurrency(value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[rgba(245,241,237,0.88)] px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(214,164,164,0.16)] text-[var(--moran-ink)]">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                  {copy.dashboard.hero.snapshot}
                </p>
                <p className="font-display text-3xl leading-none text-[var(--moran-ink)]">
                  {copy.dashboard.hero.snapshotTitle}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {heroItems.map((label, index) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-[rgba(15,15,15,0.06)] bg-white/80 px-4 py-4"
                >
                  <span className="text-sm text-[var(--moran-soft)]">{label}</span>
                  <span className="text-lg font-semibold text-[var(--moran-ink)]">
                    {heroValues[index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="p-5">
          <p className="rounded-2xl bg-[#f7e6e6] px-4 py-3 text-sm text-[#8d3c3c]">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {[...copy.dashboard.metrics, ...extraMetrics].map((metric, index) => {
          const value =
            metric.key === 'monthIncome' || metric.key === 'pendingAmount'
              ? formatCurrency(metrics[metric.key])
              : metric.key === 'monthExpenses' || metric.key === 'monthNetProfit'
              ? formatCurrency(metrics[metric.key])
              : metrics[metric.key]

          const accents = [
            'rgba(214, 164, 164, 0.22)',
            'rgba(107, 112, 92, 0.22)',
            'rgba(15, 15, 15, 0.12)',
            'rgba(245, 241, 237, 0.92)',
            'rgba(15, 15, 15, 0.08)',
            'rgba(107, 112, 92, 0.16)',
          ]

          return (
            <MetricCard
              key={metric.key}
              label={metric.label}
              value={value}
              accent={accents[index]}
              helper={metric.helper}
            />
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
              {copy.dashboard.sections.income}
            </p>
            <h3 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
              {copy.dashboard.sections.incomeTitle}
            </h3>
          </div>
          <IncomeChart data={dashboard?.incomeSeries || []} />
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
              {copy.dashboard.sections.paymentHealth}
            </p>
            <h3 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
              {copy.dashboard.sections.paymentHealthTitle}
            </h3>
          </div>
          <PaymentOverviewChart
            overview={
              dashboard?.paymentOverview || {
                paidProjects: 0,
                partialProjects: 0,
                pendingProjects: 0,
              }
            }
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              [copy.dashboard.sections.paid, dashboard?.paymentOverview?.paidProjects || 0, '#6B705C'],
              [copy.dashboard.sections.partial, dashboard?.paymentOverview?.partialProjects || 0, '#D6A4A4'],
              [copy.dashboard.sections.pending, dashboard?.paymentOverview?.pendingProjects || 0, '#0F0F0F'],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-2xl bg-[rgba(245,241,237,0.85)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--moran-soft)]">
                    {label}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-[var(--moran-ink)]">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
              {copy.dashboard.sections.topServices}
            </p>
            <h3 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
              {copy.dashboard.sections.topServicesTitle}
            </h3>
          </div>

          {dashboard?.topServices?.length ? (
            <ServicesChart data={dashboard.topServices} />
          ) : (
            <EmptyState
              eyebrow={copy.dashboard.sections.topServices}
              title={copy.dashboard.sections.emptyTopTitle}
              description={copy.dashboard.sections.emptyTopDescription}
            />
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
              {copy.dashboard.sections.ranking}
            </p>
            <h3 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
              {copy.dashboard.sections.rankingTitle}
            </h3>
          </div>

          <div className="space-y-3">
            {(dashboard?.topServices || []).map((service) => (
              <div
                key={service.id}
                className="rounded-[24px] border border-[rgba(15,15,15,0.06)] bg-[rgba(255,255,255,0.86)] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-[var(--moran-ink)]">{service.name}</p>
                    <p className="mt-1 text-sm text-[var(--moran-soft)]">
                      {service.totalProjects} project{service.totalProjects === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--moran-olive)]">
                    {formatCurrency(service.totalRevenue)}
                  </p>
                </div>
              </div>
            ))}

            {!dashboard?.topServices?.length ? (
              <EmptyState
                eyebrow={copy.dashboard.sections.ranking}
                title={copy.dashboard.sections.emptyRankingTitle}
                description={copy.dashboard.sections.emptyRankingDescription}
              />
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
