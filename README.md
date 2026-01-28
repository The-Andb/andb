# The Andb UI

**The Intelligent Database Orchestrator** — Desktop application for seamless schema visualization, comparison, and synchronization.

## 🚀 Features

- **Auto-hide Sidebar**: Collapsible navigation with keyboard shortcuts
- **Dual-Pane Layout**: Resizable source/destination panes for efficient comparison
- **Atomic Operations**: Smart Refresh & Compare individual objects or categories
- **Multiple Database Connections**: Manage multiple database configurations
- **Connection Pairs**: Select source ↔ target for compare/migrate operations
- **Visual Diff**: Side-by-side comparison with status indicators & syntax highlighting
- **Context-Aware Dashboard**: Intelligent filtering of connections and pairs based on active project context
- **Export Preview**: Live SQL preview with syntax highlighting (Rainbow brackets + Line numbers)
- **Migration Management**: Create and track database migrations
- **Script Generator**: Generate andb-core CLI scripts
- **High-Performance Storage**: SQLite-backed metadata and snapshot management
- **Dark/Light Theme**: Modern UI with theme support

## 🛠️ Tech Stack

- **Frontend**: Vue.js 3 + TypeScript
- **Desktop**: Electron
- **Styling**: Tailwind CSS
- **Icons**: Lucide Vue Next
- **State Management**: Pinia
- **Routing**: Vue Router
- **Build Tool**: Vite
- **Database Tool**: andb-core
- **Metadata Storage**: SQLite (better-sqlite3)

## 📥 Download

Latest Release: **v2.3.0**

- **macOS (Apple Silicon)**: [The-Andb-2.3.0-arm64.dmg](https://github.com/The-Andb/andb/releases/download/v2.3.0/The-Andb-2.3.0-arm64.dmg)
- **macOS (Portable ZIP)**: [The-Andb-2.3.0-mac.zip](https://github.com/The-Andb/andb/releases/download/v2.3.0/The-Andb-2.3.0-mac.zip)
- [All Releases](https://github.com/The-Andb/andb/releases)

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/The-Andb/andb.git
cd andb

# Install dependencies
npm install

# Start development server
npm run dev

# Start Electron app
npm run electron:dev

# Build for production
npm run electron:build

# Build and Publish to GitHub Releases
GH_TOKEN=your_token npm run electron:publish
```

## 🎯 Usage

### Development

```bash
# Start Vite dev server
npm run dev

# Start Electron with hot reload
npm run electron:dev
```

### Production

```bash
# Build the application
npm run build

# Package for distribution
npm run electron:build

# Package and Publish to GitHub
GH_TOKEN=your_token npm run electron:publish
```

## 📁 Project Structure

```
andb-ui/
├── electron/           # Electron main process
│   ├── main.ts        # Main process entry
│   └── preload.ts     # Preload script
├── src/               # Vue.js application
│   ├── components/    # Reusable components
│   ├── views/         # Page components
│   ├── stores/        # Pinia stores
│   ├── router/        # Vue Router configuration
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript types
│   ├── App.vue        # Root component
│   ├── main.ts        # Application entry
│   └── style.css      # Global styles
├── public/            # Static assets
├── index.html         # HTML template
├── package.json       # Dependencies and scripts
├── vite.config.ts     # Vite configuration
├── tailwind.config.js # Tailwind CSS configuration
└── tsconfig.json      # TypeScript configuration
```

## 🎨 UI Components

### Layout Components

- **Sidebar**: Auto-hide navigation with connection management
- **Header**: Connection pair selector and quick actions
- **Main Content**: Resizable dual-pane layout

### Views

- **Dashboard**: Overview of connections and recent operations
- **Export**: Database objects export with SQL preview
- **Compare**: Side-by-side database comparison
- **Migrate**: Migration management and history
- **Scripts**: andb-core script generator
- **Settings**: Application configuration

## ⌨️ Keyboard Shortcuts

- `Ctrl+B`: Toggle sidebar
- `Ctrl+Left/Right`: Resize panes
- `Ctrl+Shift+C`: Compare selected
- `Ctrl+Shift+E`: Export selected
- `Ctrl+Shift+M`: Create migration

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Development
NODE_ENV=development

# Database connections (example)
DEV_DB_HOST=localhost
DEV_DB_NAME=dev_database
DEV_DB_USER=root
DEV_DB_PASS=password

STAGE_DB_HOST=stage-server.com
STAGE_DB_NAME=stage_database
STAGE_DB_USER=stage_user
STAGE_DB_PASS=stage_password

PROD_DB_HOST=prod-server.com
PROD_DB_NAME=prod_database
PROD_DB_USER=prod_user
PROD_DB_PASS=prod_password
```

## 📚 Documentation

- [Development Guide](docs/DEVELOPMENT.md) - Deep dive into architecture and status.
- [Changelog](docs/CHANGELOG.md) - History of changes and updates.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [@the-andb/core](https://github.com/The-Andb/andb-core) - Database orchestration engine
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful & consistent icon toolkit

---

**Made with ❤️ by ph4n4n**
