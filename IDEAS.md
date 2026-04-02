# Future Improvement Ideas

Rough backlog of ideas, ordered roughly by effort. Nothing here is committed to.

---

## UX / Forms

- **Trip editing** — currently trips are write-once. Add an edit page or inline editing for name, dates, country, temperature, activities.
- **Duplicate trip** — clone an existing trip as a starting point (same items, new dates/destination).
- **Trip archiving** — mark past trips as archived so the dashboard doesn't get cluttered.
- **Drag-to-reorder items** in the checklist — `@dnd-kit` is already installed, just not wired up.
- **Item notes** — optional free-text note on a TripItem (e.g. "borrow from dad", "buy at destination").
- **Category grouping in checklist** — group TripView checklist by category tag instead of a flat list.
- **Quick-add item from TripView** — add an ad-hoc item to a trip without going through the full inventory drawer.

---

## Packing Intelligence

- **Smart defaults by trip length** — auto-scale quantities for quantity-relevant items based on trip duration (e.g. 7 days → 7 pairs of socks instead of the default).
- **Tag-based exclusion rules** — mark certain items as mutually exclusive (e.g. "if Skiing is selected, exclude Sandals").
- **Item importance levels** — mark items as Essential / Nice-to-have / Optional so the checklist can be filtered.
- **Packing templates** — save a set of selected items + tags as a named template to reuse across trips.

---

## AI

- **Better AI prompt** — include trip duration, country, and specific activities for more targeted suggestions.
- **AI explanation** — show why each suggested item was recommended.
- **Auto-add AI suggestions** — "Add all suggestions" button.
- **AI item categorisation** — when a user adds a custom item name, ask Gemini to suggest which tags to apply.

---

## Inventory Management

- **Bulk tag assignment** — select multiple items and apply/remove a tag to all at once.
- **Item search in drawer** — when editing a trip item, search the full inventory to swap it for a different item.
- **Physical item tracking** — mark items you actually own vs. ones you'd need to buy or borrow.
- **Weight / volume tracking** — optional per-item weight so you can see total pack weight.
- **Item images** — attach a photo to an item (Firebase Storage).

---

## Social / Sharing

- **Share a trip checklist** — generate a read-only public link to a trip's checklist.
- **Export to PDF** — printable packing list.
- **Export to CSV / Apple Notes / Notion** — copy-friendly format.
- **Collaborate on a trip** — invite another user to view/edit a shared trip.

---

## Technical

- **Firestore offline persistence** — enable `enableIndexedDbPersistence` so the app works offline.
- **Optimistic UI throughout** — Inventory and TripView already do this partially; make it consistent.
- **Pagination / virtual list** — inventory list will get slow beyond a few hundred items.
- **E2E tests** — Playwright tests for the critical happy paths (create trip → generate list → check items).
- **Error boundaries per page** — currently one global error boundary; add per-route ones for better recovery.
- **Bundle splitting** — the single 860 kB JS chunk should be split; start with lazy-loading routes.
- **PWA / installable** — add a `manifest.json` and service worker for mobile home screen install.
