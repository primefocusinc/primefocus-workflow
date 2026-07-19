import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import RegistrationEventCreator from '../components/RegistrationEventCreator'
import { createRegistrationEvent, deleteRegistrationEvent, getRegistrationEvents, type RegistrationEventOption } from '../DataControl'
import { useAuth } from '../context/AuthContext'

const archivo = { fontFamily: 'Archivo, sans-serif' }

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
  const [registrationEvents, setRegistrationEvents] = useState<RegistrationEventOption[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingEventIds, setDeletingEventIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function loadData() {
      const loadedRegistrationEvents = await getRegistrationEvents()
      setRegistrationEvents(loadedRegistrationEvents.sort(sortRegistrationEvents))
      setLoading(false)
    }

    loadData()
  }, [])

  const refreshRegistrationEvents = async () => {
    const refreshedEvents = await getRegistrationEvents()
    setRegistrationEvents(refreshedEvents.sort(sortRegistrationEvents))
  }

  const handleCreateRegistrationEvent = async ({ eventName, eventDate }: { eventName: string; eventDate: string }) => {
    await createRegistrationEvent(eventName, eventDate)
  }

  const handleDeleteRegistrationEvent = async (eventId: string, eventName: string) => {
    const confirmed = window.confirm(`Delete registration event "${eventName || eventId}"?`)
    if (!confirmed) {
      return
    }

    setDeletingEventIds((current) => ({ ...current, [eventId]: true }))
    try {
      await deleteRegistrationEvent(eventId)
      setRegistrationEvents((current) => current.filter((event) => event.id !== eventId))
    } finally {
      setDeletingEventIds((current) => ({ ...current, [eventId]: false }))
    }
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
              This page shows the shared registration event catalog used by the registration page and participant tracking.
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
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrationEvents.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-[#7d919c]" colSpan={5}>
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
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void handleDeleteRegistrationEvent(event.id, event.eventName)}
                            disabled={Boolean(deletingEventIds[event.id])}
                            className="rounded border border-red-300 px-3 py-1.5 text-xs font-bold text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingEventIds[event.id] ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))
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
