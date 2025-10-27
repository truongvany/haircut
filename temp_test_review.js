const axios = require('axios');

const api = axios.create({ baseURL: 'http://localhost/haircut/backend/public/api' });

async function run(){
  try{
    console.log('1) Login as test customer...');
    const login = await api.post('/v1/auth/login', { email: 'guest@haircut.test', password: 'secret123' });
    const token = login.data?.token;
    if(!token){ console.error('Login failed, no token'); return; }
    console.log(' Logged in, token length:', token.length);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log('2) Get salons...');
    const salons = await api.get('/v1/salons');
    const salon = (salons.data.items || [])[0];
    if(!salon){ console.error('No salon found'); return; }
    console.log(' Using salon id', salon.id, salon.name);

    console.log('3) Get services for salon...');
    const sv = await api.get(`/v1/salons/${salon.id}/services`, { params: { limit: 10 } });
    const service = (sv.data.items || [])[0];
    if(!service){ console.error('No service found for salon', salon.id); return; }
    console.log(' Using service', service.id, service.name || service.slug || '');

    // appointment 2 hours from now
    const date = new Date(Date.now() + 2*60*60*1000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth()+1).padStart(2,'0');
    const dd = String(date.getDate()).padStart(2,'0');
    const hh = String(date.getHours()).padStart(2,'0');
    const min = String(date.getMinutes()).padStart(2,'0');
    const appt = `${yyyy}-${mm}-${dd} ${hh}:${min}:00`;

    console.log('4) Create booking at', appt);
    const create = await api.post('/v1/bookings', {
      salon_id: salon.id,
      stylist_id: null,
      appointment_at: appt,
      items: [{ service_id: service.id, qty: 1 }],
      note: 'Test booking for review'
    });
    console.log(' Create response:', create.data);
    const bookingId = create.data.booking_id;
    if(!bookingId){ console.error('Booking create failed'); return; }

    console.log('5) Confirm booking id', bookingId);
    const conf = await api.put(`/v1/bookings/${bookingId}/confirm`);
    console.log(' Confirm response:', conf.data);

    console.log('6) Complete booking id', bookingId);
    const comp = await api.put(`/v1/bookings/${bookingId}/complete`);
    console.log(' Complete response:', comp.data);

    console.log('7) Post review for booking');
    const post = await api.post(`/v1/bookings/${bookingId}/reviews`, { rating: 5, comment: 'Automated test review' });
    console.log(' Post review response:', post.data);

    console.log('8) Fetch salon reviews to verify...');
    const rev = await api.get(`/v1/salons/${salon.id}/reviews`);
    console.log(' Reviews count:', (rev.data.items || []).length);
    const found = (rev.data.items || []).find(r => r.booking_id == bookingId);
    if(found) console.log(' Found review:', found);
    else console.error(' Review not found in salon reviews');

  }catch(e){
    console.error('Error:', e.response ? e.response.data : e.message);
  }
}

run();
