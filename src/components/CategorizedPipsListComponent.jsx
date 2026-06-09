function CategorizedPipsListComponent({ dc, categorizedItems }) {
  const { useCallback } = dc;

  const formatCategoryName = useCallback((categoryId) => {
    if (!categoryId) return 'UNCATEGORIZED';
    return categoryId.split('-')[0].toUpperCase();
  }, []);

  const totalCategorizedCount = Object.values(categorizedItems).flat().length;

  return (
    <div
      style={{
        color: 'var(--text-normal)',
        padding: '10px',
        height: '100%',
        overflowY: 'auto',
        fontFamily: `'Consolas', 'Monaco', 'Lucida Console', 'monospace'`,
        fontSize: '12px',
        backgroundColor: 'var(--background-primary-alt)',
        border: '1px solid var(--background-modifier-border)',
        borderRadius: '5px',
        boxSizing: 'border-box'
      }}
    >
      <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-normal)', fontSize: '16px', textAlign: 'center', borderBottom: '1px solid var(--background-modifier-border)', paddingBottom: '5px' }}>
        {`TOTAL: ${totalCategorizedCount} CARD${totalCategorizedCount === 1 ? '' : 'S'}`}
      </h2>
      {totalCategorizedCount === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '20px' }}>
          No cards categorized yet.
        </div>
      ) : (
        Object.entries(categorizedItems).map(([categoryId, items]) => (
          <div key={categoryId} style={{ marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-accent)', fontSize: '14px', borderBottom: '1px dotted var(--background-modifier-border)', paddingBottom: '3px' }}>
              {`${formatCategoryName(categoryId)} (${items.length})`}
            </h3>
            {items.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                {items.map((item, index) => (
                  <li
                    key={item.pipId || index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '3px',
                      padding: '2px 0',
                      backgroundColor: index % 2 === 0 ? 'var(--background-secondary)' : 'var(--background-primary)',
                      borderRadius: '3px'
                    }}
                  >
                    <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', paddingLeft: '5px' }}>
                      {item.displayName}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

return { CategorizedPipsListComponent };
