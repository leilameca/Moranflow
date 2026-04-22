import { Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { InputField } from '../../components/ui/InputField.jsx'
import { NoticeBanner } from '../../components/ui/NoticeBanner.jsx'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { TableToolbar } from '../../components/ui/TableToolbar.jsx'
import { TextareaField } from '../../components/ui/TextareaField.jsx'
import { useLanguage } from '../../hooks/useLanguage.js'
import { moranApi } from '../../services/moranApi.js'
import { formatCurrency } from '../../utils/formatters.js'

const emptyForm = {
  name: '',
  category: '',
  basePrice: '',
  description: '',
  isActive: true,
}

export const ServicesPage = () => {
  const { copy, locale } = useLanguage()
  const [services, setServices] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [selectedId, setSelectedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activityFilter, setActivityFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const uiText =
    locale === 'es'
      ? {
          searchPlaceholder: 'Buscar por nombre, categoria o descripcion',
          allStatuses: 'Todos los estados',
          results: (shown, total) => `Mostrando ${shown} de ${total} servicios`,
        }
      : {
          searchPlaceholder: 'Search by name, category or description',
          allStatuses: 'All statuses',
          results: (shown, total) => `Showing ${shown} of ${total} services`,
        }

  const activityFilterOptions = useMemo(
    () => [
      { value: 'all', label: uiText.allStatuses },
      { value: 'active', label: copy.common.clientStatuses.active },
      { value: 'inactive', label: copy.common.clientStatuses.inactive },
    ],
    [copy.common.clientStatuses, uiText.allStatuses]
  )

  const filteredServices = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()

    return services.filter((service) => {
      const matchesSearch =
        !term ||
        [service.name, service.category, service.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))

      const matchesStatus =
        activityFilter === 'all' ||
        (activityFilter === 'active' ? service.isActive : !service.isActive)

      return matchesSearch && matchesStatus
    })
  }, [activityFilter, searchQuery, services])

  const loadServices = async (focusId) => {
    setLoading(true)
    setError('')

    try {
      const response = await moranApi.getServices()
      setServices(response.items)

      if (focusId) {
        const focused = response.items.find((item) => item.id === focusId)
        if (focused) {
          setSelectedId(focused.id)
          setForm({
            name: focused.name || '',
            category: focused.category || '',
            basePrice:
              focused.basePrice === null || focused.basePrice === undefined
                ? ''
                : String(focused.basePrice),
            description: focused.description || '',
            isActive: Boolean(focused.isActive),
          })
        }
      } else if (!response.items.length) {
        setSelectedId(null)
        setForm(emptyForm)
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || copy.services.feedback.loadError)
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
        const response = await moranApi.getServices()

        if (!cancelled) {
          setServices(response.items)

          if (!response.items.length) {
            setSelectedId(null)
            setForm(emptyForm)
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || copy.services.feedback.loadError)
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
  }, [copy.services.feedback.loadError])

  const handleSelect = (service) => {
    setSelectedId(service.id)
    setForm({
      name: service.name || '',
      category: service.category || '',
      basePrice:
        service.basePrice === null || service.basePrice === undefined
          ? ''
          : String(service.basePrice),
      description: service.description || '',
      isActive: Boolean(service.isActive),
    })
    setFeedback('')
    setError('')
  }

  const handleNew = () => {
    setSelectedId(null)
    setForm(emptyForm)
    setFeedback('')
    setError('')
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const payload = {
    name: form.name,
    category: form.category,
    basePrice: form.basePrice === '' ? null : Number(form.basePrice),
    description: form.description,
    isActive: form.isActive,
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (selectedId) {
        const response = await moranApi.updateService(selectedId, payload)
        setFeedback(copy.services.feedback.updated)
        await loadServices(response.item.id)
      } else {
        const response = await moranApi.createService(payload)
        setFeedback(copy.services.feedback.created)
        await loadServices(response.item.id)
      }
    } catch (submitError) {
      setError(submitError.response?.data?.message || copy.services.feedback.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) {
      return
    }

    const confirmed = window.confirm(copy.services.feedback.confirmDelete)

    if (!confirmed) {
      return
    }

    try {
      await moranApi.deleteService(selectedId)
      setFeedback(copy.services.feedback.deleted)
      setSelectedId(null)
      setForm(emptyForm)
      await loadServices()
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || copy.services.feedback.deleteError)
    }
  }

  const selectedService = services.find((service) => service.id === selectedId)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={copy.services.header.eyebrow}
        title={copy.services.header.title}
        description={copy.services.header.description}
        actions={
          <>
            <Button
              variant="subtle"
              className="w-full sm:w-auto"
              onClick={() => loadServices(selectedId)}
              disabled={loading}
            >
              <RefreshCcw size={16} />
              {copy.common.refresh}
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={handleNew}>
              <Plus size={16} />
              {copy.services.actions.new}
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_390px]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {copy.services.sections.list}
              </p>
              <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
                {copy.services.sections.listTitle}
              </h2>
            </div>
            <div className="rounded-2xl bg-[rgba(245,241,237,0.95)] px-4 py-3 text-left sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
                {copy.common.total}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--moran-ink)]">{services.length}</p>
            </div>
          </div>

          {error ? <NoticeBanner tone="error" className="mb-5">{error}</NoticeBanner> : null}

          <TableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={uiText.searchPlaceholder}
            filters={[
              {
                key: 'activity',
                label: copy.services.table.status,
                value: activityFilter,
                onChange: setActivityFilter,
                options: activityFilterOptions,
              },
            ]}
            summary={uiText.results(filteredServices.length, services.length)}
          />

          <DataTable
            columns={[
              {
                key: 'name',
                header: copy.services.table.service,
                render: (item) => (
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs text-[var(--moran-soft)]">
                      {item.category || copy.services.table.categoryFallback}
                    </p>
                  </div>
                ),
              },
              {
                key: 'isActive',
                header: copy.services.table.status,
                render: (item) => (
                  <Badge tone={item.isActive ? 'active' : 'inactive'}>
                    {item.isActive
                      ? copy.common.clientStatuses.active
                      : copy.common.clientStatuses.inactive}
                  </Badge>
                ),
              },
              {
                key: 'totalProjects',
                header: copy.services.table.projects,
              },
              {
                key: 'basePrice',
                header: copy.services.table.basePrice,
                render: (item) => (item.basePrice ? formatCurrency(item.basePrice) : '-'),
              },
            ]}
            data={filteredServices}
            onRowClick={handleSelect}
            selectedRowId={selectedId}
            empty={
              <EmptyState
                eyebrow={copy.services.empty.eyebrow}
                title={copy.services.empty.title}
                description={copy.services.empty.description}
              />
            }
          />
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
              {copy.services.sections.editor}
            </p>
            <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
              {selectedService
                ? copy.services.sections.editorUpdate
                : copy.services.sections.editorNew}
            </h2>
          </div>

          {selectedService ? (
            <div className="mb-5 rounded-[24px] bg-[rgba(245,241,237,0.92)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {copy.common.selected}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--moran-ink)]">
                {selectedService.name}
              </p>
              <p className="mt-1 text-sm text-[var(--moran-soft)]">
                {selectedService.category || copy.services.table.categoryFallback}
              </p>
            </div>
          ) : null}

          {feedback ? <NoticeBanner tone="success" className="mb-5">{feedback}</NoticeBanner> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <InputField
              label={copy.services.form.name}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Branding package"
            />
            <InputField
              label={copy.services.form.category}
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Design, development, consulting..."
            />
            <InputField
              label={copy.services.form.basePrice}
              name="basePrice"
              type="number"
              min="0"
              step="0.01"
              value={form.basePrice}
              onChange={handleChange}
              placeholder="350"
            />
            <TextareaField
              label={copy.services.form.description}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={copy.services.form.descriptionPlaceholder}
            />

            <label className="flex items-center gap-3 rounded-2xl bg-[rgba(245,241,237,0.9)] px-4 py-3 text-sm text-[var(--moran-ink)]">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-[rgba(15,15,15,0.2)] text-[var(--moran-olive)]"
              />
              {copy.services.form.keepActive}
            </label>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" className="w-full flex-1 justify-center sm:w-auto" disabled={saving}>
                {saving
                  ? copy.common.saving
                  : selectedService
                    ? copy.services.actions.update
                    : copy.services.actions.create}
              </Button>

              {selectedService ? (
                <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={handleDelete}>
                  <Trash2 size={16} />
                  {copy.common.delete}
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
