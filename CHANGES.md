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
- Old Firestore records that predate this change have no `registrationEventId`; they are matched in the Participants filter by `eventName` instead (see below).

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

Participant event records created before this change have no `registrationEventId` and are matched in the filter by exact `eventName`. If an event name is ever changed in the catalog after participants have already registered, those older records will no longer match the filter for that event.

---

## 2026-09-09 — Participant Delete Fix

### Problem

Deleting a participant from the Participants page appeared to work (the confirmation dialog fired and the participant disappeared from the list) but the record reappeared within a second on every attempt.

#### Root causes

1. **Wrong Firestore document key** — Older participant records were saved to Firestore using the participant's email address as the document key, not the `participant-{name}-{timestamp}` ID stored in the `id` field inside the document. `deleteCustomerById` was constructing the delete reference from the `id` field value, which pointed to a non-existent document. Firestore silently succeeds when deleting a non-existent document, so no error was raised.

2. **Bulk re-save race condition** — Every station update, event update, and event delete called `saveCustomers(nextCustomers)`, which re-wrote all participants to Firestore. Any of these calls in-flight at the time of a delete would re-create the deleted participant.

3. **Email used as document ID fallback** — `saveCustomerToFirebase` fell back to using the participant's email as the Firestore document key when no `id` was present, perpetuating the mismatch for any new records saved without an `id`.

### Changes

#### `src/DataControl.ts`

- `deleteCustomerById` now queries Firestore for documents where the `id` field matches the participant ID, then deletes the actual document reference(s) found. Falls back to a direct key lookup if no match is found via query. This handles both old email-keyed records and new ID-keyed records.
- `saveCustomerToFirebase` no longer falls back to email as the Firestore document key. A missing `id` now throws an error rather than silently using the email.
- `saveCustomerToFirebase` is now exported so individual saves can be called directly.

#### `src/pages/Participants.tsx`

- All calls to `saveCustomers(nextCustomers)` (which re-wrote every participant on every small change) replaced with targeted `saveCustomerToFirebase(updatedCustomer)` calls that only write the affected participant. The one exception is `handleAddEventToAll`, which intentionally saves all participants in parallel.

### Notes

Old participant records in Firestore keyed by email will be deleted correctly by the query-based approach. However, they will continue to exist under their email key until deleted — no migration is needed, but be aware that the Firestore `participants` collection may contain a mix of email-keyed and ID-keyed documents until old records are cleaned up.

---

## 2026-09-09 — Save Writes Back to the Original Document Key

### Problem

`saveCustomerToFirebase` always wrote to `participants/{id}`. For old records keyed by email (with a different `participant-...` value in the `id` field), the first edit or station update created a second document under the ID key while the email-keyed document remained, producing duplicate participants on the next load.

### Changes

#### `src/DataControl.ts`

- `CustomerRecord` gained a `firestoreDocId` field, populated at load time with the actual Firestore document key the record came from. It is stripped from the payload before saving.
- `saveCustomerToFirebase` now writes to `firestoreDocId` when present, falling back to the participant `id` for new records. Edits to legacy email-keyed records therefore update the existing document in place instead of creating a duplicate.
- A query-before-write lookup was deliberately not used: public registration runs unauthenticated and cannot read the `participants` collection under the security rules.
