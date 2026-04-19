type OdooBadgeProps = {
  className?: string;
};

export function OdooBadge({ className = "" }: OdooBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-white/16 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white ${className}`.trim()}
      aria-label='Odoo'
    >
      <span className='flex items-center gap-0.5' aria-hidden>
        <span className='h-2 w-2 rounded-full bg-white/95' />
        <span className='h-2 w-2 rounded-full bg-white/75 -mr-1' />
      </span>
      <span>odoo</span>
    </span>
  );
}
