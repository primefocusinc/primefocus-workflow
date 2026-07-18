import { useState } from 'react'
import Button from '@mui/material/Button'
import { Link } from 'react-router'

type Question = {
  text: string
  fact: string
  options: string[] // first option counts as a "concern" (Yes)
}

const childQuestions: Question[] = [
  {
    text: 'Does your child frequently squint when trying to see things far away (such as the classroom board or television)?',
    fact: "Squinting may be a sign that your child's eyes are working harder to focus and could indicate the need for a comprehensive eye examination.",
    options: ['Yes', 'No'],
  },
  {
    text: 'Does your child complain of frequent headaches, especially after reading, using a computer, or after school?',
    fact: 'While headaches can have many causes, vision problems can sometimes contribute to eye strain and discomfort.',
    options: ['Yes', 'No'],
  },
  {
    text: 'Does your child hold books, tablets, or phones very close to their face?',
    fact: 'Holding reading materials unusually close may indicate difficulty seeing clearly at a comfortable distance.',
    options: ['Yes', 'No'],
  },
  {
    text: 'Has your child ever complained that words are blurry, doubled, or difficult to read?',
    fact: "Children don't always realize their vision isn't normal. They may assume everyone sees the same way they do.",
    options: ['Yes', 'No'],
  },
  {
    text: 'Does your child avoid reading, homework, or other close-up activities because they seem difficult or frustrating?',
    fact: 'Vision problems can sometimes affect reading confidence, concentration, and classroom participation.',
    options: ['Yes', 'No'],
  },
  {
    text: "Has it been more than one year since your child's last comprehensive eye examination—or has your child never had one?",
    fact: 'Regular comprehensive eye examinations can help identify vision problems that may not be detected through routine school screenings.',
    options: ['Yes', 'No', "I'm not sure"],
  },
]

const adultQuestions: Question[] = [
  {
    text: 'Do you have difficulty reading small print, even with good lighting?',
    fact: 'Changes in near vision become more common with age, but a comprehensive eye examination can determine whether corrective lenses or further evaluation is needed.',
    options: ['Yes', 'No'],
  },
  {
    text: 'Do you frequently experience blurry vision while driving, especially at night?',
    fact: 'Difficulty seeing at night may be related to changes in vision that should be evaluated by a licensed eye care professional.',
    options: ['Yes', 'No'],
  },
  {
    text: 'Do your eyes often feel tired, strained, or uncomfortable after reading or using digital devices?',
    fact: 'Extended screen time and uncorrected vision problems can both contribute to digital eye strain.',
    options: ['Yes', 'No'],
  },
  {
    text: 'Do you experience frequent headaches after reading, computer work, or other close-up tasks?',
    fact: 'Persistent headaches may have many causes, including vision changes. A comprehensive eye examination may help identify whether your eyes are contributing.',
    options: ['Yes', 'No'],
  },
  {
    text: 'Have you noticed that your vision has changed over the past year, or has it been more than two years since your last comprehensive eye examination?',
    fact: 'Many eye conditions develop gradually and may not cause noticeable symptoms in their early stages.',
    options: ['Yes', 'No', "I'm not sure"],
  },
  {
    text: 'Do you have diabetes, high blood pressure, or a family history of serious eye disease?',
    fact: 'Certain medical conditions and family history can increase the risk of eye diseases, making regular comprehensive eye examinations even more important.',
    options: ['Yes', 'No', 'Unsure'],
  },
]

const results = {
  low: {
    heading: 'No Immediate Concerns Identified',
    message:
      'Based on your responses, no common warning signs were identified today. Continue scheduling routine comprehensive eye examinations and monitor for any future changes in vision.',
  },
  medium: {
    heading: 'A Comprehensive Eye Exam May Be Helpful',
    message:
      'Your responses suggest that a comprehensive eye examination may be beneficial. While this assessment is not a diagnosis, scheduling an eye exam can help ensure your vision is evaluated by a licensed eye care professional.',
  },
  high: {
    heading: 'We Recommend Scheduling a Comprehensive Eye Exam',
    message:
      'Several of your responses suggest that scheduling a comprehensive eye examination would be beneficial. If Community Vision Day registration is currently open, we encourage you to register. If no upcoming events are available, please contact a licensed eye care professional in your community.',
  },
}

function scoreToResult(yesCount: number) {
  if (yesCount <= 1) return results.low
  if (yesCount <= 3) return results.medium
  return results.high
}

export default function VisionCheck() {
  const [type, setType] = useState<'child' | 'adult' | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [finished, setFinished] = useState(false)

  const questions = type === 'child' ? childQuestions : adultQuestions

  function reset() {
    setType(null)
    setAnswers({})
    setFinished(false)
  }

  // Type selection
  if (!type) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-blue-800">Vision Check</h1>
        <p className="mt-1 text-green-600">A Free 2-Minute Vision Awareness Assessment</p>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-gray-700">
          <strong>Important Notice:</strong> Vision Check is an educational awareness tool
          designed to help identify common signs that may indicate the need for a
          comprehensive eye examination. It is not intended to diagnose eye conditions,
          provide medical advice, or replace an examination by a licensed eye care
          professional. By continuing, you acknowledge that this assessment is for
          informational purposes only.
        </div>

        <h2 className="mt-8 text-xl font-semibold">Choose an assessment:</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <Button variant="contained" color="primary" onClick={() => setType('child')}>
            Vision Check for Children
          </Button>
          <Button variant="contained" color="primary" onClick={() => setType('adult')}>
            Vision Check for Adults
          </Button>
        </div>
      </div>
    )
  }

  // Results
  if (finished) {
    const yesCount = Object.values(answers).filter((i) => i === 0).length
    const result = scoreToResult(yesCount)
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-blue-800">{result.heading}</h1>
        <p className="mt-4 text-gray-700">{result.message}</p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link to="/register">
            <Button variant="contained" color="primary">
              Register for a Community Vision Day
            </Button>
          </Link>
          <Button variant="outlined" onClick={reset}>Start Over</Button>
        </div>

        <div className="mt-8 bg-gray-50 border rounded p-4 text-sm text-gray-600">
          <strong>Medical Disclaimer:</strong> Your Vision Check results are based solely
          on the answers you provided and are intended for educational purposes only. This
          assessment does not diagnose eye diseases, vision disorders, or any other medical
          condition. Only a licensed eye care professional can diagnose, treat, or manage
          eye and vision conditions. If you experience sudden vision loss, severe eye pain,
          flashes of light, a curtain-like shadow over your vision, or any other urgent eye
          symptoms, seek immediate medical attention.
        </div>
      </div>
    )
  }

  // Questions
  const allAnswered = questions.every((_, i) => answers[i] !== undefined)

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-blue-800">
        Vision Check for {type === 'child' ? 'Children' : 'Adults'}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {Object.keys(answers).length} of {questions.length} answered
      </p>

      <div className="mt-6 space-y-6">
        {questions.map((q, i) => (
          <div key={i} className="border rounded-lg p-5">
            <p className="font-medium text-gray-900">
              Question {i + 1}. {q.text}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {q.options.map((opt, oi) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                  className={`px-4 py-2 rounded border ${
                    answers[i] === oi
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-800 border-gray-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-600">
              <strong>Did You Know?</strong> {q.fact}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-4">
        <Button
          variant="contained"
          color="primary"
          disabled={!allAnswered}
          onClick={() => setFinished(true)}
        >
          See My Results
        </Button>
        <Button variant="text" onClick={reset}>Cancel</Button>
      </div>
    </div>
  )
}
