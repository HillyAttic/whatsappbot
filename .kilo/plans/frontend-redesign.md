# Plan: Improve WhatsApp Bot Admin Frontend

## Problem Summary
1. **Redirect issue**: `/admin/clients` page redirects to `/admin/clients/[id]/documents` on a separate page when clicking "Documents" instead of showing documents inline
2. **Two parallel implementations**: The monolithic `/admin` page already has inline client+document management, but the component-based `/admin/clients` page doesn't
3. **Basic UI**: Current styling is minimal — plain HTML tables, no animations, generic Tailwind defaults, no personality

## Design Direction
**Refined dark sidebar + light content dashboard** — Clean, professional admin panel with a charcoal/slate sidebar, soft white content area, card-based client list, smooth transitions, and polished form elements. Typography using distinctive font pairing. Inline document management with slide-in panel animation.

## Implementation Plan

### 1. Rewrite `app/admin/page.tsx` — Main Dashboard (Single-Window)
- **Left sidebar** (dark charcoal): Logo/title, client list as selectable cards with avatar initials, "Add Client" button
- **Main content area** (light): When a client is selected, show their documents inline in a panel with add/edit/delete
- **No page navigation** — everything happens in this single view
- **Header bar**: Client name breadcrumb, sign out button
- Use the existing components (`ClientForm`, `DocumentForm`, `ConfirmDialog`) with modal overlays for forms
- Auth token included in all API calls (using `useAuth().getToken()`)

### 2. Update `components/admin/ClientList.tsx` — Card-Based Client List
- Replace HTML table with card-style list items
- Each card shows avatar initials circle, name, phone
- Active/selected state with accent highlight
- Hover micro-interaction
- Remove `onViewDocuments` redirect — replace with `onSelect` for inline selection

### 3. Update `components/admin/DocumentList.tsx` — Polished Document Table
- Improve table styling with alternating rows, better spacing
- Add file type icon/badge
- Smooth enter animation for rows
- Better empty state with illustration text

### 4. Update `components/admin/ConfirmDialog.tsx` — Modal with Animation
- Add backdrop blur effect
- Scale-in animation for dialog
- Better button styling

### 5. Update `components/admin/ClientForm.tsx` & `components/admin/DocumentForm.tsx`
- Better input styling with focus rings
- Improved labels and spacing
- Consistent button styling

### 6. Update `app/page.tsx` — Login Page
- Polished login card with branding
- Better input styling
- Subtle background pattern or gradient

### 7. Update `app/globals.css` — Custom Styles & Animations
- Add CSS custom properties for consistent theming
- Slide-in panel animation
- Fade-in/scale-in for modals
- Smooth transitions throughout

### 8. Update `tailwind.config.ts` — Extended Theme
- Custom color palette (charcoal sidebar, accent colors)
- Custom font family configuration

### 9. Remove dead routes
- Remove `app/admin/clients/page.tsx` and `app/admin/clients/[id]/documents/page.tsx` since all management is now in the single `/admin` page

## Files to Modify
- `app/admin/page.tsx` — Complete rewrite (main dashboard)
- `app/page.tsx` — Login page polish
- `app/globals.css` — Custom animations & variables
- `tailwind.config.ts` — Extended theme
- `components/admin/ClientList.tsx` — Card-based redesign
- `components/admin/DocumentList.tsx` — Polished table
- `components/admin/ConfirmDialog.tsx` — Animated modal
- `components/admin/ClientForm.tsx` — Better styling
- `components/admin/DocumentForm.tsx` — Better styling

## Files to Remove
- `app/admin/clients/page.tsx`
- `app/admin/clients/[id]/documents/page.tsx`

## Verification
- Run `npm run build` to ensure no build errors
- Run `npm run lint` to check for lint issues
- Visual inspection: single-window flow works — clicking a client shows documents inline, no page redirects
