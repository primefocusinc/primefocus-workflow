import { collection, doc, deleteDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export type StationDecision = 'PASS' | 'FAIL' | 'REFERRAL' | 'FRAME';

export interface StationStatus {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'complete' | 'skipped';
  decision?: StationDecision;
  printRequested?: boolean;
  pboReferralConfirmed?: boolean;
  frameSelection?: string;
}

export interface EventRecord {
  id: string;
  participantId: string;
  participantEmail: string;
  eventName: string;
  eventDate: string;
  createdAt: string;
  status: 'planned' | 'active' | 'completed';
  stationStatuses: StationStatus[];
}

export interface RegistrationEventOption {
  id: string;
  eventName: string;
  eventDate: string;
  createdAt: string;
  status: 'planned' | 'active' | 'completed';
}

export interface ParticipantDemographics {
  gender: string;
  race: string;
  ethnicity: string;
  primaryLanguage: string;
  veteranStatus: string;
  lgbtqIdentity: string;
  disabilityStatus: string;
}

export interface ParticipantGuardian {
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string;
}

export interface ParticipantContact {
  preferredCommunication: string;
  phoneNumber: string;
  email: string;
}

export interface ParticipantAddress {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface ParticipantSchool {
  name: string;
  district: string;
  currentGrade: string;
}

export interface ParticipantVisionIntake {
  wearsGlasses: string;
  glassesStatus: string;
  glassesStatusOther: string;
  wearsContacts: string;
  lastEyeExam: string;
  eyeCareProvider: string;
  toldNeedsGlasses: string;
  currentConcerns: string[];
  currentConcernsOther: string;
}

export interface ParticipantInsurance {
  visionInsurance: string;
  medicalInsuranceProvider: string;
}

export interface ParticipantConsents {
  consentToParticipate: boolean;
  photoVideoRelease: boolean;
  communicationAuthorization: boolean;
  acknowledgement: boolean;
  printedName: string;
  signatureDate: string;
}

export interface ParticipantProfile {
  id: string;
  participantType: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ageAtEvent: number | null;
  demographics: ParticipantDemographics;
  guardian: ParticipantGuardian;
  contact: ParticipantContact;
  address: ParticipantAddress;
  school: ParticipantSchool;
  visionIntake: ParticipantVisionIntake;
  insurance: ParticipantInsurance;
  resourceInterests: string[];
  resourceOther: string;
  referralSource: string;
  consents: ParticipantConsents;
  checkedIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CustomerValue = string | boolean | number | EventRecord[] | ParticipantProfile | undefined;

export interface CustomerRecord {
  [key: string]: CustomerValue;
  id?: string;
  Email?: string;
  Events?: EventRecord[];
  participant?: ParticipantProfile;
}

const STATION_IDS = ['check-in', 'vision-screening', 'eye-exam', 'frame-selection', 'vision-success'] as const;

function toSerializable(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(item => toSerializable(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [key, toSerializable(entryValue)]));
  }

  return value;
}

function normalizeParticipant(customer: CustomerRecord): ParticipantProfile {
  const existing = customer.participant;
  const legacyAge = typeof customer['Age'] === 'string' ? Number(customer['Age']) : undefined;

  return {
    id: customer.id ?? `participant-${customer.Email ?? Date.now()}`,
    participantType: (typeof customer['Participant Type'] === 'string' && customer['Participant Type']) ? customer['Participant Type'] : existing?.participantType ?? 'Adult (18+)',
    firstName: (typeof customer['First Name'] === 'string' && customer['First Name']) ? customer['First Name'] : existing?.firstName ?? '',
    lastName: (typeof customer['Last Name'] === 'string' && customer['Last Name']) ? customer['Last Name'] : existing?.lastName ?? '',
    dateOfBirth: (typeof customer['Date of Birth'] === 'string' && customer['Date of Birth']) ? customer['Date of Birth'] : existing?.dateOfBirth ?? '',
    ageAtEvent: existing?.ageAtEvent ?? (typeof legacyAge === 'number' && Number.isFinite(legacyAge) ? legacyAge : null),
    demographics: {
      gender: (typeof customer['Gender'] === 'string' && customer['Gender']) ? customer['Gender'] : existing?.demographics.gender ?? '',
      race: (typeof customer['Race'] === 'string' && customer['Race']) ? customer['Race'] : existing?.demographics.race ?? '',
      ethnicity: (typeof customer['Ethnicity'] === 'string' && customer['Ethnicity']) ? customer['Ethnicity'] : existing?.demographics.ethnicity ?? '',
      primaryLanguage: (typeof customer['Primary Language'] === 'string' && customer['Primary Language']) ? customer['Primary Language'] : existing?.demographics.primaryLanguage ?? '',
      veteranStatus: (typeof customer['Veteran Status'] === 'string' && customer['Veteran Status']) ? customer['Veteran Status'] : existing?.demographics.veteranStatus ?? '',
      lgbtqIdentity: existing?.demographics.lgbtqIdentity ?? '',
      disabilityStatus: existing?.demographics.disabilityStatus ?? ''
    },
    guardian: {
      name: (typeof customer['Parent/Guardian Name'] === 'string' && customer['Parent/Guardian Name']) ? customer['Parent/Guardian Name'] : existing?.guardian.name ?? '',
      relationship: (typeof customer['Relationship to Participant'] === 'string' && customer['Relationship to Participant']) ? customer['Relationship to Participant'] : existing?.guardian.relationship ?? '',
      phoneNumber: (typeof customer['Phone Number'] === 'string' && customer['Phone Number']) ? customer['Phone Number'] : existing?.guardian.phoneNumber ?? '',
      email: (typeof customer['Parent/Guardian Email'] === 'string' && customer['Parent/Guardian Email']) ? customer['Parent/Guardian Email'] : (typeof customer['Parent/GauEmail'] === 'string' && customer['Parent/GauEmail']) ? customer['Parent/GauEmail'] : existing?.guardian.email ?? ''
    },
    contact: {
      preferredCommunication: (typeof customer['Preferred Method of Communication'] === 'string' && customer['Preferred Method of Communication']) ? customer['Preferred Method of Communication'] : existing?.contact.preferredCommunication ?? '',
      phoneNumber: (typeof customer['Phone number'] === 'string' && customer['Phone number']) ? customer['Phone number'] : existing?.contact.phoneNumber ?? '',
      email: (typeof customer.Email === 'string' && customer.Email) ? customer.Email : existing?.contact.email ?? ''
    },
    address: {
      streetAddress: (typeof customer['Street Address'] === 'string' && customer['Street Address']) ? customer['Street Address'] : existing?.address.streetAddress ?? '',
      city: (typeof customer['City'] === 'string' && customer['City']) ? customer['City'] : existing?.address.city ?? '',
      state: (typeof customer['State '] === 'string' && customer['State ']) ? customer['State '] : existing?.address.state ?? '',
      zipCode: (typeof customer['ZIP Code'] === 'string' && customer['ZIP Code']) ? customer['ZIP Code'] : existing?.address.zipCode ?? ''
    },
    school: {
      name: (typeof customer['School Name'] === 'string' && customer['School Name']) ? customer['School Name'] : existing?.school.name ?? '',
      district: (typeof customer['School District'] === 'string' && customer['School District']) ? customer['School District'] : existing?.school.district ?? '',
      currentGrade: (typeof customer['Current Grade'] === 'string' && customer['Current Grade']) ? customer['Current Grade'] : existing?.school.currentGrade ?? ''
    },
    visionIntake: {
      wearsGlasses: existing?.visionIntake?.wearsGlasses ?? '',
      glassesStatus: existing?.visionIntake?.glassesStatus ?? '',
      glassesStatusOther: existing?.visionIntake?.glassesStatusOther ?? '',
      wearsContacts: existing?.visionIntake?.wearsContacts ?? '',
      lastEyeExam: existing?.visionIntake?.lastEyeExam ?? '',
      eyeCareProvider: existing?.visionIntake?.eyeCareProvider ?? '',
      toldNeedsGlasses: existing?.visionIntake?.toldNeedsGlasses ?? '',
      currentConcerns: existing?.visionIntake?.currentConcerns ?? [],
      currentConcernsOther: existing?.visionIntake?.currentConcernsOther ?? ''
    },
    insurance: {
      visionInsurance: existing?.insurance?.visionInsurance ?? '',
      medicalInsuranceProvider: existing?.insurance?.medicalInsuranceProvider ?? ''
    },
    resourceInterests: existing?.resourceInterests ?? [],
    resourceOther: existing?.resourceOther ?? '',
    referralSource: existing?.referralSource ?? '',
    consents: {
      consentToParticipate: existing?.consents?.consentToParticipate ?? false,
      photoVideoRelease: existing?.consents?.photoVideoRelease ?? false,
      communicationAuthorization: existing?.consents?.communicationAuthorization ?? false,
      acknowledgement: existing?.consents?.acknowledgement ?? false,
      printedName: existing?.consents?.printedName ?? '',
      signatureDate: existing?.consents?.signatureDate ?? ''
    },
    checkedIn: existing?.checkedIn ?? false,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: existing?.updatedAt ?? new Date().toISOString()
  };
}

export function createDefaultParticipantProfile(): ParticipantProfile {
  return {
    id: '',
    participantType: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    ageAtEvent: null,
    demographics: {
      gender: '',
      race: '',
      ethnicity: '',
      primaryLanguage: '',
      veteranStatus: '',
      lgbtqIdentity: '',
      disabilityStatus: ''
    },
    guardian: {
      name: '',
      relationship: '',
      phoneNumber: '',
      email: ''
    },
    contact: {
      preferredCommunication: '',
      phoneNumber: '',
      email: ''
    },
    address: {
      streetAddress: '',
      city: '',
      state: '',
      zipCode: ''
    },
    school: {
      name: '',
      district: '',
      currentGrade: ''
    },
    visionIntake: {
      wearsGlasses: '',
      glassesStatus: '',
      glassesStatusOther: '',
      wearsContacts: '',
      lastEyeExam: '',
      eyeCareProvider: '',
      toldNeedsGlasses: '',
      currentConcerns: [],
      currentConcernsOther: ''
    },
    insurance: {
      visionInsurance: '',
      medicalInsuranceProvider: ''
    },
    resourceInterests: [],
    resourceOther: '',
    referralSource: '',
    consents: {
      consentToParticipate: false,
      photoVideoRelease: false,
      communicationAuthorization: false,
      acknowledgement: false,
      printedName: '',
      signatureDate: ''
    },
    checkedIn: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeEventRecord(event: EventRecord): EventRecord {
  return {
    ...event,
    createdAt: event.createdAt || new Date(event.eventDate || new Date().toISOString()).toISOString()
  };
}

function normalizeRegistrationEventOption(event: Partial<RegistrationEventOption> & { id: string }): RegistrationEventOption {
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: event.id,
    eventName: (typeof event.eventName === 'string' && event.eventName.trim()) ? event.eventName.trim() : 'Community Vision Event',
    eventDate: (typeof event.eventDate === 'string' && event.eventDate.trim()) ? event.eventDate.trim() : today,
    createdAt: (typeof event.createdAt === 'string' && event.createdAt.trim()) ? event.createdAt.trim() : new Date().toISOString(),
    status: event.status ?? 'active'
  };
}

function sortRegistrationEventOptions(left: RegistrationEventOption, right: RegistrationEventOption): number {
  const leftTime = Date.parse(left.eventDate || left.createdAt || '1970-01-01');
  const rightTime = Date.parse(right.eventDate || right.createdAt || '1970-01-01');

  if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
    return 0;
  }

  if (Number.isNaN(leftTime)) {
    return 1;
  }

  if (Number.isNaN(rightTime)) {
    return -1;
  }

  return rightTime - leftTime;
}

async function readCustomersFromFirebase(): Promise<CustomerRecord[]> {
  try {
    const [participantsSnapshot, eventsSnapshot, stationStatusesSnapshot] = await Promise.all([
      getDocs(collection(db, 'participants')),
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'stationStatuses'))
    ]);

    // Build station statuses map: eventId -> StationStatus[]
    const stationsByEvent: Record<string, StationStatus[]> = {};
    for (const statusDoc of stationStatusesSnapshot.docs) {
      const data = statusDoc.data() as StationStatus & { eventId: string };
      const { eventId, ...status } = data;
      if (!stationsByEvent[eventId]) {
        stationsByEvent[eventId] = [];
      }
      stationsByEvent[eventId].push(status as StationStatus);
    }

    // Build events map: participantId -> EventRecord[]
    const eventsByParticipant: Record<string, EventRecord[]> = {};
    for (const eventDoc of eventsSnapshot.docs) {
      const data = eventDoc.data() as EventRecord;
      const participantId = data.participantId;
      const event: EventRecord = {
        ...data,
        id: data.id ?? eventDoc.id,
        stationStatuses: stationsByEvent[data.id ?? eventDoc.id] ?? []
      };
      if (!eventsByParticipant[participantId]) {
        eventsByParticipant[participantId] = [];
      }
      eventsByParticipant[participantId].push(normalizeEventRecord(event));
    }

    return participantsSnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data() as Partial<CustomerRecord>;
      const fallbackEmail = typeof data.Email === 'string' ? data.Email.trim() : docSnapshot.id;
      const normalizedEmail = fallbackEmail.toLowerCase();
      const participantId = data.id ?? docSnapshot.id;

      return {
        ...(data as CustomerRecord),
        id: participantId,
        Email: normalizedEmail,
        participant: data.participant ? data.participant : normalizeParticipant({ ...(data as CustomerRecord), Email: normalizedEmail }),
        Events: eventsByParticipant[participantId] ?? []
      } satisfies CustomerRecord;
    });
  } catch (error) {
    console.warn('Unable to load participants from Firestore.', error);
    return [];
  }
}

