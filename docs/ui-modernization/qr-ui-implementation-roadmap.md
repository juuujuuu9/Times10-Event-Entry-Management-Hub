# QR Check-In UI — Implementation Roadmap

## Phase 1: Quick Wins (30-60 minutes)

### 1. Add StatusBadges
**File:** `src/components/ui/StatusBadge.tsx`
**Copy:** From `qr-ui-components.tsx` → StatusBadge section
**Replace in:** `AdminDashboard.tsx` (or wherever you render the attendee list)

**Before:**
```tsx
<span>{attendee.checkedIn ? 'Checked In' : 'Not Checked In'}</span>
```

**After:**
```tsx
<StatusBadge status={attendee.checkedIn ? 'checked-in' : 'pending'} />
```

---

### 2. Add Hover Actions to Table
**File:** Your attendee row component
**Copy:** From `qr-ui-components.tsx` → AttendeeRow section
**Key change:** Actions hidden until hover

**To retrofit your existing table:**
1. Wrap your action buttons in a div with:
   ```tsx
   <div className="opacity-0 group-hover:opacity-100 transition-opacity">
   ```
2. Add `group` class to the parent `<tr>`

---

### 3. Empty State
**File:** `src/components/EmptyState.tsx`
**Copy:** From `qr-ui-components.tsx` → EmptyState section
**Usage:** Conditional render when `attendees.length === 0`

---

## Phase 2: Layout Improvements (1-2 hours)

### 4. Global Search with Cmd+K
**File:** `src/components/GlobalSearch.tsx`
**Copy:** From `qr-ui-components.tsx` → GlobalSearch section
**Integration:**
- Replace your current search input
- Wire `onSearch` to your existing filter logic
- Add `fuse.js` if you want fuzzy search:
  ```bash
  npm install fuse.js
  ```

---

### 5. Typography Hierarchy
**In your page/layout component:**

```tsx
// Before
<h1>Attendees</h1>

// After
<div className="mb-6">
  <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
    Attendees
  </h1>
  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
    {attendees.length} registered · {checkedInCount} checked in
  </p>
</div>
```

---

### 6. Stats Cards
**File:** Create `src/components/StatCard.tsx` and `src/components/CheckInProgress.tsx`
**Copy:** From `qr-ui-components.tsx` → StatCard and CheckInProgress sections

**Layout for stats section:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <StatCard 
    label="Total Attendees" 
    value={attendees.length} 
  />
  <StatCard 
    label="Checked In" 
    value={checkedInCount}
    trend="up"
    previousValue={previousEventCheckedIn} // if you track this
  />
  <CheckInProgress 
    checkedIn={checkedInCount} 
    total={attendees.length} 
  />
</div>
```

---

## Phase 3: Polish (2-3 hours)

### 7. Activity Feed
**File:** `src/components/ActivityFeed.tsx`
**Copy:** From `qr-ui-components.tsx` → ActivityItem section

**Data structure you'll need:**
```typescript
interface Activity {
  id: string;
  type: 'check-in' | 'rsvp' | 'email-sent';
  attendeeName: string;
  timestamp: string;
}
```

**Integration:**
- Add activities table to your DB, OR
- Derive from existing data with timestamps
- Poll every 10-30 seconds for updates

---

### 8. Dark Mode
**File:** `src/styles/global.css` or `tailwind.config.js`

You already have Tailwind 4. Add to your root layout:

```tsx
// src/layouts/Layout.astro or root component
<html class="dark" /> // Force dark, OR
<html class={theme} /> // Dynamic
```

**Toggle component:**
```tsx
<button
  onClick={() => document.documentElement.classList.toggle('dark')}
  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
>
  <Sun className="w-5 h-5 hidden dark:block" />
  <Moon className="w-5 h-5 block dark:hidden" />
</button>
```

---

### 9. Add Animations
**File:** `src/styles/animations.css`
**Copy:** From `qr-ui-animations.css`
**Import:** In your root layout or main entry point

---

## Phase 4: Advanced (Optional)

### 10. Command Palette (Full-Featured)
If you want full cmd+k navigation (not just search), use:
```bash
npm install cmdk
```

Reference: https://github.com/pacocoursey/cmdk

### 11. Real-Time Updates
For live activity feed without polling:
- Vercel Server-Sent Events (SSE), OR
- Supabase real-time subscriptions, OR
- Pusher / Ably

### 12. Virtualized Lists
For 1000+ attendees, use `@tanstack/react-virtual`:
```bash
npm install @tanstack/react-virtual
```

---

## File Structure After Implementation

```
src/
├── components/
│   ├── ui/                    # Reusable UI primitives
│   │   ├── StatusBadge.tsx
│   │   ├── Button.tsx         # (if not using existing)
│   │   └── Card.tsx           # (if not using existing)
│   ├── EmptyState.tsx
│   ├── GlobalSearch.tsx
│   ├── AttendeeRow.tsx        # Refactored from AdminDashboard
│   ├── ActivityFeed.tsx
│   ├── StatCard.tsx
│   ├── CheckInProgress.tsx
│   └── ThemeToggle.tsx
├── hooks/
│   ├── useKeyboardShortcut.ts # For cmd+k
│   └── useRelativeTime.ts     # Format "2m ago"
├── styles/
│   ├── global.css
│   └── animations.css         # New
└── lib/
    └── utils.ts               # cn() helper, formatters
```

---

## Priority Checklist

- [ ] StatusBadge component
- [ ] Hover actions on table rows
- [ ] EmptyState for zero attendees
- [ ] Typography hierarchy (title + subtitle)
- [ ] GlobalSearch with cmd+k hint
- [ ] Relative timestamps ("2m ago")
- [ ] Stats cards with trend indicators
- [ ] Check-in progress donut chart
- [ ] Activity feed sidebar
- [ ] Dark mode toggle
- [ ] Animation CSS imported
- [ ] Reduced motion support tested

---

## Testing Checklist

- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] Table actions show on hover
- [ ] Empty state displays when no attendees
- [ ] Cmd+K focuses search
- [ ] Mobile layout works (stack cards, hide sidebar)
- [ ] Reduced motion disables animations
- [ ] Screen reader announces status badges
