import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useUser } from '../../hooks/useUser';
import '../../components/Salon.css';

export default function EditSalonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useUser();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Load salon data
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/v1/salons/${id}`);
        if (!mounted) return;
        
        const salon = data.salon;
        setName(salon.name || '');
        setAddress(salon.address_text || '');
        setPhone(salon.phone || '');
        setEmail(salon.email || '');
        setDescription(salon.description || '');
        setAvatar(salon.avatar || '');
        setAvatarPreview(salon.avatar || '');
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Không thể tải thông tin salon');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name || !address) {
      alert('Vui lòng điền tên salon và địa chỉ');
      return;
    }

    setSubmitting(true);
    try {
      let avatarUrl = avatar;
      
      // Upload avatar if file selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        try {
          const uploadRes = await api.post('/v1/upload/avatar', formData);
          avatarUrl = uploadRes.data.url || uploadRes.data.path || avatarUrl;
        } catch (uploadErr) {
          // silently fail
        }
      }

      await api.put(`/v1/salons/${id}`, {
        name,
        address_text: address,
        phone,
        email,
        description,
        avatar: avatarUrl
      });

      alert('Cập nhật salon thành công!');
      navigate('/salons');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Cập nhật salon thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div style={{ color: 'crimson' }}>{error}</div>;

  return (
    <div className="salons-page">
      <div className="salons-container">
        <div className="salons-header">
          <h2>✏️ Chỉnh sửa Salon</h2>
          <p>Cập nhật thông tin salon của bạn</p>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tên Salon *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Salon Tóc Đẹp"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Địa chỉ *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: salon@example.com"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu về salon của bạn..."
                rows={4}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Logo/Avatar Salon</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }}
                    id="salon-avatar-upload"
                  />
                  <label htmlFor="salon-avatar-upload" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    📷 Chọn ảnh từ máy tính
                  </label>
                </div>
                {avatarPreview && (
                  <div style={{ textAlign: 'center' }}>
                    <img 
                      src={avatarPreview} 
                      alt="Preview" 
                      style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '8px', border: '1px solid #ddd' }} 
                    />
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>Xem trước</p>
                  </div>
                )}
              </div>
              <input 
                type="text" 
                value={avatar}
                onChange={(e) => {
                  setAvatar(e.target.value);
                  setAvatarPreview(e.target.value);
                }}
                placeholder="Hoặc nhập URL ảnh..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', marginTop: '0.75rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/salons')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

