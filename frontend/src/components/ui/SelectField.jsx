import { FieldShell } from './FieldShell.jsx'

export const SelectField = ({
  label,
  options,
  hint,
  className = '',
  placeholder = 'Select one',
  ...props
}) => (
  <FieldShell label={label} hint={hint}>
    <div className="field-shell rounded-[22px] px-4 py-3.5 sm:px-5 sm:py-4">
      <select className={`field-input w-full text-[15px] ${className}`} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </FieldShell>
)
