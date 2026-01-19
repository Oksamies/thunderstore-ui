# QA Testing Checklist for cyberstorm-remix

## Overview
This document provides a comprehensive QA testing checklist for changes made to the cyberstorm-remix app between commit `41c60cef6ff778d6e552a019eba415a69f7aa009` and `master`.

**Total commits to test: 93**

---

## 1. Authentication & Session Management

### Test Scenarios:
- [ ] **Test invalid session handling**
  - Log in to the application
  - Manually invalidate your session (via browser dev tools or API)
  - Navigate to different pages
  - Verify graceful 401 handling with proper error messages
  - Verify automatic cleanup and redirect to login

- [ ] **Test unauthenticated access to protected pages**
  - Without logging in, try to access package edit page
  - Verify 401 error is displayed correctly
  - Verify no infinite loops or crashes

- [ ] **Test session cleanup**
  - Log in and perform various actions
  - Log out
  - Verify session is properly cleaned up
  - Verify no residual session data remains

### Related Commits:
- `adb7e276` - chore: wire session cleanup, enable api tests, and update exports
- `87c9db37` - fix(auth): unify invalid session handling and cleanup 401 recovery
- `655cfbea` - packageEdit: show 401 for unauthenticated users
- `fa721457` - Improve error messaging in ReportPackageForm for unauthorized access

---

## 2. Package Editing

### Test Scenarios:
- [ ] **Test package edit page load (as owner)**
  - Navigate to a package you own
  - Click "Edit Package"
  - Verify page loads without errors
  - Verify all form fields are populated correctly
  - Verify no duplicate API requests

- [ ] **Test package edit page load (as moderator)**
  - Log in as a moderator account
  - Navigate to a package you don't own
  - Verify you can access the edit page
  - Verify moderator permissions work correctly

- [ ] **Test package edit for private packages**
  - Create or access a private package
  - Verify edit functionality is available
  - Verify visibility controls work correctly

- [ ] **Test category editing**
  - Open package edit page
  - Change package categories
  - Verify categories are properly validated
  - Verify form state hydration works
  - Save and verify changes persist

- [ ] **Test unauthenticated edit access**
  - Log out
  - Try to access package edit URL directly
  - Verify proper 401 error handling
  - Verify no crashes or infinite loops

- [ ] **Test loading states**
  - Edit a package
  - Verify loading indicators appear appropriately
  - Verify no SSR data loading issues
  - Verify proper error handling for failed loads

### Related Commits:
- `ee71269e` - Fix review comments
- `8e553ae4` - Prevent using .map on undefined
- `aa1fdc29` - Fix styling issues
- `ad2ec6b2` - packageEdit: use two-phase package listing fetch
- `65f74fd8` - packageEdit: don't load data on SSR loader
- `9dd3e05d` - packageEdit: DRY error handling code
- `7ed2988f` - packageEdit: clean up fetched data
- `655cfbea` - packageEdit: show 401 for unauthenticated users
- `860385a1` - Allow moderators to manage packages
- `6864eeba` - Add permissions check for categories
- `15c9c0f2` - Hydrate category form state from loader data
- `08b1448a` - Make edit package visible for private packages

---

## 3. Package Listing & Details Pages

### Test Scenarios:
- [ ] **Test package listing page**
  - Navigate to various package detail pages
  - Verify all package information displays correctly
  - Verify no duplicate API requests
  - Verify loading states work properly
  - Check package version dropdown functionality

- [ ] **Test package version pages**
  - View different versions of a package
  - Verify version-specific data displays correctly
  - Verify no unnecessary community fetches
  - Verify simplified packageVersion.tsx works

- [ ] **Test package listing without community context**
  - Access package endpoints that are not community-scoped
  - Verify proper handling and no errors

- [ ] **Test review information display**
  - View packages with review status
  - Verify review information components render
  - Verify styling is correct
  - Check for undefined status handling

- [ ] **Test management tools visibility**
  - As package owner: verify management tools show
  - As moderator: verify management tools show
  - As regular user: verify management tools hidden
  - Test edit, unlist, and other management actions

- [ ] **Test package listing refactoring**
  - Browse multiple packages
  - Verify data access patterns work correctly
  - Verify no rendering issues or loops

### Related Commits:
- `49893800` - Refactor PackageListing data access and generic isPromise
- `aa1fdc29` - Fix styling issues
- `77541695` - Reduce duplicate requests made in listing's Required tab
- `91b13857` - Reduce duplicate requests made in listing's Required tab
- `d3e48a1e` - Rename component to make the usage clearer
- `2c3bf56d` - Simplify packageVersion.tsx
- `09203be6` - Don't fetch community in packageVersion.tsx
- `c317e17c` - Update data fetching for packageVersion.tsx
- `0a8b5a76` - Add package version support for getPackageListingDetails Dapper method
- `ae11afd3` - Refactor helper functions
- `224077c2` - Use review information components in package listing
- `54d9525f` - Add css styling for review information
- `dd489d0a` - Prevent infinite render loop
- `0349e701` - Move package detail URL & small refactoring
- `45ac56d3` - Update and refactor package listing component
- `0c81670d` - Implement dapper method for listing status
- `e2cf1f65` - Implement function for fetching listing status

