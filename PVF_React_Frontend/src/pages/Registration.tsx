import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { ReactNode } from 'react'
import Button from '@mui/material/Button'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useSearchParams } from 'react-router'
import {
  saveRegistrationCustomer,
  createRegistrationEvent,
  getRegistrationEvents,
  type RegistrationEventOption,
} from '../DataControl'
import { useAuth } from '../context/AuthContext'
import RegistrationEventCreator from '../components/RegistrationEventCreator'
import {
  childParticipantType,
  createCustomerRecordFromPayload,
  createInitialRegistrationForm,
  createRegistrationSubmissionPayload,
  defaultEventName,
  isValidEmail,
  isValidPhoneNumber,
  type RegistrationForm,
} from '../registrationModel'

type ContactField = 'guardianPhone' | 'guardianEmail'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const participantTypes = [childParticipantType, 'Adult (18+)']
const communicationMethods = ['Phone', 'Text Message', 'Email']
const yesNoUnsure = ['Yes', 'No', 'Unsure']
const glassesStatuses = [
  'In their possession and worn regularly',
  'Broken',
  'Lost',
  'Left at home',
  'No longer fit or prescription is outdated',
  'Other',
]
const currentConcernOptions = [
  'Difficulty seeing the board',
  'Blurry vision',
  'Frequent headaches',
  'Squinting',
  'Holds books or devices very close',
  'Eye strain',
  'Double vision',
  'No current concerns',
]
const resourceOptions = [
  'Food Assistance',
  'Housing Resources',
  'Employment Services',
  'Financial Literacy',
  'Health & Wellness Programs',
  'Youth Programs',
  'Veteran Resources',
  'Senior Resources',
  'Vision Care Resources',
]

const isContactField = (field: keyof RegistrationForm): field is ContactField =>
  field === 'guardianPhone' || field === 'guardianEmail'

const createFallbackRegistrationEvent = (): RegistrationEventOption => ({
  id: 'default-community-vision-event',
  eventName: defaultEventName,
  eventDate: new Date().toISOString().slice(0, 10),
  createdAt: new Date().toISOString(),
  status: 'active',
})

const referralSources = [
  'Social Media',
  'School',
  'Community Partner',
  'Church/Faith Organization',
  'Healthcare Provider',
  'Friend/Family',
  'Motorsure America',
  'Prevent Blindness Ohio',
  'Other',
]

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-semibold text-gray-800">
      {children}
      {required ? <span className="text-red-600"> *</span> : null}
    </span>
  )
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow: string
  children: ReactNode
}) {
  return (
    <Accordion defaultExpanded disableGutters className="rounded-lg border border-gray-200 bg-white shadow-sm before:hidden">
      <AccordionSummary expandIcon={<span aria-hidden="true">▾</span>}>
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-bold text-blue-800">{title}</h2>
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <div className="grid gap-4 md:grid-cols-2">{children}</div>
      </AccordionDetails>
    </Accordion>
  )
}

