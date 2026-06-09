---
author: beto.group
name.official: Minigame 888
price: "0"
category:
  - visualization
tags:
  - babylonjs
  - 3d
  - cinematic
  - animation
  - aesthetic
  - showcase
  - cdn
desc: A cinematic, stylized 3D minigame component featuring animated models and "enigmatic-style" text reveal effects.
status: stable
complexity: intermediate
ext.dependencies:
  - babylon-js
id: 27
resources:
  - preview.gif
  - preview.png
longDesc: An elegant and immersive component designed to showcase a single "Enigma"—a combination of a 3D model and descriptive text—in a stylized, animated view. It seamlessly integrates a live-rendered Babylon.js scene with dynamically animated text to create a focused, high-impact presentation. The component is entirely self-contained and manages its own dependencies and assets.
version.obsidian: 1.4.11
version: 2.1.1
---

### Tab: MiniGame 888

```datacorejsx
const activeFile = dc.resolvePath("MINIGAME 888");
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));
const { View } = await dc.require(folderPath + '/src/index.jsx');
return await View({ folderPath });
```

-----

![preview.gif](assets/preview.gif)
