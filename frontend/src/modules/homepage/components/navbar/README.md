# Navbar Module

## File Structure

```
Navbar.tsx                  ← ENTRY POINT — thin shell, only state + layout
navbar/
  nav.constants.ts          ← Nav link data (labels, hrefs, mega menu items)
  NavDesktopLinks.tsx       ← Desktop nav pills + mega menu (lg+ only)
  NavUserMenu.tsx           ← Desktop user icon + dropdown (lg+ only)
  NavMobileDrawer.tsx       ← Mobile slide-in drawer (hidden on lg+)
```

---

## Want to change something?

| Task | File to edit |
|---|---|
| Add / remove a nav link | `navbar/nav.constants.ts` |
| Change desktop nav style (hover pill, color) | `navbar/NavDesktopLinks.tsx` |
| Add item to mega menu (e.g. new helmet subcategory) | `navbar/nav.constants.ts` → `megaMenuItems` array |
| Change mobile drawer layout / animation | `navbar/NavMobileDrawer.tsx` |
| Change user dropdown (add Wishlist, Track Order link) | `navbar/NavUserMenu.tsx` |
| Change logo size, cart icon, hamburger button | `Navbar.tsx` (right actions section) |
| Change scroll behavior (sticky vs fixed) | `Navbar.tsx` → `theme` prop |

---

## Theme Prop

```tsx
<Navbar theme="dark" />   // Homepage — transparent at top, white on scroll
<Navbar theme="light" />  // All other pages — always white
```

---

## Mobile vs Desktop Split

| Component | Mobile (< lg) | Desktop (lg+) |
|---|---|---|
| `NavDesktopLinks` | `hidden` | `flex` |
| `NavUserMenu` | `hidden` | `block` |
| `NavMobileDrawer` | visible (slide-in) | never rendered |
| Hamburger button | visible | `hidden` |
| Search bar | hidden on xs, visible sm+ | always visible |
