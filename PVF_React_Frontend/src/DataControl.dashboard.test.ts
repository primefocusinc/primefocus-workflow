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
  events: [] as MockDoc[],
  stationStatuses: [] as MockDoc[],
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
    const docs = collectionName === 'events'
      ? firestoreState.events.filter(docSnapshot => matchesConstraints(docSnapshot.data(), constraints))
      : []

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
  return {
    id,
    data: () => data,
  }
}

function matchesConstraints(data: Record<string, unknown>, constraints: MockConstraint[]) {
  return constraints.every(constraint => {
    if (constraint.operator === '==') {
      return data[constraint.field] === constraint.value
    }

    if (constraint.operator === 'in' && Array.isArray(constraint.value)) {
      return constraint.value.includes(data[constraint.field])
    }

    return false
  })
}

describe('dashboard aggregate data access', () => {
  beforeEach(() => {
    firestoreState.events = [
      createDoc('event-1', {
        id: 'event-1',
        eventName: 'Community Vision Event',
        eventDate: '2026-07-01',
        createdAt: '2026-07-01T09:00:00.000Z',
        participantId: 'participant-1',
      }),
      createDoc('event-2', {
        id: 'event-2',
        eventName: 'Community Vision Event',
        eventDate: '2026-07-01',
        createdAt: '2026-07-01T09:05:00.000Z',
        participantId: 'participant-2',
      }),
      createDoc('event-3', {
        id: 'event-3',
        eventName: 'Back to School Event',
        eventDate: '2026-06-01',
        createdAt: '2026-06-01T09:00:00.000Z',
        participantId: 'participant-3',
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

  it('returns one event option per event name using the newest matching event', async () => {
    const { getDashboardEventOptions } = await import('./DataControl')

    await expect(getDashboardEventOptions()).resolves.toEqual([
      {
        eventName: 'Community Vision Event',
        eventDate: '2026-07-01',
        createdAt: '2026-07-01T09:05:00.000Z',
      },
      {
        eventName: 'Back to School Event',
        eventDate: '2026-06-01',
        createdAt: '2026-06-01T09:00:00.000Z',
      },
    ])
  })

  it('counts selected-event dashboard stats from current events and stationStatuses fields', async () => {
    const { getDashboardStats } = await import('./DataControl')

    await expect(getDashboardStats('this', 'Community Vision Event')).resolves.toEqual({
      registered: 2,
      checkedIn: 1,
      screened: 2,
      passed: 1,
      failed: 1,
      examRouted: 1,
      examCompleted: 1,
      examInQueue: 0,
      referralOut: 0,
      rxFrameSelected: 1,
    })
  })
})