---

## 4. Package Dependencies (Required Tab)

### Test Scenarios:
- [ ] **Test Required tab on package pages**
  - Navigate to package detail page
  - Click "Required" tab
  - Verify dependencies list displays correctly
  - Verify no duplicate API requests
  - Verify required indicator shows for required fields

- [ ] **Test Required tab for different package versions**
  - Switch between package versions
  - Check Required tab for each version
  - Verify dependencies update correctly

- [ ] **Test Required tab without community context**
  - Access package version pages without community
  - Check Required tab functionality
  - Verify proper handling

- [ ] **Test combined dependency components**
  - Verify single unified component works
  - Check pagination if applicable
  - Verify loading states

### Related Commits:
- `36e72c46` - feat: add RequiredIndicator component for indicating required fields
- `91b13857` - Reduce duplicate requests made in listing's Required tab
- `c2a01f32` - Combine the three components used to list package's dependencies

---

## 5. Package Reporting

### Test Scenarios:
- [ ] **Test report package as authenticated user**
  - Log in
  - Navigate to any package
  - Click "Report Package" button
  - Verify modal opens with correct width
  - Fill out and submit report form
  - Verify success/error handling

- [ ] **Test report package as unauthenticated user**
  - Log out
  - Navigate to any package
  - Click "Report Package" button
  - Verify proper error message for unauthorized access
  - Verify no crashes

- [ ] **Test report package modal styling**
  - Open report modal
  - Verify modal width is appropriate
  - Verify form fields are properly styled
  - Test on different screen sizes

- [ ] **Test report form validation**
  - Open report modal
  - Try to submit with empty fields
  - Verify validation messages
  - Fill required fields and submit
  - Verify proper submission

### Related Commits:
- `4269bf35` - Fix types and reportform
- `c3c08acb` - Adjust modal widths globally
- `fa721457` - Improve error messaging in ReportPackageForm for unauthorized access

---

## 6. Moderation Tools

### Test Scenarios:
- [ ] **Test moderator package management**
  - Log in as a moderator
  - Navigate to packages you don't own
  - Verify management tools are visible
  - Test package editing as moderator
  - Test package unlisting/moderation actions
  - Verify permissions work correctly

- [ ] **Test non-moderator restrictions**
  - Log in as regular user
  - Navigate to packages you don't own
  - Verify management tools are hidden
  - Verify no access to moderation features

### Related Commits:
- `860385a1` - Allow moderators to manage packages

---

## 7. Team Settings

### Test Scenarios:
- [ ] **Test team profile form (as owner)**
  - Navigate to team settings
  - Go to Profile tab
  - Verify all fields are editable
  - Make changes and save
  - Verify changes persist

- [ ] **Test team profile form (as non-owner member)**
  - Log in as team member (not owner)
  - Navigate to team settings
  - Go to Profile tab
  - Verify form is disabled for non-owners
  - Verify appropriate message is shown

- [ ] **Test team donation link**
  - Go to team profile settings
  - Test setting donation link
  - Test removing donation link (null value)
  - Verify blank/null donation links are handled

- [ ] **Test team disband form**
  - Navigate to team disband page
  - Verify confirmation input is required
  - Verify form validates before submission
  - Verify broken team links are removed
  - Test disband process (if safe to test)

- [ ] **Test team member management**
  - Add a new team member
  - Verify form validation with enhanced useStrongForm
  - Verify member appears in table
  - Edit member permissions
  - Remove a member

- [ ] **Test service accounts**
  - Add a service account
  - View service accounts table
  - Remove a service account with modal
  - Verify modal works correctly

### Related Commits:
- `47e2c336` - Disable team profile form for non-owner members
- `cfe636c3` - feat(forms): enhance useStrongForm with validation, field state, and tests
- `3346451a` - thunderstore-api: allow null values for team donation link
- `64f00935` - Remove broken team links from the team disband page
- `7a931ebe` - Prevent team disband submission until confirmation input validates

---

## 8. Community Pages

### Test Scenarios:
- [ ] **Test community page rendering**
  - Navigate to different community pages
  - Verify page loads correctly
  - Verify package search works
  - Verify filters work

- [ ] **Test community package search**
  - Use search functionality
  - Apply filters
  - Verify results update correctly
  - Check category tag cloud
  - Verify package count display

- [ ] **Test community-scoped vs non-scoped endpoints**
  - Access community-specific package pages
  - Access non-community-scoped package pages
  - Verify routing works correctly
  - Verify disabled endpoints are properly blocked

