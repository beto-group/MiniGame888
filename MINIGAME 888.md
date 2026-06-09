---
author: beto.group
version: 2.1.1
type: DatacoreEntry
---

```datacorejsx
const activeFile = dc.resolvePath("MINIGAME 888");
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { View } = await dc.require(folderPath + "/src/index.jsx");
return await View({ folderPath });
```
