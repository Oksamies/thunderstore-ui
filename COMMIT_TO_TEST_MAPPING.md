# Commit to QA Test Mapping

This document maps each commit between `41c60cef6ff778d6e552a019eba415a69f7aa009` and `master` to the specific QA tests that should be performed.

## How to Use This Document

For each commit, the relevant QA test sections from `QA_TESTING_CHECKLIST.md` are listed. When a commit is tested and verified, mark it with an `[x]`.

---

## Authentication & Session Management

- [ ] `adb7e276` - chore: wire session cleanup, enable api tests, and update exports
  - **Tests:** Section 1 - All authentication scenarios
  - **Key Areas:** Session cleanup, logout flow

- [ ] `87c9db37` - fix(auth): unify invalid session handling and cleanup 401 recovery
  - **Tests:** Section 1 - Invalid session handling, 401 error handling
  - **Key Areas:** Session invalidation, automatic cleanup, 401 recovery

- [ ] `655cfbea` - packageEdit: show 401 for unauthenticated users
  - **Tests:** Section 1 - Unauthenticated access, Section 2 - Package edit access control
  - **Key Areas:** Package edit page 401 errors

- [ ] `fa721457` - Improve error messageing in ReportPackageForm for unauthorized access
  - **Tests:** Section 1 - Unauthorized error messages, Section 5 - Report package unauthorized
  - **Key Areas:** Error message display, report form access control

---

## Package Editing

- [ ] `ee71269e` - Fix review comments
  - **Tests:** Section 2 - Package editing, review information display
  - **Key Areas:** Review form fixes, styling

- [ ] `8e553ae4` - Prevent using .map on undefined
  - **Tests:** Section 2 - Package edit page load
  - **Key Areas:** Edge cases, undefined data handling

- [ ] `aa1fdc29` - Fix styling issues
  - **Tests:** Section 2 - Package edit styling, Section 3 - Package listing styling
  - **Key Areas:** Visual appearance, CSS fixes

- [ ] `ad2ec6b2` - packageEdit: use two-phase package listing fetch
  - **Tests:** Section 2 - Package edit page load, data fetching
  - **Key Areas:** API request patterns, loading states

- [ ] `65f74fd8` - packageEdit: don't load data on SSR loader
  - **Tests:** Section 2 - Loading states, SSR behavior
  - **Key Areas:** Server-side rendering, client-side data loading

- [ ] `9dd3e05d` - packageEdit: DRY error handling code
  - **Tests:** Section 2 - Error handling in package edit
  - **Key Areas:** Error messages, error recovery

- [ ] `7ed2988f` - packageEdit: clean up fetched data
  - **Tests:** Section 2 - Package edit data display
  - **Key Areas:** Data transformation, display accuracy

- [ ] `655cfbea` - packageEdit: show 401 for unauthenticated users
  - **Tests:** Section 2 - Unauthenticated edit access
  - **Key Areas:** Access control, 401 errors

- [ ] `860385a1` - Allow moderators to manage packages
  - **Tests:** Section 2 - Moderator access, Section 6 - Moderation tools
  - **Key Areas:** Moderator permissions, package management

- [ ] `6864eeba` - Add permissions check for categories
  - **Tests:** Section 2 - Category editing permissions
  - **Key Areas:** Category management, permission validation

- [ ] `15c9c0f2` - Hydrate category form state from loader data
  - **Tests:** Section 2 - Category editing form state
  - **Key Areas:** Form hydration, initial values

- [ ] `08b1448a` - Make edit package visible for private packages
  - **Tests:** Section 2 - Private package editing
  - **Key Areas:** Private package visibility, edit access

---

## Package Listing & Details

- [ ] `49893800` - Refactor PackageListing data access and generic isPromise
  - **Tests:** Section 3 - Package listing page, data fetching
  - **Key Areas:** Data access patterns, promise handling

- [ ] `aa1fdc29` - Fix styling issues
  - **Tests:** Section 3 - Package listing styling
  - **Key Areas:** Visual appearance, CSS

- [ ] `77541695` - Reduce duplicate requests made in listing's Required tab
  - **Tests:** Section 3 - Package listing performance, Section 4 - Required tab
  - **Key Areas:** API request optimization, duplicate prevention

