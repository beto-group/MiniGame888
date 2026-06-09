/**
 * MiniGame888 Component Entry Point
 * Loads all component and dataset dependencies asynchronously
 * before rendering the synchronous App component.
 */
async function View({ folderPath, ...props }, dcOverride) {
    const localDc = dcOverride || (typeof dc !== 'undefined' ? dc : window.dc);

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

    // 3. Return the synchronous App VNode
    return <App 
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
    />;
}

return { View };
