import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { getAllEvents, getCustomers, type CustomerRecord, type EventRecord } from '../DataControl'
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

export default function AdminEvents() {
  const { user, role } = useAuth()
  const [events, setEvents] = useState<EventRecord[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [loadedEvents, loadedCustomers] = await Promise.all([getAllEvents(), getCustomers()])
      setEvents(loadedEvents.sort(sortByRecency))
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
              This page lists every event stored in the system, including its event id, participant id, and a link back to the participant record.
            </p>
          </div>
          <Link
            to="/participants"
            className="rounded-[10px] bg-[#2b3a46] px-4 py-2 text-sm font-bold text-white hover:bg-[#334552]"
          >
            Open participants
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-[16px] border border-[#22303b] bg-[#18232c]">
          <div className="overflow-x-auto">
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
                {events.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-[#7d919c]" colSpan={6}>
                      No events found.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => {
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
        </div>
      </div>
    </main>
  )
}
