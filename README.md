# Lunar

A modern SSH terminal and SFTP file manager built with Electron.

Lunar lets you manage multiple SSH connections, open concurrent terminal sessions with split panes, and transfer files through a dual-pane SFTP browser — all from a single desktop app.

## Features

- **SSH Terminal** — Multiple concurrent sessions powered by xterm.js with WebGL rendering, tabs, and horizontal/vertical split panes
- **SFTP File Manager** — Dual-pane browser (local + remote) with drag-and-drop transfers, file preview, and a concurrent transfer queue
- **Connection Manager** — Save connections with password or SSH key authentication, organize into folders, assign color tags, and configure startup commands
- **Command Palette** — Quick access to all actions via `Cmd+K` / `Ctrl+K`
- **Terminal Themes** — Dracula, Nord, and Tokyo Night built-in
- **Auto-Reconnect** — Automatic reconnection with exponential backoff on dropped connections
- **Auto-Update** — Built-in update mechanism via GitHub releases
- **Secure Credential Storage** — Passwords and passphrases stored securely, separate from the connection database
- **Cross-Platform** — macOS, Windows, and Linux

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the Electron app with hot module replacement for the renderer process.

### Build

```bash
# Build only (no packaging)
npm run build

# Package for distribution
npm run dist:mac
npm run dist:win
npm run dist:linux
```

### Type Checking

```bash
npm run typecheck          # Both main and renderer
npm run typecheck:node     # Main + preload only
npm run typecheck:web      # Renderer only
```

### Testing

```bash
npm run test               # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### Formatting & Linting

```bash
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
```

## Tech Stack

| Layer         | Technology                 |
| ------------- | -------------------------- |
| Framework     | Electron + electron-vite   |
| Renderer      | React 18, Tailwind CSS v4  |
| UI Components | Lucide React, CMDK, Sonner |
| Terminal      | xterm.js (WebGL addon)     |
| SSH/SFTP      | ssh2                       |
| Database      | better-sqlite3 (WAL mode)  |
| State         | Zustand                    |
| Data Fetching | TanStack React Query       |
| Animations    | Framer Motion              |
| Packaging     | electron-builder           |
| Testing       | Vitest, Testing Library    |

## 📝 Author

**Salvatore Corvaglia**

- GitHub: [@salvatorecorvaglia](https://github.com/salvatorecorvaglia)
