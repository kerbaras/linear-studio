<p align="center">
  <img src="images/icon.png" alt="Linear Studio Logo" width="128" height="128">
</p>

<h1 align="center">Linear Studio</h1>

<p align="center">
  <strong>Seamlessly manage Linear issues directly from VS Code</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=linear-studio.linear-studio">
    <img src="https://img.shields.io/visual-studio-marketplace/v/linear-studio.linear-studio?style=flat-square&label=VS%20Code%20Marketplace&logo=visual-studio-code&logoColor=white" alt="VS Code Marketplace Version">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=linear-studio.linear-studio">
    <img src="https://img.shields.io/visual-studio-marketplace/d/linear-studio.linear-studio?style=flat-square&label=Downloads&logo=visual-studio-code&logoColor=white" alt="VS Code Marketplace Downloads">
  </a>
  <a href="https://github.com/kerbaras/linear-studio/actions/workflows/test.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/kerbaras/linear-studio/test.yml?style=flat-square&label=Tests&logo=github" alt="Tests">
  </a>
  <a href="https://github.com/kerbaras/linear-studio/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/kerbaras/linear-studio?style=flat-square&label=License" alt="License">
  </a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-commands">Commands</a> •
  <a href="#%EF%B8%8F-configuration">Configuration</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## Why Linear Studio?

Stop context-switching between your IDE and browser. **Linear Studio** brings your Linear workflow directly into VS Code, letting you stay focused on what matters most — writing code.

<p align="center">
  <img src="images/demo.gif" alt="Linear Studio Demo" width="800">
</p>

## ✨ Features

### 📋 Issue Management
- **View assigned issues** in a clean sidebar tree view
- **Filter by cycle, project, or team** to focus on what matters
- **Rich issue details** with full markdown rendering
- **Comments view** to stay in sync with your team

### 🌿 Git Integration
- **One-click branch creation** with Linear's suggested branch names
- **Smart repository detection** in multi-root workspaces
- **Automatic checkout** of existing branches

### 🔒 Secure Authentication
- **API key storage** using VS Code's secure credential manager
- **Automatic session validation** on startup
- **Easy logout** when switching accounts

### 🎨 Native VS Code Experience
- **Theme-aware UI** that matches your VS Code theme
- **Keyboard-friendly** with full command palette support
- **Auto-refresh** to keep issues up to date

---

## 📦 Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)
3. Search for **"Linear Studio"**
4. Click **Install**

### From Command Line

```bash
code --install-extension linear-studio.linear-studio
```

### Requirements

- VS Code **1.85.0** or higher
- Git extension (built into VS Code)
- A [Linear](https://linear.app) account with API access

---

## 🚀 Quick Start

### 1. Get Your API Key

1. Go to [Linear Settings → API](https://linear.app/settings/api)
2. Click **"Create new API key"**
3. Give it a name (e.g., "VS Code")
4. Copy the key (starts with `lin_api_`)

### 2. Authenticate in VS Code

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run **"Linear Studio: Authenticate"**
3. Paste your API key
4. You're in! 🎉

### 3. Start Working

1. Find your issue in the **Linear Studio** sidebar
2. Click on an issue to view details
3. Click **"Start Working"** to create a branch
4. Code away!

---

## 🎯 Commands

Access all commands via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `Linear Studio: Authenticate` | Connect to Linear with your API key |
| `Linear Studio: Logout` | Disconnect from Linear |
| `Linear Studio: Refresh Issues` | Refresh the issues list |
| `Linear Studio: Filter by Cycle` | Filter issues by sprint/cycle |
| `Linear Studio: Filter by Project` | Filter issues by project |
| `Linear Studio: Clear Filters` | Remove all active filters |
| `Linear Studio: Start Work` | Create a branch for the selected issue |
| `Linear Studio: Copy Issue Link` | Copy issue URL to clipboard |
| `Linear Studio: Open in Browser` | Open issue in Linear web app |

---

## ⚙️ Configuration

Customize Linear Studio in your VS Code settings:

```json
{
  // Auto-refresh interval in seconds (0 to disable)
  "linear-studio.autoRefreshInterval": 300,

  // Default team ID for filtering
  "linear-studio.defaultTeam": ""
}
```

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `autoRefreshInterval` | `number` | `300` | How often to refresh issues (in seconds). Set to `0` to disable. |
| `defaultTeam` | `string` | `""` | Pre-select a team filter on startup |

---

## 🖼️ Screenshots

<details>
<summary><strong>Issues Tree View</strong></summary>
<p align="center">
  <img src="images/screenshot-tree.png" alt="Issues Tree View" width="400">
</p>
View all your assigned issues organized by cycle/sprint.
</details>

<details>
<summary><strong>Issue Detail Panel</strong></summary>
<p align="center">
  <img src="images/screenshot-detail.png" alt="Issue Detail Panel" width="600">
</p>
Full issue details with description, comments, and actions.
</details>

<details>
<summary><strong>Branch Creation</strong></summary>
<p align="center">
  <img src="images/screenshot-branch.png" alt="Branch Creation" width="500">
</p>
One-click branch creation with Linear's suggested naming.
</details>

---

## 🛠️ Development

Want to contribute or run locally? Check out our development guides:

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** — Setup, workflows, and common tasks
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System design and patterns
- **[TESTING.md](./TESTING.md)** — Testing infrastructure and conventions
- **[CLAUDE.md](./CLAUDE.md)** — AI assistant guide for the codebase

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/kerbaras/linear-studio.git
cd linear-studio

# Install dependencies
pnpm install
cd webview-ui && pnpm install && cd ..

# Build
pnpm build

# Run in VS Code (press F5)
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Extension | TypeScript, VS Code Extension API |
| API Client | [@linear/sdk](https://www.npmjs.com/package/@linear/sdk) |
| Webview UI | React 18, Vite |
| Bundler | esbuild |
| Testing | Vitest, Playwright |
| Package Manager | pnpm |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **🐛 Report bugs** — [Open an issue](https://github.com/kerbaras/linear-studio/issues/new?template=bug_report.md)
2. **💡 Suggest features** — [Open a feature request](https://github.com/kerbaras/linear-studio/issues/new?template=feature_request.md)
3. **🔧 Submit PRs** — Fork, branch, code, and open a pull request

Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Linear](https://linear.app) for their excellent API and SDK
- [Atlassian's atlascode](https://bitbucket.org/atlassianlabs/atlascode) for architectural inspiration
- The VS Code team for the amazing extension API

---

<p align="center">
  Made with ❤️ for developers who love staying in the zone
</p>

<p align="center">
  <a href="https://linear.app">
    <img src="https://img.shields.io/badge/Powered%20by-Linear-5E6AD2?style=flat-square&logo=linear&logoColor=white" alt="Powered by Linear">
  </a>
</p>
