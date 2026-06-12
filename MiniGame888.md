
```datacorejsx
const activeFile = dc.resolvePath("MiniGame888") || "_RESOURCES/DATACORE/_DONE/MiniGame888/MiniGame888";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath, dc });
```
