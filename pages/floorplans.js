import Link from 'next/link'
 
export default function FloorPlans() {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '2rem' }}>
        <Link href="/" style={{ fontSize: '0.85rem', color: '#666', textDecoration: 'none', border: '1px solid #ccc', padding: '4px 10px', borderRadius: 6 }}>
          ← Back to Booking
        </Link>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Floor Plans</h1>
      </div>
 
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#444', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Floor 1</h2>
        <img src="/First Floor.png" alt="Floor 1 Plan" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
      </div>
 
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#444', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Floor 2</h2>
        <img src="/Second Floor.png" alt="Floor 2 Plan" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
      </div>
 
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#444', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Floor 3</h2>
        <img src="/Third Floor.png" alt="Floor 3 Plan" style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }} />
      </div>
    </div>
  )
}