export async function getCustomers(): Promise<CustomerRecord[]> {
  const firebaseCustomers = await readCustomersFromFirebase();

  return firebaseCustomers.map(customer => ({
    ...customer,
    Email: customer.Email ?? '',
    participant: customer.participant ?? normalizeParticipant(customer),
    Events: Array.isArray(customer.Events) ? customer.Events.map(normalizeEventRecord) : []
  }));
}

export async function saveCustomers(customers: CustomerRecord[]): Promise<void> {
  await Promise.all(customers.map((customer, index) => {
    const normalizedEmail = customer.Email?.trim().toLowerCase();
    const documentId = normalizedEmail || customer.id || `customer-${index}`;
    const participantId = customer.id ?? documentId;
    const { Events, ...customerWithoutEvents } = customer;
    const payload = toSerializable({
      ...customerWithoutEvents,
      Email: normalizedEmail ?? customer.Email
    }) as Record<string, unknown>;
    const saveParticipant = setDoc(doc(db, 'participants', documentId), payload, { merge: true });
    const saveEvents = Promise.all((Events ?? []).map(event => saveEventDocToFirebase(event, participantId)));
    return Promise.all([saveParticipant, saveEvents]);
  }));
}

export async function saveRegistrationCustomer(customer: CustomerRecord): Promise<void> {
  await saveCustomerToFirebase(customer);
}

