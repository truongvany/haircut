import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../store/auth';
import { listServices } from '../api/services';
import type { Service } from '../api/services';
import { listStylists } from '../api/stylists';
import type { Stylist } from '../api/stylists';
import { listBookingsBySalonDate } from '../api/bookings';
import api from '../api/client';

export type CreateBookingPayload = {
    salonId: number;
    stylistId?: number | null;
    appointmentAt: string;
    items: { service_id: number; qty: number }[];
    note?: string;
    voucher_code?: string;
    voucher_id?: number;
};

async function createBooking(payload: CreateBookingPayload) {
    const backendPayload: any = {
        salon_id: payload.salonId,
        stylist_id: payload.stylistId ?? null,
        appointment_at: payload.appointmentAt,
        items: payload.items.map(i => ({ service_id: i.service_id, qty: i.qty })),
        note: payload.note ?? null
    } as any;
    if ((payload as any).voucher_code) backendPayload.voucher_code = (payload as any).voucher_code;
    if ((payload as any).voucher_id) backendPayload.voucher_id = (payload as any).voucher_id;

    const { data } = await api.post('/v1/bookings', backendPayload);
    return data;
}

const ServiceSelector = ({ services, selected, onChange }: { services: Service[], selected: { [key: number]: number }, onChange: (id: number, qty: number) => void }) => {
    return (
        <div>
            <h4>Chọn dịch vụ:</h4>
            {services.length === 0 && <p>Chưa có dịch vụ nào.</p>}
            {services.map(service => (
                <div key={service.id} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="number"
                        min={0}
                        value={selected[service.id] || 0}
                        onChange={(e) => onChange(service.id, parseInt(e.target.value, 10) || 0)}
                        style={{ width: '60px' }}
                    />
                    <span>{service.name} ({service.durationMin} phút) - {service.price.toLocaleString()}đ</span>
                </div>
            ))}
        </div>
    );
};

