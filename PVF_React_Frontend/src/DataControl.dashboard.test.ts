import { beforeEach, describe, expect, it, vi } from 'vitest'

type MockConstraint = {
  field: string
  operator: string
  value: unknown
}

type MockQuery = {
  collectionName: string
  constraints: MockConstraint[]
}

type MockDoc = {
  id: string
  data: () => Record<string, unknown>
}

const firestoreState = vi.hoisted(() => ({
  participants: [] as MockDoc[],
  events: [] as MockDoc[],
  stationStatuses: [] as MockDoc[],
  registrationEvents: [] as MockDoc[],
}))

vi.mock('./firebase', () => ({
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, collectionName: string) => ({ collectionName }),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getCountFromServer: vi.fn((mockQuery: MockQuery) => {
    const source = mockQuery.collectionName === 'events'
      ? firestoreState.events
      : firestoreState.stationStatuses
    const count = source.filter(docSnapshot => matchesConstraints(docSnapshot.data(), mockQuery.constraints)).length
    return Promise.resolve({ data: () => ({ count }) })
  }),
  getDocs: vi.fn((source: { collectionName: string } | MockQuery) => {
    const collectionName = 'collectionName' in source ? source.collectionName : ''
    const constraints = 'constraints' in source ? source.constraints : []
    let docs: MockDoc[]

    if (collectionName === 'participants') {
      docs = firestoreState.participants.filter(d => matchesConstraints(d.data(), constraints))
    } else if (collectionName === 'events') {
      docs = firestoreState.events.filter(d => matchesConstraints(d.data(), constraints))
    } else if (collectionName === 'stationStatuses') {
      docs = firestoreState.stationStatuses.filter(d => matchesConstraints(d.data(), constraints))
    } else if (collectionName === 'registrationEvents') {
      docs = firestoreState.registrationEvents.filter(d => matchesConstraints(d.data(), constraints))
    } else {
      docs = []
    }

    return Promise.resolve({ docs, empty: docs.length === 0 })
  }),
  query: (collectionRef: { collectionName: string }, ...constraints: MockConstraint[]) => ({
    collectionName: collectionRef.collectionName,
    constraints,
  }),
  setDoc: vi.fn(),
  where: (field: string, operator: string, value: unknown) => ({ field, operator, value }),
}))

function createDoc(id: string, data: Record<string, unknown>): MockDoc {
  return { id, data: () => data }
}

function matchesConstraints(data: Record<string, unknown>, constraints: MockConstraint[]) {
  return constraints.every(constraint => {
    if (constraint.operator === '==') return data[constraint.field] === constraint.value
    if (constraint.operator === 'in' && Array.isArray(constraint.value)) return constraint.value.includes(data[constraint.field])
    return false
  })
}

