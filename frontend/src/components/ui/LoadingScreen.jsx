import logo from '../../assets/logo.png'

export const LoadingScreen = ({ label = 'Loading...' }) => (
  <div className="flex min-h-screen items-center justify-center px-6">
    <div className="glass-panel flex max-w-sm flex-col items-center rounded-[32px] px-10 py-12 text-center">
      <div className="mb-6 flex h-16 w-[144px] items-center justify-center rounded-[24px] bg-[rgba(214,164,164,0.12)] px-4 py-3">
        <img src={logo} alt="Moran Studio logo" className="h-full w-full object-contain" />
      </div>
      <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[rgba(214,164,164,0.22)] border-t-[var(--moran-ink)]" />
      <p className="font-display text-3xl text-[var(--moran-ink)]">Moran Studio</p>
      <p className="mt-3 text-sm leading-6 text-[var(--moran-soft)]">{label}</p>
    </div>
  </div>
)