- [ ] `91b13857` - Reduce duplicate requests made in listing's Required tab
  - **Tests:** Section 3 - Package listing performance, Section 4 - Required tab
  - **Key Areas:** API request optimization, duplicate prevention

- [ ] `d3e48a1e` - Rename component to make the usage clearer
  - **Tests:** Section 3 - Package version pages
  - **Key Areas:** Component naming, functionality preservation

- [ ] `2c3bf56d` - Simplify packageVersion.tsx
  - **Tests:** Section 3 - Package version pages
  - **Key Areas:** Version page rendering, code simplification

- [ ] `09203be6` - Don't fetch community in packageVersion.tsx
  - **Tests:** Section 3 - Package version pages, API requests
  - **Key Areas:** Community fetching optimization

- [ ] `c317e17c` - Update data fetching for packageVersion.tsx
  - **Tests:** Section 3 - Package version data fetching
  - **Key Areas:** Data loading patterns, API calls

- [ ] `0a8b5a76` - Add package version support for getPackageListingDetails Dapper method
  - **Tests:** Section 3 - Package version details
  - **Key Areas:** Dapper method functionality, version support

- [ ] `ae11afd3` - Refactor helper functions
  - **Tests:** Section 3 - Package listing functionality
  - **Key Areas:** Helper function behavior, utilities

- [ ] `224077c2` - Use review information components in package listing
  - **Tests:** Section 3 - Review information display
  - **Key Areas:** Review status, component integration

- [ ] `54d9525f` - Add css styling for review information
  - **Tests:** Section 3 - Review information styling
  - **Key Areas:** Visual appearance, CSS

- [ ] `dd489d0a` - Prevent infinite render loop
  - **Tests:** Section 3 - Package listing rendering
  - **Key Areas:** Render loops, performance

- [ ] `0349e701` - Move package detail URL & small refactoring
  - **Tests:** Section 3 - Package detail URLs, navigation
  - **Key Areas:** URL handling, routing

- [ ] `45ac56d3` - Update and refactor package listing component
  - **Tests:** Section 3 - Package listing page
  - **Key Areas:** Component refactoring, functionality

- [ ] `0c81670d` - Implement dapper method for listing status
  - **Tests:** Section 3 - Package listing status
  - **Key Areas:** Status fetching, Dapper methods

- [ ] `e2cf1f65` - Implement function for fetching listing status
  - **Tests:** Section 3 - Package listing status
  - **Key Areas:** Status API calls, data fetching

---

## Package Dependencies (Required Tab)

- [ ] `36e72c46` - feat: add RequiredIndicator component for indicating required fields
  - **Tests:** Section 4 - Required indicator display, Section 10 - RequiredIndicator component
  - **Key Areas:** Required field indicators, visual design

- [ ] `91b13857` - Reduce duplicate requests made in listing's Required tab
  - **Tests:** Section 4 - Required tab, duplicate request prevention
  - **Key Areas:** API optimization, request deduplication

- [ ] `c2a01f32` - Combine the three components used to list package's dependencies
  - **Tests:** Section 4 - Required tab, dependency listing
  - **Key Areas:** Component consolidation, dependency display

---

## Package Reporting

- [ ] `4269bf35` - Fix types and reportform
  - **Tests:** Section 5 - Report package form, type handling
  - **Key Areas:** Type safety, form functionality

- [ ] `c3c08acb` - Adjust modal widths globally
  - **Tests:** Section 5 - Report modal styling, Section 11 - Modal components
  - **Key Areas:** Modal width, responsive design

- [ ] `fa721457` - Improve error messageing in ReportPackageForm for unauthorized access
  - **Tests:** Section 5 - Report package unauthorized access
  - **Key Areas:** Error messages, access control

---

## Moderation Tools

- [ ] `860385a1` - Allow moderators to manage packages
  - **Tests:** Section 6 - Moderator package management
  - **Key Areas:** Moderator permissions, package management tools

---

## Team Settings

