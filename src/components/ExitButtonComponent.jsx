function ExitButtonComponent({ dc, onExit }) {
  const { useCallback } = dc;

  const handleClick = useCallback(() => {
    if (onExit) {
      onExit();
    }
  }, [onExit]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        backgroundColor: "transparent",
        borderRadius: "50%",
        boxSizing: 'border-box',
        color: 'var(--text-normal)'
      }}
      onClick={handleClick}
      title="Exit Game"
    >
      <svg
        width="22px" height="22px" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ display: 'block' }}
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
}

return { ExitButtonComponent };