export default function Registration() {
  const { role } = useAuth()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<RegistrationForm>(() => createInitialRegistrationForm())
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [createdUserEmail, setCreatedUserEmail] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState('')
  const [registrationEvents, setRegistrationEvents] = useState<RegistrationEventOption[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadRegistrationEvents() {
      setEventsLoading(true)
      const loadedEvents = await getRegistrationEvents()

      if (!cancelled) {
        setRegistrationEvents(loadedEvents)
        setEventsLoading(false)
      }
    }

    loadRegistrationEvents()

    return () => {
      cancelled = true
    }
  }, [])

  const availableRegistrationEvents = useMemo(() => (
    registrationEvents.length > 0
      ? registrationEvents
      : [createFallbackRegistrationEvent()]
  ), [registrationEvents])

  useEffect(() => {
    if (!availableRegistrationEvents.length) {
      return
    }

    const requestedEventId = searchParams.get('eventId')?.trim() ?? ''
    const requestedEvent = requestedEventId
      ? availableRegistrationEvents.find(event => event.id === requestedEventId)
      : undefined
    const selectedStillExists = availableRegistrationEvents.some(event => event.id === form.event)
    const nextEventId = requestedEvent?.id ?? availableRegistrationEvents[0].id

    if (!form.event || !selectedStillExists || (requestedEvent && form.event !== requestedEvent.id)) {
      setForm(current => ({ ...current, event: nextEventId }))
    }
  }, [availableRegistrationEvents, form.event, searchParams])

  const isChild = form.participantType === childParticipantType
  const phoneInvalid =
    form.guardianPhone.trim() !== '' &&
    !isValidPhoneNumber(form.guardianPhone)
  const emailInvalid =
    form.guardianEmail.trim() !== '' &&
    !isValidEmail(form.guardianEmail)
  const requiredConsentComplete =
    form.consentParticipate &&
    form.communicationAuthorization &&
    form.acknowledgement &&
    form.printedName.trim() &&
    form.signatureDate

  const requiredValues = useMemo(() => {
    const requiredValues = [
      form.participantType,
      form.event,
      form.firstName,
      form.lastName,
      form.dateOfBirth,
      form.age,
      form.preferredCommunication,
      form.wearsGlasses,
      form.wearsContacts,
      form.toldNeedsGlasses,
      form.visionInsurance,
      form.referralSource,
      form.guardianEmail,
      form.printedName,
      form.signatureDate,
    ]

    if (isChild) {
      requiredValues.push(
        form.guardianName,
        form.guardianRelationship,
        form.guardianPhone,
        form.guardianEmail,
        form.streetAddress,
        form.city,
        form.state,
        form.zipCode,
        form.schoolName,
        form.schoolDistrict,
        form.currentGrade,
      )
    }

    return requiredValues
  }, [form, isChild])

  const requiredFieldsComplete = requiredValues.every(Boolean)

  const completionCount = useMemo(() => {
    const completedFields = requiredValues.filter(Boolean).length
    const completedConsents = [
      form.consentParticipate,
      form.communicationAuthorization,
      form.acknowledgement,
    ].filter(Boolean).length

    return `${completedFields + completedConsents}/${requiredValues.length + 3}`
  }, [form, requiredValues])

  const updateField = (field: keyof RegistrationForm, value: string | boolean | string[]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setSuccessModalOpen(false)
    setSaveStatus('idle')
    setSaveError('')
  }

  const handleInput =
    (field: keyof RegistrationForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateField(field, event.target.value)
    }

  const toggleArrayValue = (field: 'currentConcerns' | 'resourceInterests', value: string) => {
    setForm((current) => {
      const currentValues = current[field]
      let nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]

      if (field === 'currentConcerns' && value === 'No current concerns' && !currentValues.includes(value)) {
        nextValues = ['No current concerns']
      }

      if (field === 'currentConcerns' && value !== 'No current concerns') {
        nextValues = nextValues.filter((item) => item !== 'No current concerns')
      }

      return { ...current, [field]: nextValues }
    })
    setSuccessModalOpen(false)
    setSaveStatus('idle')
    setSaveError('')
  }

  const handleReset = () => {
    setForm(createInitialRegistrationForm())
    setSuccessModalOpen(false)
    setSaveStatus('idle')
    setSaveError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!requiredFieldsComplete || phoneInvalid || emailInvalid) return

    const selectedEvent = availableRegistrationEvents.find(event => event.id === form.event)
    const payload = createRegistrationSubmissionPayload(form, selectedEvent?.eventName || defaultEventName)
    setSaveStatus('saving')
    setSaveError('')

    try {
      await saveRegistrationCustomer(createCustomerRecordFromPayload(payload))
      setCreatedUserEmail(payload.participant.contact.email)
      setSuccessModalOpen(true)
      setSaveStatus('saved')
    } catch (error) {
      console.error('Failed to save registration', error)
      setSaveStatus('error')
      setSaveError('Unable to save this registration to the database. Please try again or contact an administrator.')
    }
  }

  const handleCreateRegistrationEvent = async ({ eventName, eventDate }: { eventName: string; eventDate: string }) => {
    const createdEvent = await createRegistrationEvent(eventName, eventDate)
    setForm(current => ({ ...current, event: createdEvent.id }))
  }

  const refreshRegistrationEvents = async () => {
    const refreshedEvents = await getRegistrationEvents()
    setRegistrationEvents(refreshedEvents)
  }

  const inputClass = 'mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100'
  const selectClass = `${inputClass} bg-white`
  const invalidInputClass = `${inputClass} border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-100`
  const canReviewRegistration = Boolean(requiredFieldsComplete && requiredConsentComplete && !phoneInvalid && !emailInvalid)

  const renderContactInput = (field: ContactField, label: string, required = false) => {
    const isPhone = field === 'guardianPhone'
    const isEmail = field === 'guardianEmail'
    const invalid = (isPhone && phoneInvalid) || (isEmail && emailInvalid)
    const message = isPhone
      ? 'Enter a valid 10-digit phone number.'
      : 'Enter a valid email address, such as name@example.com.'

    return (
      <label key={field}>
        <FieldLabel required={required}>{label}</FieldLabel>
        <input
          type={isEmail ? 'email' : isPhone ? 'tel' : 'text'}
          value={String(form[field])}
          onChange={handleInput(field)}
          className={invalid ? invalidInputClass : inputClass}
          required={required}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${field}-error` : undefined}
        />
        {invalid ? (
          <p id={`${field}-error`} className="mt-1 text-sm font-medium text-red-700">
            {message}
          </p>
        ) : null}
      </label>
    )
  }

  return (
    <main className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Prime Focus Inc.
            </p>
            <h1 className="mt-2 text-4xl font-bold text-blue-900">
              Community Vision Event Registration
            </h1>
            <p className="mt-3 max-w-3xl text-gray-700">
              Children ages 5-17 receive priority scheduling. Adults are welcome to register
              and may be scheduled if appointment availability permits.
            </p>
          </div>

          <aside className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700">Required progress</p>
            <p className="mt-2 text-3xl font-bold text-blue-800">{completionCount}</p>
            <p className="mt-2 text-sm text-gray-600">Complete required fields to save the registration.</p>
          </aside>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {saveStatus === 'error' ? (
            <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="font-semibold">Unable to save registration</p>
              <p className="mt-2">{saveError}</p>
            </section>
          ) : null}
          <Section eyebrow="Section 1" title="Event Registration">
            <div className="rounded border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 md:col-span-2">
              Select the event this participant should be registered for.
            </div>

            <label>
              <FieldLabel required>Event</FieldLabel>
              <select
                value={form.event}
                onChange={handleInput('event')}
                className={selectClass}
                required
                disabled={eventsLoading && registrationEvents.length === 0}
              >
                {availableRegistrationEvents.map((eventOption) => (
                  <option key={eventOption.id} value={eventOption.id}>
                    {eventOption.eventName} {eventOption.eventDate ? `(${eventOption.eventDate})` : ''}
                  </option>
                ))}
              </select>
            </label>

            {role === 'admin' ? (
              <RegistrationEventCreator
                className="md:col-span-2"
                title="Create a new registration event"
                description="Create an event once here and use it everywhere else in the app."
                buttonLabel="Create event"
                onCreate={handleCreateRegistrationEvent}
                onCreated={refreshRegistrationEvents}
              />
            ) : null}

            <label>
              <FieldLabel required>Participant Type</FieldLabel>
              <select
                value={form.participantType}
                onChange={handleInput('participantType')}
                className={selectClass}
                required
              >
                <option value="">Select participant type</option>
                {participantTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </Section>

          <Section eyebrow="Section 2" title="Participant Information">
            {[
              ['firstName', 'First Name', true],
              ['lastName', 'Last Name', true],
              ['dateOfBirth', 'Date of Birth', true],
              ['age', 'Age', true],
              ['gender', 'Gender', false],
              ['race', 'Race', false],
              ['ethnicity', 'Ethnicity', false],
              ['primaryLanguage', 'Primary Language', false],
              ['veteranStatus', 'Veteran Status', false],
              ['lgbtqIdentity', 'LGBTQ+ Identity (Optional)', false],
              ['disabilityStatus', 'Disability Status (Optional)', false],
            ].map(([field, label, required]) => (
              <label key={String(field)}>
                <FieldLabel required={Boolean(required)}>{String(label)}</FieldLabel>
                <input
                  type={field === 'dateOfBirth' ? 'date' : field === 'age' ? 'number' : 'text'}
                  value={String(form[field as keyof RegistrationForm])}
                  onChange={handleInput(field as keyof RegistrationForm)}
                  className={inputClass}
                  required={Boolean(required)}
                />
              </label>
            ))}
          </Section>

          {isChild ? (
            <>
              <Section eyebrow="Section 3" title="Parent/Guardian Information">
                {[
                  ['guardianName', 'Parent/Guardian Name'],
                  ['guardianRelationship', 'Relationship to Participant'],
                  ['guardianPhone', 'Phone Number'],
                  ['guardianEmail', 'Email Address'],
                  ['streetAddress', 'Street Address'],
                  ['city', 'City'],
                  ['state', 'State'],
                  ['zipCode', 'ZIP Code'],
                ].map(([field, label]) => {
                  const formField = field as keyof RegistrationForm

                  return isContactField(formField)
                    ? renderContactInput(formField, label, true)
                    : (
                      <label key={field}>
                        <FieldLabel required>{label}</FieldLabel>
                        <input
                          value={String(form[formField])}
                          onChange={handleInput(formField)}
                          className={inputClass}
                          required
                        />
                      </label>
                    )
                })}
                <label>
                  <FieldLabel required>Preferred Method of Communication</FieldLabel>
                  <select
                    value={form.preferredCommunication}
                    onChange={handleInput('preferredCommunication')}
                    className={selectClass}
                    required
                  >
                    <option value="">Select a method</option>
                    {communicationMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </label>
              </Section>

              <Section eyebrow="Section 4" title="School Information">
                {[
                  ['schoolName', 'School Name'],
                  ['schoolDistrict', 'School District'],
                  ['currentGrade', 'Current Grade'],
                ].map(([field, label]) => (
                  <label key={field}>
                    <FieldLabel required>{label}</FieldLabel>
                    <input
                      value={String(form[field as keyof RegistrationForm])}
                      onChange={handleInput(field as keyof RegistrationForm)}
                      className={inputClass}
                      required
                    />
                  </label>
                ))}
              </Section>
            </>
          ) : (
            <Section eyebrow="Section 3" title="Contact Information">
              <label>
                <FieldLabel required>Preferred Method of Communication</FieldLabel>
                <select
                  value={form.preferredCommunication}
                  onChange={handleInput('preferredCommunication')}
                  className={selectClass}
                  required
                >
                  <option value="">Select a method</option>
                  {communicationMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </label>
              {[
                ['guardianPhone', 'Phone Number'],
                ['guardianEmail', 'Email Address'],
                ['streetAddress', 'Street Address'],
                ['city', 'City'],
                ['state', 'State'],
                ['zipCode', 'ZIP Code'],
              ].map(([field, label]) => {
                const formField = field as keyof RegistrationForm

                return isContactField(formField)
                  ? renderContactInput(formField, label, formField === 'guardianEmail')
                  : (
                    <label key={field}>
                      <FieldLabel>{label}</FieldLabel>
                      <input
                        value={String(form[formField])}
                        onChange={handleInput(formField)}
                        className={inputClass}
                      />
                    </label>
                  )
              })}
            </Section>
          )}

          <Section eyebrow="Section 5" title="Vision History">
            <label>
              <FieldLabel required>Does the participant currently wear glasses?</FieldLabel>
              <select value={form.wearsGlasses} onChange={handleInput('wearsGlasses')} className={selectClass} required>
                <option value="">Select one</option>
                {yesNoUnsure.slice(0, 2).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            {form.wearsGlasses === 'Yes' ? (
              <>
                <label>
                  <FieldLabel>If yes, are the glasses currently:</FieldLabel>
                  <select value={form.glassesStatus} onChange={handleInput('glassesStatus')} className={selectClass}>
                    <option value="">Select status</option>
                    {glassesStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                {form.glassesStatus === 'Other' ? (
                  <label>
                    <FieldLabel>Other glasses status</FieldLabel>
                    <input value={form.glassesStatusOther} onChange={handleInput('glassesStatusOther')} className={inputClass} />
                  </label>
                ) : null}
              </>
            ) : null}

            <label>
              <FieldLabel required>Does the participant wear contact lenses?</FieldLabel>
              <select value={form.wearsContacts} onChange={handleInput('wearsContacts')} className={selectClass} required>
                <option value="">Select one</option>
                {yesNoUnsure.slice(0, 2).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              <FieldLabel>Date of Last Eye Exam</FieldLabel>
              <input type="date" value={form.lastEyeExam} onChange={handleInput('lastEyeExam')} className={inputClass} />
            </label>

            <label>
              <FieldLabel>Name of Eye Care Provider (Optional)</FieldLabel>
              <input value={form.eyeCareProvider} onChange={handleInput('eyeCareProvider')} className={inputClass} />
            </label>

            <label>
              <FieldLabel required>Has the participant ever been told they need glasses?</FieldLabel>
              <select
                value={form.toldNeedsGlasses}
                onChange={handleInput('toldNeedsGlasses')}
                className={selectClass}
                required
              >
                <option value="">Select one</option>
                {yesNoUnsure.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <fieldset className="md:col-span-2">
              <legend className="text-sm font-semibold text-gray-800">
                Is the participant currently experiencing any of the following?
              </legend>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {currentConcernOptions.map((concern) => (
                  <label key={concern} className="flex items-start gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.currentConcerns.includes(concern)}
                      onChange={() => toggleArrayValue('currentConcerns', concern)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">{concern}</span>
                  </label>
                ))}
              </div>
              <input
                value={form.currentConcernsOther}
                onChange={handleInput('currentConcernsOther')}
                placeholder="Other concern"
                className={`${inputClass} mt-3`}
              />
            </fieldset>

            <p className="rounded bg-blue-50 p-3 text-sm text-blue-900 md:col-span-2">
              The condition or availability of glasses will not prevent participation in the event.
            </p>
          </Section>

          <Section eyebrow="Section 6" title="Insurance Information">
            <div className="rounded bg-green-50 p-3 text-sm text-green-900 md:col-span-2">
              Insurance information is optional, collected for program planning and reporting only.
              Prime Focus Inc. will not bill insurance, and insurance status will not affect eligibility.
            </div>
            <label>
              <FieldLabel required>Does the participant currently have vision insurance?</FieldLabel>
              <select
                value={form.visionInsurance}
                onChange={handleInput('visionInsurance')}
                className={selectClass}
                required
              >
                <option value="">Select one</option>
                {yesNoUnsure.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel>Medical Insurance Provider (Optional)</FieldLabel>
              <input
                value={form.medicalInsuranceProvider}
                onChange={handleInput('medicalInsuranceProvider')}
                className={inputClass}
              />
            </label>
          </Section>

          <Section eyebrow="Section 7" title="Community Resource Interests">
            <fieldset className="md:col-span-2">
              <legend className="text-sm font-semibold text-gray-800">
                Would you like information about any of the following community resources?
              </legend>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {resourceOptions.map((resource) => (
                  <label key={resource} className="flex items-start gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={form.resourceInterests.includes(resource)}
                      onChange={() => toggleArrayValue('resourceInterests', resource)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">{resource}</span>
                  </label>
                ))}
              </div>
              <input
                value={form.resourceOther}
                onChange={handleInput('resourceOther')}
                placeholder="Other resource interest"
                className={`${inputClass} mt-3`}
              />
            </fieldset>
          </Section>

          <Section eyebrow="Section 8" title="How did you hear about this event?">
            <label className="md:col-span-2">
              <FieldLabel required>Referral Source</FieldLabel>
              <select value={form.referralSource} onChange={handleInput('referralSource')} className={selectClass} required>
                <option value="">Select one</option>
                {referralSources.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </label>
          </Section>

          <Section eyebrow="Section 9" title="Consents & Authorizations">
            <div className="space-y-3 md:col-span-2">
              {[
                [
                  'consentParticipate',
                  'Consent to Participate',
                  'I authorize Prime Focus Inc. and its licensed healthcare partners to conduct a vision screening and, if applicable, provide information regarding recommended follow-up care.',
                  true,
                ],
                [
                  'photoVideoRelease',
                  'Photo & Video Release',
                  'I grant permission for Prime Focus Inc. to photograph or record me and/or my child during the event for educational, promotional, fundraising, and marketing purposes.',
                  false,
                ],
                [
                  'communicationAuthorization',
                  'Communication Authorization',
                  'I authorize Prime Focus Inc. to contact me by phone, email, and/or text message regarding event updates, follow-up information, community resources, and future Prime Focus programs.',
                  true,
                ],
                [
                  'acknowledgement',
                  'Acknowledgement',
                  'I certify that the information provided is true and accurate to the best of my knowledge.',
                  true,
                ],
              ].map(([field, title, body, required]) => (
                <label key={String(field)} className="flex gap-3 rounded border border-gray-200 bg-gray-50 p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form[field as keyof RegistrationForm])}
                    onChange={(event) => updateField(field as keyof RegistrationForm, event.target.checked)}
                    required={Boolean(required)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-gray-900">
                      {String(title)}{required ? <span className="text-red-600"> *</span> : null}
                    </span>
                    <span className="text-sm text-gray-700">{String(body)}</span>
                  </span>
                </label>
              ))}
            </div>
            <label>
              <FieldLabel required>Printed Name</FieldLabel>
              <input value={form.printedName} onChange={handleInput('printedName')} className={inputClass} required />
            </label>
            <label>
              <FieldLabel required>Date</FieldLabel>
              <input type="date" value={form.signatureDate} onChange={handleInput('signatureDate')} className={inputClass} required />
            </label>
          </Section>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-blue-900">Registration Submission</h2>
              <p className="text-sm text-gray-600">
                This page is ready to save the registration to the participant database.
              </p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outlined" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit" variant="contained" disabled={!canReviewRegistration || saveStatus === 'saving'}>
                {saveStatus === 'saving' ? 'Saving...' : 'Save Registration'}
              </Button>
            </div>
          </div>
        </form>

        <Dialog open={successModalOpen} onClose={() => setSuccessModalOpen(false)} aria-labelledby="registration-success-title">
          <DialogTitle id="registration-success-title">Registration saved</DialogTitle>
          <DialogContent>
            <p className="text-sm text-gray-700">
              A confirmation was recorded for {createdUserEmail || form.guardianEmail.trim().toLowerCase()}.
            </p>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSuccessModalOpen(false)} variant="contained">OK</Button>
          </DialogActions>
        </Dialog>
      </div>
    </main>
  )
}
