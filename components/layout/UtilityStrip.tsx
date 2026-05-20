export default function UtilityStrip() {
  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 60,
        top: 0,
        left: 0,
        right: 0,
        background: 'var(--cream)',
        color: 'var(--fg-muted)',
        borderBottom: '1px solid var(--border-soft)',
        textAlign: 'center',
        padding: '10px 16px',
        fontSize: '11.5px',
        letterSpacing: '0.04em',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.5,
      }}
    >
      Posted from Bangkok · Worldwide shipping
      <span style={{ margin: '0 10px', opacity: 0.5 }}>·</span>
      Founding member of{' '}
      <a
        href="https://obsflowerletter.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--moss)',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
          textDecorationThickness: '0.5px',
        }}
      >
        The Flower Letter
      </a>{' '}
      is open
    </div>
  );
}
