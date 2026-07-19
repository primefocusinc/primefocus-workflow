import { useState } from 'react'
import Button from '@mui/material/Button'

export type RegistrationEventDraft = {
  eventName: string
  eventDate: string
}

type RegistrationEventCreatorProps = {
  title: string
  description: string
  buttonLabel: string
  onCreate: (draft: RegistrationEventDraft) => Promise<void> | void
  onCreated?: () => Promise<void> | void
  className?: string
  initialEventName?: string
  initialEventDate?: string
  disabled?: boolean
}

const today = new Date().toISOString().slice(0, 10)

export default function RegistrationEventCreator({
  title,
  description,
  buttonLabel,
  onCreate,
  onCreated,
  className = '',
  initialEventName = '',
  initialEventDate = today,
  disabled = false,
}: RegistrationEventCreatorProps) {
  const [eventName, setEventName] = useState(initialEventName)
  const [eventDate, setEventDate] = useState(initialEventDate)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const trimmedName = eventName.trim()
    if (!trimmedName) {
      setError('Event name is required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await onCreate({ eventName: trimmedName, eventDate })
      await onCreated?.()
      setEventName('')
      setEventDate(today)
    } catch (createError) {
      console.error('Failed to create registration event', createError)
      setError('Unable to create this event right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}>
      <div className="mb-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Admin only</p>
        <h3 className="mt-1 text-lg font-bold text-amber-900">{title}</h3>
        <p className="mt-1 text-sm text-amber-900/80">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_auto]">
        <label>
          <span className="text-sm font-semibold text-gray-800">Event name</span>
          <input
            value={eventName}
            onChange={(changeEvent) => setEventName(changeEvent.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Back to School Vision 2026"
            disabled={disabled || saving}
          />
        </label>
        <label>
          <span className="text-sm font-semibold text-gray-800">Event date</span>
          <input
            type="date"
            value={eventDate}
            onChange={(changeEvent) => setEventDate(changeEvent.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            disabled={disabled || saving}
          />
        </label>
        <div className="flex items-end">
          <Button
            type="button"
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={disabled || saving}
          >
            {saving ? 'Creating...' : buttonLabel}
          </Button>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
    </section>
  )
}
