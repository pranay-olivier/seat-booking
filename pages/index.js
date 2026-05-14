import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'
 
const supabase = createClient(
  'https://aidkjaptzbwmetjvpylg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZGtqYXB0emJ3bWV0anZweWxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODU0MjYsImV4cCI6MjA5NDI2MTQyNn0.Rs4d3O001P3pPAb8qUFETcNRYijp2_8PFaZjy0kNlHs'
)
 
function getNext14Weekdays() {
  const days = []
  const d = new Date()
  // Use UK timezone
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
  const [selectedDate, setSelectedDate] = useState(null)
  const [seats, setSeats] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
 
  const weekdays = getNext14Weekdays()
 
  async function loadSeats(date) {
    setLoading(true)
    setMessage('')
    const dateStr = formatDate(date)
 
    const { data: allSeats } = await supabase
      .from('seats')
      .select('*')
      .eq('active', true)
      .order('seatnumber')
 
    const { data: dayBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('bookingdate', dateStr)
 
    setSeats(allSeats || [])
    setBookings(dayBookings || [])
    setSelectedDate(date)
    setLoading(false)
  }
 
  async function toggleSeat(seat) {
    if (!selectedDate) return
    const dateStr = formatDate(selectedDate)
    const existing = bookings.find(b => b.seatid === seat.id)
 
    if (existing) {
      // Cancel booking
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', existing.id)
      if (!error) {
        setBookings(bookings.filter(b => b.id !== existing.id))
        setMessage(`Seat ${seat.seatnumber} has been cancelled.`)
      }
    } else {
      // Make booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({ seatid: seat.id, bookingdate: dateStr })
        .select()
        .single()
      if (!error && data) {
        setBookings([...bookings, data])
        setMessage(`Seat ${seat.seatnumber} is now booked for ${formatDisplay(selectedDate)}.`)
      } else {
        setMessage('This seat was just taken. Please choose another.')
      }
    }
  }
 
  const floors = ['1', '2', '3']
 
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Seat Booking</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>Select a date, then click a seat to book or cancel it.</p>
 
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
          <div style={{ display: 'flex', gap: 16, marginBottom: '1rem', fontSize: '0.8rem', color: '#555' }}>
            <span><span style={{ display: 'inline-block', width: 14, height: 14, background: '#fff', border: '1px solid #ccc', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }}></span>Available</span>
            <span><span style={{ display: 'inline-block', width: 14, height: 14, background: '#dc2626', border: '1px solid #dc2626', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }}></span>Booked</span>
          </div>
 
          {floors.map(floor => {
            const floorSeats = seats.filter(s => s.seatnumber.startsWith(floor + '.'))
            if (floorSeats.length === 0) return null
            return (
              <div key={floor} style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#444' }}>Floor {floor}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {floorSeats.map(seat => {
                    const isBooked = bookings.some(b => b.seatid === seat.id)
                    return (
                      <button
                        key={seat.id}
                        onClick={() => toggleSeat(seat)}
                        style={{
                          width: 64,
                          height: 40,
                          borderRadius: 6,
                          border: '1px solid',
                          borderColor: isBooked ? '#dc2626' : '#d1d5db',
                          background: isBooked ? '#dc2626' : '#fff',
                          color: isBooked ? '#fff' : '#1a1a1a',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 500
                        }}
                      >
                        {seat.seatnumber}
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
