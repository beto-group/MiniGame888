# Contribution Guidelines — MiniGame888

Welcome! This component is part of the BetoOS Datacore library. Please adhere to the following architectural standards.

## Codebase Architecture

The module utilizes a split-file structure to guarantee legibility, testability, and isolated execution scopes:

```text
MiniGame888/
├── MINIGAME 888.md        # Obsidian entry point
├── METADATA.md            # Component manifest
├── README.md              # Documentation
├── CONTRIBUTION.md        # This file
├── LICENSE.md             # MIT license
├── data/
│   ├── CardData.js        # Card asset definitions
│   ├── FinalMessage.js    # End-state message content
│   ├── cache/             # Locally cached GLB 3D model files
│   └── music/
│       └── beto.minigame.soundtrack.wav
├── assets/
│   ├── image/
│   │   ├── preview.png                # Static preview screenshot
│   │   └── BETO_Logo_T_Loading.svg    # Animated loading logo asset
│   └── videos/
│       └── preview.gif                # Interactive walkthrough GIF
└── src/
    ├── index.jsx          # Datacore entry bootstrapper and hot reload daemon
    ├── App.jsx            # Babylon.js coordinator driving rendering and Preact layout
    ├── components/
    │   ├── BasicView.jsx                   # Compact non-fullscreen fallback view
    │   ├── CategorizedPipsListComponent.jsx # Manages categorized card list pips
    │   ├── EnigmaViewer.jsx                # 3D Babylon card inspector with hacker-style reveal
    │   ├── ExitButtonComponent.jsx         # Pip close/exit button
    │   ├── FreshPip.jsx                    # Universal draggable/minimizable window manager
    │   ├── LoadingConfirmation.jsx         # Asset download confirmation and progress tracker
    │   ├── LoadingLogo.jsx                 # Animated BETO logo for loading states
    │   ├── StatusPipContentComponent.jsx   # Status information pip window
    │   └── WelcomeMessageComponent.jsx     # Welcome screen content
    └── utils/
        └── LoadScriptUpgrade.js   # Offline caching script loader utility
```

## Developer Standards

1. **Strict Zero Emojis**: All UI elements, buttons, headers, and control indicators must use Lucide vector icons (`<dc.Icon>`) or plain text. Emojis are reserved strictly for documentation.
2. **Zero ESM Exports**: To remain compatible with Obsidian's internal dynamic import pipeline, do not use standard ES module exports (`export default`, `export {}`). Use a trailing return statement returning a named object instead:
   ```javascript
   function MyComponent() {
       return <div>Hello</div>;
   }
   return { MyComponent };
   ```
3. **Relative Imports**: Use `dc.require(folderPath + "/path/to/file")` to import local files, leveraging the parent-provided `folderPath` parameter. Do not hardcode absolute vault directories.
4. **Path Safety**: Do not hardcode absolute path strings (e.g. `/Volumes/` or `file:///`). Always resolve vault directories dynamically.
5. **Theme Variable Colors**: Style coordinates must utilize theme variables provided by the host context (e.g. `var(--background-primary)`, `var(--text-normal)`) rather than hardcoded hex colors to ensure rendering in both light and dark mode vaults.
6. **HMR Command System**: To force a code reload or command watch directory path change remotely via MCP agents, write the reload payload to `data/mcp_commands.json`.
