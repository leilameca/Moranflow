import { api } from './api.js'

export const moranApi = {
  async login(payload) {
    const { data } = await api.post('/auth/login', payload)
    return data
  },

  async getProfile() {
    const { data } = await api.get('/auth/me')
    return data
  },

  async getDashboard() {
    const { data } = await api.get('/dashboard')
    return data
  },

  async getClients() {
    const { data } = await api.get('/clients')
    return data
  },

  async createClient(payload) {
    const { data } = await api.post('/clients', payload)
    return data
  },

  async updateClient(id, payload) {
    const { data } = await api.put(`/clients/${id}`, payload)
    return data
  },

  async deleteClient(id) {
    await api.delete(`/clients/${id}`)
  },

  async getServices() {
    const { data } = await api.get('/services')
    return data
  },

  async createService(payload) {
    const { data } = await api.post('/services', payload)
    return data
  },

  async updateService(id, payload) {
    const { data } = await api.put(`/services/${id}`, payload)
    return data
  },

  async deleteService(id) {
    await api.delete(`/services/${id}`)
  },

  async getProjects() {
    const { data } = await api.get('/projects')
    return data
  },

  async getProject(id) {
    const { data } = await api.get(`/projects/${id}`)
    return data
  },

  async createProject(payload) {
    const { data } = await api.post('/projects', payload)
    return data
  },

  async updateProject(id, payload) {
    const { data } = await api.put(`/projects/${id}`, payload)
    return data
  },

  async deleteProject(id) {
    await api.delete(`/projects/${id}`)
  },

  async createPayment(projectId, payload) {
    const { data } = await api.post(`/payments/project/${projectId}`, payload)
    return data
  },

  async deletePayment(id) {
    await api.delete(`/payments/${id}`)
  },

  async getInvoices() {
    const { data } = await api.get('/invoices')
    return data
  },

  async createInvoice(projectId, payload) {
    const { data } = await api.post(`/invoices/project/${projectId}`, payload)
    return data
  },

  async downloadInvoice(invoiceId) {
    const response = await api.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    })

    return response.data
  },
}
