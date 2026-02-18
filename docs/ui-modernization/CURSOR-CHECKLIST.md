# UI Modernization — Cursor Execution Checklist

## Pre-Flight
- [ ] All files copied to `docs/ui-modernization/`
- [ ] Cursor rule created at `.cursor/rules/ui-modernization.mdc`
- [ ] You have read the component code in `docs/ui-modernization/qr-ui-components.tsx`

---

## Phase 1: Foundation

### Task 1.1: Create Utility Files
**Files to create:**
- `src/lib/formatters.ts` — Add `formatRelativeTime()` function

**Instructions:**
1. Create `src/lib/formatters.ts`
2. Copy the formatRelativeTime function from section 7 of this doc
3. Export it as named export

---

### Task 1.2: Add Animation Styles
**File to modify:** `src/styles/global.css`

**Instructions:**
1. Open `src/styles/global.css`
2. Append the contents of `docs/ui-modernization/qr-ui-animations.css` to the end
3. Save

---

### Task 1.3: Create UI Primitives
**Files to create:**
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/EmptyState.tsx`

**Instructions:**
1. Create both files
2. Copy StatusBadge component from `docs/ui-modernization/qr-ui-components.tsx` (lines 1-35)
3. Copy EmptyState component from `docs/ui-modernization/qr-ui-components.tsx` (lines 37-74)
4. Update imports as needed for your project (Lucide icons path, etc.)

---

## Phase 2: Table Modernization

### Task 2.1: Update AttendeeRow Component
**File to modify:** Your attendee table row component (likely in AdminDashboard or similar)

**Changes to make:**
1. Import StatusBadge: `import { StatusBadge } from '@/components/ui/StatusBadge'`
2. Import formatRelativeTime: `import { formatRelativeTime } from '@/lib/formatters'`
3. Add `group` class to the `<tr>` element
4. Replace status cell:
   - Remove: `{attendee.checkedIn ? 'Checked In' : 'Not Checked In'}`
   - Add: `<StatusBadge status={attendee.checkedIn ? 'checked-in' : 'pending'} />`
5. Add avatar column (before name):
   ```tsx
   <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
     {`${attendee.firstName[0]}${attendee.lastName[0]}`.toUpperCase()}
   </div>
   ```
6. Replace timestamp with: `{formatRelativeTime(attendee.checkedInAt)}`
7. Wrap action buttons in hover-only div:
   ```tsx
   <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
     {/* your action buttons */}
   </div>
   ```

---

### Task 2.2: Add Empty State
**File to modify:** Your attendee list component

**Instructions:**
1. Import EmptyState: `import { EmptyState } from '@/components/ui/EmptyState'`
2. Wrap the table in a conditional:
   ```tsx
   {attendees.length === 0 ? (
     <EmptyState 
       onAddAttendee={() => setShowAddModal(true)} 
       onImportCSV={() => handleImportCSV()} 
     />
   ) : (
     <table>...</table>
   )}
   ```

---

## Phase 3: Header & Stats

### Task 3.1: Update Page Header
**File to modify:** Your main admin page

**Changes:**
1. Replace current header with:
   ```tsx
   <div className="mb-6">
     <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
       Attendees
     </h1>
     <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
       {attendees.length} registered · {attendees.filter(a => a.checkedIn).length} checked in
     </p>
   </div>
   ```

---

### Task 3.2: Create Stats Components (Optional)
**Files to create:**
- `src/components/StatCard.tsx`
- `src/components/CheckInProgress.tsx`

**Instructions:**
1. Create both files
2. Copy from `docs/ui-modernization/qr-ui-components.tsx` sections 9 and 10
3. Add to your page above the table:
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
     <StatCard label="Total Attendees" value={attendees.length} />
     <StatCard label="Checked In" value={checkedInCount} />
     <CheckInProgress checkedIn={checkedInCount} total={attendees.length} />
   </div>
   ```

---

## Phase 4: Search

### Task 4.1: Create Search Component
**File to create:** `src/components/GlobalSearch.tsx`

**Instructions:**
1. Create file
2. Copy from `docs/ui-modernization/qr-ui-components.tsx` section 6
3. Replace your existing search input with this component
4. Wire up the `onSearch` prop to your existing filter logic

---

## Phase 5: Dark Mode (Optional)

### Task 5.1: Add Theme Toggle
**File to create:** `src/components/ThemeToggle.tsx`

**Instructions:**
1. Create simple toggle button that adds/removes `dark` class from document.documentElement
2. Add to header/layout
3. Update html element in your layout to support dark mode classes

---

## Post-Implementation Checklist

- [ ] No TypeScript errors
- [ ] Components render without crashing
- [ ] Status badges show correct colors
- [ ] Hover actions appear on row hover
- [ ] Empty state displays when no attendees
- [ ] Relative timestamps format correctly
- [ ] Search still filters the list
- [ ] Mobile view stacks properly
- [ ] Dark mode classes work (if implemented)

---

## Quick Reference

### Status Badge Colors
- `pending`: slate (gray)
- `checked-in`: emerald (green)  
- `error`: red

### Animation Classes Available
- `status-change` — Flip animation when status updates
- `just-checked-in` — Pulse animation for new check-ins
- `qr-breathing` — Subtle pulse for QR codes
- `live-indicator` — Pulsing dot for live activity
- `skeleton` — Loading placeholder

### Tailwind Classes Used
All components use Tailwind 4 classes. No custom CSS needed beyond the animations file.
