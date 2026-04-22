import { FieldShell } from './FieldShell.jsx'

export const TextareaField = ({ label, hint, className = '', ...props }) => (
  <FieldShell label={label} hint={hint}>
    <div className="field-shell rounded-[22px] px-4 py-3.5 sm:px-5 sm:py-4">
      <textarea
        className={`field-input min-h-28 w-full resize-y text-[15px] leading-7 ${className}`}
        {...props}
      />
    </div>
  </FieldShell>
)
