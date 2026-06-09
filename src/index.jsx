/**
 * MiniGame888 Component Entry Point
 * Implements True Full-Tab Lifecycle (DOM Reparenting & CSS Suppression)
 */
function View({ folderPath, ...props }, dcOverride) {
    const localDc = dcOverride || (typeof dc !== 'undefined' ? dc : window.dc);
    const { useState, useEffect, useRef } = localDc;
    const { h: preactH } = localDc.preact;

    // Full-Tab Immersion Wrapper
    function FullTabWrapper() {
        const rootRef = useRef(null);
        const [hijacked, setHijacked] = useState(false);
        const [dependencies, setDependencies] = useState(null);
        const FULLTAB_ID = 'fulltab-027-minigame888';

        // Load dependencies in parallel inside the mounted container
        useEffect(() => {
            Promise.all([
                localDc.require(folderPath + '/data/CardData.js'),
                localDc.require(folderPath + '/data/FinalMessage.js'),
                localDc.require(folderPath + '/src/components/LoadingLogo.jsx'),
                localDc.require(folderPath + '/src/components/LoadingConfirmation.jsx'),
                localDc.require(folderPath + '/src/components/FreshPip.jsx'),
                localDc.require(folderPath + '/src/components/WelcomeMessageComponent.jsx'),
                localDc.require(folderPath + '/src/components/BasicView.jsx'),
                localDc.require(folderPath + '/src/components/ExitButtonComponent.jsx'),
                localDc.require(folderPath + '/src/components/CategorizedPipsListComponent.jsx'),
                localDc.require(folderPath + '/src/components/EnigmaViewer.jsx'),
                localDc.require(folderPath + '/src/components/StatusPipContentComponent.jsx'),
                localDc.require(folderPath + '/src/App.jsx')
            ]).then(([
                ALL_CARD_DEFINITIONS,
                finalMessageOptions,
                { LoadingLogo },
                { LoadingConfirmation },
                { FreshPip },
                { WelcomeMessageComponent },
                { BasicView },
                { ExitButtonComponent },
                { CategorizedPipsListComponent },
                { EnigmaView },
                { StatusPipContentComponent },
                { App }
            ]) => {
                setDependencies({
                    ALL_CARD_DEFINITIONS,
                    finalMessageOptions,
                    LoadingLogo,
                    LoadingConfirmation,
                    FreshPip,
                    WelcomeMessageComponent,
                    BasicView,
                    ExitButtonComponent,
                    CategorizedPipsListComponent,
                    EnigmaView,
                    StatusPipContentComponent,
                    App
                });
            }).catch((err) => {
                console.error("Failed to load minigame dependencies:", err);
            });
        }, []);

        // Layer 1 - CSS Suppression
        useEffect(() => {
            let styleEl = document.getElementById(FULLTAB_ID);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = FULLTAB_ID;
                styleEl.innerHTML = `
                    /* FullTab: suppress all Obsidian chrome */
                    body > .app-container .status-bar,
                    .status-bar,
                    .inline-title,
                    .view-footer,
                    .workspace-leaf-content-footer,
                    .mod-footer,
                    .embedded-backlinks {
                        display: none !important;
                    }
                    .workspace-leaf-content {
                        padding: 0 !important;
                        margin: 0 !important;
                        border-radius: 0 !important;
                        overflow: hidden !important;
                    }
                    .markdown-preview-view,
                    .markdown-preview-section,
                    .cm-scroller {
                        padding: 0 !important;
                        max-width: 100% !important;
                        overflow: hidden !important;
                    }
                    .markdown-preview-sizer {
                        padding: 0 !important;
                        margin: 0 auto !important;
                        min-height: unset !important;
                    }
                `;
                document.head.appendChild(styleEl);
            }
            return () => {
                const el = document.getElementById(FULLTAB_ID);
                if (el) el.remove();
            };
        }, []);

        // Layer 2 - DOM Reparenting
        useEffect(() => {
            const root = rootRef.current;
            if (!root) return;

            let attempts = 0;
            const hijack = () => {
                try {
                    const leaf = root.closest('.workspace-leaf');
                    const scroller = leaf?.querySelector('.cm-scroller');
                    if (scroller) {
                        scroller.appendChild(root);
                        Object.assign(root.style, {
                            position: 'absolute',
                            top: '0', left: '0',
                            width: '100%', height: '100%',
                            zIndex: '10',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            visibility: 'visible',
                        });
                        setHijacked(true);
                        return true;
                    }
                } catch (e) { /* leaf not ready yet */ }
                return false;
            };

            if (hijack()) return;

            const poller = setInterval(() => {
                if (hijack() || attempts++ > 100) clearInterval(poller);
            }, 16);

            return () => clearInterval(poller);
        }, []);

        return (
            <div
                ref={rootRef}
                style={{
                    width: '100%',
                    height: '100%',
                    visibility: hijacked ? 'visible' : 'hidden',
                    background: 'var(--background-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {dependencies ? (
                    <dependencies.App 
                        folderPath={folderPath} 
                        ALL_CARD_DEFINITIONS={dependencies.ALL_CARD_DEFINITIONS}
                        finalMessageOptions={dependencies.finalMessageOptions}
                        LoadingLogo={dependencies.LoadingLogo}
                        LoadingConfirmation={dependencies.LoadingConfirmation}
                        FreshPip={dependencies.FreshPip}
                        WelcomeMessageComponent={dependencies.WelcomeMessageComponent}
                        BasicView={dependencies.BasicView}
                        ExitButtonComponent={dependencies.ExitButtonComponent}
                        CategorizedPipsListComponent={dependencies.CategorizedPipsListComponent}
                        EnigmaView={dependencies.EnigmaView}
                        StatusPipContentComponent={dependencies.StatusPipContentComponent}
                        {...props}
                    />
                ) : (
                    <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '13px' }}>
                        Loading Assets...
                    </div>
                )}
            </div>
        );
    }

    return <FullTabWrapper />;
}

return { View };
