import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Link } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import '../../components/Salon.css';

export default function SalonsPage(){
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [mySalon, setMySalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('21:00');
  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      setLoading(true);
      try{
        if (user?.role === 'salon') {
          // Load salon của mình
          const { data } = await api.get('/v1/salons/my');
          if(!mounted) return;
          setMySalon(data.salon);
          
          // Load tất cả salons
          const allSalons = await api.get('/v1/salons');
          if(!mounted) return;
          setItems(allSalons.data.items || []);
        } else {
          // Admin hoặc customer: load tất cả salons
          const { data } = await api.get('/v1/salons');
          if(!mounted) return;
          setItems(data.items || []);
        }
      }catch(e:any){
        setError(e?.response?.data?.error || 'Không thể tải salons');
      }finally{ setLoading(false); }
    })();
    return ()=>{ mounted = false };
  },[user]);

  // Format time for display (HH:MM:SS -> HH:MM)
  const formatTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  // Tạo salon mới
  const handleCreateSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name || !address) {
      alert('Vui lòng điền tên salon và địa chỉ');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/v1/salons', {
        name,
        address_text: address,
        phone,
        email,
        description,
        open_time: openTime + ':00',
        close_time: closeTime + ':00'
      });

      // Reload salon
      const { data } = await api.get('/v1/salons/my');
      setMySalon(data.salon);
      setShowCreateForm(false);

      // Reset form
      setName('');
      setAddress('');
      setPhone('');
      setEmail('');
      setDescription('');
      setOpenTime('08:00');
      setCloseTime('21:00');

      alert('Tạo salon thành công!');
      
      // Reload danh sách
      const allSalons = await api.get('/v1/salons');
      setItems(allSalons.data.items || []);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Tạo salon thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Mở form chỉnh sửa
  const handleShowEditForm = () => {
    if (!mySalon) return;
    
    setName(mySalon.name || '');
    setAddress(mySalon.address_text || '');
    setPhone(mySalon.phone || '');
    setEmail(mySalon.email || '');
    setDescription(mySalon.description || '');
    setOpenTime(mySalon.open_time ? formatTime(mySalon.open_time) : '08:00');
    setCloseTime(mySalon.close_time ? formatTime(mySalon.close_time) : '21:00');
    
    setShowEditForm(true);
  };

  // Cập nhật salon
  const handleUpdateSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !mySalon) return;

    if (!name || !address) {
      alert('Vui lòng điền tên salon và địa chỉ');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/v1/salons/${mySalon.id}`, {
        name,
        address_text: address,
        phone,
        email,
        description,
        open_time: openTime + ':00',
        close_time: closeTime + ':00'
      });

      // Reload salon
      const { data } = await api.get('/v1/salons/my');
      setMySalon(data.salon);
      setShowEditForm(false);

      alert('Cập nhật salon thành công!');
      
      // Reload danh sách
      const allSalons = await api.get('/v1/salons');
      setItems(allSalons.data.items || []);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Cập nhật salon thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa salon
  const handleDeleteSalon = async () => {
    if (!mySalon) return;

    if (!confirm('Bạn có chắc muốn xóa salon này? Tất cả dữ liệu liên quan sẽ bị xóa!')) {
      return;
    }

    try {
      await api.delete(`/v1/salons/${mySalon.id}`);
      setMySalon(null);
      alert('Xóa salon thành công!');
      
      // Reload danh sách
      const allSalons = await api.get('/v1/salons');
      setItems(allSalons.data.items || []);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Xóa salon thất bại');
    }
  };

  if(loading) {
    return (
      <div className="salons-loading">
        <div>Đang tải salons...</div>
      </div>
    );
  }

  if(error) {
    return (
      <div className="salons-error">
        <div>{error}</div>
      </div>
    );
  }

  // Giao diện cho Salon Owner
  if (user?.role === 'salon') {
    return (
      <div className="salons-page">
        <div className="salons-container">
          <div className="salons-header">
            <h2> ˚‧｡⋆🌻 Quản lý Salon của bạn 🌻⋆｡‧˚</h2>
            <p><b>Thông tin salon và cài đặt</b></p>
          </div>

          {!mySalon && !showCreateForm && (
            <div className="salon-owner-empty">
              <p>Bạn chưa có salon. Hãy tạo salon để bắt đầu!</p>
              <button className="btn-create-salon" onClick={() => setShowCreateForm(true)}>
                ➕ Tạo Salon Mới
              </button>
            </div>
          )}

          {showCreateForm && (
            <div className="salon-form-container">
              <h3>Tạo Salon Mới</h3>
              <form onSubmit={handleCreateSalon} className="salon-form">
                <div className="form-group">
                  <label>Tên Salon *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Salon Tóc Đẹp"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: salon@example.com"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Giờ mở cửa</label>
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Giờ đóng cửa</label>
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Giới thiệu về salon của bạn..."
                    rows={4}
                  />
                </div>

                <div className="form-buttons">
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Đang tạo...' : 'Tạo Salon'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowCreateForm(false)}>
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {showEditForm && mySalon && (
            <div className="salon-form-container">
              <h3>✏️ Chỉnh sửa Salon</h3>
              <form onSubmit={handleUpdateSalon} className="salon-form">
                <div className="form-group">
                  <label>Tên Salon *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Salon Tóc Đẹp"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: salon@example.com"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Giờ mở cửa</label>
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Giờ đóng cửa</label>
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Giới thiệu về salon của bạn..."
                    rows={4}
                  />
                </div>

                <div className="form-buttons">
                  <button type="submit" className="btn-submit" disabled={submitting}>
                    {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowEditForm(false)}>
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {mySalon && !showEditForm && (
            <div className="my-salon-section">
              <div className="my-salon-card">
                <h3> 🎀 {mySalon.name}</h3>
                <div className="salon-info-grid">
                  <p><strong>Địa chỉ:</strong> {mySalon.address_text}</p>
                  {mySalon.phone && <p><strong>Điện thoại:</strong> {mySalon.phone}</p>}
                  {mySalon.email && <p><strong>Email:</strong> {mySalon.email}</p>}
                  {mySalon.open_time && mySalon.close_time && (
                    <p><strong>Giờ mở cửa:</strong> {formatTime(mySalon.open_time)} - {formatTime(mySalon.close_time)}</p>
                  )}
                  {mySalon.description && <p><strong>Mô tả:</strong> {mySalon.description}</p>}
                  <p><strong>Trạng thái:</strong> {mySalon.status}</p>
                  <p><strong>Đánh giá:</strong> ⭐ {mySalon.rating_avg} ({mySalon.rating_count} đánh giá)</p>
                </div>
              </div>

              <div className="salon-actions">
                <button className="btn-edit" onClick={handleShowEditForm}>
                  ✏️ Chỉnh sửa
                </button>
                <button className="btn-delete" onClick={handleDeleteSalon}>
                  🗑️ Xóa Salon
                </button>
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div className="all-salons-section">
              <h3 className="section-title-center">Tất cả các Salon</h3>
              <ul className="salons-list">
                {items.map(s => (
                  <li key={s.id} className="salon-card">
                    <Link to={`/salons/${s.id}`} className="salon-link">
                      <div className="salon-icon"></div>
                      <div className="salon-name">{s.name}</div>
                      <div className="salon-address">{s.address_text ?? ''}</div>
                      {s.open_time && s.close_time && (
                        <div className="salon-hours">
                          🕐 {formatTime(s.open_time)} - {formatTime(s.close_time)}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Giao diện cho Admin/Customer
  return (
    <div className="salons-page">
      <div className="salons-container">
        <div className="salons-header">
          <h2>Danh sách Salon</h2>
          <p>Khám phá các salon làm đẹp uy tín</p>
        </div>

        {items.length === 0 ? (
          <div className="salons-empty">
            <p>Chưa có salon nào</p>
          </div>
        ) : (
          <ul className="salons-list">
            {items.map(s => (
              <li key={s.id} className="salon-card">
                <Link to={`/salons/${s.id}`} className="salon-link">
                  <div className="salon-icon"></div>
                  <div className="salon-name">{s.name}</div>
                  <div className="salon-address">{s.address_text ?? ''}</div>
                  {s.open_time && s.close_time && (
                    <div className="salon-hours">
                      🕐 {formatTime(s.open_time)} - {formatTime(s.close_time)}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}