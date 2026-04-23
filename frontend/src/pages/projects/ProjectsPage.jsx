import { Download, Plus, RefreshCcw, Trash2, Wallet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import logo from '../../assets/logo.png'
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
import {
  paymentMethodOptions,
  projectPriorityOptions,
  projectStatusOptions,
} from '../../utils/constants.js'
import { downloadBlob, formatCurrency, formatDate } from '../../utils/formatters.js'

const emptyProjectForm = {
  clientId: '',
  serviceId: '',
  title: '',
  description: '',
  agreedPrice: '',
  startDate: '',
  dueDate: '',
  status: 'Nuevo',
  priority: 'Media',
  notes: '',
}

const createEmptyPaymentForm = () => ({
  amount: '',
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'Transfer',
  note: '',
})

const paymentToneMap = {
  Pagado: 'paid',
  Parcial: 'partial',
  Pendiente: 'pending',
}

const statusToneMap = {
  Cancelado: 'inactive',
  Entregado: 'paid',
  Aprobado: 'active',
  Pausado: 'partial',
}

const STUDIO_CONTACT = {
  email: 'leiladev20@gmial.com',
  phone: '8092697630',
}

const formatInvoiceMoney = (value) =>
  `RD$ ${new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))}`

const formatInvoicePreviewDate = (value) => {
  if (!value) {
    return 'No especificada'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const buildInvoiceClientLines = (project) =>
  [
    project?.clientName,
    project?.businessName || 'Cliente independiente',
    project?.clientEmail,
    project?.clientPhone,
  ].filter(Boolean)

const getDefaultInvoiceDueDate = () => {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  return nextWeek.toISOString().slice(0, 10)
}

export const ProjectsPage = () => {
  const { copy, locale } = useLanguage()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [form, setForm] = useState(emptyProjectForm)
  const [paymentForm, setPaymentForm] = useState(createEmptyPaymentForm())
  const [invoiceNotes, setInvoiceNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const uiText =
    locale === 'es'
      ? {
          searchPlaceholder: 'Buscar por proyecto, cliente o servicio',
          allStatuses: 'Todos los estados',
          allPayments: 'Todos los pagos',
          results: (shown, total) => `Mostrando ${shown} de ${total} proyectos`,
          loading: 'Cargando...',
          paymentNotePlaceholder: 'Nota opcional del pago...',
        }
      : {
          searchPlaceholder: 'Search by project, client or service',
          allStatuses: 'All statuses',
          allPayments: 'All payments',
          results: (shown, total) => `Showing ${shown} of ${total} projects`,
          loading: 'Loading...',
          paymentNotePlaceholder: 'Optional payment note...',
        }

  const clientOptions = useMemo(
    () => clients.map((client) => ({ value: String(client.id), label: client.fullName })),
    [clients]
  )

  const serviceOptions = useMemo(
    () => services.map((service) => ({ value: String(service.id), label: service.name })),
    [services]
  )

  const statusOptions = useMemo(
    () =>
      projectStatusOptions.map((status) => ({
        value: status,
        label: copy.common.projectStatuses[status] || status,
      })),
    [copy.common.projectStatuses]
  )

  const priorityOptions = useMemo(
    () =>
      projectPriorityOptions.map((priority) => ({
        value: priority,
        label: copy.common.priorities[priority] || priority,
      })),
    [copy.common.priorities]
  )

  const paymentOptions = useMemo(
    () =>
      paymentMethodOptions.map((method) => ({
        value: method,
        label: copy.common.paymentMethods[method] || method,
      })),
    [copy.common.paymentMethods]
  )

  const projectFilterOptions = useMemo(
    () => [{ value: 'all', label: uiText.allStatuses }, ...statusOptions],
    [statusOptions, uiText.allStatuses]
  )

  const paymentFilterOptions = useMemo(
    () => [
      { value: 'all', label: uiText.allPayments },
      { value: 'Pendiente', label: copy.common.paymentStatuses.Pendiente },
      { value: 'Parcial', label: copy.common.paymentStatuses.Parcial },
      { value: 'Pagado', label: copy.common.paymentStatuses.Pagado },
    ],
    [copy.common.paymentStatuses, uiText.allPayments]
  )

  const translateProjectStatus = useCallback(
    (status) => copy.common.projectStatuses[status] || status,
    [copy.common.projectStatuses]
  )

  const translatePaymentStatus = useCallback(
    (status) => copy.common.paymentStatuses[status] || status,
    [copy.common.paymentStatuses]
  )

  const filteredProjects = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()

    return projects.filter((project) => {
      const matchesSearch =
        !term ||
        [project.title, project.clientName, project.serviceName, project.notes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      const matchesPayment = paymentFilter === 'all' || project.paymentStatus === paymentFilter

      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [paymentFilter, projects, searchQuery, statusFilter])

  const syncProjectForm = useCallback((project) => {
    setSelectedProject(project)
    setForm({
      clientId: String(project.clientId || ''),
      serviceId: String(project.serviceId || ''),
      title: project.title || '',
      description: project.description || '',
      agreedPrice: String(project.agreedPrice || ''),
      startDate: project.startDate || '',
      dueDate: project.dueDate || '',
      status: project.status || 'Nuevo',
      priority: project.priority || 'Media',
      notes: project.notes || '',
    })
    setInvoiceNotes(project.notes || '')
  }, [])

  const fetchReferenceData = async () =>
    Promise.all([moranApi.getClients(), moranApi.getServices(), moranApi.getProjects()])

  const loadProjects = async (focusId) => {
    const response = await moranApi.getProjects()
    setProjects(response.items)

    if (focusId && response.items.some((item) => item.id === focusId)) {
      setSelectedId(focusId)
      return
    }

    if (!response.items.length) {
      setSelectedId(null)
      setSelectedProject(null)
    }
  }

  const loadProjectDetail = useCallback(
    async (projectId) => {
      if (!projectId) {
        setSelectedProject(null)
        return
      }

      setDetailLoading(true)

      try {
        const response = await moranApi.getProject(projectId)
        syncProjectForm(response.item)
      } catch (detailError) {
        setError(detailError.response?.data?.message || copy.projects.feedback.detailError)
      } finally {
        setDetailLoading(false)
      }
    },
    [copy.projects.feedback.detailError, syncProjectForm]
  )

  const loadInitialData = async () => {
    setLoading(true)
    setError('')

    try {
      const [clientsResponse, servicesResponse, projectsResponse] = await fetchReferenceData()

      setClients(clientsResponse.items)
      setServices(servicesResponse.items)
      setProjects(projectsResponse.items)

      if (selectedId && projectsResponse.items.some((item) => item.id === selectedId)) {
        await loadProjectDetail(selectedId)
      } else if (!projectsResponse.items.length) {
        setSelectedId(null)
        setSelectedProject(null)
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || copy.projects.feedback.loadError)
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
        const [clientsResponse, servicesResponse, projectsResponse] = await fetchReferenceData()

        if (!cancelled) {
          setClients(clientsResponse.items)
          setServices(servicesResponse.items)
          setProjects(projectsResponse.items)

          if (!projectsResponse.items.length) {
            setSelectedId(null)
            setSelectedProject(null)
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || copy.projects.feedback.loadError)
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
  }, [copy.projects.feedback.loadError])

  useEffect(() => {
    let cancelled = false

    const hydrateSelectedProject = async () => {
      if (!selectedId) {
        setSelectedProject(null)
        return
      }

      if (!cancelled) {
        await loadProjectDetail(selectedId)
      }
    }

    hydrateSelectedProject()

    return () => {
      cancelled = true
    }
  }, [selectedId, loadProjectDetail])

  const handleNew = () => {
    setSelectedId(null)
    setSelectedProject(null)
    setForm(emptyProjectForm)
    setPaymentForm(createEmptyPaymentForm())
    setInvoiceNotes('')
    setFeedback('')
    setError('')
  }

  const handleProjectSelect = (project) => {
    setSelectedId(project.id)
    setFeedback('')
    setError('')
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handlePaymentChange = (event) => {
    const { name, value } = event.target
    setPaymentForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const buildProjectPayload = () => ({
    clientId: Number(form.clientId),
    serviceId: Number(form.serviceId),
    title: form.title,
    description: form.description,
    agreedPrice: Number(form.agreedPrice || 0),
    startDate: form.startDate,
    dueDate: form.dueDate,
    status: form.status,
    priority: form.priority,
    notes: form.notes,
  })

  const handleProjectSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (selectedId) {
        const response = await moranApi.updateProject(selectedId, buildProjectPayload())
        setFeedback(copy.projects.feedback.projectUpdated)
        await loadProjects(response.item.id)
        await loadProjectDetail(response.item.id)
      } else {
        const response = await moranApi.createProject(buildProjectPayload())
        setFeedback(copy.projects.feedback.projectCreated)
        await loadProjects(response.item.id)
        await loadProjectDetail(response.item.id)
      }
    } catch (submitError) {
      setError(submitError.response?.data?.message || copy.projects.feedback.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedId) {
      return
    }

    const confirmed = window.confirm(copy.projects.feedback.confirmProjectDelete)

    if (!confirmed) {
      return
    }

    try {
      await moranApi.deleteProject(selectedId)
      setFeedback(copy.projects.feedback.projectDeleted)
      setSelectedId(null)
      setSelectedProject(null)
      setForm(emptyProjectForm)
      setPaymentForm(createEmptyPaymentForm())
      setInvoiceNotes('')
      await loadProjects()
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || copy.projects.feedback.deleteError)
    }
  }

  const handlePaymentSubmit = async (event) => {
    event.preventDefault()

    if (!selectedId) {
      return
    }

    setPaymentSaving(true)
    setError('')

    try {
      await moranApi.createPayment(selectedId, {
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        note: paymentForm.note,
      })
      setFeedback(copy.projects.feedback.paymentCreated)
      setPaymentForm(createEmptyPaymentForm())
      await loadProjects(selectedId)
      await loadProjectDetail(selectedId)
    } catch (submitError) {
      setError(submitError.response?.data?.message || copy.projects.feedback.paymentSaveError)
    } finally {
      setPaymentSaving(false)
    }
  }

  const handleDeletePayment = async (paymentId) => {
    const confirmed = window.confirm(copy.projects.feedback.confirmPaymentDelete)

    if (!confirmed) {
      return
    }

    try {
      await moranApi.deletePayment(paymentId)
      setFeedback(copy.projects.feedback.paymentDeleted)
      await loadProjects(selectedId)
      await loadProjectDetail(selectedId)
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || copy.projects.feedback.paymentDeleteError)
    }
  }

  const handleCreateInvoice = async () => {
    if (!selectedId) {
      return
    }

    setInvoiceSaving(true)
    setError('')

    try {
      const response = await moranApi.createInvoice(selectedId, {
        notes: invoiceNotes,
      })
      const blob = await moranApi.downloadInvoice(response.item.id)
      downloadBlob(blob, `${response.item.invoiceNumber}.pdf`)
      setFeedback(copy.projects.feedback.invoiceCreated)
      await loadProjects(selectedId)
      await loadProjectDetail(selectedId)
    } catch (invoiceError) {
      setError(invoiceError.response?.data?.message || copy.projects.feedback.invoiceError)
    } finally {
      setInvoiceSaving(false)
    }
  }

  const handleDownloadInvoice = async (invoice) => {
    try {
      const blob = await moranApi.downloadInvoice(invoice.id)
      downloadBlob(blob, `${invoice.invoiceNumber}.pdf`)
    } catch (downloadError) {
      setError(downloadError.response?.data?.message || copy.projects.feedback.invoiceDownloadError)
    }
  }

  const selectedSummary = projects.find((project) => project.id === selectedId)

  const totals = {
    collected: projects.reduce((sum, project) => sum + Number(project.totalPaid || 0), 0),
    pending: projects.reduce((sum, project) => sum + Number(project.balance || 0), 0),
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={copy.projects.header.eyebrow}
        title={copy.projects.header.title}
        description={copy.projects.header.description}
        actions={
          <>
            <Button variant="subtle" className="w-full sm:w-auto" onClick={loadInitialData} disabled={loading}>
              <RefreshCcw size={16} />
              {copy.common.refresh}
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={handleNew}>
              <Plus size={16} />
              {copy.projects.actions.new}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
            {copy.projects.stats.totalProjects}
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--moran-ink)]">{projects.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
            {copy.projects.stats.collected}
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--moran-olive)]">
            {formatCurrency(totals.collected)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
            {copy.projects.stats.pending}
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--moran-ink)]">
            {formatCurrency(totals.pending)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
            {copy.projects.stats.references}
          </p>
          <p className="mt-3 text-lg font-semibold text-[var(--moran-ink)]">
            {clients.length} clients / {services.length} services
          </p>
        </Card>
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_400px]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {copy.projects.sections.roster}
              </p>
              <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
                {copy.projects.sections.rosterTitle}
              </h2>
            </div>

            {selectedSummary ? (
              <div className="rounded-2xl bg-[rgba(245,241,237,0.95)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
                  {copy.common.selected}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--moran-ink)]">
                  {selectedSummary.title}
                </p>
              </div>
            ) : null}
          </div>

          <TableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={uiText.searchPlaceholder}
            filters={[
              {
                key: 'status',
                label: copy.projects.table.status,
                value: statusFilter,
                onChange: setStatusFilter,
                options: projectFilterOptions,
              },
              {
                key: 'payment',
                label: copy.projects.table.payment,
                value: paymentFilter,
                onChange: setPaymentFilter,
                options: paymentFilterOptions,
              },
            ]}
            summary={uiText.results(filteredProjects.length, projects.length)}
          />

          <DataTable
            columns={[
              {
                key: 'title',
                header: copy.projects.table.project,
                render: (item) => (
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-[var(--moran-soft)]">{`${item.clientName} / ${item.serviceName}`}</p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: copy.projects.table.status,
                render: (item) => (
                  <Badge tone={statusToneMap[item.status] || 'pending'}>
                    {translateProjectStatus(item.status)}
                  </Badge>
                ),
              },
              {
                key: 'paymentStatus',
                header: copy.projects.table.payment,
                render: (item) => (
                  <Badge tone={paymentToneMap[item.paymentStatus] || 'pending'}>
                    {translatePaymentStatus(item.paymentStatus)}
                  </Badge>
                ),
              },
              {
                key: 'balance',
                header: copy.projects.table.balance,
                render: (item) => formatCurrency(item.balance),
              },
            ]}
            data={filteredProjects}
            onRowClick={handleProjectSelect}
            selectedRowId={selectedId}
            empty={
              <EmptyState
                eyebrow={copy.projects.empty.projects.eyebrow}
                title={copy.projects.empty.projects.title}
                description={copy.projects.empty.projects.description}
              />
            }
          />
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
              {copy.projects.sections.editor}
            </p>
            <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
              {selectedProject ? copy.projects.sections.editorUpdate : copy.projects.sections.editorNew}
            </h2>
          </div>

          {selectedProject ? (
            <div className="mb-5 rounded-[24px] bg-[rgba(245,241,237,0.92)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {copy.common.selected}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--moran-ink)]">
                {selectedProject.title}
              </p>
              <p className="mt-1 text-sm text-[var(--moran-soft)]">
                {`${selectedProject.clientName} / ${selectedProject.serviceName}`}
              </p>
            </div>
          ) : null}

          {!clients.length || !services.length ? (
            <NoticeBanner tone="info" className="mb-5">
              {copy.projects.helper.missingReferences}
            </NoticeBanner>
          ) : null}

          <form className="space-y-4" onSubmit={handleProjectSubmit}>
            <SelectField
              label={copy.projects.form.client}
              name="clientId"
              value={form.clientId}
              onChange={handleFormChange}
              options={clientOptions}
              placeholder={copy.common.clientPlaceholder}
            />
            <SelectField
              label={copy.projects.form.service}
              name="serviceId"
              value={form.serviceId}
              onChange={handleFormChange}
              options={serviceOptions}
              placeholder={copy.common.servicePlaceholder}
            />
            <InputField
              label={copy.projects.form.projectTitle}
              name="title"
              value={form.title}
              onChange={handleFormChange}
              placeholder="Website redesign"
            />
            <InputField
              label={copy.projects.form.agreedPrice}
              name="agreedPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.agreedPrice}
              onChange={handleFormChange}
              placeholder="1200"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label={copy.projects.form.startDate}
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleFormChange}
              />
              <InputField
                label={copy.projects.form.dueDate}
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleFormChange}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label={copy.projects.form.status}
                name="status"
                value={form.status}
                onChange={handleFormChange}
                options={statusOptions}
                placeholder={copy.common.statusPlaceholder}
              />
              <SelectField
                label={copy.projects.form.priority}
                name="priority"
                value={form.priority}
                onChange={handleFormChange}
                options={priorityOptions}
                placeholder={copy.common.priorityPlaceholder}
              />
            </div>
            <TextareaField
              label={copy.projects.form.description}
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="Scope, deliverables and working notes..."
            />
            <TextareaField
              label={copy.projects.form.notes}
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              placeholder="Extra production notes, approvals or client context..."
            />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="submit"
                className="w-full flex-1 justify-center sm:w-auto"
                disabled={saving || !clients.length || !services.length}
              >
                {saving
                  ? copy.common.saving
                  : selectedProject
                    ? copy.projects.actions.update
                    : copy.projects.actions.create}
              </Button>

              {selectedProject ? (
                <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={handleDeleteProject}>
                  <Trash2 size={16} />
                  {copy.common.delete}
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(214,164,164,0.16)] text-[var(--moran-ink)]">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {copy.projects.sections.payments}
              </p>
              <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
                {copy.projects.sections.paymentsTitle}
              </h2>
            </div>
          </div>

          {!selectedProject ? (
            <EmptyState
              eyebrow={copy.projects.empty.payments.eyebrow}
              title={copy.projects.empty.payments.title}
              description={copy.projects.empty.payments.description}
            />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] bg-[rgba(245,241,237,0.92)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
                    {copy.projects.labels.agreedTotal}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[var(--moran-ink)]">
                    {formatCurrency(selectedProject.agreedPrice)}
                  </p>
                </div>
                <div className="rounded-[24px] bg-[rgba(245,241,237,0.92)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
                    {copy.projects.labels.collected}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[var(--moran-olive)]">
                    {formatCurrency(selectedProject.totalPaid)}
                  </p>
                </div>
                <div className="rounded-[24px] bg-[rgba(245,241,237,0.92)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
                    {copy.projects.labels.balance}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[var(--moran-ink)]">
                    {formatCurrency(selectedProject.balance)}
                  </p>
                </div>
              </div>

              <form
                className="grid gap-4 rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(245,241,237,0.78)_100%)] p-5"
                onSubmit={handlePaymentSubmit}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label={copy.projects.form.paymentAmount}
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={handlePaymentChange}
                    placeholder="250"
                  />
                  <InputField
                    label={copy.projects.form.paymentDate}
                    name="paymentDate"
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={handlePaymentChange}
                  />
                </div>
                <SelectField
                  label={copy.projects.form.paymentMethod}
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentChange}
                  options={paymentOptions}
                  placeholder={copy.common.paymentMethodPlaceholder}
                />
                <TextareaField
                  label={copy.projects.form.paymentNote}
                  name="note"
                  value={paymentForm.note}
                  onChange={handlePaymentChange}
                  placeholder={uiText.paymentNotePlaceholder}
                />
                <Button
                  type="submit"
                  variant="olive"
                  className="w-full justify-center"
                  disabled={paymentSaving}
                >
                  {paymentSaving
                    ? copy.projects.actions.savingPayment
                    : copy.projects.actions.registerPayment}
                </Button>
              </form>

              <div className="space-y-3">
                {selectedProject.payments?.length ? (
                  <DataTable
                    columns={[
                      {
                        key: 'amount',
                        header: copy.projects.form.paymentAmount,
                        render: (payment) => formatCurrency(payment.amount),
                      },
                      {
                        key: 'paymentDate',
                        header: copy.projects.form.paymentDate,
                        render: (payment) =>
                          `${formatDate(payment.paymentDate)} / ${
                            copy.common.paymentMethods[payment.paymentMethod] || payment.paymentMethod
                          }`,
                      },
                      {
                        key: 'note',
                        header: copy.projects.form.paymentNote,
                        render: (payment) => payment.note || '-',
                      },
                      {
                        key: 'actions',
                        header: copy.common.delete,
                        render: (payment) => (
                          <Button
                            type="button"
                            variant="danger"
                            className="w-full sm:w-auto"
                            onClick={() => handleDeletePayment(payment.id)}
                          >
                            <Trash2 size={16} />
                            {copy.common.delete}
                          </Button>
                        ),
                      },
                    ]}
                    data={selectedProject.payments}
                  />
                ) : (
                  <EmptyState
                    eyebrow={copy.projects.empty.paymentsList.eyebrow}
                    title={copy.projects.empty.paymentsList.title}
                    description={copy.projects.empty.paymentsList.description}
                  />
                )}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {copy.projects.sections.invoices}
              </p>
              <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
                {copy.projects.sections.invoicesTitle}
              </h2>
            </div>
            {detailLoading ? <span className="text-sm text-[var(--moran-soft)]">{uiText.loading}</span> : null}
          </div>

          {!selectedProject ? (
            <EmptyState
              eyebrow={copy.projects.empty.invoices.eyebrow}
              title={copy.projects.empty.invoices.title}
              description={copy.projects.empty.invoices.description}
            />
          ) : (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-[30px] border border-[rgba(15,15,15,0.06)] bg-[#F5F1ED]">
                <div className="bg-[var(--moran-ink)] px-5 py-5 text-white">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex h-[60px] w-[96px] items-center">
                        <img src={logo} alt="Moran Studio logo" className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <p className="text-[11px] tracking-[0.35em] text-[#f1e7e2]">MORAN STUDIO</p>
                        <p className="mt-1 text-[10px] tracking-[0.22em] text-[var(--moran-olive)]">
                          DISENO, TECNOLOGIA Y SOLUCIONES
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="font-display text-4xl leading-none text-[var(--moran-blush)]">FACTURA</p>
                      <p className="mt-3 text-[11px] tracking-[0.16em] text-[var(--moran-olive)]">
                        No. MS-PREVIA
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--moran-blush)]">
                        {formatInvoicePreviewDate(new Date())}
                      </p>
                      <div className="mt-3 inline-flex">
                        <Badge tone={paymentToneMap[selectedProject.paymentStatus] || 'pending'}>
                          {selectedProject.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-[3px] bg-gradient-to-r from-[var(--moran-olive)] to-[var(--moran-blush)]" />

                <div className="space-y-6 px-5 py-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      [
                        'Facturado por',
                        ['Moran Studio', STUDIO_CONTACT.email, STUDIO_CONTACT.phone],
                      ],
                      [
                        'Facturado a',
                        buildInvoiceClientLines(selectedProject),
                      ],
                      ['Fecha de emision', [formatInvoicePreviewDate(new Date())]],
                      [
                        'Fecha limite de pago',
                        [
                          formatInvoicePreviewDate(
                            selectedProject.dueDate || getDefaultInvoiceDueDate()
                          ),
                        ],
                      ],
                    ].map(([label, lines]) => (
                      <div key={label}>
                        <p className="border-b border-[rgba(214,164,164,0.7)] pb-2 text-[10px] uppercase tracking-[0.26em] text-[var(--moran-olive)]">
                          {label}
                        </p>
                        <div className="mt-3 space-y-1 text-sm leading-7 text-[var(--moran-ink)]">
                          {lines.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-[18px] border border-[rgba(15,15,15,0.06)] bg-white">
                    <div className="hidden grid-cols-[42px_minmax(0,1fr)_56px_132px_132px] bg-[var(--moran-ink)] px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white sm:grid">
                      <span>#</span>
                      <span>Descripcion del servicio</span>
                      <span className="text-center">Cant.</span>
                      <span className="text-right">Precio unit.</span>
                      <span className="text-right">Total</span>
                    </div>
                    <div className="border-t border-[rgba(214,164,164,0.35)] px-4 py-4 text-sm text-[var(--moran-ink)]">
                      <div className="space-y-3 sm:hidden">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
                            #01
                          </span>
                          <span className="text-sm font-semibold">
                            {formatInvoiceMoney(selectedProject.agreedPrice)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{selectedProject.serviceName}</p>
                          <p className="mt-1 text-xs leading-6 text-[var(--moran-soft)]">
                            {invoiceNotes ||
                              selectedProject.description ||
                              selectedProject.notes ||
                              selectedProject.title}
                          </p>
                        </div>
                        <div className="grid gap-2 rounded-[14px] bg-[rgba(245,241,237,0.9)] px-3 py-3 text-xs sm:hidden">
                          <div className="flex items-center justify-between">
                            <span className="uppercase tracking-[0.14em] text-[var(--moran-soft)]">
                              Cant.
                            </span>
                            <span>1</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="uppercase tracking-[0.14em] text-[var(--moran-soft)]">
                              Precio unit.
                            </span>
                            <span>{formatInvoiceMoney(selectedProject.agreedPrice)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="uppercase tracking-[0.14em] text-[var(--moran-soft)]">
                              Total
                            </span>
                            <span>{formatInvoiceMoney(selectedProject.agreedPrice)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden grid-cols-[42px_minmax(0,1fr)_56px_132px_132px] items-start text-sm sm:grid">
                        <span>01</span>
                        <div>
                          <p className="font-semibold">{selectedProject.serviceName}</p>
                          <p className="mt-1 text-xs leading-6 text-[var(--moran-soft)]">
                            {invoiceNotes ||
                              selectedProject.description ||
                              selectedProject.notes ||
                              selectedProject.title}
                          </p>
                        </div>
                        <span className="text-center">1</span>
                        <span className="text-right">{formatInvoiceMoney(selectedProject.agreedPrice)}</span>
                        <span className="text-right">{formatInvoiceMoney(selectedProject.agreedPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-full max-w-[280px] space-y-3 text-sm">
                      <div className="flex items-center justify-between border-b border-[rgba(214,164,164,0.35)] pb-2">
                        <span>Subtotal</span>
                        <span>{formatInvoiceMoney(selectedProject.agreedPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[rgba(214,164,164,0.35)] pb-2">
                        <span>Descuento (0%)</span>
                        <span>--</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[rgba(214,164,164,0.35)] pb-2">
                        <span>ITBIS (0%)</span>
                        <span>No aplica</span>
                      </div>
                      <div className="flex items-center justify-between border-t-2 border-[var(--moran-olive)] pt-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-olive)]">
                          Total
                        </span>
                        <span className="text-lg font-semibold text-[var(--moran-ink)]">
                          {formatInvoiceMoney(selectedProject.agreedPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[rgba(214,164,164,0.65)] bg-white px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.26em] text-[var(--moran-olive)]">
                      Informacion de pago
                    </p>
                    <div className="mt-3 grid gap-4 text-sm leading-7 text-[var(--moran-ink)] sm:grid-cols-2">
                      <div>
                        <p>Estado: {selectedProject.paymentStatus}</p>
                        <p>Pagado a la fecha: {formatInvoiceMoney(selectedProject.totalPaid)}</p>
                        <p>Saldo pendiente: {formatInvoiceMoney(selectedProject.balance)}</p>
                      </div>
                      <div>
                        <p>Metodo: Transferencia / Efectivo</p>
                        <p>Referencia: MS-PREVIA</p>
                        <p>Contacto: {STUDIO_CONTACT.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 bg-[var(--moran-ink)] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[var(--moran-olive)]">
                    {STUDIO_CONTACT.email} | {STUDIO_CONTACT.phone}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--moran-blush)]">
                    Gracias por tu confianza
                  </p>
                </div>
              </div>

              <TextareaField
                label={copy.projects.form.invoiceNote}
                value={invoiceNotes}
                onChange={(event) => setInvoiceNotes(event.target.value)}
                placeholder={copy.projects.form.invoiceNotePlaceholder}
              />

              <Button
                variant="olive"
                className="w-full justify-center"
                onClick={handleCreateInvoice}
                disabled={invoiceSaving}
              >
                <Download size={16} />
                {invoiceSaving
                  ? copy.projects.actions.generatingInvoice
                  : copy.projects.actions.createInvoice}
              </Button>

              <div className="space-y-3">
                {selectedProject.invoices?.length ? (
                  <DataTable
                    columns={[
                      {
                        key: 'invoiceNumber',
                        header: copy.projects.labels.downloadPdf,
                      },
                      {
                        key: 'issueDate',
                        header: copy.projects.form.paymentDate,
                        render: (invoice) => formatDate(invoice.issueDate),
                      },
                      {
                        key: 'total',
                        header: copy.common.total,
                        render: (invoice) => formatCurrency(invoice.total),
                      },
                      {
                        key: 'notes',
                        header: copy.projects.form.invoiceNote,
                        render: (invoice) => invoice.notes || '-',
                      },
                      {
                        key: 'actions',
                        header: copy.projects.labels.downloadPdf,
                        render: (invoice) => (
                          <Button
                            type="button"
                            variant="subtle"
                            className="w-full sm:w-auto"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <Download size={16} />
                            {copy.projects.labels.downloadPdf}
                          </Button>
                        ),
                      },
                    ]}
                    data={selectedProject.invoices}
                  />
                ) : (
                  <EmptyState
                    eyebrow={copy.projects.empty.invoicesList.eyebrow}
                    title={copy.projects.empty.invoicesList.title}
                    description={copy.projects.empty.invoicesList.description}
                  />
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
