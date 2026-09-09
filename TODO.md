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

- [x] **Delete race condition reduced, not eliminated.**
      Fixed: `deletedParticipantIds` ref tracks IDs deleted in the current session.
      `handleDeleteParticipant` marks the ID before awaiting Firestore (and removes it
      on failure). `handleSave` checks the set before calling `saveCustomerToFirebase`
      and skips the write if the participant has been deleted, preventing the
      `setDoc(merge:true)` resurrection.

## Medium priority

- [x] **React key remount hack is a band-aid.**
      Fixed: removed `key={participantEventFilterId}` from the list container `<div>`
      (scroll position no longer resets on filter change) and changed item keys from
      `${customerId || email || "unknown"}-${index}` to `key={customer.id}` (stable,
      index-free identity). Participants always carry an `id` so the fallback chain
      is no longer needed.

- [x] **Silent failure on optimistic updates.**
      Fixed: added `saveError` state rendered as a banner in the detail panel.
      `handleSave`, `handleDeleteEvent`, `handleAddEventToAll`, and `enqueueEventSave`
      (covering debounced event saves) all set a user-visible message on failure.
      The error clears when a new action starts or the selected participant changes.

- [x] **Name-based filter fallback edge cases** (`Participants.tsx:337-344`):
  - Two catalog entries sharing an `eventName` causing legacy records to match both
    filters is a data-quality issue at the admin level; no code fix applied.
  - Renaming a legacy event dropping it from its filter: fixed in `updateEvent` —
    when `eventName` is changed on an event with no `registrationEventId`, the new
    name is matched against the catalog and `registrationEventId` is backfilled if
    found, locking the record to the stable ID path going forward.

## Minor

- [x] `getAllEvents` legacy-backfill inconsistency — moot now that
      `LEGACY_EVENT_NAME_TO_ID` has been removed; no code path backfills `registrationEventId`.
- [x] `RegistrationSubmissionPayload.requestedEventId` is typed as required `string` but
      populated with `""` (`registrationModel.ts:59,250`) and converted back to `undefined`
      (`registrationModel.ts:313`). Made it `requestedEventId?: string`; the payload now
      carries `undefined` when no event ID is known, and the consumer reads it directly.
- [x] No test coverage for the new behavior: added two tests in `registrationModel.test.ts`
      covering `requestedEventId`/`registrationEventId` — one asserting the field is absent
      when no event ID is provided, one asserting it propagates correctly when supplied.
      Filter fallback is a pure UI concern (no pure-function test surface); query-based
      delete is a Firestore integration concern outside unit test scope.
