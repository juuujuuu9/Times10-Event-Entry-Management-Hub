# QR Check-In Dashboard — UI Modernization Guide

## Component Architecture

```
DashboardLayout
├── Header
│   ├── EventSelector (dropdown with search)
│   ├── GlobalSearch (cmd+k, full-width on mobile)
│   └── ViewToggle [Comfortable|Compact] + ThemeToggle
├── StatsSection
│   ├── StatCard (animated count-up)
│   │   ├── Sparkline (mini chart)
│   │   └── TrendIndicator (↑↓ vs previous event)
│   └── CheckInProgress (donut chart)
├── MainContent
│   ├── ActionBar
│   │   ├── PrimaryButton [Add Attendee]
│   │   ├── SecondaryButton [Import CSV]
│   │   └── FilterChips [All|Checked In|Pending]
│   ├── AttendeeTable (or CardGrid based on view)
│   │   ├── TableHeader (sticky, sortable)
│   │   └── AttendeeRow
│   │       ├── Avatar (initials or placeholder)
│   │       ├── Name/Email
│   │       ├── StatusBadge
│   │       ├── Timestamp (relative)
│   │       └── Actions (hover-only)
│   └── EmptyState (conditional)
├── ActivitySidebar (collapsible on mobile)
│   ├── ActivityFeed
│   │   └── ActivityItem
│   │       ├── Avatar
│   │       ├── Action text
│   │       └── Relative timestamp
│   └── LiveIndicator (pulse dot when scanning)
└── QRDisplayModal (for sharing/screenshots)
    ├── Large QR Code (hero size)
    ├── Event name + date
    └── Download/Share buttons
```

---

## Key Components

### 1. StatusBadge
**Pattern:** Badge with semantic color
**States:** pending, checked-in, error

### 2. AttendeeRow
**Pattern:** Table row with hover reveal
**Interactions:**
- Hover: show actions
- Click: expand detail drawer (optional)
- Checkbox: bulk select mode

### 3. ActivityFeed
**Pattern:** Reverse-chronological list with live updates
**Features:**
- Auto-scroll to top on new item
- Group rapid events ("3 people checked in")
- Relative timestamps (2 min ago)

### 4. GlobalSearch
**Pattern:** Command palette style
**Trigger:** Click or Cmd+K
**Results:** Fuzzy match on name, email, company

---

## Color System (Tailwind)

```javascript
// Status colors
const statusColors = {
  pending:    'bg-slate-100 text-slate-700 border-slate-200',
  checkedIn:  'bg-emerald-100 text-emerald-800 border-emerald-200',
  error:      'bg-red-100 text-red-800 border-red-200',
}

// Priority accent (for QR, primary actions)
const accent = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-white border border-slate-300 hover:bg-slate-50',
  ghost:     'hover:bg-slate-100 text-slate-700',
}

// Dark mode overrides
const darkMode = {
  bg:        'dark:bg-slate-900',
  surface:   'dark:bg-slate-800',
  border:    'dark:border-slate-700',
  text:      'dark:text-slate-100',
  muted:     'dark:text-slate-400',
}
```

---

## Animation Specs

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Row hover   | 150ms    | ease-out |
| Status flip | 300ms    | cubic-bezier(0.4, 0, 0.2, 1) |
| Toast in    | 200ms    | ease-out |
| Modal       | 200ms    | ease-in-out |
| Count-up    | 600ms    | ease-out |

---

## Responsive Breakpoints

- **Mobile (<640px):** Card grid view, stacked stats, hidden sidebar
- **Tablet (640-1024px):** Compact table, collapsible sidebar
- **Desktop (>1024px):** Full table, persistent sidebar, comfortable spacing

---

## Accessibility Requirements

- All interactive elements: focus-visible ring
- Status badges: aria-label describing state
- Table: proper thead/tbody, scope on headers
- Cmd+K: aria-live region for result count
- Reduced motion: respect prefers-reduced-motion
