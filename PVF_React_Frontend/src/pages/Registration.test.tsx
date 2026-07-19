import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { adultParticipantType } from '../registrationModel'
import Registration from './Registration'

const saveRegistrationCustomerMock = vi.hoisted(() => vi.fn())
const getRegistrationEventsMock = vi.hoisted(() => vi.fn(() => Promise.resolve([])))
const createRegistrationEventMock = vi.hoisted(() => vi.fn())
const useAuthMock = vi.hoisted(() => vi.fn(() => ({ role: null })))

vi.mock('../DataControl', () => ({
  saveRegistrationCustomer: saveRegistrationCustomerMock,
  getRegistrationEvents: getRegistrationEventsMock,
  createRegistrationEvent: createRegistrationEventMock,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: useAuthMock,
}))

vi.mock('react-router', () => ({
  useSearchParams: vi.fn(() => [new URLSearchParams()]),
}))

function changeField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function fillRequiredAdultRegistration() {
  const user = userEvent.setup()

  changeField(/participant type/i, adultParticipantType)
  changeField(/^first name/i, 'Jamie')
  changeField(/^last name/i, 'Rivera')
  changeField(/date of birth/i, '1990-04-12')
  changeField(/^age/i, '36')
  changeField(/preferred method of communication/i, 'Email')
  changeField(/email address/i, '  FAMILY@Example.COM ')
  changeField(/does the participant currently wear glasses/i, 'No')
  changeField(/does the participant wear contact lenses/i, 'No')
  changeField(/has the participant ever been told they need glasses/i, 'Unsure')
  changeField(/does the participant currently have vision insurance/i, 'No')
  changeField(/referral source/i, 'School')
  fireEvent.click(screen.getByLabelText(/consent to participate/i))
  fireEvent.click(screen.getByLabelText(/communication authorization/i))
  fireEvent.click(screen.getByLabelText(/acknowledgement/i))
  changeField(/printed name/i, 'Jamie Rivera')

  return user
}

afterEach(() => {
  cleanup()
  saveRegistrationCustomerMock.mockReset()
  getRegistrationEventsMock.mockClear()
  createRegistrationEventMock.mockClear()
  useAuthMock.mockClear()
})

describe('Registration page', () => {
  it('flags invalid phone and email values while the user edits contact fields', async () => {
    const user = userEvent.setup()
    render(<Registration />)

    await user.selectOptions(screen.getByLabelText(/participant type/i), adultParticipantType)
    await user.type(screen.getByLabelText(/phone number/i), '614-555')
    await user.type(screen.getByLabelText(/email address/i), 'not-an-email')

    expect(screen.getByText(/enter a valid 10-digit phone number/i)).toBeInTheDocument()
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save registration/i })).toBeDisabled()
  })

  it('saves a complete registration and shows confirmation only after the save resolves', async () => {
    saveRegistrationCustomerMock.mockResolvedValue(undefined)
    render(<Registration />)

    const user = fillRequiredAdultRegistration()
    await user.click(screen.getByRole('button', { name: /save registration/i }))

    await waitFor(() => expect(saveRegistrationCustomerMock).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(/registration saved/i)).toBeInTheDocument()

    const savedCustomer = saveRegistrationCustomerMock.mock.calls[0]?.[0]
    expect(savedCustomer).toMatchObject({
      Email: 'family@example.com',
      'First Name': 'Jamie',
      'Last Name': 'Rivera',
      'Participant Type': adultParticipantType,
    })
    expect(savedCustomer.Events).toHaveLength(1)
  })

  it('shows a database error message when registration cannot be saved', async () => {
    saveRegistrationCustomerMock.mockRejectedValue(new Error('permission denied'))
    render(<Registration />)

    const user = fillRequiredAdultRegistration()
    await user.click(screen.getByRole('button', { name: /save registration/i }))

    expect(await screen.findByText(/unable to save registration/i)).toBeInTheDocument()
    expect(screen.queryByText(/^registration saved$/i)).not.toBeInTheDocument()
  })
})
