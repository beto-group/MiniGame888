/**
 * MiniGame888 Component Entry Point
 * Implements True Full-Tab Lifecycle (DOM Reparenting & CSS Suppression)
 */
async function View({ folderPath, ...props }, dcOverride) {
    const localDc = dcOverride || (typeof dc !== 'undefined' ? dc : window.dc);
    const { useState, useEffect, useRef } = localDc;
    const { h: preactH } = localDc.preact;

    // 1. Load Data & Components asynchronously
    const ALL_CARD_DEFINITIONS = await localDc.require(folderPath + '/data/CardData.js');
    const finalMessageOptions = await localDc.require(folderPath + '/data/FinalMessage.js');
    const { LoadingLogo } = await localDc.require(folderPath + '/src/components/LoadingLogo.jsx');
    const { LoadingConfirmation } = await localDc.require(folderPath + '/src/components/LoadingConfirmation.jsx');
    const { FreshPip } = await localDc.require(folderPath + '/src/components/FreshPip.jsx');
    const { WelcomeMessageComponent } = await localDc.require(folderPath + '/src/components/WelcomeMessageComponent.jsx');
    const { BasicView } = await localDc.require(folderPath + '/src/components/BasicView.jsx');
    const { ExitButtonComponent } = await localDc.require(folderPath + '/src/components/ExitButtonComponent.jsx');
    const { CategorizedPipsListComponent } = await localDc.require(folderPath + '/src/components/CategorizedPipsListComponent.jsx');
    const { EnigmaView } = await localDc.require(folderPath + '/src/components/EnigmaViewer.jsx');
    const { StatusPipContentComponent } = await localDc.require(folderPath + '/src/components/StatusPipContentComponent.jsx');

    // 2. Load the App component
    const { App } = await localDc.require(folderPath + '/src/App.jsx');

    // 3. Full-Tab Immersion Wrapper
    function FullTabWrapper() {
        const rootRef = useRef(null);
        const [hijacked, setHijacked] = useState(false);
        const FULLTAB_ID = 'fulltab-027-minigame888';

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
                }}
            >
                <App 
                    folderPath={folderPath} 
                    ALL_CARD_DEFINITIONS={ALL_CARD_DEFINITIONS}
                    finalMessageOptions={finalMessageOptions}
                    LoadingLogo={LoadingLogo}
                    LoadingConfirmation={LoadingConfirmation}
                    FreshPip={FreshPip}
                    WelcomeMessageComponent={WelcomeMessageComponent}
                    BasicView={BasicView}
                    ExitButtonComponent={ExitButtonComponent}
                    CategorizedPipsListComponent={CategorizedPipsListComponent}
                    EnigmaView={EnigmaView}
                    StatusPipContentComponent={StatusPipContentComponent}
                    {...props}
                />
            </div>
        );
    }

    return <FullTabWrapper />;
}

return { View };
