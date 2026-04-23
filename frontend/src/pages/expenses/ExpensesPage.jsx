import { Plus, RefreshCcw, Trash2, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { InputField } from '../../components/ui/InputField.jsx'
import { NoticeBanner } from '../../components/ui/NoticeBanner.jsx'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { SelectField } from '../../components/ui/SelectField.jsx'
import { TableToolbar } from '../../components/ui/TableToolbar.jsx'
import { TextareaField } from '../../components/ui/TextareaField.jsx'
import { useLanguage } from '../../hooks/useLanguage.js'
import { moranApi } from '../../services/moranApi.js'
import { formatCurrency, formatDate } from '../../utils/formatters.js'

const createEmptyForm = () => ({
  scope: 'fixed',
  projectId: '',
  title: '',
  category: '',
  amount: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  vendor: '',
  note: '',
})

const scopeToneMap = {
  fixed: 'pending',
  project: 'partial',
}

export const ExpensesPage = () => {
  const { locale, copy } = useLanguage()
  const [expenses, setExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [form, setForm] = useState(createEmptyForm())
  const [selectedId, setSelectedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const uiText =
    locale === 'es'
      ? {
          header: {
            eyebrow: 'Finanzas del estudio',
            title: 'Gastos y utilidad',
            description:
              'Registra gastos fijos del negocio y costos por proyecto para ver una rentabilidad mucho mas clara.',
          },
          actions: {
            new: 'Nuevo gasto',
            create: 'Registrar gasto',
            update: 'Actualizar gasto',
          },
          sections: {
            ledger: 'Registro financiero',
            ledgerTitle: 'Movimientos de gasto',
            editor: 'Editor de gasto',
            editorNew: 'Nuevo gasto',
            editorUpdate: 'Actualizar gasto',
            profitability: 'Rentabilidad',
            profitabilityTitle: 'Ganancia por proyecto',
          },
          stats: {
            fixedMonth: 'Gastos fijos del mes',
            projectMonth: 'Gastos por proyecto del mes',
            totalMonth: 'Gastos del mes',
            netMonth: 'Ganancia neta del mes',
          },
          table: {
            concept: 'Concepto',
            scope: 'Tipo',
            date: 'Fecha',
            amount: 'Monto',
            details: 'Detalle',
            project: 'Proyecto',
            expectedProfit: 'Ganancia esperada',
            collectedProfit: 'Ganancia cobrada',
          },
          form: {
            scope: 'Tipo de gasto',
            project: 'Proyecto asociado',
            title: 'Concepto',
            category: 'Categoria',
            amount: 'Monto',
            expenseDate: 'Fecha del gasto',
            vendor: 'Proveedor o suscripcion',
            note: 'Nota',
            projectHint: 'Solo se muestra cuando el gasto pertenece a un proyecto.',
          },
          scope: {
            all: 'Todos los tipos',
            fixed: 'Fijo',
            project: 'Proyecto',
          },
          helpers: {
            searchPlaceholder: 'Buscar por concepto, proyecto, categoria o proveedor',
            allProjects: 'Todos los proyectos',
            results: (shown, total) => `Mostrando ${shown} de ${total} gastos`,
            noProjectsForScope:
              'Agrega al menos un proyecto antes de registrar gastos ligados a trabajos especificos.',
          },
          feedback: {
            created: 'Gasto registrado correctamente.',
            updated: 'Gasto actualizado correctamente.',
            deleted: 'Gasto eliminado correctamente.',
            loadError: 'No se pudieron cargar los gastos',
            saveError: 'No se pudo guardar el gasto',
            deleteError: 'No se pudo eliminar el gasto',
            confirmDelete: 'Eliminar este gasto?',
          },
          empty: {
            expenses: {
              eyebrow: 'Finanzas ordenadas',
              title: 'Aun no hay gastos registrados',
              description:
                'Empieza con tus suscripciones, herramientas o costos de proyecto para medir utilidad real.',
            },
            profitability: {
              eyebrow: 'Rentabilidad pendiente',
              title: 'Todavia no hay datos suficientes',
              description:
                'Cuando registres proyectos, pagos y gastos veras aqui la utilidad limpia de cada trabajo.',
            },
          },
        }
      : {
          header: {
            eyebrow: 'Studio finances',
            title: 'Expenses and profit',
            description:
              'Track fixed business costs and per-project expenses so your profit view becomes much clearer.',
          },
          actions: {
            new: 'New expense',
            create: 'Create expense',
            update: 'Update expense',
          },
          sections: {
            ledger: 'Financial ledger',
            ledgerTitle: 'Expense log',
            editor: 'Expense editor',
            editorNew: 'New expense',
            editorUpdate: 'Update expense',
            profitability: 'Profitability',
            profitabilityTitle: 'Project profit',
          },
          stats: {
            fixedMonth: 'Fixed expenses this month',
            projectMonth: 'Project expenses this month',
            totalMonth: 'Expenses this month',
            netMonth: 'Net profit this month',
          },
          table: {
            concept: 'Concept',
            scope: 'Type',
            date: 'Date',
            amount: 'Amount',
            details: 'Details',
            project: 'Project',
            expectedProfit: 'Expected profit',
            collectedProfit: 'Collected profit',
          },
          form: {
            scope: 'Expense type',
            project: 'Linked project',
            title: 'Concept',
            category: 'Category',
            amount: 'Amount',
            expenseDate: 'Expense date',
            vendor: 'Vendor or subscription',
            note: 'Note',
            projectHint: 'This only appears when the expense belongs to a project.',
          },
          scope: {
            all: 'All types',
            fixed: 'Fixed',
            project: 'Project',
          },
          helpers: {
            searchPlaceholder: 'Search by concept, project, category or vendor',
            allProjects: 'All projects',
            results: (shown, total) => `Showing ${shown} of ${total} expenses`,
            noProjectsForScope:
              'Add at least one project before registering expenses tied to a specific job.',
          },
          feedback: {
            created: 'Expense created successfully.',
            updated: 'Expense updated successfully.',
            deleted: 'Expense deleted successfully.',
            loadError: 'Could not load expenses',
            saveError: 'Could not save expense',
            deleteError: 'Could not delete expense',
            confirmDelete: 'Delete this expense?',
          },
          empty: {
            expenses: {
              eyebrow: 'Organized finances',
              title: 'No expenses registered yet',
              description:
                'Start with subscriptions, tools or project costs so you can measure real profitability.',
            },
            profitability: {
              eyebrow: 'Profitability pending',
              title: 'Not enough data yet',
              description:
                'As soon as you register projects, payments and expenses, each project will show its clean profit here.',
            },
          },
        }

  const scopeOptions = useMemo(
    () => [
      { value: 'fixed', label: uiText.scope.fixed },
      { value: 'project', label: uiText.scope.project },
    ],
    [uiText.scope.fixed, uiText.scope.project]
  )

  const scopeFilterOptions = useMemo(
    () => [{ value: 'all', label: uiText.scope.all }, ...scopeOptions],
    [scopeOptions, uiText.scope.all]
  )

  const projectOptions = useMemo(
    () => projects.map((project) => ({ value: String(project.id), label: project.title })),
    [projects]
  )

  const projectFilterOptions = useMemo(
    () => [{ value: 'all', label: uiText.helpers.allProjects }, ...projectOptions],
    [projectOptions, uiText.helpers.allProjects]
  )

  const filteredExpenses = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()

    return expenses.filter((expense) => {
      const matchesSearch =
        !term ||
        [
          expense.title,
          expense.projectTitle,
          expense.clientName,
          expense.category,
          expense.vendor,
          expense.note,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))

      const matchesScope = scopeFilter === 'all' || expense.scope === scopeFilter
      const matchesProject =
        projectFilter === 'all' || String(expense.projectId || '') === projectFilter

      return matchesSearch && matchesScope && matchesProject
    })
  }, [expenses, projectFilter, scopeFilter, searchQuery])

  const monthKey = new Date().toISOString().slice(0, 7)
  const monthlyExpenses = expenses.filter((expense) => expense.expenseDate?.startsWith(monthKey))

  const summary = {
    fixedMonth: monthlyExpenses
      .filter((expense) => expense.scope === 'fixed')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    projectMonth: monthlyExpenses
      .filter((expense) => expense.scope === 'project')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    totalMonth: Number(dashboard?.metrics?.monthExpenses || 0),
    netMonth: Number(dashboard?.metrics?.monthNetProfit || 0),
  }

  const profitabilityRows = useMemo(
    () =>
      [...projects]
        .filter(
          (project) =>
            Number(project.agreedPrice || 0) > 0 ||
            Number(project.totalExpenses || 0) > 0 ||
            Number(project.totalPaid || 0) > 0
        )
        .sort(
          (left, right) =>
            Number(right.collectedProfit || 0) - Number(left.collectedProfit || 0) ||
            Number(right.expectedProfit || 0) - Number(left.expectedProfit || 0)
        ),
    [projects]
  )

  const loadData = async (focusId) => {
    setLoading(true)
    setError('')

    try {
      const [expensesResponse, projectsResponse, dashboardResponse] = await Promise.all([
        moranApi.getExpenses(),
        moranApi.getProjects(),
        moranApi.getDashboard(),
      ])

      setExpenses(expensesResponse.items)
      setProjects(projectsResponse.items)
      setDashboard(dashboardResponse)

      if (focusId) {
        const focused = expensesResponse.items.find((item) => item.id === focusId)

        if (focused) {
          setSelectedId(focused.id)
          setForm({
            scope: focused.scope || 'fixed',
            projectId: focused.projectId ? String(focused.projectId) : '',
            title: focused.title || '',
            category: focused.category || '',
            amount: String(focused.amount || ''),
            expenseDate: focused.expenseDate || new Date().toISOString().slice(0, 10),
            vendor: focused.vendor || '',
            note: focused.note || '',
          })
        }
      } else if (!expensesResponse.items.length) {
        setSelectedId(null)
        setForm(createEmptyForm())
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || uiText.feedback.loadError)
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
        const [expensesResponse, projectsResponse, dashboardResponse] = await Promise.all([
          moranApi.getExpenses(),
          moranApi.getProjects(),
          moranApi.getDashboard(),
        ])

        if (!cancelled) {
          setExpenses(expensesResponse.items)
          setProjects(projectsResponse.items)
          setDashboard(dashboardResponse)

          if (!expensesResponse.items.length) {
            setSelectedId(null)
            setForm(createEmptyForm())
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || uiText.feedback.loadError)
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
  }, [uiText.feedback.loadError])

  const handleNew = () => {
    setSelectedId(null)
    setForm(createEmptyForm())
    setFeedback('')
    setError('')
  }

  const handleSelect = (expense) => {
    setSelectedId(expense.id)
    setForm({
      scope: expense.scope || 'fixed',
      projectId: expense.projectId ? String(expense.projectId) : '',
      title: expense.title || '',
      category: expense.category || '',
      amount: String(expense.amount || ''),
      expenseDate: expense.expenseDate || new Date().toISOString().slice(0, 10),
      vendor: expense.vendor || '',
      note: expense.note || '',
    })
    setFeedback('')
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'scope' && value === 'fixed' ? { projectId: '' } : {}),
    }))
  }

  const buildPayload = () => ({
    scope: form.scope,
    projectId: form.scope === 'project' ? Number(form.projectId) : null,
    title: form.title,
    category: form.category,
    amount: Number(form.amount || 0),
    expenseDate: form.expenseDate,
    vendor: form.vendor,
    note: form.note,
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (selectedId) {
        const response = await moranApi.updateExpense(selectedId, buildPayload())
        setFeedback(uiText.feedback.updated)
        await loadData(response.item.id)
      } else {
        const response = await moranApi.createExpense(buildPayload())
        setFeedback(uiText.feedback.created)
        await loadData(response.item.id)
      }
    } catch (submitError) {
      setError(submitError.response?.data?.message || uiText.feedback.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) {
      return
    }

    const confirmed = window.confirm(uiText.feedback.confirmDelete)

    if (!confirmed) {
      return
    }

    setError('')
    setFeedback('')

    try {
      await moranApi.deleteExpense(selectedId)
      setFeedback(uiText.feedback.deleted)
      setSelectedId(null)
      setForm(createEmptyForm())
      await loadData()
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || uiText.feedback.deleteError)
    }
  }

  const selectedExpense = expenses.find((expense) => expense.id === selectedId)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={uiText.header.eyebrow}
        title={uiText.header.title}
        description={uiText.header.description}
        actions={
          <>
            <Button
              variant="subtle"
              className="w-full sm:w-auto"
              onClick={() => loadData(selectedId)}
              disabled={loading}
            >
              <RefreshCcw size={16} />
              {copy.common.refresh}
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={handleNew}>
              <Plus size={16} />
              {uiText.actions.new}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [uiText.stats.fixedMonth, summary.fixedMonth, 'text-[var(--moran-ink)]'],
          [uiText.stats.projectMonth, summary.projectMonth, 'text-[var(--moran-olive)]'],
          [uiText.stats.totalMonth, summary.totalMonth, 'text-[var(--moran-ink)]'],
          [uiText.stats.netMonth, summary.netMonth, summary.netMonth >= 0 ? 'text-[var(--moran-olive)]' : 'text-[#8d3c3c]'],
        ].map(([label, value, tone]) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
              {label}
            </p>
            <p className={`mt-3 text-3xl font-semibold ${tone}`}>{formatCurrency(value)}</p>
          </Card>
        ))}
      </div>

      {error ? (
        <Card className="p-5">
          <NoticeBanner tone="error">{error}</NoticeBanner>
        </Card>
      ) : null}

      {feedback ? (
        <Card className="p-5">
          <NoticeBanner tone="success">{feedback}</NoticeBanner>
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_390px]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {uiText.sections.ledger}
              </p>
              <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
                {uiText.sections.ledgerTitle}
              </h2>
            </div>
            <div className="rounded-2xl bg-[rgba(245,241,237,0.95)] px-4 py-3 text-left sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
                {copy.common.total}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--moran-ink)]">
                {expenses.length}
              </p>
            </div>
          </div>

          <TableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={uiText.helpers.searchPlaceholder}
            filters={[
              {
                key: 'scope',
                label: uiText.table.scope,
                value: scopeFilter,
                onChange: setScopeFilter,
                options: scopeFilterOptions,
              },
              {
                key: 'project',
                label: uiText.table.project,
                value: projectFilter,
                onChange: setProjectFilter,
                options: projectFilterOptions,
              },
            ]}
            summary={uiText.helpers.results(filteredExpenses.length, expenses.length)}
          />

          <DataTable
            columns={[
              {
                key: 'title',
                header: uiText.table.concept,
                render: (expense) => (
                  <div>
                    <p className="font-semibold">{expense.title}</p>
                    <p className="mt-1 text-xs text-[var(--moran-soft)]">
                      {expense.projectTitle || expense.vendor || '-'}
                    </p>
                  </div>
                ),
              },
              {
                key: 'scope',
                header: uiText.table.scope,
                render: (expense) => (
                  <Badge tone={scopeToneMap[expense.scope] || 'pending'}>
                    {expense.scope === 'project' ? uiText.scope.project : uiText.scope.fixed}
                  </Badge>
                ),
              },
              {
                key: 'expenseDate',
                header: uiText.table.date,
                render: (expense) => formatDate(expense.expenseDate),
              },
              {
                key: 'amount',
                header: uiText.table.amount,
                render: (expense) => formatCurrency(expense.amount),
              },
              {
                key: 'details',
                header: uiText.table.details,
                render: (expense) => expense.category || expense.note || '-',
              },
            ]}
            data={filteredExpenses}
            onRowClick={handleSelect}
            selectedRowId={selectedId}
            empty={
              <EmptyState
                eyebrow={uiText.empty.expenses.eyebrow}
                title={uiText.empty.expenses.title}
                description={uiText.empty.expenses.description}
              />
            }
          />
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
              {uiText.sections.editor}
            </p>
            <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
              {selectedExpense ? uiText.sections.editorUpdate : uiText.sections.editorNew}
            </h2>
          </div>

          {selectedExpense ? (
            <div className="mb-5 rounded-[24px] bg-[rgba(245,241,237,0.92)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {copy.common.selected}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--moran-ink)]">
                {selectedExpense.title}
              </p>
              <p className="mt-1 text-sm text-[var(--moran-soft)]">
                {selectedExpense.projectTitle || selectedExpense.vendor || uiText.scope.fixed}
              </p>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <SelectField
              label={uiText.form.scope}
              name="scope"
              value={form.scope}
              onChange={handleChange}
              options={scopeOptions}
              placeholder={uiText.form.scope}
            />

            {form.scope === 'project' ? (
              <SelectField
                label={uiText.form.project}
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                options={projectOptions}
                placeholder={uiText.form.project}
              />
            ) : null}

            {form.scope === 'project' && !projects.length ? (
              <NoticeBanner tone="info">{uiText.helpers.noProjectsForScope}</NoticeBanner>
            ) : null}

            <InputField
              label={uiText.form.title}
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder={locale === 'es' ? 'Suscripcion a Figma' : 'Figma subscription'}
            />
            <InputField
              label={uiText.form.category}
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder={locale === 'es' ? 'Software, hosting, transporte...' : 'Software, hosting, transport...'}
            />
            <InputField
              label={uiText.form.amount}
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="45"
            />
            <InputField
              label={uiText.form.expenseDate}
              name="expenseDate"
              type="date"
              value={form.expenseDate}
              onChange={handleChange}
            />
            <InputField
              label={uiText.form.vendor}
              name="vendor"
              value={form.vendor}
              onChange={handleChange}
              placeholder={locale === 'es' ? 'Proveedor o referencia' : 'Vendor or reference'}
            />
            <TextareaField
              label={uiText.form.note}
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder={uiText.form.projectHint}
            />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="submit"
                className="w-full flex-1 justify-center sm:w-auto"
                disabled={saving || (form.scope === 'project' && !projects.length)}
              >
                {saving
                  ? copy.common.saving
                  : selectedExpense
                    ? uiText.actions.update
                    : uiText.actions.create}
              </Button>

              {selectedExpense ? (
                <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={handleDelete}>
                  <Trash2 size={16} />
                  {copy.common.delete}
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(214,164,164,0.16)] text-[var(--moran-ink)]">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
              {uiText.sections.profitability}
            </p>
            <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
              {uiText.sections.profitabilityTitle}
            </h2>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: 'title',
              header: uiText.table.project,
              render: (project) => (
                <div>
                  <p className="font-semibold">{project.title}</p>
                  <p className="mt-1 text-xs text-[var(--moran-soft)]">
                    {project.clientName} / {project.serviceName}
                  </p>
                </div>
              ),
            },
            {
              key: 'totalExpenses',
              header: uiText.table.amount,
              render: (project) => formatCurrency(project.totalExpenses),
            },
            {
              key: 'expectedProfit',
              header: uiText.table.expectedProfit,
              render: (project) => formatCurrency(project.expectedProfit),
            },
            {
              key: 'collectedProfit',
              header: uiText.table.collectedProfit,
              render: (project) => formatCurrency(project.collectedProfit),
            },
          ]}
          data={profitabilityRows}
          empty={
            <EmptyState
              eyebrow={uiText.empty.profitability.eyebrow}
              title={uiText.empty.profitability.title}
              description={uiText.empty.profitability.description}
            />
          }
        />
      </Card>
    </div>
  )
}
