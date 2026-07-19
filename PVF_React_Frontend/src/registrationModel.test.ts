import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  adultParticipantType,
  childParticipantType,
  createCustomerRecordFromPayload,
  createInitialRegistrationForm,
  createParticipantId,
  createRegistrationSubmissionPayload,
  isValidEmail,
  isValidPhoneNumber,
  normalizeEmail,
  normalizePhoneNumber,
  type RegistrationForm,
} from './registrationModel'

const preparedAt = '2026-02-03T04:05:06.000Z'

function buildCompleteForm(overrides: Partial<RegistrationForm> = {}): RegistrationForm {
  return {
    ...createInitialRegistrationForm(),
    participantType: childParticipantType,
    firstName: '  Jamie  ',
    lastName: '  Rivera  ',
    dateOfBirth: '2015-04-12',
    age: '10',
    gender: 'Nonbinary',
    race: 'Prefer not to say',
    ethnicity: 'Hispanic or Latino',
    primaryLanguage: 'English',
    guardianName: '  Alex Rivera  ',
    guardianRelationship: 'Parent',
    guardianPhone: '+1 (614) 555-0189',
    guardianEmail: '  FAMILY@Example.COM ',
    streetAddress: '  123 Main St  ',
    city: '  Columbus  ',
    state: 'OH',
    zipCode: '43215',
    preferredCommunication: 'Email',
    schoolName: '  North Elementary  ',
    schoolDistrict: 'Columbus City Schools',
    currentGrade: '5',
    wearsGlasses: 'Yes',
    glassesStatus: 'Broken',
    wearsContacts: 'No',
    lastEyeExam: '2025-03-01',
    eyeCareProvider: '  Central Eye Care  ',
    toldNeedsGlasses: 'Yes',
    currentConcerns: ['Blurry vision'],
    currentConcernsOther: '  Light sensitivity  ',
    visionInsurance: 'No',
    medicalInsuranceProvider: '  Care Plan  ',
    resourceInterests: ['Youth Programs'],
    resourceOther: '  Tutoring  ',
    referralSource: 'School',
    consentParticipate: true,
    communicationAuthorization: true,
    acknowledgement: true,
    printedName: '  Alex Rivera  ',
    signatureDate: '2026-02-03',
    ...overrides,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('registration field normalization and validation', () => {
  it('normalizes contact fields without changing already usable values', () => {
    expect(normalizePhoneNumber('+1 (614) 555-0189')).toBe('6145550189')
    expect(normalizePhoneNumber('6145550189')).toBe('6145550189')
    expect(normalizeEmail('  FAMILY@Example.COM ')).toBe('family@example.com')
  })

  it('accepts expected phone and email formats and rejects incomplete values', () => {
    expect(isValidPhoneNumber('(614) 555-0189')).toBe(true)
    expect(isValidPhoneNumber('1-614-555-0189')).toBe(true)
    expect(isValidPhoneNumber('614-555')).toBe(false)
    expect(isValidEmail('family@example.com')).toBe(true)
    expect(isValidEmail('family.example.com')).toBe(false)
  })
})

describe('createRegistrationSubmissionPayload', () => {
  it('creates a normalized child participant payload with guardian and school details', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(preparedAt))

    const payload = createRegistrationSubmissionPayload(buildCompleteForm())

    expect(payload.submissionMeta).toEqual({
      source: 'public-registration-page',
      preparedAt,
      clientVersion: 'registration-page-v1',
    })
    expect(payload.participant).toMatchObject({
      id: 'participant-jamie-rivera-20260203040506',
      participantType: childParticipantType,
      firstName: 'Jamie',
      lastName: 'Rivera',
      ageAtEvent: 10,
      checkedIn: false,
      contact: {
        preferredCommunication: 'Email',
        phoneNumber: '6145550189',
        email: 'family@example.com',
      },
      guardian: {
        name: 'Alex Rivera',
        relationship: 'Parent',
        phoneNumber: '6145550189',
        email: 'family@example.com',
      },
      address: {
        streetAddress: '123 Main St',
        city: 'Columbus',
        state: 'OH',
        zipCode: '43215',
      },
      school: {
        name: 'North Elementary',
        district: 'Columbus City Schools',
        currentGrade: '5',
      },
      consents: {
        consentToParticipate: true,
        photoVideoRelease: false,
        communicationAuthorization: true,
        acknowledgement: true,
        printedName: 'Alex Rivera',
        signatureDate: '2026-02-03',
      },
    })
  })

  it('clears child-only data for adult participants and stores invalid age as null', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(preparedAt))

    const payload = createRegistrationSubmissionPayload(buildCompleteForm({
      participantType: adultParticipantType,
      age: 'unknown',
    }))

    expect(payload.participant.ageAtEvent).toBeNull()
    expect(payload.participant.guardian).toEqual({
      name: '',
      relationship: '',
      phoneNumber: '',
      email: '',
    })
    expect(payload.participant.school).toEqual({
      name: '',
      district: '',
      currentGrade: '',
    })
  })
})

describe('Firestore customer record preparation', () => {
  it('maps a payload into the customer shape with an initial active event and station statuses', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(preparedAt))

    const payload = createRegistrationSubmissionPayload(buildCompleteForm())
    const customer = createCustomerRecordFromPayload(payload)
    const event = customer.Events?.[0]

    expect(customer).toMatchObject({
      id: 'participant-jamie-rivera-20260203040506',
      Email: 'family@example.com',
      'First Name': 'Jamie',
      'Last Name': 'Rivera',
      'Phone Number': '6145550189',
      'Parent/Guardian Email': 'family@example.com',
      participant: payload.participant,
    })
    expect(event).toMatchObject({
      id: 'family@example.com-1770091506000',
      participantId: payload.participant.id,
      participantEmail: 'family@example.com',
      eventName: 'Community Vision Event',
      eventDate: '2026-02-03',
      status: 'active',
    })
    expect(event?.stationStatuses.map((station) => station.id)).toEqual([
      'check-in',
      'vision-screening',
      'eye-exam',
      'frame-selection',
      'vision-success',
    ])
    expect(event?.stationStatuses[0]?.status).toBe('current')
  })
})

describe('createParticipantId', () => {
  it('falls back to a generic slug when names contain no usable characters', () => {
    expect(createParticipantId(buildCompleteForm({ firstName: ' ! ', lastName: ' ? ' }), preparedAt))
      .toBe('participant-registration-20260203040506')
  })
})
