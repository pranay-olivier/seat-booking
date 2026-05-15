S
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import Link from 'next/link'
 
const supabase = createClient(
  'https://aidkjaptzbwmetjvpylg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZGtqYXB0emJ3bWV0anZweWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODU0MjYsImV4cCI6MjA5NDI2MTQyNn0.Rs4d3O001P3pPAb8qUFETcNRYijp2_8PFaZjy0kNlHs'
)
 
const USERS = {
  'Dept.W': 'QMUL',
  'User.R': 'QMUL',
  'User.S': 'QMUL'
}
 
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
 
function formatDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
 
function getNext14Weekdays() {
  const days = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (days.length < 14) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}
 
export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [bookings, setBookings] = useState([])
  const [seats, setSeats] = useState([])
  const [blockedSeats, setBlockedSeats] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('bookings')
 
  // Block seat form
  const [blockSeatNumber, setBlockSeatNumber] = useState('')
  const [blockDate, setBlockDate] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockMessage, setBlockMessage] = useState('')
 
  const weekdays = getNext14Weekdays()
 
  useEffect(() => {
    const savedUser = sessionStorage.getItem('sb_user')
    if (savedUser) {
      setLoggedIn(true)
      setCurrentUser(savedUser)
      loadAllSeats()
    }
  }, [])
 
  async function loadAllSeats() {
    const { data: allSeats } = await supabase.from('seats').select('*').order('seat_number')
    setSeats(allSeats || [])
  }
 
  function handleLogin() {
    if (USERS[username] && USERS[username] === password) {
      sessionStorage.setItem('sb_user', username)
      setLoggedIn(true)
      setCurrentUser(username)
      setLoginError('')
      loadAllSeats()
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
    setBookings([])
    setSeats([])
    setBlockedSeats([])
    setMessage('')
  }
 
  async function loadBookings(date) {
    setLoading(true)
    setMessage('')
    const dateStr = formatDate(date)
 
    const { data: allSeats } = await supabase.from('seats').select('*').order('seat_number')
    const { data: dayBookings } = await supabase.from('bookings').select('*').eq('booking_date', dateStr)
    const { data: dayBlocked } = await supabase.from('blocked_seats').select('*').eq('blocked_date', dateStr)
 
    setSeats(allSeats || [])
    setBookings(dayBookings || [])
    setBlockedSeats(dayBlocked || [])
    setSelectedDate(date)
    setLoading(false)
  }
 
  async function cancelBooking(bookingId, seatNumber) {
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
    if (!error) {
      setBookings(bookings.filter(b => b.id !== bookingId))
      setMessage(`Booking for seat ${seatNumber} has been cancelled.`)
    }
  }
 
  async function unblockSeat(blockedId, seatNumber) {
    const { error } = await supabase.from('blocked_seats').delete().eq('id', blockedId)
    if (!error) {
      setBlockedSeats(blockedSeats.filter(b => b.id !== blockedId))
      setMessage(`Seat ${seatNumber} has been unblocked.`)
    }
  }
 
  async function handleBlockSeat() {
    setBlockMessage('')
    if (!blockSeatNumber || !blockDate) {
      setBlockMessage('Please enter a seat number and date.')
      return
    }
 
    const { data: seatData } = await supabase
      .from('seats')
      .select('*')
      .eq('seat_number', blockSeatNumber.trim())
      .single()
 
    if (!seatData) {
      setBlockMessage('Seat number not found. Please check and try again.')
      return
    }
 
    const { error } = await supabase.from('blocked_seats').insert({
      seat_id: seatData.id,
      blocked_date: blockDate,
      reason: blockReason || null
    })
    if (!error) {
      setBlockMessage(`Seat ${blockSeatNumber} has been blocked for ${formatDisplay(blockDate)}.`)
      setBlockSeatNumber('')
      setBlockDate('')
      setBlockReason('')
      if (selectedDate && formatDate(selectedDate) === blockDate) {
        loadBookings(selectedDate)
      }
    } else {
      setBlockMessage('This seat is already blocked for that date.')
    }
  }
 
  if (!loggedIn) {
    return (
      <div style={{ fontFamily: 'sans-serif', maxWidth: 400, margin: '6rem auto', padding: '2rem', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Admin Dashboard</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Please log in to continue.</p>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#444' }}>Username</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 12, fontSize: '0.95rem', boxSizing: 'border-box' }} />
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#444' }}>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 12, fontSize: '0.95rem', boxSizing: 'border-box' }} />
        {loginError && <p style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: 12 }}>{loginError}</p>}
        <button onClick={handleLogin} style={{ width: '100%', padding: '10px', borderRadius: 6, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: '0.95rem', cursor: 'pointer' }}>Log in</button>
      </div>
    )
  }
 
  const totalSeats = seats.length
  const bookedCount = bookings.length
  const blockedCount = blockedSeats.length
  const availableCount = totalSeats - bookedCount - blockedCount
 
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ fontSize: '0.85rem', color: '#1a1a1a', textDecoration: 'none', border: '1px solid #ccc', padding: '4px 10px', borderRadius: 6 }}>← Booking Page</Link>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>Logged in as <strong>{currentUser}</strong></span>
          <button onClick={handleLogout} style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', color: '#666' }}>Log out</button>
        </div>
      </div>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>View bookings, block seats, and manage the office.</p>
 
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('bookings')} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', background: activeTab === 'bookings' ? '#1a1a1a' : '#fff', color: activeTab === 'bookings' ? '#fff' : '#1a1a1a', cursor: 'pointer', fontSize: '0.9rem' }}>View Bookings</button>
        <button onClick={() => setActiveTab('block')} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', background: activeTab === 'block' ? '#1a1a1a' : '#fff', color: activeTab === 'block' ? '#fff' : '#1a1a1a', cursor: 'pointer', fontSize: '0.9rem' }}>Block a Seat</button>
      </div>
 
      {/* View Bookings Tab */}
      {activeTab === 'bookings' && (
        <>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Select a date</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
            {weekdays.map((d, i) => {
              const isSelected = selectedDate && formatDate(d) === formatDate(selectedDate)
              return (
                <button key={i} onClick={() => loadBookings(d)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', background: isSelected ? '#1a1a1a' : '#fff', color: isSelected ? '#fff' : '#1a1a1a', cursor: 'pointer', fontSize: '0.85rem' }}>
                  {d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </button>
              )
            })}
          </div>
 
          {message && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '10px 14px', marginBottom: '1.5rem', color: '#166534' }}>{message}</div>}
          {loading && <p>Loading...</p>}
 
          {!loading && selectedDate && (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[{ label: 'Booked', value: bookedCount, bg: '#fee2e2', color: '#991b1b' }, { label: 'Blocked', value: blockedCount, bg: '#fef9c3', color: '#713f12' }, { label: 'Available', value: availableCount, bg: '#dcfce7', color: '#166534' }, { label: 'Total', value: totalSeats, bg: '#f3f4f6', color: '#1a1a1a' }].map(stat => (
                  <div key={stat.label} style={{ background: stat.bg, borderRadius: 8, padding: '12px 20px', textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.8rem', color: stat.color }}>{stat.label}</div>
                  </div>
                ))}
              </div>
 
              {bookings.length === 0 && blockedSeats.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No bookings or blocked seats for this date.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Seat</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Floor</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Type</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Booked By / Reason</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => {
                      const seat = seats.find(s => s.id === booking.seat_id)
                      if (!seat) return null
                      return (
                        <tr key={booking.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>{seat.seat_number}</td>
                          <td style={{ padding: '10px 12px', color: '#666' }}>Floor {seat.seat_number.split('.')[0]}</td>
                          <td style={{ padding: '10px 12px' }}><span style={{ background: seat.label === 'Standing' ? '#fef9c3' : '#f3f4f6', color: seat.label === 'Standing' ? '#713f12' : '#666', padding: '2px 8px', borderRadius: 20, fontSize: '0.8rem' }}>{seat.label === 'Standing' ? 'Standing' : 'Standard'}</span></td>
                          <td style={{ padding: '10px 12px' }}><span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 20, fontSize: '0.8rem' }}>Booked</span></td>
                          <td style={{ padding: '10px 12px', color: '#666' }}>{booking.booked_by}</td>
                          <td style={{ padding: '10px 12px' }}><button onClick={() => cancelBooking(booking.id, seat.seat_number)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button></td>
                        </tr>
                      )
                    })}
                    {blockedSeats.map(blocked => {
                      const seat = seats.find(s => s.id === blocked.seat_id)
                      if (!seat) return null
                      return (
                        <tr key={'b' + blocked.id} style={{ borderBottom: '1px solid #f3f4f6', background: '#fffbeb' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>{seat.seat_number}</td>
                          <td style={{ padding: '10px 12px', color: '#666' }}>Floor {seat.seat_number.split('.')[0]}</td>
                          <td style={{ padding: '10px 12px' }}><span style={{ background: seat.label === 'Standing' ? '#fef9c3' : '#f3f4f6', color: seat.label === 'Standing' ? '#713f12' : '#666', padding: '2px 8px', borderRadius: 20, fontSize: '0.8rem' }}>{seat.label === 'Standing' ? 'Standing' : 'Standard'}</span></td>
                          <td style={{ padding: '10px 12px' }}><span style={{ background: '#fef9c3', color: '#713f12', padding: '2px 8px', borderRadius: 20, fontSize: '0.8rem' }}>Blocked</span></td>
                          <td style={{ padding: '10px 12px', color: '#666' }}>{blocked.reason || '—'}</td>
                          <td style={{ padding: '10px 12px' }}><button onClick={() => unblockSeat(blocked.id, seat.seat_number)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #a3e635', background: '#f7fee7', color: '#3f6212', cursor: 'pointer', fontSize: '0.8rem' }}>Unblock</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </>
      )}
 
      {/* Block a Seat Tab */}
      {activeTab === 'block' && (
        <div style={{ maxWidth: 500 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Block a seat for a specific date</h2>
 
          {blockMessage && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '10px 14px', marginBottom: '1rem', color: '#166534' }}>{blockMessage}</div>}
 
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#444' }}>Seat number</label>
          <input
            type="text"
            placeholder="e.g. 1.05"
            value={blockSeatNumber}
            onChange={e => setBlockSeatNumber(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 12, fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
 
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#444' }}>Date</label>
          <input
            type="date"
            value={blockDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setBlockDate(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 12, fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
 
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4, color: '#444' }}>Reason (optional)</label>
          <input
            type="text"
            placeholder="e.g. Maintenance, Reserved, Deep clean"
            value={blockReason}
            onChange={e => setBlockReason(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 16, fontSize: '0.95rem', boxSizing: 'border-box' }}
          />
 
          <button
            onClick={handleBlockSeat}
            style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: '0.95rem', cursor: 'pointer' }}
          >
            Block Seat
          </button>
 
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>To unblock a seat, go to View Bookings, select the date, and click Unblock next to the blocked seat.</p>
        </div>
      )}
    </div>
  )
}
