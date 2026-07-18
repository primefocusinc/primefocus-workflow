import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from "react-router";
import './index.css'
import Home from './pages/Home.tsx'
import About from './pages/About.tsx'
import Events from './pages/Events.tsx'
import Registration from './pages/Registration.tsx'
import Resources from './pages/Resources.tsx'
import VisionCheck from './pages/VisionCheck.tsx'
import Register from './pages/Register.tsx';
import LogIn from './pages/LogIn.tsx';

function Nav() {
  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/events', label: 'Events' },
    { to: '/vision-check', label: 'Vision Check' },
    { to: '/resources', label: 'Resources' },
    { to: '/register', label: 'Register' },
  ]
  return (
    <nav className="border-b bg-white">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link to="/" className="font-bold text-blue-800 text-lg">Prime Focus Inc.</Link>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-gray-700">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-blue-700">{l.label}</Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/vision-check" element={<VisionCheck />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/login" element={<LogIn />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
