# Changelog

All notable changes to the **andb-ui** project will be documented in this file.

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

### ✨ UI/UX Refinements

- **Refined Header Layout**:
  - Unified the header design across `GlobalSchemaView` and `Compare` views.
  - Aligned the "Console" toggle to the far right.
  - Grouped action buttons (Fetch, Compare) to the right side for cleaner separation.
  - Converted the "Fetch" button to a minimal icon-only style to reduce visual clutter.
  - Removed redundant vertical separators in the toolbar.

### 🚀 Functionality

- **Compare View**:
  - Added **DDL Type Filtering** (Tables, Views, Procedures, Functions, Triggers) to the Tree View mode.
  - Synchronized filter state between List and Tree views to ensure consistency when switching modes.

---

## [2.2.1] - 2026-01-14

### ✨ UI & Branding Refinements

- **Dynamic Versioning**: The application version is now automatically synchronized across all UI components (Splash Screen, About Modal).
- **New Primary Home**: Updated all links and internal metadata to point to the new `The-Andb/andb` repository.
- **License Update**: Officially transitioned to **GPL-3.0**.
- **Sidebar Fix**: Resolved an issue where navigation items were clipped in vertical list mode.
- **Landing Page Polish**: Fixed "black box" logo issue and improved text contrast in Light Mode.
- **Project Settings Refactor**: Improved layout stability and fixed navigation bugs in the Project Settings view.

---

## [2.2.0] - 2026-01-14

### ✨ New & Improved

- **Context-Aware Dashboard**: The "Sync Mappings" list is now strictly intelligent. It filters connection pairs based on your **Active Project** and **Enabled Environments** (e.g. enabling/disabling UAT).
- **Premium Visuals**: Completely redesigned "Switch Project" and "Settings" buttons in the dashboard with kinetic hover effects and premium styling.
- **Interactive Global Blur**: The blurred sidebar in global views now acts as a click-to-close surface, improving navigation fluidity.

### 🐛 Bug Fixes

- **Zombie Project Fix**: Resolved a critical issue where duplicated projects inherited "System Protected" status (undeletable). Added auto-sanitization to fix existing corrupted projects on startup.
- **Robust ID Generation**: Replaced UUID generator with a fail-safe implementation for reliable project creation/copying.

---

## [2.0.0] - 2025-12-26

### Added

- Initial public release
- Electron + Vue 3 + TypeScript foundation
- Integration with @the-andb/core
- Basic export, compare, and migrate workflows

[2.3.0]: https://github.com/The-Andb/andb/releases/tag/v2.3.0
[2.2.2]: https://github.com/The-Andb/andb/releases/tag/v2.2.2
[2.2.1]: https://github.com/The-Andb/andb/releases/tag/v2.2.1
[2.2.0]: https://github.com/The-Andb/andb/releases/tag/v2.2.0
[2.0.0]: https://github.com/The-Andb/andb/releases/tag/v2.0.0