### Related Commits:
- `c2a01f32` - Combine the three components used to list package's dependencies
- `d41ce511` - Disable package endpoints that are not community-scoped

---

## 9. Wiki Functionality

### Test Scenarios:
- [ ] **Test wiki page viewing**
  - Navigate to package wiki
  - View different wiki pages
  - Verify content renders correctly
  - Verify navigation between pages works

- [ ] **Test wiki first page**
  - Access wiki for package with/without pages
  - Verify first page displays correctly
  - Verify proper empty states

- [ ] **Test wiki page editing**
  - Edit a wiki page
  - Verify editor works correctly
  - Save changes
  - Verify changes appear

- [ ] **Test wiki new page creation**
  - Create a new wiki page
  - Verify form works
  - Submit new page
  - Verify page appears in wiki

- [ ] **Test wiki page deletion**
  - Delete a wiki page
  - Verify confirmation
  - Verify page is removed

### Related Commits:
- `2cbec7e3` - Wiki fixes (#1668)

---

## 10. Forms & Input Components

### Test Scenarios:
- [ ] **Test enhanced useStrongForm**
  - Test forms with field validation
  - Verify field state tracking works
  - Test required field indicators
  - Verify validation messages display
  - Test form submission with errors
  - Test form submission with valid data

- [ ] **Test Switch component**
  - Find and interact with Switch components
  - Verify cursor styles on hover
  - Verify transition animations
  - Test disabled state
  - Verify disabled modifier styling

- [ ] **Test Button components**
  - Find buttons throughout the app
  - Test hover states
  - Test disabled state
  - Verify no hover highlight on disabled buttons
  - Test click functionality

- [ ] **Test TextInput components**
  - Find text input fields
  - Test typing and editing
  - Test disabled state
  - Verify no hover highlight on disabled inputs
  - Test validation states

- [ ] **Test RequiredIndicator component**
  - Find forms with required fields
  - Verify required indicators display
  - Verify styling is correct and consistent

### Related Commits:
- `cfe636c3` - feat(forms): enhance useStrongForm with validation, field state, and tests
- `36e72c46` - feat: add RequiredIndicator component for indicating required fields
- `a4d99349` - Disable hover highlight styles from disabled buttons
- `48b9c8e3` - Disable hover highlight styles from disabled text inputs
- `e1c67b6e` - Enhance Switch component with cursor and transition styles; add 'disabled' modifier support

---

## 11. Navigation & UI Components

### Test Scenarios:
- [ ] **Test navigation menu**
  - Navigate through the app
  - Verify navigation renders correctly
  - Verify navigation wrapper works
  - Test responsive behavior
  - Verify styling updates

- [ ] **Test modal components**
  - Open various modals throughout the app
  - Verify modal width adjustments
  - Test modal closing
  - Verify modal content displays correctly

- [ ] **Test general UI components**
  - Verify alerts display correctly
  - Check avatar rendering
  - Test breadcrumbs navigation
  - Verify cards (community, package) render
  - Test dropdown menus
  - Check icons display
  - Test tooltips
  - Verify tables render correctly

### Related Commits:
- `c3c08acb` - Adjust modal widths globally
- `09fa2644` - Fix TS build errors and Cyberstorm import paths (affects many UI components)

---

## 12. Error Handling & Error Boundaries

### Test Scenarios:
- [ ] **Test RouteErrorBoundary**
  - Trigger an error in a route
  - Verify RouteErrorBoundary catches it
  - Verify proper error display
  - Verify Sentry logging (if logs are accessible)
  - Verify no hydration errors

- [ ] **Test general error handling**
  - Test API errors (404, 500, etc.)
  - Verify ApiError serialization works
  - Verify error messages are user-friendly
  - Test error recovery flows

- [ ] **Test SSR safety**
  - Load pages with JavaScript disabled
  - Verify no hydration errors
  - Verify graceful degradation
  - Re-enable JavaScript and verify functionality

- [ ] **Test error documentation**
  - Review error handling documentation
  - Verify it matches actual behavior

### Related Commits:
- `5003ae5a` - Update data fetching and error handling related documentation
- `75c1dda1` - Add PoC helper for avoiding hydration errors in RouteErrorBoundary
- `4dc9928d` - Improve isApiError
- `65c1f907` - Make ApiError serializable
- `7a38feed` - Replace error boundary in root.tsx with RouteErrorBoundary
- `874b4802` - Log errors in RouteErrorBoundary to Sentry
- `50e74666` - Add RouteErrorBoundary

---

## 13. Beta Switch Functionality

### Test Scenarios:
- [ ] **Test beta switch toggle**
  - Find and use the beta switch
  - Toggle between beta and stable
  - Verify proper initialization
  - Verify SSR safety
  - Verify settings persist across page loads

- [ ] **Test beta features**
  - Enable beta mode
  - Test beta-only features
  - Disable beta mode
  - Verify beta features are hidden

### Related Commits:
- `07ea4c51` - refactor(beta-switch): wrap initialization and improve SSR safety

---

## 14. Code Display & Syntax Highlighting

### Test Scenarios:
- [ ] **Test CodeBox component**
  - View pages with code blocks
  - Verify syntax highlighting works
  - Test different programming languages
  - Verify styling is correct

- [ ] **Test CodeBoxHTML component**
  - Find HTML code blocks
  - Verify they render using CodeBox
  - Verify no visual issues

### Related Commits:
- `38a12071` - Fix CodeBoxHTML's issues by using the CodeBox component with SyntaxHi…
- `3bf9a572` - build(deps): upgrade storybook, react-router and syntax highlighter

---

## 15. Package Upload

### Test Scenarios:
- [ ] **Test package upload flow**
  - Navigate to package upload page
  - Select a package file
  - Verify drag-and-drop works
  - Fill out package information
  - Submit package upload
  - Verify success/error handling

- [ ] **Test upload validation**
  - Try to upload invalid package
  - Verify validation messages
  - Verify proper error handling

### Related Commits:
- `80ade566` - Run pre-commit on all files and fix all tsc -b errors (includes upload files)

---

## 16. Markdown & Content Rendering

### Test Scenarios:
- [ ] **Test markdown rendering**
  - View package README files
  - Verify markdown renders correctly
  - Test various markdown features:
    - Headers
    - Lists
    - Links
    - Code blocks
    - Images
    - Tables

- [ ] **Test content sanitization**
  - Verify HTML is properly sanitized
  - Test XSS prevention
  - Verify safe markdown elements work

- [ ] **Test collapsible content**
  - Find collapsible elements
  - Verify expand/collapse works
  - Test collapsible text components

### Related Commits:
- `80ade566` - Run pre-commit on all files (includes Markdown components)

---

## 17. Dependency Upgrades

### Test Scenarios:
- [ ] **Test with upgraded dependencies**
  - Verify Storybook integration works (if applicable)
  - Test react-router functionality
  - Test syntax highlighter
  - Verify no breaking changes from upgrades
  - Check for any deprecation warnings

### Related Commits:
- `3bf9a572` - build(deps): upgrade storybook, react-router and syntax highlighter

---

## 18. Docker & Build

### Test Scenarios:
- [ ] **Test Docker build** (Development environment only)
  - Build Docker image with updated Dockerfile
  - Verify packages are built correctly
  - Verify container runs successfully
  - Test development environment setup

### Related Commits:
- `a2f4fe31` - Update cyberstorm-remix Dockerfile to include building packages
- `dfd62ab5` - Set up Docker development environment for Cyberstorm Remix

---

## Cross-Functional Test Scenarios

### Browser Compatibility:
- [ ] Test on Chrome/Chromium
- [ ] Test on Firefox
- [ ] Test on Safari (if available)
- [ ] Test on Edge

### Responsive Design:
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Test navigation menu on mobile

### Performance:
- [ ] Check page load times
- [ ] Verify no duplicate API requests
- [ ] Check for memory leaks (long sessions)
- [ ] Verify lazy loading works

### Accessibility:
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify ARIA labels
- [ ] Check color contrast

---

## Testing Priorities

### High Priority (Must Test):
1. Authentication & Session Management
2. Package Editing (especially moderator access)
3. Package Listing & Details Pages
4. Error Handling & Error Boundaries
5. Forms & Input Components
6. Team Settings

### Medium Priority (Should Test):
7. Package Dependencies (Required Tab)
8. Package Reporting
9. Community Pages
10. Navigation & UI Components
11. Moderation Tools

### Low Priority (Nice to Test):
12. Wiki Functionality
13. Beta Switch
14. Code Display
15. Package Upload
16. Markdown Rendering
17. Docker & Build

---

## Notes for QA Testers

1. **Test with different user roles:**
   - Regular user (non-owner)
   - Package owner
   - Team owner
   - Team member (non-owner)
   - Moderator
   - Unauthenticated user

2. **Focus on areas with the most changes:**
   - Package editing has significant changes
   - Error handling has been overhauled
   - Forms have been enhanced
   - Team settings have several fixes

3. **Watch for:**
   - Duplicate API requests (should be reduced)
   - Infinite render loops (should be fixed)
   - 401 error handling (should be graceful)
   - Disabled UI element styling (should not show hover effects)
   - Modal widths (should be adjusted)

4. **Performance checks:**
   - Verify reduced duplicate requests
   - Check loading states
   - Verify no performance regressions

5. **Regression testing:**
   - Ensure existing functionality still works
   - Pay special attention to refactored code
   - Test edge cases
