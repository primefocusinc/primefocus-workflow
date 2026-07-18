import { Link } from 'react-router'
import Button from '@mui/material/Button'

const events = [
  {
    name: 'Community Vision Day',
    date: 'September 12',
    location: 'Northeast Ohio',
    status: 'Registration Open',
  },
]

export default function Events() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-blue-800">Community Vision Events</h1>
      <p className="mt-2 text-gray-700">
        Register online ahead of time or on-site at the event.
      </p>

      <div className="mt-8 space-y-4">
        {events.map((e) => (
          <div
            key={e.name}
            className="border rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h2 className="text-xl font-semibold">{e.name}</h2>
              <p className="text-gray-700">{e.date} · {e.location}</p>
              <span className="inline-block mt-2 text-sm text-green-700 font-medium">
                {e.status}
              </span>
            </div>
            <Link to="/register">
              <Button variant="contained" color="primary">Register</Button>
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-8 text-gray-600">
        Not sure if you need an eye exam?{' '}
        <Link to="/vision-check" className="text-blue-700 underline">
          Take the free 2-minute Vision Check
        </Link>
        .
      </p>
    </div>
  )
}
