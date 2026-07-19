import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import RegistrationEventCreator from '../components/RegistrationEventCreator'
import { createRegistrationEvent, getAllEvents, getCustomers, getRegistrationEvents, type CustomerRecord, type EventRecord, type RegistrationEventOption } from '../DataControl'
import { useAuth } from '../context/AuthContext'

const archivo = { fontFamily: 'Archivo, sans-serif' }

function sortByRecency(left: EventRecord, right: EventRecord): number {
  const leftTime = Date.parse(left.createdAt || left.eventDate || '1970-01-01')
  const rightTime = Date.parse(right.createdAt || right.eventDate || '1970-01-01')

  if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
    return 0
  }
  if (Number.isNaN(leftTime)) {
    return 1
  }
  if (Number.isNaN(rightTime)) {
    return -1
  }

  return rightTime - leftTime
}

function sortRegistrationEvents(left: RegistrationEventOption, right: RegistrationEventOption): number {
  const leftTime = Date.parse(left.createdAt || left.eventDate || '1970-01-01')
  const rightTime = Date.parse(right.createdAt || right.eventDate || '1970-01-01')

  if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
    return 0
  }
  if (Number.isNaN(leftTime)) {
    return 1
  }
  if (Number.isNaN(rightTime)) {
    return -1
  }

  return rightTime - leftTime
}

export default function AdminEvents() {
  const { user, role } = useAuth()
  const [participantEvents, setParticipantEvents] = useState<EventRecord[]>([])
  const [registrationEvents, setRegistrationEvents] = useState<RegistrationEventOption[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [loadedParticipantEvents, loadedRegistrationEvents, loadedCustomers] = await Promise.all([
        getAllEvents(),
        getRegistrationEvents(),
        getCustomers(),
      ])

      setParticipantEvents(loadedParticipantEvents.sort(sortByRecency))
      setRegistrationEvents(loadedRegistrationEvents.sort(sortRegistrationEvents))
      setCustomers(loadedCustomers)
      setLoading(false)
    }

    loadData()
  }, [])

  const participantById = useMemo(() => {
    const map = new Map<string, CustomerRecord>()

    for (const customer of customers) {
      const participantId = customer.participant?.id ?? customer.id ?? ''
      if (participantId) {
        map.set(participantId, customer)
      }
    }

    return map
  }, [customers])

  const refreshRegistrationEvents = async () => {
    const refreshedEvents = await getRegistrationEvents()
    setRegistrationEvents(refreshedEvents.sort(sortRegistrationEvents))
  }

  const handleCreateRegistrationEvent = async ({ eventName, eventDate }: { eventName: string; eventDate: string }) => {
    await createRegistrationEvent(eventName, eventDate)
  }

  if (!user) {
    return <div className="max-w-6xl mx-auto px-6 py-12">Please sign in to view this page.</div>
  }

  if (role !== 'admin') {
    return <div className="max-w-6xl mx-auto px-6 py-12">You do not have permission to view this page.</div>
  }

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-12">Loading events...</div>
  }

  return (
    <main className="bg-[#eceeeb] px-6 py-10 md:px-10" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      <div className="mx-auto max-w-[1180px] rounded-2xl bg-[#10181f] p-6 text-[#f2f5f3] shadow-[0_2px_14px_rgba(16,24,31,.35)] md:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight md:text-[34px]" style={archivo}>
                Admin Events
              </h1>
              <span className="rounded-full bg-[#d95a4a]/15 px-3 py-1 text-xs font-bold uppercase tracking-[.12em] text-[#e88a7a]">
                IDs visible
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-[#7d919c]">
              This page shows the shared registration event catalog and the participant event records used by the participants page.
            </p>
          </div>
          <Link
            to="/participants"
            className="rounded-[10px] bg-[#2b3a46] px-4 py-2 text-sm font-bold text-white hover:bg-[#334552]"
          >
            Open participants
          </Link>
        </div>

        <div className="mt-6 grid gap-6">
          <RegistrationEventCreator
            title="Create a new registration event"
            description="Create once here and reuse the same event in registration and participant tracking."
            buttonLabel="Create event"
            onCreate={handleCreateRegistrationEvent}
            onCreated={refreshRegistrationEvents}
          />

          <section className="rounded-[16px] border border-[#22303b] bg-[#18232c] p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#f2f5f3]" style={archivo}>Registration Event Catalog</h2>
                <p className="mt-1 text-sm text-[#7d919c]">These are the shared events used by the registration page dropdown.</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-[12px] border border-[#22303b]">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-[#22303b] text-[#d5dce0]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Event name</th>
                    <th className="px-4 py-3 font-semibold">Event id</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrationEvents.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-[#7d919c]" colSpan={4}>
                        No registration events found.
                      </td>
                    </tr>
                  ) : (
                    registrationEvents.map((event) => (
                      <tr key={event.id} className="border-t border-[#22303b] text-[#f2f5f3]">
                        <td className="px-4 py-3 font-semibold text-[#6fb3c0]">{event.eventName || 'Untitled event'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#d5dce0]">{event.id}</td>
                        <td className="px-4 py-3 text-[#d5dce0]">{event.eventDate || 'No date'}</td>
                        <td className="px-4 py-3 text-[#d5dce0]">{event.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[16px] border border-[#22303b] bg-[#18232c] p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#f2f5f3]" style={archivo}>Participant Event Records</h2>
                <p className="mt-1 text-sm text-[#7d919c]">These are the events stored for participants and shown in the participants page.</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-[12px] border border-[#22303b]">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-[#22303b] text-[#d5dce0]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Event name</th>
                    <th className="px-4 py-3 font-semibold">Event id</th>
                    <th className="px-4 py-3 font-semibold">Participant</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {participantEvents.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-[#7d919c]" colSpan={6}>
                        No participant events found.
                      </td>
                    </tr>
                  ) : (
                    participantEvents.map((event) => {
                      const participant = participantById.get(event.participantId)
                      const displayName = participant
                        ? `${participant['First Name'] ?? participant.participant?.firstName ?? ''} ${participant['Last Name'] ?? participant.participant?.lastName ?? ''}`.trim()
                        : ''

                      return (
                        <tr key={event.id} className="border-t border-[#22303b] text-[#f2f5f3]">
                          <td className="px-4 py-3 font-semibold text-[#6fb3c0]">{event.eventName || 'Untitled event'}</td>
                          <td className="px-4 py-3 font-mono text-xs text-[#d5dce0]">{event.id}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#f2f5f3]">{displayName || 'Unknown participant'}</div>
                            <div className="text-xs text-[#7d919c]">{participant?.Email || event.participantEmail || 'No email available'}</div>
                            <div className="text-xs text-[#7d919c]">Participant id: {event.participantId}</div>
                          </td>
                          <td className="px-4 py-3 text-[#d5dce0]">{event.eventDate || 'No date'}</td>
                          <td className="px-4 py-3 text-[#d5dce0]">{event.status}</td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/participants?eventId=${encodeURIComponent(event.id)}`}
                              className="rounded bg-[#3d8b99] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#4a9aaa]"
                            >
                              Open in participants
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
