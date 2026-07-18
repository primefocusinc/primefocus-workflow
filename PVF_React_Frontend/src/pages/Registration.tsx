import { useState, type ReactNode } from 'react'
import Button from '@mui/material/Button'

function Section({ title, note, children }: {
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section className="border-t pt-6 mt-6">
      <h2 className="text-xl font-semibold text-blue-800">{title}</h2>
      {note && <p className="mt-1 text-sm text-gray-600">{note}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, type = 'text', optional }: {
  label: string
  type?: string
  optional?: boolean
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-800">
        {label} {optional && <span className="text-gray-400">(Optional)</span>}
      </span>
      <input
        type={type}
        className="mt-1 w-full border rounded px-3 py-2"
      />
    </label>
  )
}

function CheckRow({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" />
      <span className="text-gray-800">{label}</span>
    </label>
  )
}

export default function Registration() {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-blue-800">Thank You!</h1>
        <p className="mt-4 text-gray-700">
          Thank you for registering with Prime Focus Inc. Your registration has been
          received. Our team will review your information and contact you with updates
          regarding your selected Community Vision Event.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-blue-800">Prime Focus Inc.</h1>
      <p className="mt-1 text-gray-600">Community Vision Event Registration Form</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(true)
        }}
      >
        <Section title="Section 1 – Event Registration">
          <Field label="Select the Community Vision Event you are registering for" />
          <fieldset>
            <legend className="text-sm font-medium text-gray-800">Participant Type</legend>
            <div className="mt-2 space-y-1">
              <CheckRow label="Child (Ages 5–17)" />
              <CheckRow label="Adult (18+)" />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Children ages 5–17 receive priority scheduling. Adults are welcome to
              register and may be scheduled if appointment availability permits.
            </p>
          </fieldset>
        </Section>

        <Section title="Section 2 – Participant Information">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="First Name" />
            <Field label="Last Name" />
            <Field label="Date of Birth" type="date" />
            <Field label="Age" type="number" />
            <Field label="Gender" />
            <Field label="Race" />
            <Field label="Ethnicity" />
            <Field label="Primary Language" />
            <Field label="Veteran Status" />
            <Field label="LGBTQ+ Identity" optional />
            <Field label="Disability Status" optional />
          </div>
        </Section>

        <Section title="Section 3 – Parent/Guardian Information" note="Required for minors.">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Parent/Guardian Name" />
            <Field label="Relationship to Participant" />
            <Field label="Phone Number" type="tel" />
            <Field label="Email Address" type="email" />
            <Field label="Street Address" />
            <Field label="City" />
            <Field label="State" />
            <Field label="ZIP Code" />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-gray-800">
              Preferred Method of Communication
            </legend>
            <div className="mt-2 space-y-1">
              <CheckRow label="Phone" />
              <CheckRow label="Text Message" />
              <CheckRow label="Email" />
            </div>
          </fieldset>
        </Section>

        <Section title="Section 4 – School Information" note="Children only.">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="School Name" />
            <Field label="School District" />
            <Field label="Current Grade" />
          </div>
        </Section>

        <Section title="Section 5 – Vision History">
          <fieldset>
            <legend className="text-sm font-medium text-gray-800">
              Does the participant currently wear glasses?
            </legend>
            <div className="mt-2 space-y-1">
              <CheckRow label="Yes" />
              <CheckRow label="No" />
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-gray-800">
              If yes, are the glasses currently:
            </legend>
            <div className="mt-2 space-y-1">
              <CheckRow label="In their possession and worn regularly" />
              <CheckRow label="Broken" />
              <CheckRow label="Lost" />
              <CheckRow label="Left at home" />
              <CheckRow label="No longer fit or prescription is outdated" />
              <CheckRow label="Other" />
            </div>
          </fieldset>
          <p className="text-sm text-gray-600">
            The condition or availability of your glasses will not prevent you from
            receiving a vision screening or participating in this event.
          </p>
          <Field label="Date of Last Eye Exam" type="date" />
          <Field label="Name of Eye Care Provider" optional />
          <fieldset>
            <legend className="text-sm font-medium text-gray-800">
              Is the participant currently experiencing any of the following?
            </legend>
            <div className="mt-2 space-y-1">
              <CheckRow label="Difficulty seeing the board" />
              <CheckRow label="Blurry vision" />
              <CheckRow label="Frequent headaches" />
              <CheckRow label="Squinting" />
              <CheckRow label="Holds books or devices very close" />
              <CheckRow label="Eye strain" />
              <CheckRow label="Double vision" />
              <CheckRow label="No current concerns" />
            </div>
          </fieldset>
        </Section>

        <Section
          title="Section 6 – Insurance Information"
          note="Optional. Prime Focus Inc. will not bill your insurance, and your insurance status will not affect your eligibility to receive services."
        >
          <fieldset>
            <legend className="text-sm font-medium text-gray-800">
              Does the participant currently have vision insurance?
            </legend>
            <div className="mt-2 space-y-1">
              <CheckRow label="Yes" />
              <CheckRow label="No" />
              <CheckRow label="Unsure" />
            </div>
          </fieldset>
          <Field label="Medical Insurance Provider" optional />
        </Section>

        <Section title="Section 7 – Community Resource Interests" note="Optional.">
          <div className="grid md:grid-cols-2 gap-1">
            {[
              'Food Assistance', 'Housing Resources', 'Employment Services',
              'Financial Literacy', 'Health & Wellness Programs', 'Youth Programs',
              'Veteran Resources', 'Senior Resources', 'Vision Care Resources', 'Other',
            ].map((r) => <CheckRow key={r} label={r} />)}
          </div>
        </Section>

        <Section title="Section 8 – How did you hear about this event?">
          <div className="grid md:grid-cols-2 gap-1">
            {[
              'Social Media', 'School', 'Community Partner', 'Church/Faith Organization',
              'Healthcare Provider', 'Friend/Family', 'Motorsure America',
              'Prevent Blindness Ohio', 'Other',
            ].map((r) => <CheckRow key={r} label={r} />)}
          </div>
        </Section>

        <Section title="Section 9 – Consents & Authorizations">
          <CheckRow label="Consent to Participate — I authorize Prime Focus Inc. and its licensed healthcare partners to conduct a vision screening and, if applicable, provide information regarding recommended follow-up care." />
          <CheckRow label="Photo & Video Release — I grant permission for Prime Focus Inc. to photograph or record me and/or my child during the event for educational, promotional, fundraising, and marketing purposes." />
          <CheckRow label="Communication Authorization — I authorize Prime Focus Inc. to contact me by phone, email, and/or text message regarding event updates, follow-up information, community resources, and future Prime Focus programs." />
          <CheckRow label="Acknowledgement — I certify that the information provided is true and accurate to the best of my knowledge." />
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Field label="Electronic Signature" />
            <Field label="Printed Name" />
            <Field label="Date" type="date" />
          </div>
        </Section>

        <div className="mt-8">
          <Button type="submit" variant="contained" color="primary">
            Submit Registration
          </Button>
        </div>
      </form>
    </div>
  )
}
