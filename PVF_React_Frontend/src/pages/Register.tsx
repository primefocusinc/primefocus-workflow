import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, createUserProfile, DEFAULT_ROLE, googleProvider, type UserRole } from '../firebase'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role] = useState<UserRole>(DEFAULT_ROLE)
  const [error, setError] = useState('')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await createUserProfile(credential.user, role)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.')
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoadingGoogle(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      await createUserProfile(result.user, role)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign up with Google.')
    } finally {
      setLoadingGoogle(false)
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md rounded border p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold">Create Account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded border px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded border px-3 py-2"
          required
        />
        {/* <select
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          className="rounded border px-3 py-2"
        >
          <option value="basic-user">Basic User</option>
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
        </select> */}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-white">
          Register
        </button>
      </form>

      <div className="my-4 flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-300" />
        <span className="text-sm text-gray-500">or</span>
        <div className="h-px flex-1 bg-gray-300" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loadingGoogle}
        className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-gray-700"
      >
        {loadingGoogle ? 'Signing in...' : 'Continue with Google'}
      </button>

      <p className="mt-4 text-sm text-gray-600">
        Already have an account? <Link to="/login" className="text-blue-700">Log in</Link>
      </p>
    </div>
  )
}