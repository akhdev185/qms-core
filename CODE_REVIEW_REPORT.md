# QMS Codebase Code Review Report

**Date:** April 5th, 2026  
**Reviewer:** Kilo (⚡)  
**Scope:** `src/components/`, `src/lib/`, `src/pages/`  
**Total Lines:** ~22,358

---

## Summary

| Category | Issues Found |
|----------|-------------|
| Errors | 19 |
| Warnings | 12 |
| `any` type usage | 16+ locations |
| Missing error handling | 8+ locations |
| Performance opportunities | Multiple |

---

## 1. Code Quality Issues

### 1.1 Excessive `any` Type Usage (16+ locations)

**Impact:** TypeScript loses type safety, runtime errors likely.

| File | Line | Issue |
|------|------|-------|
| `src/components/layout/Sidebar.tsx` | 68 | `any` in event handler |
| `src/components/records/RecordCard.tsx` | 45 | `const review: any = ...` |
| `src/components/records/RecordsTable.tsx` | 154 | Column type `any` |
| `src/pages/ProjectDetailPage.tsx` | 51, 64, 67 | Multiple `any` types |
| `src/pages/ProjectsPage.tsx` | 55 | Filter type `any` |
| `src/pages/AuditPage.tsx` | 96 | Event handler `any` |
| `src/pages/AdminAccounts.tsx` | 85 | User type `any` |

**Recommendation:** Define proper interfaces for all data structures.

---

### 1.2 Empty Catch Blocks / Silent Error Swallowing

**Impact:** Errors hidden, debugging difficult.

| File | Line | Issue |
|------|------|-------|
| `src/lib/driveService.ts` | 383 | Empty catch: `catch (e) { }` |
| `src/lib/driveService.ts` | 406, 444, 514 | Unnecessary try/catch wrappers |
| `src/lib/googleSheets.ts` | 374, 675 | Unnecessary try/catch wrappers |

**Example (driveService.ts:383):**
```typescript
} catch (e) { }  // SILENTLY SWALLOWS ERROR!
return "Unknown";
```

**Recommendation:** Log errors or return meaningful error states.

---

### 1.3 React Hooks Dependencies Missing

| File | Line | Warning |
|------|------|---------|
| `src/components/layout/Sidebar.tsx` | 83 | `useEffect` missing `expandedItems` |
| `src/components/records/RecordBrowser.tsx` | 85 | `useEffect` missing `files.length`, `loadFiles` |
| `src/pages/AuditPage.tsx` | 338 | `useMemo` missing `dateFilter`, `projectFilter`, `yearFilter` |
| `src/pages/ArchivePage.tsx` | 58 | `useEffect` missing `loadArchivedFiles`, `toast` |

**Impact:** Stale closures, bugs that appear randomly.

---

## 2. Performance Improvements

### 2.1 Low Memoization Ratio

- **useState:** 241 usages
- **useMemo/useCallback:** 68 usages (~28%)

**Recommendation:** Add memoization for:
- Complex filtered lists
- Event handlers passed to child components
- Expensive computations in list renders

### 2.2 RecordsTable Potential Re-renders

The `RecordsTable` component renders potentially large datasets without virtualization.

```typescript
// Current: renders all rows at once
// Recommended: use react-window for 100+ rows
```

---

## 3. Security Issues

### 3.1 Limited Findings ✅

- **No `eval()` usage** - Good
- **No hardcoded secrets** - Good
- **OAuth flow looks secure** - Token handled server-side

### 3.2 Notes of Concern

| File | Line | Note |
|------|------|------|
| `src/lib/auth.ts` | 17 | Generic error message, may expose internal details |
| `src/components/ui/chart.tsx` | 70 | `dangerouslySetInnerHTML` for dynamic CSS (low risk, used for theming) |

---

## 4. Missing Error Handling

### 4.1 Async Handlers Without try/catch

| File | Function | Issue |
|------|----------|-------|
| `src/pages/RecordDetail.tsx` | `handleAuditStatusChange` | No error handling |
| `src/pages/RecordDetail.tsx` | `handleReviewedChange` | No error handling |
| `src/pages/RecordDetail.tsx` | `handleSaveReviewer` | No error handling |

**Example (RecordDetail.tsx:62-66):**
```typescript
const handleAuditStatusChange = async (newStatus: string) => {
  if (!record) return;
  await updateRecord.mutateAsync({  // Can fail silently!
    rowIndex: record.rowIndex,
    field: "auditStatus",
    value: newStatus,
  });
};
```

**Recommendation:** Wrap in try/catch with toast notifications.

---

### 4.2 Generic Error Messages

Multiple files use `console.error("Error")` without the actual error:

```typescript
// Poor
console.error("Error");

// Better
console.error("Failed to load files:", error);
```

---

## 5. Unused Imports / Dead Code

### 5.1 Fast Refresh Warnings

Fast refresh works best when files export only components. These files export both components and utilities:

- `src/components/ui/ErrorBoundary.tsx` (line 60)
- `src/components/ui/badge.tsx` (line 29)
- `src/components/ui/button.tsx` (line 47)
- `src/components/ui/form.tsx` (line 129)
- `src/components/ui/navigation-menu.tsx` (line 111)
- `src/components/ui/sidebar.tsx` (line 636)
- `src/components/ui/textarea.tsx` (line 5 - empty interface)
- `src/components/ui/toggle.tsx` (line 37)

**Recommendation:** Split utilities into separate files.

---

### 5.2 Unused Imports

No significant unused imports found - imports are being used appropriately.

---

## 6. Anti-Patterns

### 6.1 Non-Atomic State Updates

```typescript
// Current pattern (risky)
await updateRecord.mutateAsync({...});  // call 1
await updateRecord.mutateAsync({...});  // call 2
```

**Issue:** If second call fails, data is in inconsistent state.

**Recommendation:** Batch updates into single operation if possible.

---

### 6.2 Magic Strings

```typescript
value: checked ? "TRUE" : "FALSE"  // Hardcoded strings
```

**Recommendation:** Use constants:
```typescript
const TRUE = "TRUE" as const;
const FALSE = "FALSE" as const;
```

---

## Priority Fix Recommendations

### 🔴 High Priority
1. **Fix empty catch blocks** (driveService.ts:383) - Silent failures
2. **Add try/catch to async handlers** (RecordDetail.tsx) - User feedback missing
3. **Remove `any` from RecordCard.tsx:45** - Type safety

### 🟡 Medium Priority
4. **Add memoization** to filtered lists in AuditPage, RecordsTable
5. **Fix React hooks dependencies** to avoid stale closure bugs
6. **Improve error messages** - log actual errors, not just "Error"

### 🟢 Low Priority
7. Split utility exports from component files
8. Add constants for magic strings
9. Consider virtualization for large tables

---

*Generated by Kilo (⚡)*