export default function NewBookingPage() {
    const navigate = useNavigate();
    const user = getUser();

    const [salons, setSalons] = useState<Array<{ id: number; name: string }>>([]);
    const [salonId, setSalonId] = useState<number | null>(null);
    const [salonInfo, setSalonInfo] = useState<any | null>(null);

    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [availableStylists, setAvailableStylists] = useState<Stylist[]>([]);
    const [selectedServices, setSelectedServices] = useState<{ [key: number]: number }>({});
    const [selectedStylistId, setSelectedStylistId] = useState<number | null>(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Load salons initially
    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/v1/salons');
                const items = data.items || [];
                setSalons(items.map((s: any) => ({ id: s.id, name: s.name })));
                if (items.length > 0) setSalonId(items[0].id);
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    // Load services/stylists when salon changes
    useEffect(() => {
        if (!salonId) return;
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const [svcResp, styResp, salonResp] = await Promise.all([
                    listServices(salonId, { limit: 200 }),
                    listStylists(salonId, { limit: 200 }),
                    api.get(`/v1/salons/${salonId}`)
                ]);
                if (!mounted) return;
                setAvailableServices(svcResp.items || []);
                setAvailableStylists(styResp.items || []);
                setSalonInfo(salonResp.data?.salon ?? null);
            } catch (e) {
                setError('Không thể tải dữ liệu salon');
            } finally {
                setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [salonId]);

    // Compute subtotal/minutes from selected services
    const computeTotals = () => {
        let totalMin = 0;
        let subtotal = 0;
        for (const [sidStr, qty] of Object.entries(selectedServices)) {
            const sid = Number(sidStr);
            const svc = availableServices.find(s => s.id === sid);
            if (!svc) continue;
            totalMin += (svc.durationMin || 0) * qty;
            subtotal += (svc.price || 0) * qty;
        }
        return { totalMin, subtotal };
    };

    // Compute available slots for a given date
    const computeAvailableSlots = async (sId: number, date: string) => {
        if (!sId || !date) return setAvailableSlots([]);
        const { totalMin } = computeTotals();
        // default slot length is totalMin
        const stepMin = 15;
        try {
            // fetch salon info if not present
            if (!salonInfo) {
                const resp = await api.get(`/v1/salons/${sId}`);
                setSalonInfo(resp.data?.salon ?? null);
            }
            const open = salonInfo?.open_time ?? null;
            const close = salonInfo?.close_time ?? null;
            if (!open || !close) return setAvailableSlots([]);
            const startTsBase = new Date(`${date}T${open}`);
            const endTsBase = new Date(`${date}T${close}`);
            // fetch bookings
            const { items: bookings } = await listBookingsBySalonDate(sId, date);
            // list stylists to check availability counts
            const { items: stylists } = await listStylists(sId, { limit: 200 });

            const slots: string[] = [];
            for (let t = startTsBase.getTime(); t + totalMin * 60 * 1000 <= endTsBase.getTime(); t += stepMin * 60 * 1000) {
                const slotStart = new Date(t);
                const slotEnd = new Date(t + totalMin * 60 * 1000);
                // Check conflicts
                if (selectedStylistId) {
                    // check if selected stylist has overlapping booking
                    const conflict = bookings.some((b: any) => {
                        if (!b.stylistId) return false;
                        if (b.stylistId !== selectedStylistId) return false;
                        const existingStart = new Date(b.appointmentAt.replace(' ', 'T')).getTime();
                        const existingEnd = existingStart + (b.totalMinutes || 0) * 60 * 1000;
                        return slotStart.getTime() < existingEnd && slotEnd.getTime() > existingStart;
                    });
                    if (!conflict) slots.push(slotStart.toISOString().substr(11,5));
                } else {
                    // find if any stylist is free in this slot
                    const freeExists = stylists.some((st: any) => {
                        const conflict = bookings.some((b: any) => {
                            if (!b.stylistId) return false;
                            if (b.stylistId !== st.id) return false;
                            const existingStart = new Date(b.appointmentAt.replace(' ', 'T')).getTime();
                            const existingEnd = existingStart + (b.totalMinutes || 0) * 60 * 1000;
                            return slotStart.getTime() < existingEnd && slotEnd.getTime() > existingStart;
                        });
                        return !conflict;
                    });
                    if (freeExists) slots.push(slotStart.toISOString().substr(11,5));
                }
            }
            setAvailableSlots(slots);
        } catch (e) {
            setAvailableSlots([]);
        }
    };

    useEffect(() => {
        if (!salonId || !appointmentDate) return;
        computeAvailableSlots(salonId, appointmentDate);
    }, [salonId, appointmentDate, selectedServices, selectedStylistId]);

    // Voucher apply
    const applyVoucher = async () => {
        if (!voucherCode || !salonId) return setError('Nhập mã voucher');
        try {
            const { data } = await api.get(`/v1/salons/${salonId}/vouchers`, { params: { code: voucherCode } });
            setAppliedVoucher(data.voucher);
            setError(null);
        } catch (e: any) {
            setAppliedVoucher(null);
            setError(e?.response?.data?.error || 'Voucher không hợp lệ');
        }
    };

    const handleServiceChange = (id: number, qty: number) => {
        const newSelected = { ...selectedServices };
        if (qty > 0) newSelected[id] = qty; else delete newSelected[id];
        setSelectedServices(newSelected);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        if (!user) { setError('Bạn cần đăng nhập để đặt lịch.'); navigate('/login'); return; }
        if (!salonId) { setError('Chọn salon'); return; }
        const items = Object.entries(selectedServices)
            .filter(([_, qty]) => Number(qty) > 0)
            .map(([sid, qty]) => ({ service_id: Number(sid), qty: Number(qty) }));
        if (items.length === 0) { setError('Vui lòng chọn ít nhất một dịch vụ.'); return; }
        if (!appointmentDate || !appointmentTime) { setError('Vui lòng chọn ngày và giờ hẹn.'); return; }
        const appointmentAt = `${appointmentDate} ${appointmentTime}:00`;
        if (new Date(appointmentAt.replace(' ','T')).getTime() < Date.now() + 60*60*1000) { setError('Thời gian hẹn phải sau ít nhất 1 giờ.'); return; }

        const payload: CreateBookingPayload = {
            salonId: salonId,
            stylistId: selectedStylistId ?? undefined,
            appointmentAt,
            items,
            note
        } as any;
        if (appliedVoucher) payload.voucher_id = appliedVoucher.id;
        else if (voucherCode) payload.voucher_code = voucherCode;

        setLoading(true);
        try {
            const res = await createBooking(payload);
            setSuccessMessage(`${res.message}. Mã lịch hẹn: ${res.booking_id}`);
            // reset
            setSelectedServices({}); setSelectedStylistId(null); setAppointmentDate(''); setAppointmentTime(''); setVoucherCode(''); setAppliedVoucher(null);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Đặt lịch thất bại');
        } finally { setLoading(false); }
    };

    const { totalMin, subtotal } = computeTotals();
    const discountPreview = appliedVoucher ? (appliedVoucher.discount_amt ?? Math.floor((appliedVoucher.discount_pct ?? 0)/100 * subtotal)) : 0;
    const totalPreview = Math.max(0, subtotal - discountPreview);

    return (
        <div style={{ maxWidth: 720, margin: 'auto' }}>
            <h2>Đặt lịch hẹn mới</h2>
            {loading && <p>Đang tải...</p>}
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
                <div>
                    <label>Chọn Salon:</label>
                    <select value={salonId ?? ''} onChange={e=>setSalonId(e.target.value?Number(e.target.value):null)}>
                        <option value="">-- Chọn salon --</option>
                        {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <ServiceSelector services={availableServices} selected={selectedServices} onChange={handleServiceChange} />

                <div>
                    <label>Chọn stylist (tùy chọn):</label>
                    <select value={selectedStylistId ?? ''} onChange={e=>setSelectedStylistId(e.target.value?Number(e.target.value):null)}>
                        <option value="">Bất kỳ / Salon xếp</option>
                        {availableStylists.map(s=> <option key={s.id} value={s.id}>{s.fullName}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div>
                        <label>Ngày:</label>
                        <input type="date" value={appointmentDate} onChange={e=>setAppointmentDate(e.target.value)} />
                    </div>
                    <div>
                        <label>Giờ (chọn nhanh):</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {availableSlots.length === 0 && <small>Chọn salon và ngày để xem khung giờ trống</small>}
                            {availableSlots.map(s=> (
                                <button type="button" key={s} onClick={()=>setAppointmentTime(s)} style={{ padding: '6px 8px' }}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label>Giờ thủ công:</label>
                        <input type="time" value={appointmentTime} onChange={e=>setAppointmentTime(e.target.value)} />
                    </div>
                </div>

                <div>
                    <label>Voucher:</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input value={voucherCode} onChange={e=>setVoucherCode(e.target.value)} placeholder="Mã voucher" />
                        <button type="button" onClick={applyVoucher}>Áp dụng</button>
                        {appliedVoucher && <small style={{ color: 'green' }}>Áp dụng: {appliedVoucher.code}</small>}
                    </div>
                </div>

                <div>
                    <label>Ghi chú:</label>
                    <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} style={{ width: '100%' }} />
                </div>

                <div>
                    <strong>Tạm tính:</strong> {subtotal.toLocaleString()}đ — <strong>Giảm</strong>: {discountPreview.toLocaleString()}đ — <strong>Tổng</strong>: {totalPreview.toLocaleString()}đ — <small>{totalMin} phút</small>
                </div>

                <div>
                    <button type="submit" disabled={loading}>{loading? 'Đang...' : 'Xác nhận đặt lịch'}</button>
                </div>
            </form>
        </div>
    );
}