- [ ] `47e2c336` - Disable team profile form for non-owner members
  - **Tests:** Section 7 - Team profile form access control
  - **Key Areas:** Owner vs. member permissions, form disabling

- [ ] `cfe636c3` - feat(forms): enhance useStrongForm with validation, field state, and tests
  - **Tests:** Section 7 - Team member management, Section 10 - Form validation
  - **Key Areas:** Form validation, field state tracking

- [ ] `3346451a` - thunderstore-api: allow null values for team donation link
  - **Tests:** Section 7 - Team donation link
  - **Key Areas:** Null value handling, donation link management

- [ ] `64f00935` - Remove broken team links from the team disband page
  - **Tests:** Section 7 - Team disband form
  - **Key Areas:** Link removal, disband page display

- [ ] `1fdc8f22` - Remove unused CSS definitions
  - **Tests:** Section 7 - Team settings styling
  - **Key Areas:** CSS cleanup, visual appearance

- [ ] `c5db94d9` - Fix copy-pasted code
  - **Tests:** Section 7 - Team settings functionality
  - **Key Areas:** Code quality, functionality preservation

- [ ] `7a931ebe` - Prevent team disband submission until confirmation input validates
  - **Tests:** Section 7 - Team disband form validation
  - **Key Areas:** Form validation, confirmation input

---

## Community Pages

- [ ] `80ade566` - Run pre-commit on all files and fix all tsc -b errors
  - **Tests:** Section 8 - Community page rendering, package search
  - **Key Areas:** TypeScript fixes, code quality

- [ ] `c2a01f32` - Combine the three components used to list package's dependencies
  - **Tests:** Section 8 - Community package display
  - **Key Areas:** Component consolidation

- [ ] `d41ce511` - Disable package endpoints that are not community-scoped
  - **Tests:** Section 8 - Community-scoped vs non-scoped endpoints
  - **Key Areas:** Endpoint access control, routing

- [ ] `09203be6` - Don't fetch community in packageVersion.tsx
  - **Tests:** Section 8 - Community data fetching optimization
  - **Key Areas:** API request reduction

---

## Wiki Functionality

- [ ] `80ade566` - Run pre-commit on all files and fix all tsc -b errors
  - **Tests:** Section 9 - All wiki functionality
  - **Key Areas:** TypeScript fixes, wiki components

