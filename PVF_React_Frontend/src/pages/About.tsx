export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-blue-800">About Prime Focus Inc.</h1>

      <section className="mt-6">
        <h2 className="text-2xl font-semibold">Our Mission</h2>
        <p className="mt-2 text-gray-700">
          Prime Focus Inc. improves equitable health outcomes by increasing access to
          vision care for underserved communities. Through early detection, intervention,
          and connection to care, we help individuals see clearly and move forward with
          confidence.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">Who We Serve</h2>
        <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
          <li>Children ages 5–17 (priority scheduling)</li>
          <li>Adults and families</li>
          <li>Veterans and older adults</li>
          <li>Underserved communities facing barriers to vision care</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">What We Do</h2>
        <p className="mt-2 text-gray-700">
          At Community Vision Events, participants move through registration, check-in,
          vision screening, comprehensive eye exams, frame selection, and pickup or
          shipping of custom eyeglasses — all free of charge and centered on a positive,
          respectful experience.
        </p>
      </section>
    </div>
  )
}
