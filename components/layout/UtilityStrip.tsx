export default function UtilityStrip() {
  const Sep = () => (
    <span
      aria-hidden="true"
      style={{ color: 'var(--mauve)', margin: '0 1.6em', display: 'inline-block', fontSize: '10px' }}
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

  // Field-journal treatment: the strip keeps its slow drift but drops
  // to half height - italic serif lowercase instead of tracked caps,
  // so it reads as a margin note, not a banner. Nav.tsx pins itself
  // directly below at top-[25px]; keep the two in sync.
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
        padding: '5px 0',
        fontSize: '13px',
        lineHeight: 1.15,
        letterSpacing: '0.02em',
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontWeight: 400,
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
