export const Card = ({ className = '', children }) => (
  <section className={`soft-panel studio-card rounded-[18px] sm:rounded-[20px] ${className}`}>
    {children}
  </section>
)
