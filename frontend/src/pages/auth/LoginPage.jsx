import { Globe2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import logo from '../../assets/logo.png'
import { Button } from '../../components/ui/Button.jsx'
import { InputField } from '../../components/ui/InputField.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useLanguage } from '../../hooks/useLanguage.js'

export const LoginPage = () => {
  const { login, isAuthenticated } = useAuth()
  const { locale, setLocale, copy } = useLanguage()
  const [form, setForm] = useState({
    email: 'admin@moranstudio.local',
    password: 'MoranAdmin123!',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
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
    setLoading(true)
    setError('')

    try {
      await login(form)
    } catch (submitError) {
      setError(submitError.response?.data?.message || copy.login.errorFallback)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--moran-ink)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1380px] overflow-hidden rounded-[36px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] shadow-[0_35px_90px_rgba(0,0,0,0.35)] lg:grid-cols-[1.1fr_520px]">
        <section className="relative overflow-hidden px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,164,164,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(107,112,92,0.22),transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-14 w-[132px] items-center rounded-[22px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-2">
                  <img src={logo} alt="Moran Studio logo" className="h-full w-full object-contain" />
                </div>

                <div className="flex items-center rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] p-1">
                  {['es', 'en'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLocale(lang)}
                      className={`rounded-[14px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                        locale === lang
                          ? 'bg-[rgba(214,164,164,0.22)] text-white'
                          : 'text-[rgba(255,255,255,0.68)]'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <h1 className="font-display mt-8 max-w-xl text-6xl leading-none sm:text-7xl">
                {copy.login.headline}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[rgba(255,255,255,0.72)]">
                {copy.login.description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {copy.login.highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-4 py-4 text-sm leading-6 text-[rgba(255,255,255,0.76)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center bg-[var(--moran-beige)] px-5 py-8 sm:px-8 lg:px-10">
          <div className="glass-panel w-full rounded-[32px] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 text-[var(--moran-soft)]">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-[112px] items-center rounded-[22px] bg-[rgba(214,164,164,0.12)] px-3 py-2">
                  <img src={logo} alt="Moran Studio logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    {copy.login.access}
                  </p>
                  <p className="text-sm">{copy.login.subtitle}</p>
                </div>
              </div>

              <div className="hidden items-center gap-2 rounded-full bg-[rgba(255,255,255,0.74)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--moran-soft)] sm:flex">
                <Globe2 size={14} />
                {copy.common.language}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="font-display text-4xl text-[var(--moran-ink)]">{copy.login.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--moran-soft)]">
                {copy.login.helper}
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <InputField
                label={copy.login.email}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@moranstudio.local"
              />
              <InputField
                label={copy.login.password}
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={copy.login.passwordPlaceholder}
              />

              {error ? (
                <div className="rounded-2xl bg-[#f7e6e6] px-4 py-3 text-sm text-[#8d3c3c]">{error}</div>
              ) : null}

              <Button type="submit" className="w-full justify-center" disabled={loading}>
                {loading ? copy.login.signingIn : copy.login.signIn}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
