import Button from '@mui/material/Button';

export default function Register() {
  return (
    <div> 
        <h1>Register</h1>
        <form>
            <input type="text" placeholder="Username" />
            <input type="email" placeholder="Email" />
            <input type="password" placeholder="Password" />
            <Button variant="contained" color="primary">
                Register
            </Button>
        </form>
    </div>
  )
}