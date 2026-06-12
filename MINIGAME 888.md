```datacorejsx
const activeFile = dc.resolvePath("MINIGAME 888") || "_RESOURCES/DATACORE/_DONE/MiniGame888/MINIGAME 888";
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath, dc });
```
