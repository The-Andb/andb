# Changelog

All notable changes to **The Andb UI** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-01-28

### Added

- **SQL Dump File Comparison**: Compare `.sql` dump files directly without live database connections. Perfect for offline analysis and reviewing schema changes from backups.
- **DDL Type Filtering**: Filter comparison results by DDL type (Tables, Views, Procedures, Functions, Triggers, Events) in both tree and list views.
- **Enhanced Schema Caching**: Improved sidebar schema loading with SQLite-backed persistence for faster startup times.
- **Composable Architecture**: Refactored core comparison logic into reusable Vue composables (`useCompareCore`, `useComparisonFilter`).

### Improved

- **Comparison Performance**: Optimized comparison engine with better memory handling for large schemas (1000+ objects).
- **Tree View Synchronization**: DDL type filters now synchronize between tree view and list view modes.
- **Report Generation**: Reports now use embedded Highcharts and improved dark-mode aesthetics.

### Fixed

- **TypeScript Strict Mode**: Fixed all TypeScript errors for clean production builds.
- **Sidebar Loading**: Fixed issue where DDLs were not loading in schema tab after dump file operations.
- **Connection Persistence**: Improved handling of connection state across app restarts.

### Changed

- **Electron 34**: Upgraded from Electron 28 to 34 for macOS 26 (Tahoe) compatibility.
- **Core 3.0.3**: Updated to latest @the-andb/core with improved test stability.

---

## [2.2.2] - 2026-01-19

### Added

- **DDL Type Filtering**: Filter comparison tree by object type.
- **Landing Page Updates**: New version highlights and download links.

### Fixed

- **Build errors**: Resolved TypeScript compilation issues.

---

## [2.2.0] - 2026-01-12

### Added

- **Visual Diff Engine**: Side-by-side comparison with syntax highlighting and Rainbow brackets.
- **Export Preview**: Live SQL preview with line numbers.
- **Connection Pairs**: Select source ↔ target for compare/migrate operations.
- **Auto-hide Sidebar**: Collapsible navigation with keyboard shortcuts (Ctrl+B).

### Improved

- **Performance**: SQLite-backed metadata storage for faster operations.
- **Theme Support**: Polished dark and light mode aesthetics.

---

## [2.0.0] - 2025-12-26

### Added

- Initial public release
- Electron + Vue 3 + TypeScript foundation
- Integration with @the-andb/core
- Basic export, compare, and migrate workflows

[2.3.0]: https://github.com/The-Andb/andb/releases/tag/v2.3.0
[2.2.2]: https://github.com/The-Andb/andb/releases/tag/v2.2.2
[2.2.0]: https://github.com/The-Andb/andb/releases/tag/v2.2.0
[2.0.0]: https://github.com/The-Andb/andb/releases/tag/v2.0.0
