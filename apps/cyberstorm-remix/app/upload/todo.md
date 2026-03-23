 apps/cyberstorm-remix/app/upload                                                     |   90.64 |    89.33 |   87.05 |   90.64 |                                                                                                                                              
  IntentSwitcher.tsx                                                                  |     100 |      100 |     100 |     100 |                                                                                                                                              
  ManifestConfiguration.tsx                                                           |   90.37 |    82.35 |   77.77 |   90.37 | 122-125,135,144-156                                                                                                                          
  MarkdownConfiguration.tsx                                                           |     100 |      100 |     100 |     100 |                                                                                                                                              
  SubmissionResult.tsx                                                                |     100 |      100 |     100 |     100 |                                                                                                                                              
  TeamSelect.tsx                                                                      |     100 |      100 |     100 |     100 |                                                                                                                                              
  UpdateSourceSelect.tsx                                                              |     100 |      100 |     100 |     100 |                                                                                                                                              
  UploadDropzone.tsx                                                                  |     100 |      100 |     100 |     100 |                                                                                                                                              
  VirtualZipEditor.tsx                                                                |   93.41 |    93.13 |   84.84 |   93.41 | 129,159-161,269-277,280-282,364-370,446-448                                                                                                  
  upload.tsx                                                                          |   86.48 |    70.49 |   78.57 |   86.48 | 54-57,249-259,293-297,307-309,317-319,474-478,516-543,546-554,574-578,598,618-619,687,695-697                                                
  useDependencySearch.ts                                                              |     100 |      100 |     100 |     100 |                                                                                                                                              
  useTeamPackages.ts                                                                  |     100 |      100 |     100 |     100 |                                                                                                                                              
  useUploadActions.ts                                                                 |    71.3 |    70.21 |      75 |    71.3 | 130,160-161,190,214-223,234-245,247-272,335-336,354-355,357-397,401-405                                                                      
  zipUtils.ts                                                                         |     100 |    95.58 |     100 |     100 | 1,101,251

## Goal: 100% Coverage Plan & Priorities

### 1. `useUploadActions.ts` (Largest Gap)
**Current:** ~71% Coverage (untouched API logic)
- **Problem:** Contains vast untested blocks for API requests, package submission, failure cascades, and server polling logic.
- **Action Items:**
  - Mock backend endpoints to replicate:
    - Successful submission to `/api/experimental/submission/`
    - Error responses (e.g. 400 Bad Request, 500 Internal Error)
    - Successful & Failed polling for `/api/experimental/usertask/{task_id}/` (completed, stuck, and failed states)
  - Assert the correct hook states (`isUploading`, `uploadError`, `progress`) based on these mock results.
  - Implement coverage for catching `repackageExistingZip()` failures and cascading them appropriately.

### 2. `upload.tsx` (Complex View Component)
**Current:** ~86% Coverage
- **Problem:** Missing error states, specific form handler steps, and rare validation flows.
- **Action Items:**
  - Trace lines `516-543`, `546-554` (likely form submission validations or specific view renderings).
  - Simulate submission scenarios like "Uploading without a selected team", "Network connection lost", or "Invalid form structure".
  - Write mock-override tests for Dapper/Remix form submit bindings.

### 3. `VirtualZipEditor.tsx` & `VirtualZipEditor.test.tsx` (Component UI Events)
**Current:** ~93% Coverage
- **Problem:** The test for "cancels rename" on the `Escape` key (`it.skip`) is currently skipped because custom `<TextInput>` abstractions inside `@thunderstore/cyberstorm` swallow key bubbling in React Testing Library. 
- **Action Items:**
  - Re-enable the `it.skip` and work around `<TextInput>` event routing. Options:
    - Target the specific internal base-input element (e.g., using `screen.getByRole("textbox")`) instead of a wrapper.
    - Test standard key-down propagation without relying on `userEvent.keyboard` if needed, by dispatching events directly on the raw DOM node elements or mock the underlying UI input element globally.
  - Verify edge cases from lines `269` and `364` (file conflicts, directory renaming boundaries).

### 4. `ManifestConfiguration.tsx` (Specific Logic Gateways)
**Current:** ~90% Coverage
- **Problem:** Small slivers of untouched configuration logic (likely edge case initializations).
- **Action Items:**
  - Map lines `122-125, 135` to the logic blocks verifying version logic overrides or unexpected manifest dependencies payload rendering.

### Development Reminders
- Remember that `zipUtils.ts` has been extensively covered and currently boasts robust mock setups.
- Use `node -e "const fs=require('fs')..."` alongside `yarn coverage apps/cyberstorm-remix/app/upload --coverage.reporter=json` inside `coverage-temp2/coverage-final.json` to generate detailed line AST extraction programmatically.
- For MSW/fetch mocking, ensure robust cleanup in afterEach loops to avoid contaminating node-space for other test suites.   