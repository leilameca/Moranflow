import { FieldShell } from './FieldShell.jsx'

export const InputField = ({ label, hint, className = '', ...props }) => (
  <FieldShell label={label} hint={hint}>
    <div className="field-shell rounded-[22px] px-4 py-3.5 sm:px-5 sm:py-4">
      <input className={`field-input w-full text-[15px] ${className}`} {...props} />
    </div>
  </FieldShell>
)
