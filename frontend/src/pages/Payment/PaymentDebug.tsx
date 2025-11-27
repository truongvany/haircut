import { useEffect, useState } from 'react';
import { listPayments } from '../../api/payments';
import { listMyBookings } from '../../api/bookings';

export default function PaymentDebugPage() {
  const [payments, setPayments] = useState<any>(null);
  const [bookings, setBookings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Test Payments API
        const paymentsResult = await listPayments();
        console.log('Payments API Response:', paymentsResult);
        setPayments(paymentsResult);

        // Test Bookings API
        const bookingsResult = await listMyBookings();
        console.log('Bookings API Response:', bookingsResult);
        setBookings(bookingsResult);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err?.message);
      }
    };
    load();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', lineHeight: 1.8 }}>
      <h1>API Debug</h1>
      {error && <div style={{ color: 'red', marginBottom: '20px' }}>Error: {error}</div>}
      
      <section style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '10px' }}>
        <h2>Payments API (/v1/payments)</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(payments, null, 2)}
        </pre>
      </section>

      <section style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '10px' }}>
        <h2>Bookings API (/v1/bookings/mine)</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(bookings, null, 2)}
        </pre>
      </section>

      {bookings?.items && bookings.items.length > 0 && (
        <section style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '10px' }}>
          <h2>First Booking Object Keys</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px' }}>
            {Object.keys(bookings.items[0]).join('\n')}
          </pre>
        </section>
      )}
    </div>
  );
}