async function saveCustomerToFirebase(customer: CustomerRecord, fallbackDocumentId?: string): Promise<void> {
  const normalizedEmail = customer.Email?.trim().toLowerCase();
  const documentId = normalizedEmail || customer.id || fallbackDocumentId;

  if (!documentId) {
    throw new Error('A participant email or id is required before saving to Firestore.');
  }

  const participantId = customer.id ?? documentId;
  const { Events, ...customerWithoutEvents } = customer;
  const payload = toSerializable({
    ...customerWithoutEvents,
    Email: normalizedEmail ?? customer.Email
  }) as Record<string, unknown>;

  try {
    await setDoc(doc(db, 'participants', documentId), payload, { merge: true });
  } catch (error) {
    console.error(`Failed to write participant ${documentId} to Firestore:`, error);
    throw new Error(`Failed to save participant record: ${error instanceof Error ? error.message : String(error)}`);
  }

  await Promise.all((Events ?? []).map(event => saveEventDocToFirebase(event, participantId)));
}

export async function deleteCustomerByEmail(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  const customers = await getCustomers();
  const target = customers.find(customer => customer.Email?.toLowerCase() === normalizedEmail);
  const nextCustomers = customers.filter(customer => customer.Email?.toLowerCase() !== normalizedEmail);

  await saveCustomers(nextCustomers);

  try {
    await deleteDoc(doc(db, 'participants', normalizedEmail));

    // Delete all events and their station statuses for this participant
    const participantId = target?.id ?? normalizedEmail;
    const eventsSnapshot = await getDocs(query(collection(db, 'events'), where('participantId', '==', participantId)));
    await Promise.all(eventsSnapshot.docs.map(async eventDoc => {
      await deleteDoc(eventDoc.ref);
      await Promise.all(STATION_IDS.map(stationId =>
        deleteDoc(doc(db, 'stationStatuses', `${eventDoc.id}_${stationId}`))
      ));
    }));
  } catch (error) {
    console.warn('Unable to delete participant from Firestore; local storage was updated instead.', error);
  }
}

