// A utility function to load external scripts.
function loadScript(src, onload, onerror) {
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onload = onload;
  script.onerror =
    onerror ||
    function () {
      // Script loading failed
    };
  document.body.appendChild(script);
  return script;
}

// Fuzzy search for a file using Fuse.js and the Obsidian file index.
async function fuzzyFindFile(filename) {
  if (!window.Fuse) {
    await new Promise((resolve) =>
      loadScript("https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.js", resolve)
    );
  }
  const files = app.vault.getFiles();
  const fuse = new Fuse(files, {
    keys: ["path"],
    includeScore: true,
    threshold: 0.4,
  });
  const results = fuse.search(filename);
  if (results.length > 0) {
    return results[0].item;
  }
  return files.find(f => f.path.endsWith(filename)) || null;
}

// Get an Obsidian resource path that the browser can use.
async function getMediaResourcePath(filename) {
  const file = await fuzzyFindFile(filename);
  if (!file) {
    throw new Error(`File containing "${filename}" not found in the vault.`);
  }
  return app.vault.getResourcePath(file);
}

// The main component to render the view.
function LoadingLogo({ dc, folderPath }) {
  const fileName = "BETO_Logo_T_Loading.svg";
  
  const [mediaSrc, setMediaSrc] = dc.useState(null);
  const [error, setError] = dc.useState(null);
  const [isImageLoaded, setIsImageLoaded] = dc.useState(false);

  dc.useEffect(() => {
    setIsImageLoaded(false); 
    
    const resolvePath = async () => {
      try {
        const vaultRelativePath = folderPath 
          ? `${folderPath}/assets/${fileName}`
          : `_RESOURCES/DATACORE/_DONE/MINIGAME 888/assets/${fileName}`;
          
        const adapter = app.vault.adapter;
        const exists = await adapter.exists(vaultRelativePath);
        if (exists) {
          setMediaSrc(adapter.getResourcePath(vaultRelativePath));
        } else {
          // Simple direct name search fallback (O(N) search, no indexing)
          const file = app.vault.getFiles().find(f => f.name === fileName);
          if (file) {
            setMediaSrc(app.vault.getResourcePath(file));
          } else {
            throw new Error(`File "${fileName}" not found in the vault.`);
          }
        }
      } catch (err) {
        setError(err.message);
      }
    };
    
    resolvePath();
  }, [fileName, folderPath]);

  const logoStyles = `
    @keyframes logoCompositorPulse {
      0%, 100% { transform: scale(0.96) translateZ(0); opacity: 0.8; }
      50% { transform: scale(1.02) translateZ(0); opacity: 1.0; }
    }
    .logo-compositor-anim {
      animation: logoCompositorPulse 2s ease-in-out infinite;
      will-change: transform, opacity;
    }
  `;

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      <style dangerouslySetInnerHTML={{ __html: logoStyles }} />
      {mediaSrc && (
        <img
          src={mediaSrc}
          onLoad={() => setIsImageLoaded(true)}
          alt="BETO Logo Loading Animation"
          className="logo-compositor-anim"
          style={{
            width: "300px",
            height: "222px",
            opacity: isImageLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out'
          }}
        />
      )}
    </div>
  );
}

return { LoadingLogo };
