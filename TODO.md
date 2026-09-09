# TODO — Review concerns for `fix-participant-filtering`

Findings from reviewing commits `d88336e` and `d8d4ad6` (documented in CHANGES.md)
against the codebase. Build passes and all 11 tests pass; these are correctness,
data-integrity, and maintainability concerns.

## High priority

- [x] **Editing an old email-keyed participant creates a duplicate Firestore document.**
      Resolved: records loaded from Firestore now carry `firestoreDocId` (the actual document
      key), and `saveCustomerToFirebase` writes back to that key instead of assuming the key
      equals the `id` field. New records (no `firestoreDocId`) are keyed by `id` as before.
      A query-before-write approach was rejected because anonymous registration cannot read
      `participants` under the security rules.

- [x] **Per-keystroke Firestore writes with no ordering guarantee.**
      Resolved: event mutations now write only the changed event document via
      `saveParticipantEvent` (instead of rewriting the participant plus all events),
      the event name/date inputs are debounced (600ms), and all saves for a given event
      are serialized through a per-event promise queue so writes cannot complete out of
      order. Pending debounced saves are cancelled on event delete and flushed on unmount.

- [ ] **Delete race condition reduced, not eliminated.**
      Any in-flight `saveCustomerToFirebase` (including `handleAddEventToAll`,
      `Participants.tsx:636`) can resurrect a concurrently deleted participant because
      `setDoc(..., { merge: true })` recreates missing docs. The original "deleted record
      reappears" failure mode is still reachable.

## Medium priority

- [ ] **React key remount hack is a band-aid.**
      The list container is keyed on `participantEventFilterId`
      (`Participants.tsx:1642`), but item keys still include the array index
      (`${customerId || email || "unknown"}-${index}`, line 1650). The stale-DOM behavior can
      recur when the search term changes or participants are added/deleted — those paths get no
      remount. Since saves now guarantee an `id`, use `key={customer.id}` and drop both the
      index suffix and the container-key hack (which also resets scroll position on every
      filter change).

- [ ] **Silent failure on optimistic updates.**
      All Participants.tsx handlers update React state first and only `console.error` on save
      failure (e.g., lines 446-449, 636-642). With `saveCustomerToFirebase` now throwing on a
      missing `id`, a user can see a "successful" edit that was never persisted and vanishes on
      refresh. `handleAddEventToAll`'s `Promise.all` has no partial-failure handling — some
      participants save, some don't, with no rollback or user feedback.
      Fix: surface save errors in the UI and consider reverting optimistic state on failure.

- [ ] **Name-based filter fallback edge cases** (`Participants.tsx:337-344`):
  - Two catalog entries sharing an `eventName` cause legacy records to match both filters.
  - Event names are user-editable per event (`Participants.tsx:2024`); renaming a legacy
    event (no `registrationEventId`) silently drops it from its filter.

## Minor

- [x] `getAllEvents` legacy-backfill inconsistency — moot now that
      `LEGACY_EVENT_NAME_TO_ID` has been removed; no code path backfills `registrationEventId`.
- [ ] `RegistrationSubmissionPayload.requestedEventId` is typed as required `string` but
      populated with `""` (`registrationModel.ts:59,250`) and converted back to `undefined`
      (`registrationModel.ts:313`). Make it `requestedEventId?: string`.
- [ ] No test coverage for the new behavior: `registrationModel.test.ts` never references
      `requestedEventId`/`registrationEventId`, and there are no tests for the filter fallback
      or query-based delete.