export async function deleteEventFromFirebase(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId));
    await Promise.all(STATION_IDS.map(stationId =>
      deleteDoc(doc(db, 'stationStatuses', `${eventId}_${stationId}`))
    ));
  } catch (error) {
    console.warn('Unable to delete event from Firestore.', error);
  }
}

async function saveEventDocToFirebase(event: EventRecord, participantId: string): Promise<void> {
  const { stationStatuses, ...eventFields } = event;
  const eventPayload = toSerializable({
    ...eventFields,
    participantId,
  }) as Record<string, unknown>;
  try {
    await setDoc(doc(db, 'events', event.id), eventPayload);
  } catch (error) {
    console.error(`Failed to write event ${event.id} to Firestore:`, error);
    throw new Error(`Failed to save event record: ${error instanceof Error ? error.message : String(error)}`);
  }

  await Promise.all(stationStatuses.map(async status => {
    const docId = `${event.id}_${status.id}`;
    const payload = toSerializable({
      ...status,
      eventId: event.id,
      participantId,
    }) as Record<string, unknown>;
    try {
      await setDoc(doc(db, 'stationStatuses', docId), payload);
    } catch (error) {
      console.error(`Failed to write stationStatus ${docId} to Firestore:`, error);
      throw new Error(`Failed to save station status record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }));
}

export async function getCustomerByEmail(email: string): Promise<CustomerRecord | undefined> {
  const customers = await getCustomers();
  return customers.find(customer => customer.Email?.toLowerCase() === email.toLowerCase());
}

export async function getCustomersFromFirebase(): Promise<CustomerRecord[]> {
  return getCustomers();
}

export async function getAllEvents(): Promise<EventRecord[]> {
  try {
    const [eventsSnapshot, stationStatusesSnapshot] = await Promise.all([
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'stationStatuses')),
    ]);

    const stationsByEvent: Record<string, StationStatus[]> = {};
    for (const statusDoc of stationStatusesSnapshot.docs) {
      const data = statusDoc.data() as StationStatus & { eventId: string };
      const { eventId, ...status } = data;
      if (!stationsByEvent[eventId]) {
        stationsByEvent[eventId] = [];
      }
      stationsByEvent[eventId].push(status as StationStatus);
    }

    return eventsSnapshot.docs
      .map(eventDoc => {
        const data = eventDoc.data() as EventRecord;
        return normalizeEventRecord({
          ...data,
          id: data.id ?? eventDoc.id,
          stationStatuses: stationsByEvent[data.id ?? eventDoc.id] ?? []
        });
      })
      .sort((left, right) => {
        const leftTime = Date.parse(left.createdAt || left.eventDate || '1970-01-01');
        const rightTime = Date.parse(right.createdAt || right.eventDate || '1970-01-01');

        if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
          return 0;
        }

        if (Number.isNaN(leftTime)) {
          return 1;
        }

        if (Number.isNaN(rightTime)) {
          return -1;
        }

        return rightTime - leftTime;
      });
  } catch (error) {
    console.warn('Unable to load participant events from Firestore.', error);
    return [];
  }
}

export async function getRegistrationEvents(): Promise<RegistrationEventOption[]> {
  try {
    const snapshot = await getDocs(collection(db, 'registrationEvents'));
    return snapshot.docs
      .map(docSnapshot => normalizeRegistrationEventOption({ id: docSnapshot.id, ...(docSnapshot.data() as Partial<RegistrationEventOption>) }))
      .sort(sortRegistrationEventOptions);
  } catch (error) {
    console.warn('Unable to load registration events from Firestore.', error);
    return [];
  }
}

export async function createRegistrationEvent(eventName: string, eventDate: string): Promise<RegistrationEventOption> {
  const id = `registration-event-${Date.now()}`;
  const normalized = normalizeRegistrationEventOption({
    id,
    eventName,
    eventDate,
    createdAt: new Date().toISOString(),
    status: 'active'
  });

  await setDoc(doc(db, 'registrationEvents', id), normalized);
  return normalized;
}
