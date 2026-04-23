import {
  BriefcaseBusiness,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Users2,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import logo from '../../assets/logo.png'
import { useAuth } from '../../hooks/useAuth.js'
import { useLanguage } from '../../hooks/useLanguage.js'
import { Button } from '../ui/Button.jsx'

const COLLAPSE_KEY = 'moran-studio-sidebar-collapsed'
const DESKTOP_MEDIA = '(min-width: 1024px)'

const readCollapsed = () => window.localStorage.getItem(COLLAPSE_KEY) === 'true'

export const AppShell = () => {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { locale, setLocale, copy } = useLanguage()
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    window.matchMedia(DESKTOP_MEDIA).matches
  )
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, String(isDesktopCollapsed))
  }, [isDesktopCollapsed])

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA)
    const handleChange = (event) => {
      setIsDesktopViewport(event.matches)

      if (event.matches) {
        setMobileOpen(false)
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const navItems = useMemo(
    () => [
      {
        to: '/dashboard',
        label: copy.layout.nav.dashboard,
        icon: LayoutDashboard,
      },
      {
        to: '/clients',
        label: copy.layout.nav.clients,
        icon: Users2,
      },
      {
        to: '/services',
        label: copy.layout.nav.services,
        icon: Palette,
      },
      {
        to: '/projects',
        label: copy.layout.nav.projects,
        icon: BriefcaseBusiness,
      },
      {
        to: '/finances',
        label: locale === 'es' ? 'Finanzas' : 'Finances',
        icon: Wallet,
      },
    ],
    [copy.layout.nav, locale]
  )

  const pageTitle = useMemo(() => {
    const match = navItems.find((item) => pathname.startsWith(item.to))
    return match?.label || copy.layout.workspace
  }, [copy.layout.workspace, navItems, pathname])

  const handleMenuToggle = () => {
    if (isDesktopViewport) {
      setIsDesktopCollapsed((current) => !current)
      return
    }

    setMobileOpen((current) => !current)
  }

  return (
    <div className="min-h-screen">
      {mobileOpen ? (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menu"
          className="fixed inset-0 z-30 bg-[rgba(15,15,15,0.34)] lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-1rem))] border-r border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,#0f0f0f_0%,#171615_100%)] text-white shadow-[18px_0_54px_rgba(15,15,15,0.16)] transition-[width,transform] duration-200 lg:translate-x-0 ${
          isDesktopCollapsed ? 'lg:w-[88px]' : 'lg:w-[280px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-full w-full flex-col overflow-y-auto px-3 py-4">
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] px-2 pb-4">
            <div className={`flex items-center gap-3 ${isDesktopCollapsed ? 'lg:justify-center' : ''}`}>
              <div
                className={`overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.03)_100%)] ${
                  isDesktopCollapsed ? 'h-12 w-12 p-2' : 'h-14 w-[108px] px-3 py-2'
                }`}
              >
                <img src={logo} alt="Moran Studio logo" className="h-full w-full object-contain" />
              </div>
              <div className={`${isDesktopCollapsed ? 'lg:hidden' : ''}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f3d7d7]">
                  Moran Studio
                </p>
                <h1 className="font-display text-3xl leading-none text-white">Manager</h1>
              </div>
            </div>
          </div>

          {!isDesktopCollapsed ? (
            <p className="px-2 pt-4 text-sm leading-6 text-[rgba(255,255,255,0.68)]">
              {copy.layout.brandDescription}
            </p>
          ) : null}

          <nav className="mt-6 flex flex-1 flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  title={item.label}
                  className={({ isActive }) =>
                    `sidebar-link flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-semibold ${
                      isDesktopCollapsed ? 'lg:justify-center lg:px-0' : ''
                    } ${isActive ? 'sidebar-link-active' : ''}`
                  }
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span className={`${isDesktopCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-5 border-t border-[rgba(255,255,255,0.08)] px-2 pt-4">
            <div className={`flex items-center gap-3 ${isDesktopCollapsed ? 'lg:justify-center' : ''}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[rgba(214,164,164,0.18)] text-[#f3d7d7]">
                <Users2 size={18} strokeWidth={1.8} />
              </div>
              <div className={`${isDesktopCollapsed ? 'lg:hidden' : ''}`}>
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-[rgba(255,255,255,0.7)]">{copy.layout.signedInAs}</p>
              </div>
            </div>

            {!isDesktopCollapsed ? (
              <p className="mt-3 text-xs text-[rgba(255,255,255,0.68)]">{user?.email}</p>
            ) : null}

            <div className={`mt-4 flex items-center gap-2 ${isDesktopCollapsed ? 'lg:flex-col' : ''}`}>
              <div
                className={`flex items-center rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.06)] p-1 ${
                  isDesktopCollapsed ? 'lg:flex-col' : 'flex-1'
                }`}
              >
                {['es', 'en'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLocale(lang)}
                    title={lang.toUpperCase()}
                    className={`rounded-[10px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      locale === lang
                        ? 'bg-[rgba(214,164,164,0.22)] text-white'
                        : 'text-[rgba(255,255,255,0.62)]'
                    } ${isDesktopCollapsed ? 'lg:w-11' : 'flex-1'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <Button
                variant="secondary"
                className={`${isDesktopCollapsed ? 'lg:h-11 lg:w-11 lg:p-0' : 'justify-center px-4'} text-[var(--moran-ink)]`}
                onClick={logout}
                title={copy.common.signOut}
              >
                <LogOut size={16} strokeWidth={1.8} />
                <span className={`${isDesktopCollapsed ? 'lg:hidden' : ''}`}>
                  {copy.common.signOut}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`min-h-screen transition-[padding] duration-200 ${
          isDesktopCollapsed ? 'lg:pl-[88px]' : 'lg:pl-[280px]'
        }`}
      >
        <div className="relative min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="relative mx-auto max-w-[1480px]">
            <header className="glass-panel mb-8 rounded-[18px] px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <Button
                    variant="subtle"
                    className="h-11 w-11 shrink-0 rounded-[14px] p-0"
                    onClick={handleMenuToggle}
                    title={
                      isDesktopViewport
                        ? isDesktopCollapsed
                          ? copy.common.expandMenu
                          : copy.common.collapseMenu
                        : copy.common.openMenu
                    }
                  >
                    <Menu size={18} strokeWidth={1.8} />
                  </Button>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--moran-soft)]">
                      {copy.layout.overview}
                    </p>
                    <h2 className="mt-2 truncate font-display text-3xl leading-none text-[var(--moran-ink)] sm:text-4xl">
                      {pageTitle}
                    </h2>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-[14px] border border-[rgba(15,15,15,0.06)] bg-white/82 px-4 py-3 text-sm leading-6 text-[var(--moran-soft)] sm:items-center">
                  <Globe2 size={16} strokeWidth={1.8} />
                  <span>{copy.layout.statusLine}</span>
                </div>
              </div>
            </header>

            <main className="relative">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
