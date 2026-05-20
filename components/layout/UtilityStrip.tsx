export default function UtilityStrip() {
  const Sep = () => (
    <span
      aria-hidden="true"
      style={{ color: 'var(--mauve)', margin: '0 1.6em', display: 'inline-block' }}
    >
      ✦
    </span>
  );

  const Items = ({ ariaHidden = false }: { ariaHidden?: boolean }) => (
    <div
      aria-hidden={ariaHidden}
      style={{ display: 'inline-flex', alignItems: 'center', paddingRight: '1.6em' }}
    >
      <span>Posted from Bangkok</span>
      <Sep />
      <span>Worldwide shipping</span>
      <Sep />
      <span>
        Founding member of{' '}
        <a
          href="https://obsflowerletter.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--cream)',
            borderBottom: '1px solid rgba(245, 240, 230, 0.4)',
            paddingBottom: '1px',
            textDecoration: 'none',
          }}
        >
          The Flower Letter
        </a>{' '}
        is open
      </span>
      <Sep />
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        background: 'var(--brown-dark)',
        color: 'var(--cream)',
        padding: '9px 0',
        fontSize: '10.5px',
        lineHeight: 1,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      <div className="utility-strip-track">
        <Items />
        <Items ariaHidden />
      </div>
    </div>
  );
}
