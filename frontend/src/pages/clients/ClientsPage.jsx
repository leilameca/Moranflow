import { Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { InputField } from '../../components/ui/InputField.jsx'
import { MobileSectionTabs } from '../../components/ui/MobileSectionTabs.jsx'
import { NoticeBanner } from '../../components/ui/NoticeBanner.jsx'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { SelectField } from '../../components/ui/SelectField.jsx'
import { TableToolbar } from '../../components/ui/TableToolbar.jsx'
import { TextareaField } from '../../components/ui/TextareaField.jsx'
import { useLanguage } from '../../hooks/useLanguage.js'
import { moranApi } from '../../services/moranApi.js'
import { formatCurrency } from '../../utils/formatters.js'

const emptyForm = {
  fullName: '',
  businessName: '',
  phone: '',
  email: '',
  instagram: '',
  notes: '',
  status: 'active',
}

export const ClientsPage = () => {
  const { copy, locale } = useLanguage()
  const [clients, setClients] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [selectedId, setSelectedId] = useState(null)
  const [mobileSection, setMobileSection] = useState('directory')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')

  const uiText =
    locale === 'es'
      ? {
          searchPlaceholder: 'Buscar por nombre, marca, correo o telefono',
          allStatuses: 'Todos los estados',
          results: (shown, total) => `Mostrando ${shown} de ${total} clientes`,
        }
      : {
          searchPlaceholder: 'Search by name, brand, email or phone',
          allStatuses: 'All statuses',
          results: (shown, total) => `Showing ${shown} of ${total} clients`,
        }

  const statusOptions = useMemo(
    () => [
      { value: 'active', label: copy.common.clientStatuses.active },
      { value: 'inactive', label: copy.common.clientStatuses.inactive },
    ],
    [copy.common.clientStatuses]
  )

  const statusFilterOptions = useMemo(
    () => [{ value: 'all', label: uiText.allStatuses }, ...statusOptions],
    [statusOptions, uiText.allStatuses]
  )

  const filteredClients = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()

    return clients.filter((client) => {
      const matchesSearch =
        !term ||
        [
          client.fullName,
          client.businessName,
          client.email,
          client.phone,
          client.instagram,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term))

      const matchesStatus = statusFilter === 'all' || client.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [clients, searchQuery, statusFilter])

  const loadClients = async (focusId) => {
    setLoading(true)
    setError('')

    try {
      const response = await moranApi.getClients()
      setClients(response.items)

      if (focusId) {
        const focused = response.items.find((item) => item.id === focusId)
        if (focused) {
          setSelectedId(focused.id)
          setForm({
            fullName: focused.fullName || '',
            businessName: focused.businessName || '',
            phone: focused.phone || '',
            email: focused.email || '',
            instagram: focused.instagram || '',
            notes: focused.notes || '',
            status: focused.status || 'active',
          })
        }
      } else if (!response.items.length) {
        setSelectedId(null)
        setForm(emptyForm)
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || copy.clients.feedback.loadError)
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
        const response = await moranApi.getClients()

        if (!cancelled) {
          setClients(response.items)

          if (!response.items.length) {
            setSelectedId(null)
            setForm(emptyForm)
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || copy.clients.feedback.loadError)
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
  }, [copy.clients.feedback.loadError])

  const handleNew = () => {
    setSelectedId(null)
    setForm(emptyForm)
    setFeedback('')
    setError('')
    setMobileSection('editor')
  }

  const handleSelect = (client) => {
    setSelectedId(client.id)
    setForm({
      fullName: client.fullName || '',
      businessName: client.businessName || '',
      phone: client.phone || '',
      email: client.email || '',
      instagram: client.instagram || '',
      notes: client.notes || '',
      status: client.status || 'active',
    })
    setFeedback('')
    setError('')
    setMobileSection('editor')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (selectedId) {
        const response = await moranApi.updateClient(selectedId, form)
        setFeedback(copy.clients.feedback.updated)
        await loadClients(response.item.id)
      } else {
        const response = await moranApi.createClient(form)
        setFeedback(copy.clients.feedback.created)
        await loadClients(response.item.id)
      }
    } catch (submitError) {
      setError(submitError.response?.data?.message || copy.clients.feedback.saveError)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) {
      return
    }

    const confirmed = window.confirm(copy.clients.feedback.confirmDelete)

    if (!confirmed) {
      return
    }

    setError('')
    setFeedback('')

    try {
      await moranApi.deleteClient(selectedId)
      setFeedback(copy.clients.feedback.deleted)
      setSelectedId(null)
      setForm(emptyForm)
      setMobileSection('directory')
      await loadClients()
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || copy.clients.feedback.deleteError)
    }
  }

  const selectedClient = clients.find((client) => client.id === selectedId)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={copy.clients.header.eyebrow}
        title={copy.clients.header.title}
        description={copy.clients.header.description}
        actions={
          <>
            <Button
              variant="subtle"
              className="w-full sm:w-auto"
              onClick={() => loadClients(selectedId)}
              disabled={loading}
            >
              <RefreshCcw size={16} />
              {copy.common.refresh}
            </Button>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={handleNew}>
              <Plus size={16} />
              {copy.clients.actions.new}
            </Button>
          </>
        }
      />

      <MobileSectionTabs
        className="sticky top-3 z-20"
        value={mobileSection}
        onChange={setMobileSection}
        tabs={[
          {
            value: 'directory',
            label: locale === 'es' ? 'Listado' : 'List',
          },
          {
            value: 'editor',
            label: locale === 'es' ? 'Editor' : 'Editor',
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_390px]">
        <Card
          className={`${mobileSection !== 'directory' ? 'hidden xl:block' : ''} p-5 sm:p-6`}
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {copy.clients.sections.directory}
              </p>
              <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
                {copy.clients.sections.listTitle}
              </h2>
            </div>
            <div className="rounded-2xl bg-[rgba(245,241,237,0.95)] px-4 py-3 text-left sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moran-soft)]">
                {copy.common.total}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--moran-ink)]">{clients.length}</p>
            </div>
          </div>

          {error ? <NoticeBanner tone="error" className="mb-5">{error}</NoticeBanner> : null}

          <TableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={uiText.searchPlaceholder}
            filters={[
              {
                key: 'status',
                label: copy.clients.table.status,
                value: statusFilter,
                onChange: setStatusFilter,
                options: statusFilterOptions,
              },
            ]}
            summary={uiText.results(filteredClients.length, clients.length)}
          />

          <DataTable
            columns={[
              {
                key: 'fullName',
                header: copy.clients.table.client,
                render: (item) => (
                  <div>
                    <p className="font-semibold">{item.fullName}</p>
                    <p className="mt-1 text-xs text-[var(--moran-soft)]">
                      {item.businessName || copy.clients.table.independent}
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: copy.clients.table.status,
                render: (item) => (
                  <Badge tone={item.status === 'active' ? 'active' : 'inactive'}>
                    {copy.common.clientStatuses[item.status]}
                  </Badge>
                ),
              },
              {
                key: 'totalProjects',
                header: copy.clients.table.projects,
              },
              {
                key: 'projectedRevenue',
                header: copy.clients.table.revenue,
                render: (item) => formatCurrency(item.projectedRevenue),
              },
            ]}
            data={filteredClients}
            onRowClick={handleSelect}
            selectedRowId={selectedId}
            empty={
              <EmptyState
                eyebrow={copy.clients.empty.eyebrow}
                title={copy.clients.empty.title}
                description={copy.clients.empty.description}
              />
            }
          />
        </Card>

        <Card
          className={`${mobileSection !== 'editor' ? 'hidden xl:block' : ''} p-5 sm:p-6`}
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {copy.clients.sections.editor}
              </p>
              <h2 className="font-display mt-2 text-3xl text-[var(--moran-ink)] sm:text-4xl">
                {selectedClient ? copy.clients.sections.editorUpdate : copy.clients.sections.editorNew}
              </h2>
            </div>
          </div>

          {selectedClient ? (
            <div className="mb-5 rounded-[24px] bg-[rgba(245,241,237,0.92)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                {copy.common.selected}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--moran-ink)]">
                {selectedClient.fullName}
              </p>
              <p className="mt-1 text-sm text-[var(--moran-soft)]">
                {selectedClient.businessName || copy.clients.table.independent}
              </p>
            </div>
          ) : null}

          {feedback ? <NoticeBanner tone="success" className="mb-5">{feedback}</NoticeBanner> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <InputField
              label={copy.clients.form.fullName}
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Ana Moran"
            />
            <InputField
              label={copy.clients.form.businessName}
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              placeholder="Moran Studio"
            />
            <InputField
              label={copy.clients.form.phone}
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+591 ..."
            />
            <InputField
              label={copy.clients.form.email}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="hello@client.com"
            />
            <InputField
              label={copy.clients.form.instagram}
              name="instagram"
              value={form.instagram}
              onChange={handleChange}
              placeholder="@clientbrand"
            />
            <SelectField
              label={copy.clients.form.status}
              name="status"
              value={form.status}
              onChange={handleChange}
              options={statusOptions}
              placeholder={copy.common.statusPlaceholder}
            />
            <TextareaField
              label={copy.clients.form.notes}
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder={copy.clients.form.notesPlaceholder}
            />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" className="w-full flex-1 justify-center sm:w-auto" disabled={saving}>
                {saving
                  ? copy.common.saving
                  : selectedClient
                    ? copy.clients.actions.update
                    : copy.clients.actions.create}
              </Button>

              {selectedClient ? (
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
