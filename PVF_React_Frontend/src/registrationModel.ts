import type { CustomerRecord, EventRecord, ParticipantProfile, StationStatus } from './DataControl'

export type RegistrationForm = {
  event: string
  participantType: string
  firstName: string
  lastName: string
  dateOfBirth: string
  age: string
  gender: string
  race: string
  ethnicity: string
  primaryLanguage: string
  veteranStatus: string
  lgbtqIdentity: string
  disabilityStatus: string
  guardianName: string
  guardianRelationship: string
  guardianPhone: string
  guardianEmail: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  preferredCommunication: string
  schoolName: string
  schoolDistrict: string
  currentGrade: string
  wearsGlasses: string
  glassesStatus: string
  glassesStatusOther: string
  wearsContacts: string
  lastEyeExam: string
  eyeCareProvider: string
  toldNeedsGlasses: string
  currentConcerns: string[]
  currentConcernsOther: string
  visionInsurance: string
  medicalInsuranceProvider: string
  resourceInterests: string[]
  resourceOther: string
  referralSource: string
  consentParticipate: boolean
  photoVideoRelease: boolean
  communicationAuthorization: boolean
  acknowledgement: boolean
  printedName: string
  signatureDate: string
}

export type RegistrationSubmissionPayload = {
  participant: ParticipantProfile
  requestedEventName: string
  submissionMeta: {
    source: 'public-registration-page'
    preparedAt: string
    clientVersion: 'registration-page-v1'
  }
}

export const childParticipantType = 'Child (Ages 5-17)'
export const adultParticipantType = 'Adult (18+)'
export const defaultEventName = 'Community Vision Event'

export const createInitialRegistrationForm = (): RegistrationForm => ({
  event: defaultEventName,
  participantType: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  age: '',
  gender: '',
  race: '',
  ethnicity: '',
  primaryLanguage: '',
  veteranStatus: '',
  lgbtqIdentity: '',
  disabilityStatus: '',
  guardianName: '',
  guardianRelationship: '',
  guardianPhone: '',
  guardianEmail: '',
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  preferredCommunication: '',
  schoolName: '',
  schoolDistrict: '',
  currentGrade: '',
  wearsGlasses: '',
  glassesStatus: '',
  glassesStatusOther: '',
  wearsContacts: '',
  lastEyeExam: '',
  eyeCareProvider: '',
  toldNeedsGlasses: '',
  currentConcerns: [],
  currentConcernsOther: '',
  visionInsurance: '',
  medicalInsuranceProvider: '',
  resourceInterests: [],
  resourceOther: '',
  referralSource: '',
  consentParticipate: false,
  photoVideoRelease: false,
  communicationAuthorization: false,
  acknowledgement: false,
  printedName: '',
  signatureDate: new Date().toISOString().slice(0, 10),
})

