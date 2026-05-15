import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
 
const supabase = createClient(
  'https://aidkjaptzbwmetjvpylg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZGtqYXB0emJ3bWV0anZweWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODU0MjYsImV4cCI6MjA5NDI2MTQyNn0.Rs4d3O001P3pPAb8qUFETcNRYijp2_8PFaZjy0kNlHs'
)
 
const USERS = {
  'Dept.W': 'QMUL',
  'User.R': 'QMUL',
  'User.S': 'QMUL'
}
 
function getNext14Weekdays() {
  const days = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (days.length < 14) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) {
      days.push(new Date(d))
    }
    d.setDate(d.getDate() + 1)
  }
  return days
}
 
function formatDate(date) {
  return date.toISOString().split('T')[0]
}
 
function formatDisplay(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
 
export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [seats, setSeats] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
 
  useEffect(() => {
    const savedUser = sessionStorage.getItem('sb_user')
    if (savedUser) {
      setLoggedIn(true)
      setCurrentUser(savedUser)
    }
  }, [])
 
  function handleLogin() {
    if (USERS[username] && USERS[username] === password) {
      sessionStorage.setItem('sb_user', username)
      setLoggedIn(true)
      setCurrentUser(username)
      setLoginError('')
    } else {
      setLoginError('Incorrect username or password.')
    }
  }
 
  function handleLogout() {
    sessionStorage.removeItem('sb_user')
    setLoggedIn(false)
    setCurrentUser('')
    setUsername('')
    setPassword('')
    setSelectedDate(null)
    setSeats([])
    setBookings([])
    setMessage('')
  }
 
  const weekdays = getNext14Weekdays()
 
  async function loadSeats(date) {
    setLoading(true)
    setMessage('')
    const dateStr = formatDate(date)
 
    const { data: allSeats } = await supabase
      .from('seats')
      .select('*')
      .eq('active', true)
      .order('seat_number')
 
    const { data: dayBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', dateStr)
 
    setSeats(allSeats || [])
    setBookings(dayBookings || [])
    setSelectedDate(date)
    setLoading(false)
  }
 
  async function handleSeatClick(seat) {
    if (!selectedDate) return
    const dateStr = formatDate(selectedDate)
    const existing = bookings.find(b => b.seat_id === seat.id)
 
    if (existing) {
      // Only allow cancel if this user booked it
      if (existing.booked_by !== currentUser) return
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', existing.id)
      if (!error) {
        setBookings(bookings.filter(b => b.id !== existing.id))
        setMessage(`Seat ${seat.seat_number} has been cancelled.`)
      }
    } else {
      const { data, error } = await supabase
        .from('bookings')
        .insert({ seat_id: seat.id, booking_date: dateStr, booked_by: currentUser })
        .select()
        .single()
      if (!error && data) {
        setBookings([...bookings, data])
        setMessage(`Seat ${seat.seat_number} is now booked for ${formatDisplay(selectedDate)}.`)
      } else {
        setMessage('This seat could not be booked. Please try again.')
      }
    }
  }
 
  const floors = ['1', '2', '3']
 
  if (!loggedIn) {
    return (
      <div style={{ fontFamily: 'sans-serif', maxWidth: 400, margin: '6rem auto', padding: '2rem', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Seat Booking</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Please log in to continue.</p>
 
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#444' }}>Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 12, fontSize: '0.95rem', boxSizing: 'border-box' }}
        />
 
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#444' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 12, fontSize: '0.95rem', boxSizing: 'border-box' }}
        />
 
        {loginError && (
          <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 12 }}>{loginError}</p>
        )}
 
        <button
          onClick={handleLogin}
          style={{ width: '100%', padding: '10px', borderRadius: 6, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: '0.95rem', cursor: 'pointer' }}
        >
          Log in
        </button>
      </div>
    )
  }
 
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>Seat Booking</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>Logged in as <strong>{currentUser}</strong></span>
          <button onClick={handleLogout} style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', color: '#666' }}>
            Log out
          </button>
        </div>
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Select a date, then click a seat to book it. You can only cancel your own bookings.</p>
 
      <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Select a date</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '2rem' }}>
        {weekdays.map((d, i) => {
          const isSelected = selectedDate && formatDate(d) === formatDate(selectedDate)
          return (
            <button
              key={i}
              onClick={() => loadSeats(d)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: isSelected ? '#1a1a1a' : '#fff',
                color: isSelected ? '#fff' : '#1a1a1a',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {formatDisplay(d)}
            </button>
          )
        })}
      </div>
 
      {message && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '10px 14px', marginBottom: '1.5rem', color: '#166534' }}>
          {message}
        </div>
      )}
 
      {loading && <p>Loading seats...</p>}
 
      {!loading && selectedDate && (
        <>
          <div style={{ display: 'flex', gap: 16, marginBottom: '1rem', fontSize: '0.8rem', color: '#555', flexWrap: 'wrap' }}>
            <span><span style={{ display: 'inline-block', width: 14, height: 14, background: '#fff', border: '1px solid #ccc', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }}></span>Available</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 14, background: '#22c55e', border: '1px solid #16a34a', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }}></span>Your booking</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 14, background: '#d1d5db', border: '1px solid #9ca3af', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }}></span>Booked by others</span>
          </div>
 
          {floors.map(floor => {
            const floorSeats = seats.filter(s => s.seat_number.startsWith(floor + '.'))
            if (floorSeats.length === 0) return null
            return (
              <div key={floor} style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#444' }}>Floor {floor}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {floorSeats.map(seat => {
                    const booking = bookings.find(b => b.seat_id === seat.id)
                    const isMyBooking = booking && booking.booked_by === currentUser
                    const isOthersBooking = booking && booking.booked_by !== currentUser
                    const isClickable = !isOthersBooking
 
                    return (
                      <button
                        key={seat.id}
                        onClick={() => isClickable && handleSeatClick(seat)}
                        style={{
                          width: 64,
                          height: 40,
                          borderRadius: 6,
                          border: '1px solid',
                          borderColor: isMyBooking ? '#16a34a' : isOthersBooking ? '#9ca3af' : '#d1d5db',
                          background: isMyBooking ? '#22c55e' : isOthersBooking ? '#d1d5db' : '#fff',
                          color: isMyBooking ? '#fff' : isOthersBooking ? '#6b7280' : '#1a1a1a',
                          cursor: isClickable ? 'pointer' : 'not-allowed',
                          fontSize: '0.8rem',
                          fontWeight: 500
                        }}
                      >
                        {seat.seat_number}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