describe('dashboard aggregate data access', () => {
  beforeEach(() => {
    firestoreState.registrationEvents = [
      createDoc('reg-event-july', {
        eventName: 'Community Vision Event',
        eventDate: '2026-07-01',
        createdAt: '2026-07-01T08:00:00.000Z',
        status: 'active',
      }),
      createDoc('reg-event-june', {
        eventName: 'Back to School Event',
        eventDate: '2026-06-01',
        createdAt: '2026-06-01T08:00:00.000Z',
        status: 'active',
      }),
    ]

    // Each participant doc contains an 'id' field used by readCustomersFromFirebase.
    firestoreState.participants = [
      createDoc('participant-1', { id: 'participant-1', Email: 'p1@example.com' }),
      createDoc('participant-2', { id: 'participant-2', Email: 'p2@example.com' }),
      createDoc('participant-3', { id: 'participant-3', Email: 'p3@example.com' }),
      // Legacy participant — event has no registrationEventId stored in Firestore.
      createDoc('participant-legacy', { id: 'participant-legacy', Email: 'legacy@example.com' }),
      // Test participant — event has a non-catalog registrationEventId.
      createDoc('test-participant', { id: 'test-participant', Email: 'test@example.com' }),
    ]

    firestoreState.events = [
      createDoc('event-1', {
        id: 'event-1',
        eventName: 'Community Vision Event',
        eventDate: '2026-07-01',
        createdAt: '2026-07-01T09:00:00.000Z',
        participantId: 'participant-1',
        registrationEventId: 'reg-event-july',
        status: 'active',
      }),
      createDoc('event-2', {
        id: 'event-2',
        eventName: 'Community Vision Event',
        eventDate: '2026-07-01',
        createdAt: '2026-07-01T09:05:00.000Z',
        participantId: 'participant-2',
        registrationEventId: 'reg-event-july',
        status: 'active',
      }),
      createDoc('event-3', {
        id: 'event-3',
        eventName: 'Back to School Event',
        eventDate: '2026-06-01',
        createdAt: '2026-06-01T09:00:00.000Z',
        participantId: 'participant-3',
        registrationEventId: 'reg-event-june',
        status: 'active',
      }),
      // Legacy doc: no registrationEventId in Firestore — must be matched by name.
      createDoc('event-legacy', {
        id: 'event-legacy',
        eventName: 'Community Vision Event',
        eventDate: '2026-07-01',
        createdAt: '2026-07-01T08:00:00.000Z',
        participantId: 'participant-legacy',
        status: 'active',
      }),
      // Test/invalid doc: non-catalog registrationEventId — must be excluded.
      createDoc('event-test-bad-id', {
        id: 'event-test-bad-id',
        eventName: 'Community Vision Event',
        eventDate: '2026-07-01',
        createdAt: '2026-07-01T08:00:00.000Z',
        participantId: 'test-participant',
        registrationEventId: 'non-catalog-id',
        status: 'active',
      }),
    ]

    firestoreState.stationStatuses = [
      createDoc('event-1_check-in', { eventId: 'event-1', participantId: 'participant-1', id: 'check-in', status: 'complete' }),
      createDoc('event-2_check-in', { eventId: 'event-2', participantId: 'participant-2', id: 'check-in', status: 'current' }),
      createDoc('event-1_vision-screening', { eventId: 'event-1', participantId: 'participant-1', id: 'vision-screening', status: 'complete', decision: 'FAIL' }),
      createDoc('event-2_vision-screening', { eventId: 'event-2', participantId: 'participant-2', id: 'vision-screening', status: 'complete', decision: 'PASS' }),
      createDoc('event-1_eye-exam', { eventId: 'event-1', participantId: 'participant-1', id: 'eye-exam', status: 'complete', decision: 'FRAME' }),
      createDoc('event-1_frame-selection', { eventId: 'event-1', participantId: 'participant-1', id: 'frame-selection', status: 'complete' }),
      createDoc('event-3_check-in', { eventId: 'event-3', participantId: 'participant-3', id: 'check-in', status: 'complete' }),
      createDoc('event-3_vision-screening', { eventId: 'event-3', participantId: 'participant-3', id: 'vision-screening', status: 'complete', decision: 'FAIL' }),
      createDoc('event-3_eye-exam', { eventId: 'event-3', participantId: 'participant-3', id: 'eye-exam', status: 'current', decision: 'REFERRAL' }),
    ]
  })

  it('returns event options from the registrationEvents catalog (not the raw events collection)', async () => {
    const { getDashboardEventOptions } = await import('./DataControl')

    await expect(getDashboardEventOptions()).resolves.toEqual([
      {
        id: 'reg-event-july',
        eventName: 'Community Vision Event',
        eventDate: '2026-07-01',
        createdAt: '2026-07-01T08:00:00.000Z',
      },
      {
        id: 'reg-event-june',
        eventName: 'Back to School Event',
        eventDate: '2026-06-01',
        createdAt: '2026-06-01T08:00:00.000Z',
      },
    ])
  })

  it('counts selected-event stats: one per customer, matching by registrationEventId then name for legacy records', async () => {
    const { getDashboardStats } = await import('./DataControl')

    // participant-1 → event-1 (reg-event-july) ✓
    // participant-2 → event-2 (reg-event-july) ✓
    // participant-3 → event-3 (reg-event-june) ✗ (different event)
    // participant-legacy → event-legacy (name match, no registrationEventId) ✓
    // test-participant → event-test-bad-id (non-catalog registrationEventId) ✗
    const result = await getDashboardStats('this', 'reg-event-july', 'Community Vision Event')
    expect(result.registered).toBe(3) // participant-1, participant-2, participant-legacy

    expect(result.checkedIn).toBe(1)   // participant-1 only (event-1 check-in complete)
    expect(result.screened).toBe(2)    // participant-1 (FAIL) + participant-2 (PASS)
    expect(result.passed).toBe(1)      // participant-2
    expect(result.failed).toBe(1)      // participant-1
    expect(result.examCompleted).toBe(1)
    expect(result.rxFrameSelected).toBe(1)
  })

  it('all-events mode counts one participant per customer across all catalog events', async () => {
    const { getDashboardStats } = await import('./DataControl')

    // participant-1 → event-1 (reg-event-july) ✓
    // participant-2 → event-2 (reg-event-july) ✓
    // participant-3 → event-3 (reg-event-june) ✓
    // participant-legacy → event-legacy (name match, no registrationEventId) ✓
    // test-participant → event-test-bad-id (non-catalog registrationEventId) ✗
    const result = await getDashboardStats('all', '', '')
    expect(result.registered).toBe(4)
  })
})
