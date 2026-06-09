function LoadingConfirmation({ dc, onConfirm, onCancel }) {
  const { useState } = dc;
  const [status, setStatus] = useState('ready');

  const handleConfirm = async () => {
    setStatus('checking');
    await new Promise(resolve => setTimeout(resolve, 500));
    setStatus('downloading');
    onConfirm();
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background-primary)',
      zIndex: 10000
    }}>
      <div style={{
        background: 'var(--background-secondary)',
        padding: '48px',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--background-modifier-border)',
        border: '1px solid var(--background-modifier-border)',
        textAlign: 'center'
      }}>
        {/* Icon Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          position: 'relative'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--background-primary)',
            border: '2px solid var(--interactive-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 0 20px var(--interactive-accent)'
          }}>
            {status === 'ready' ? (
              <svg
                width="40px" height="40px" viewBox="0 0 24 24" fill="none"
                stroke="var(--interactive-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: 'pulse 2s ease-in-out infinite' }}
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            ) : status === 'checking' ? (
              <svg
                width="40px" height="40px" viewBox="0 0 24 24" fill="none"
                stroke="var(--interactive-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            ) : (
              <svg
                width="40px" height="40px" viewBox="0 0 50 50"
                style={{ display: 'block' }}
              >
                <circle
                  cx="25" cy="25" r="20" fill="none" stroke="var(--interactive-accent)" strokeWidth="5"
                  strokeDasharray="31.415, 31.415" strokeDashoffset="0"
                  style={{ animation: 'spinIcon 1s linear infinite' }}
                />
              </svg>
            )}
          </div>
        </div>
        
        {/* Title */}
        <h2 style={{
          color: 'var(--text-normal)',
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '16px',
          letterSpacing: '-0.5px',
          fontFamily: 'var(--font-interface), sans-serif'
        }}>
          {status === 'ready' ? 'MiniGame 888' :
           status === 'checking' ? 'Verifying Assets' :
           'Loading Cards'}
        </h2>
        
        {/* Description */}
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '15px',
          lineHeight: '1.7',
          marginBottom: '32px',
          fontFamily: 'var(--font-interface), sans-serif',
          maxWidth: '420px',
          margin: '0 auto 32px'
        }}>
          {status === 'ready' ? 'Download and cache card assets (GLB files) for the game. Assets are stored locally for faster loading.' :
           status === 'checking' ? 'Checking asset availability and local cache...' :
           'Downloading card models and initializing game...'}
        </p>

        {/* Info Box */}
        {status === 'ready' && (
          <div style={{
            backgroundColor: 'var(--background-primary)',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            textAlign: 'left'
          }}>
            <svg
              width="18px" height="18px" viewBox="0 0 24 24" fill="none"
              stroke="var(--interactive-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: '2px' }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{
                color: 'var(--text-accent)',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '6px',
                fontFamily: 'var(--font-interface), sans-serif'
              }}>Asset Details</div>
              <div style={{
                color: 'var(--text-muted)',
                fontSize: '13px',
                lineHeight: '1.6',
                fontFamily: 'var(--font-interface), sans-serif'
              }}>
                Source: <span style={{ color: 'var(--text-normal)' }}>beto.assets/DATACORE/MINIGAME</span>
                <br />
                Cache: <span style={{ color: 'var(--text-normal)' }}>_DONE/MINIGAME 888/data/cache/</span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        {status === 'ready' && (
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={onCancel}
              className="minigame888-btn-secondary"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                borderRadius: '8px',
                border: '1px solid var(--background-modifier-border)',
                background: 'var(--interactive-normal)',
                color: 'var(--text-normal)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '600',
                fontFamily: 'var(--font-interface), sans-serif'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="minigame888-btn-primary"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--interactive-accent)',
                color: 'var(--text-on-accent)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '600',
                fontFamily: 'var(--font-interface), sans-serif'
              }}
            >
              Download & Play
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

return { LoadingConfirmation };
