# Nimbus (New Mod Manager)

This is the next-generation mod manager for the Thunderstore ecosystem, built with React, Vite, and Electron. It aims to replace the legacy r2modmanPlus with a more performant, modern, and maintainable codebase.

## 🚧 Project Status

**Current Phase:** Foundation & Core Infrastructure
**Status:** In Progress

| Feature Area | Status | Notes |
|--------------|--------|-------|
| **Core Architecture** | ✅ Complete | Remix/React + Electron setup working. |
| **Profile Management** | ✅ Complete | Create, Rename, Delete, Import/Export (File) implemented. |
| **Mod Installation** | ✅ Complete | `ModInstallerService` implemented with BepInEx support. |
| **Local Import** | ✅ Complete | Basic local mod import operational. |
| **Game Selection** | ✅ Complete | Detection logic & manual overrides included. |
| **Online Browser** | 🚧 In Progress | Virtualized UI implemented. API integration pending optimization. |
| **Config Editor** | ✅ Complete | BepInEx .cfg editor with sidebar implemented. |
| **Launch System** | ✅ Complete | Steam integration & Argument generation implemented. |
| **Settings** | 🚧 In Progress | Data Directory & Launch Args implemented. Theme pending. |

## 🗺️ Roadmap to Parity (Migration Plan)

This roadmap tracks the feature parity goals against the legacy r2modman application.

### Phase 1: Core Foundation & Local Management (Current)
- [x] **Profile System**
    - [x] Create simple default profile
    - [x] Profile directory structure (`profiles/<name>/`)
    - [x] Multiple profile support (Create, Rename, Delete)
    - [x] Import/Export Profiles (Codes & Files)
- [x] **Mod Installation (Backend)**
    - [x] `ModInstallerService` basic implementation
    - [x] Zip extraction & manifest parsing
    - [x] Dependency resolution (Basic)
    - [x] BepInEx installation rules
    - [x] Uninstall logic
- [ ] **Local Mod Management**
    - [x] Import local zip files
    - [x] Toggle mods (Enable/Disable)
    - [x] Local mod list view (Virtual scrolling required)
    - [x] Sort & Filter local mods

### Phase 2: Online Discovery & API
- [ ] **Thunderstore Integration**
    - [ ] Fetch package listing index (Chunked/Optimized)
    - [ ] Fetch package metadata
    - [ ] Caching layer (IndexedDB/Dexie)
    - [ ] **Performance Goal**: Non-blocking fetch (background w/ progress)
- [ ] **Online Browser UI**
    - [x] Virtualized List for 1000+ mods
    - [x] Search (Debounced & Fuzzy)
    - [x] Filtering (Categories, NSFW)
    - [x] Sort (Last Updated, Rating, Downloads)
- [ ] **Download System**
    - [x] Download queue management
    - [x] Progress tracking
    - [x] Dependency resolution checks

### Phase 3: Game Launch & Runtime
- [ ] **Game Selection**
    - [x] Basic game selection persistence
    - [x] Platform detection (Steam, EGS, Xbox, Generic)
    - [x] Game auto-detection logic
    - [x] Manual game selection/location override
- [ ] **Launch Logic**
    - [x] Argument generation (Doorstop, etc.)
    - [x] Platform specific runners (Steam URI, etc.)
    - [x] Mod Loader specific instructions (MelonLoader, Northstar, BepInEx)
- [x] **Config Editor**
    - [x] BepInEx `.cfg` parsing
    - [x] Virtualized editor UI (for large config files)

### Phase 4: Settings & Polish
- [ ] **Settings Manager**
    - [x] Data directory management (Change & Persistence)
    - [x] Launch Argument overrides
    - [ ] Theme selection
    - [ ] Backup/Restore settings
- [ ] **Help & Troubleshooting**
    - [ ] Log viewer
    - [ ] Discord integration

### Phase 5: Complex Features & Architecture Overhauls
- [ ] **Advanced Mod Installation**
    - [ ] Conflict management (state machine)
    - [ ] Complex dependency graphs & cycle detection

## 🎯 Performance Goals

Based on legacy app analysis, these are strict requirements:
*   **Startup**: < 1s to interactive.
*   **Profile Load (100+ mods)**: < 1s (Legacy: 2-3s).
*   **Search**: < 50ms latency (Debounced).
*   **Scrolling**: 60fps consistent (Virtualization required).
*   **Memory**: < 200MB idle.

## 🏗️ Technical Architecture

*   **Frontend**: React 18 + Vite (via Remix SPA mode).
*   **Backend**: Electron (Main Process) + Node.js.
*   **State Management**: React Context + Query (replacing Vuex).
*   **Database**: Dexie.js (IndexedDB) for metadata cache.
*   **Styling**: Cyberstorm Theme + Cyberstorm UI components + Custom CSS.

### Implementation Strategy

**Data Access Layer (Dapper):**
*   **Online Discovery**: We will utilize the **Dapper** pattern established in `packages/dapper`.
*   **Implementation**: Use `@thunderstore/dapper-ts` for TypeScript-typed API interactions. This standardizes how we fetch communities, package listings, and metadata.
*   **Caching**: Dapper will be wrapped or extended to support aggressive caching via Dexie (IndexedDB) to meet the "offline-first" and performance requirements of a desktop app.

**UI Component System (Cyberstorm):**
*   **Library**: Use `@thunderstore/cyberstorm` for all atomic components (Buttons, Cards, Inputs, Modals).
*   **Theme**: Leverage `@thunderstore/cyberstorm-theme` to ensure visual consistency with the web ecosystem.
*   **Goal**: Replace ad-hoc MUI components with Cyberstorm primitives to maintain brand identity.

## 🧪 Testing Strategy

*   **Unit Tests**: Vitest for all generic logic (installers, parsers).
*   **Integration Tests**: Test main process interactions.
*   **E2E**: Playwright/Electron for critical user flows.

## 🏃‍♂️ How to Run

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start Development Server:
   ```bash
   yarn workspace @thunderstore/mod-manager dev
   ```

3. Run Tests:
   ```bash
   yarn workspace @thunderstore/mod-manager test
   ```

---
*Generated from migration documentation analysis.*
