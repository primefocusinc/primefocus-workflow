# Changelog

## 2026-09-09 — Participants Page Event Filter Fix

### Problem

The events filter dropdown on the Participants page was showing a large number of duplicate or near-identical entries. Additionally, selecting an event from the filter did not correctly narrow the participant list.

#### Root causes

1. **Duplicate dropdown entries** — The filter dropdown was built by merging two sources: the `registrationEvents` catalog (admin-managed named events) and every individual participant `EventRecord` loaded from Firestore. Since each registration submission creates a new `EventRecord` with a unique ID, the dropdown gained one entry per registered participant, all displaying the same event name and date.

2. **Filter not working** — The filter matched participants by comparing `event.id === participantEventFilterId`. However, participant `EventRecord` IDs are unique per submission (formatted as `{email}-{timestamp}`), and never equal a catalog entry ID, so no participants ever matched.

3. **Stale DOM nodes** — When the filter changed, React was reusing old list item DOM nodes due to key collisions in the participant list (multiple records with no `id` or `email` shared the same React key), causing visually incorrect results even when the underlying data was correct.

4. **No stable link between participant events and catalog entries** — `EventRecord` had no field referencing the `registrationEvents` catalog entry it was created from, making reliable filtering impossible for existing data.

---

### Changes

#### `src/DataControl.ts`

- Added optional `registrationEventId?: string` field to the `EventRecord` interface.
- Added a `LEGACY_EVENT_NAME_TO_ID` map covering the two existing events, used at load time to backfill `registrationEventId` on old Firestore records that predate this change:
  - `"Vision Day- Sept 12"` → `registration-event-1784561157803`
  - `"Vision for Success Back to School Kickoff"` → `registration-event-1784561110683`
- When joining event documents to participants, `registrationEventId` is resolved from the stored value or the legacy map.

#### `src/registrationModel.ts`

- Added `requestedEventId: string` to `RegistrationSubmissionPayload`.
- `createRegistrationSubmissionPayload` now accepts an optional `requestedEventId` parameter.
- `buildRegistrationEvent` writes `registrationEventId` onto new `EventRecord` objects.

#### `src/pages/Registration.tsx`

- Passes `selectedEvent?.id` as `requestedEventId` when building the submission payload, so all new registrations are linked to the catalog entry by ID.

#### `src/pages/Participants.tsx`

- **Filter dropdown** now only lists `registrationEvents` catalog entries. Per-participant `EventRecord`s are no longer included.
- **Filter logic** matches participants by `registrationEventId` first; falls back to matching by `eventName` for old records that have no `registrationEventId`.
- **`buildNewEvent`**, **`handleAddEvent`**, and **`handleAddEventToAll`** all pass the selected catalog entry's `id` as `registrationEventId` when creating events through the admin UI.
- **React key fix** — the participant list container is keyed on `participantEventFilterId`, forcing a full remount when the filter changes and preventing stale DOM nodes from appearing in the list.

---

### Notes for future events

When a new `registrationEvents` catalog entry is created, existing participant records created under a different name will not automatically match it via the legacy map. If event names are ever changed in the catalog after participants have already registered, add the old name and new catalog ID to `LEGACY_EVENT_NAME_TO_ID` in `DataControl.ts` to maintain filter compatibility.