export const normalizePhoneNumber = (phoneNumber: string) => {
  const digits = phoneNumber.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const normalizeText = (value: string) => value.trim()

export const isValidPhoneNumber = (phoneNumber: string) => {
  const digits = phoneNumber.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

export const createParticipantId = (form: RegistrationForm, preparedAt: string) => {
  const readableName = `${form.firstName}-${form.lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const timestamp = preparedAt.replace(/[^0-9]/g, '').slice(0, 14)

  return `participant-${readableName || 'registration'}-${timestamp}`
}

export const createRegistrationSubmissionPayload = (form: RegistrationForm, requestedEventName?: string): RegistrationSubmissionPayload => {
  const preparedAt = new Date().toISOString()
  const normalizedPhone = normalizePhoneNumber(form.guardianPhone)
  const normalizedEmail = normalizeEmail(form.guardianEmail)
  const ageAtEvent = Number.parseInt(form.age, 10)

  return {
    participant: {
      id: createParticipantId(form, preparedAt),
      participantType: form.participantType,
      firstName: normalizeText(form.firstName),
      lastName: normalizeText(form.lastName),
      dateOfBirth: form.dateOfBirth,
      ageAtEvent: Number.isFinite(ageAtEvent) ? ageAtEvent : null,
      demographics: {
        gender: form.gender,
        race: form.race,
        ethnicity: form.ethnicity,
        primaryLanguage: form.primaryLanguage,
        veteranStatus: form.veteranStatus,
        lgbtqIdentity: form.lgbtqIdentity,
        disabilityStatus: form.disabilityStatus,
      },
      guardian: {
        name: form.participantType === childParticipantType ? normalizeText(form.guardianName) : '',
        relationship: form.participantType === childParticipantType ? normalizeText(form.guardianRelationship) : '',
        phoneNumber: form.participantType === childParticipantType ? normalizedPhone : '',
        email: form.participantType === childParticipantType ? normalizedEmail : '',
      },
      contact: {
        preferredCommunication: form.preferredCommunication,
        phoneNumber: normalizedPhone,
        email: normalizedEmail,
      },
      address: {
        streetAddress: normalizeText(form.streetAddress),
        city: normalizeText(form.city),
        state: normalizeText(form.state),
        zipCode: normalizeText(form.zipCode),
      },
      school: {
        name: form.participantType === childParticipantType ? normalizeText(form.schoolName) : '',
        district: form.participantType === childParticipantType ? normalizeText(form.schoolDistrict) : '',
        currentGrade: form.participantType === childParticipantType ? normalizeText(form.currentGrade) : '',
      },
      visionIntake: {
        wearsGlasses: form.wearsGlasses,
        glassesStatus: form.glassesStatus,
        glassesStatusOther: normalizeText(form.glassesStatusOther),
        wearsContacts: form.wearsContacts,
        lastEyeExam: form.lastEyeExam,
        eyeCareProvider: normalizeText(form.eyeCareProvider),
        toldNeedsGlasses: form.toldNeedsGlasses,
        currentConcerns: form.currentConcerns,
        currentConcernsOther: normalizeText(form.currentConcernsOther),
      },
      insurance: {
        visionInsurance: form.visionInsurance,
        medicalInsuranceProvider: normalizeText(form.medicalInsuranceProvider),
      },
      resourceInterests: form.resourceInterests,
      resourceOther: normalizeText(form.resourceOther),
      referralSource: form.referralSource,
      consents: {
        consentToParticipate: form.consentParticipate,
        photoVideoRelease: form.photoVideoRelease,
        communicationAuthorization: form.communicationAuthorization,
        acknowledgement: form.acknowledgement,
        printedName: normalizeText(form.printedName),
        signatureDate: form.signatureDate,
      },
      checkedIn: false,
      createdAt: preparedAt,
      updatedAt: preparedAt,
    },
    requestedEventName: requestedEventName || form.event,
    submissionMeta: {
      source: 'public-registration-page',
      preparedAt,
      clientVersion: 'registration-page-v1',
    },
  }
}

export function buildStationStatuses(): StationStatus[] {
  return [
    {
      id: 'check-in',
      title: 'Station 1 - Check-In',
      description: 'Verify registration, confirm consent, and assign the participant ID.',
      status: 'current',
    },
    {
      id: 'vision-screening',
      title: 'Station 2 - Vision Screening',
      description: 'Record vision screening results and route the participant to the next step.',
      status: 'pending',
    },
    {
      id: 'eye-exam',
      title: 'Station 3 - Comprehensive Eye Exam',
      description: 'Provide a full exam and note prescription or referral outcomes.',
      status: 'pending',
    },
    {
      id: 'frame-selection',
      title: 'Station 4 - Frame Selection',
      description: 'Record prescription details and frame selections for ordering.',
      status: 'pending',
    },
    {
      id: 'vision-success',
      title: 'Station 5 - Vision Success',
      description: 'Confirm next steps, referrals, and follow-up resources before departure.',
      status: 'pending',
    },
  ]
}

export function buildRegistrationEvent(payload: RegistrationSubmissionPayload): EventRecord {
  const today = new Date().toISOString().slice(0, 10)

  return {
    id: `${payload.participant.contact.email}-${Date.now()}`,
    participantId: payload.participant.id,
    participantEmail: payload.participant.contact.email,
    eventName: payload.requestedEventName || defaultEventName,
    eventDate: today,
    createdAt: payload.submissionMeta.preparedAt,
    status: 'active',
    stationStatuses: buildStationStatuses(),
  }
}

export function createCustomerRecordFromPayload(payload: RegistrationSubmissionPayload): CustomerRecord {
  const { participant } = payload

  return {
    id: participant.id,
    Email: participant.contact.email,
    'First Name': participant.firstName,
    'Last Name': participant.lastName,
    'Participant Type': participant.participantType,
    'Date of Birth': participant.dateOfBirth,
    Age: String(participant.ageAtEvent ?? ''),
    Gender: participant.demographics.gender,
    Race: participant.demographics.race,
    Ethnicity: participant.demographics.ethnicity,
    'Primary Language': participant.demographics.primaryLanguage,
    'Veteran Status': participant.demographics.veteranStatus,
    'Parent/Guardian Name': participant.guardian.name,
    'Relationship to Participant': participant.guardian.relationship,
    'Phone Number': participant.contact.phoneNumber,
    'Parent/Guardian Email': participant.contact.email,
    'Street Address': participant.address.streetAddress,
    City: participant.address.city,
    'State ': participant.address.state,
    'ZIP Code': participant.address.zipCode,
    'Preferred Method of Communication': participant.contact.preferredCommunication,
    'School Name': participant.school.name,
    'School District': participant.school.district,
    'Current Grade': participant.school.currentGrade,
    participant,
    Events: [buildRegistrationEvent(payload)],
  }
}
