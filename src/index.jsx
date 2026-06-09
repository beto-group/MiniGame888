/**
 * MiniGame888 Component Entry Point
 */
async function View({ folderPath, ...props }, dcOverride) {
    const localDc = dcOverride || (typeof dc !== 'undefined' ? dc : window.dc);

    // Dynamically load the core App component
    const { App } = await localDc.require(folderPath + '/src/App.jsx');

    // Instantiate and return the Preact Component
    return <App folderPath={folderPath} {...props} />;
}

return { View };