- [ ] `2cbec7e3` - Wiki fixes (#1668)
  - **Tests:** Section 9 - All wiki functionality
  - **Key Areas:** Wiki rendering, navigation, editing

---

## Forms & Input Components

- [ ] `cfe636c3` - feat(forms): enhance useStrongForm with validation, field state, and tests
  - **Tests:** Section 10 - Enhanced useStrongForm
  - **Key Areas:** Form validation, field state, error handling

- [ ] `36e72c46` - feat: add RequiredIndicator component for indicating required fields
  - **Tests:** Section 10 - RequiredIndicator component
  - **Key Areas:** Required field indicators

- [ ] `a4d99349` - Disable hover highlight styles from disabled buttons
  - **Tests:** Section 10 - Button disabled state
  - **Key Areas:** Disabled button styling, hover effects

- [ ] `48b9c8e3` - Disable hover highlight styles from disabled text inputs
  - **Tests:** Section 10 - TextInput disabled state
  - **Key Areas:** Disabled input styling, hover effects

- [ ] `e1c67b6e` - Enhance Switch component with cursor and transition styles; add 'disabled' modifier support
  - **Tests:** Section 10 - Switch component
  - **Key Areas:** Switch styling, transitions, disabled state

---

## Navigation & UI Components

- [ ] `80ade566` - Run pre-commit on all files and fix all tsc -b errors
  - **Tests:** Section 11 - Navigation menu
  - **Key Areas:** Navigation rendering, TypeScript fixes

- [ ] `c3c08acb` - Adjust modal widths globally
  - **Tests:** Section 11 - Modal components
  - **Key Areas:** Modal width adjustments

- [ ] `09fa2644` - Fix TS build errors and Cyberstorm import paths
  - **Tests:** Section 11 - General UI components
  - **Key Areas:** Import path fixes, component rendering

---

## Error Handling & Error Boundaries

- [ ] `5003ae5a` - Update data fetching and error handling related documentation
  - **Tests:** Section 12 - Error documentation review
  - **Key Areas:** Documentation accuracy

- [ ] `75c1dda1` - Add PoC helper for avoiding hydration errors in RouteErrorBoundary
  - **Tests:** Section 12 - RouteErrorBoundary, hydration errors
  - **Key Areas:** SSR safety, hydration error prevention

- [ ] `4dc9928d` - Improve isApiError
  - **Tests:** Section 12 - API error handling
  - **Key Areas:** Error type checking, ApiError utility

- [ ] `65c1f907` - Make ApiError serializable
  - **Tests:** Section 12 - ApiError serialization
  - **Key Areas:** Error serialization, data transfer

- [ ] `7a38feed` - Replace error boundary in root.tsx with RouteErrorBoundary
  - **Tests:** Section 12 - RouteErrorBoundary integration
  - **Key Areas:** Error boundary replacement, root error handling

- [ ] `874b4802` - Log errors in RouteErrorBoundary to Sentry
  - **Tests:** Section 12 - Sentry logging
  - **Key Areas:** Error logging, monitoring integration

- [ ] `50e74666` - Add RouteErrorBoundary
  - **Tests:** Section 12 - RouteErrorBoundary functionality
  - **Key Areas:** Error boundary behavior, error display

---

## Beta Switch

- [ ] `07ea4c51` - refactor(beta-switch): wrap initialization and improve SSR safety
  - **Tests:** Section 13 - Beta switch toggle, SSR safety
  - **Key Areas:** Beta switch initialization, server-side rendering

---

## Code Display & Syntax Highlighting

- [ ] `38a12071` - Fix CodeBoxHTML's issues by using the CodeBox component with SyntaxHi…
  - **Tests:** Section 14 - CodeBox and CodeBoxHTML components
  - **Key Areas:** Code block rendering, syntax highlighting

- [ ] `3bf9a572` - build(deps): upgrade storybook, react-router and syntax highlighter
  - **Tests:** Section 14 - Syntax highlighting, Section 17 - Dependency upgrades
  - **Key Areas:** Syntax highlighter upgrade, functionality preservation

---

## Package Upload

- [ ] `80ade566` - Run pre-commit on all files and fix all tsc -b errors
  - **Tests:** Section 15 - Package upload flow
  - **Key Areas:** Upload functionality, TypeScript fixes

---

## Markdown & Content Rendering

- [ ] `80ade566` - Run pre-commit on all files and fix all tsc -b errors
  - **Tests:** Section 16 - Markdown rendering, content sanitization
  - **Key Areas:** Markdown components, sanitization

---

## Dependency Upgrades

- [ ] `3bf9a572` - build(deps): upgrade storybook, react-router and syntax highlighter
  - **Tests:** Section 17 - All dependency upgrade tests
  - **Key Areas:** Storybook, react-router, syntax highlighter compatibility

---

## Docker & Build

- [ ] `a2f4fe31` - Update cyberstorm-remix Dockerfile to include building packages
  - **Tests:** Section 18 - Docker build
  - **Key Areas:** Dockerfile changes, package building

- [ ] `dfd62ab5` - Set up Docker development environment for Cyberstorm Remix
  - **Tests:** Section 18 - Docker development environment
  - **Key Areas:** Development environment setup, Docker configuration

---

## Infrastructure & Build System

- [ ] `3f475a37` - feat: add export for src components in cyberstorm-theme package
  - **Tests:** General functionality check
  - **Key Areas:** Component exports, package structure

- [ ] `5a211de2` - fix: change type assertion from 'any' to 'unknown' for pkg dependencies
  - **Tests:** General functionality check
  - **Key Areas:** Type safety, package dependencies

- [ ] `d8c4e836` - chore: overhaul monorepo configuration, build system, and dev env tools
  - **Tests:** Build and development environment
  - **Key Areas:** Monorepo configuration, build system

- [ ] `96b78140` - Fix unlist URL
  - **Tests:** Package unlisting functionality
  - **Key Areas:** Unlist URL, package management

- [ ] `51b96397` - Add helper functions to listingUtils and fix 403 problem
  - **Tests:** Package listing, 403 error handling
  - **Key Areas:** Helper utilities, permission errors

- [ ] `2a6f589d` - Run pre-commit
  - **Tests:** Code quality check
  - **Key Areas:** Pre-commit hooks, code formatting

- [ ] `bdb6e1a9` - Implement package detail utils
  - **Tests:** Package detail functionality
  - **Key Areas:** Utility functions, package details

- [ ] `fec972bf` - Add getPackageListingStatus to dapper index
  - **Tests:** Package listing status
  - **Key Areas:** Dapper methods, status fetching

- [ ] `c7ecbb7c` - Implement listing status schemas
  - **Tests:** Package listing status
  - **Key Areas:** Schema validation, data structure

---

## Merge Commits (No Direct Testing Required)

These are merge commits that don't require separate testing as their changes are covered by the feature commits above:

- `6366c639` - Merge pull request #1689 from thunderstore-io/eb4-documentation
- `8ac7c585` - Merge pull request #1693 from thunderstore-io/01-19-update_cyberstorm-remix_dockerfile_to_include_building_packages
- `391e1089` - Merge pull request #1678 from thunderstore-io/xmas-features
- `d42c3d4a` - Merge pull request #1690 from thunderstore-io/moderation-tools-feature-branch
- `02ed4e26` - Merge pull request #1688 from thunderstore-io/eb3-fortify
- `a6eae798` - Merge pull request #1663 from thunderstore-io/12-10-docker_dev_env_setup
- `d3c5101d` - Merge pull request #1664 from thunderstore-io/team-blank-donation-url
- `67049ca6` - Merge pull request #1658 from thunderstore-io/12-09-improve_error_messageing_in_reportpackageform_for_unauthorized_access
- `06470841` - Merge pull request #1659 from thunderstore-io/12-09-enhance_switch_component_with_cursor_and_transition_styles_add_disabled_modifier_support
- `0bed1999` - Merge pull request #1656 from thunderstore-io/eb2-error-logging
- `ecf71863` - Merge pull request #1657 from thunderstore-io/report-package-modal-width
- `6e2d6787` - Merge pull request #1655 from thunderstore-io/eb1-route-boundary
- `8f6ddb3c` - Merge pull request #1649 from thunderstore-io/disband-team-form-validation

---

## CI/Build Commits (Testing Not Required in QA)

These commits are related to CI/CD and build configuration:

- `6a887c33` - feat: add build step for Yarn dependencies in chromatic-deployment CI workflow
- `2f51353b` - fix: correct glob pattern for project configuration in vitest
- `1fa915e1` - Fix visual-diff-ci build by compiling cyberstorm dependencies
- `d1af0c43` - Fix CI build order for ts-uploader dependency
- `0e4dc4ba` - Fix pre-commit CI failure by installing yarn dependencies
- `5156cdf4` - chore: enable prettier import sorting

---

## Summary Statistics

- **Total Commits:** 93
- **Feature Commits Requiring Testing:** ~60
- **Merge Commits:** 13
- **CI/Build Commits:** 6
- **Infrastructure Commits:** ~14

## Testing Progress Tracker

Track overall progress by category:

- [ ] Authentication & Session Management (4 commits)
- [ ] Package Editing (13 commits)
- [ ] Package Listing & Details (16 commits)
- [ ] Package Dependencies (3 commits)
- [ ] Package Reporting (3 commits)
- [ ] Moderation Tools (1 commit)
- [ ] Team Settings (7 commits)
- [ ] Community Pages (4 commits)
- [ ] Wiki Functionality (2 commits)
- [ ] Forms & Input Components (5 commits)
- [ ] Navigation & UI Components (3 commits)
- [ ] Error Handling & Error Boundaries (7 commits)
- [ ] Beta Switch (1 commit)
- [ ] Code Display & Syntax Highlighting (2 commits)
- [ ] Package Upload (1 commit)
- [ ] Markdown & Content Rendering (1 commit)
- [ ] Dependency Upgrades (1 commit)
- [ ] Docker & Build (2 commits)
- [ ] Infrastructure & Build System (9 commits)
