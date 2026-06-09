# Contributing to Minigame 888

We welcome contributions! Please adhere to the following architectural guidelines to ensure the component remains stable, highly adaptable, and self-contained.

---

## 🛠️ Codebase Guidelines

### 1. Zero ESM Exports
To remain compatible with Obsidian's internal dynamic import pipeline, **do not** use standard ES module exports.
- ❌ **Do not use**: `export default Component;` or `export { Component };`
-  **Do use**: A trailing return statement returning an object at the end of the file:
  ```javascript
  function MyComponent() {
      return <div>Hello</div>;
  }
  return { MyComponent };
  ```

### 2. Relative Imports
Use `dc.require(folderPath + "/path/to/file")` to import local files, leveraging the parent-provided `folderPath` parameter. Do not hardcode absolute vault directories.

### 3. Absolute Colors Avoidance
Style coordinates must utilize theme variables provided by the host context (e.g. `var(--background-primary)`, `var(--text-normal)`) rather than hardcoded hex colors like `#000` or `#fff` to ensure beautiful rendering in both light and dark mode vaults.
