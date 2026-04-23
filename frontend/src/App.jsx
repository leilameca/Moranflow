import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

import { AppShell } from './components/layout/AppShell.jsx'
import { LoadingScreen } from './components/ui/LoadingScreen.jsx'
import { useAuth } from './hooks/useAuth.js'

const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage.jsx').then((module) => ({
    default: module.LoginPage,
  }))
)

const DashboardPage = lazy(() =>
  import('./pages/dashboard/DashboardPage.jsx').then((module) => ({
    default: module.DashboardPage,
  }))
)

const ClientsPage = lazy(() =>
  import('./pages/clients/ClientsPage.jsx').then((module) => ({
    default: module.ClientsPage,
  }))
)

const ServicesPage = lazy(() =>
  import('./pages/services/ServicesPage.jsx').then((module) => ({
    default: module.ServicesPage,
  }))
)

const ProjectsPage = lazy(() =>
  import('./pages/projects/ProjectsPage.jsx').then((module) => ({
    default: module.ProjectsPage,
  }))
)

const ExpensesPage = lazy(() =>
  import('./pages/expenses/ExpensesPage.jsx').then((module) => ({
    default: module.ExpensesPage,
  }))
)

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingScreen label="Preparing your studio workspace..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

const PublicOnlyRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingScreen label="Checking your session..." />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading Moran Studio experience..." />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/finances" element={<ExpensesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
