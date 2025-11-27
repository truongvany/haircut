import { useEffect, useState } from 'react';
import { getUser, setAuth, clearAuth } from '../../store/auth';
import api from '../../api/client';
import { getMe, updateMe, changePassword } from '../../api/user';
import '../../components/Account.css';

export default function AccountPage(){
  const u = getUser();
  const [me, setMe] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  useEffect(()=>{
    if (u) loadProfile();
  }, []);

  async function loadProfile(){
    setLoading(true); setError(null);
    try{
      const data = await getMe();
      setMe(data);
      setName(data.name || ''); 
      setPhone(data.phone || ''); 
      setAvatar(data.avatar || '');
      setAvatarPreview(data.avatar || '');
    }catch(e:any){ setError(e?.response?.data?.error || 'Cannot load profile'); }
    finally{ setLoading(false); }
  }

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

async function onUpdate(e:any){
  e.preventDefault(); setError(null);
  try{
    let avatarUrl = avatar;
    
    // Upload avatar if file selected
    if (avatarFile) {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      try {
        const uploadRes = await api.post('/v1/upload/avatar', formData, { 
         headers: { 'Content-Type': 'multipart/form-data' }
      });
        avatarUrl = uploadRes.data.url || uploadRes.data.path || avatarUrl;
      } catch (uploadErr) {
        console.error('Avatar upload failed, using URL instead:', uploadErr);
      }
    }

    await updateMe({ name, phone, avatar: avatarUrl });
    alert('Cập nhật thông tin thành công! ✅');
    
    // THÊM DÒNG NÀY - Reload trang để cập nhật avatar ở header
    setTimeout(() => location.reload(), 500);
    
  }catch(e:any){ 
    alert(e?.response?.data?.error || 'Cập nhật thất bại'); 
  }
}

  async function onChangePassword(e:any){
    e.preventDefault();
    try{
      await changePassword(curPwd, newPwd);
      alert('Đổi mật khẩu thành công! ✅'); 
      setCurPwd(''); 
      setNewPwd('');
    }catch(e:any){ 
      alert(e?.response?.data?.error || 'Đổi mật khẩu thất bại'); 
    }
  }

  async function onLogout(){ clearAuth(); location.href = '/login'; }

  // If not logged in - show auth forms
  if (!u) return (
    <div className="account-page">
      <div className="auth-container">
        <div className="account-title">
          <h2>Tài khoản</h2>
          <p className="account-subtitle">Đăng nhập hoặc đăng ký để tiếp tục</p>
        </div>

        <div className="auth-grid">
          {/* Login Form */}
          <div className="auth-card">
            <h3 className="auth-title">🔐 Đăng nhập</h3>
            <form onSubmit={async (e)=>{ 
              e.preventDefault(); 
              const f=new FormData(e.target as HTMLFormElement); 
              const email=f.get('email'); 
              const password=f.get('password'); 
              try{ 
                const res = await api.post('/v1/auth/login',{ email, password }); 
                setAuth(res.data.token, res.data.user); 
                location.href='/'; 
              } catch(err:any){ 
                alert(err?.response?.data?.error || 'Đăng nhập thất bại'); 
              } 
            }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input name="email" type="email" placeholder="your@email.com" required className="form-input"/>
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input type="password" name="password" placeholder="••••••••" required className="form-input"/>
              </div>
              <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Đăng nhập</button>
            </form>
          </div>

          {/* Register Form */}
          <div className="auth-card">
            <h3 className="auth-title">✨ Đăng ký</h3>
            <form onSubmit={async (e)=>{ 
              e.preventDefault(); 
              const f=new FormData(e.target as HTMLFormElement); 
              const name=f.get('name'); 
              const email=f.get('email'); 
              const password=f.get('password'); 
              try{ 
                await api.post('/v1/auth/register',{ full_name: name, email, password }); 
                alert('Đăng ký thành công, vui lòng đăng nhập! ✅'); 
                location.href='/account'; 
              } catch(err:any){ 
                alert(err?.response?.data?.error || 'Đăng ký thất bại'); 
              } 
            }}>
              <div className="form-group">
                <label className="form-label">Họ tên</label>
                <input name="name" placeholder="Nguyễn Văn A" required className="form-input"/>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input name="email" type="email" placeholder="your@email.com" required className="form-input"/>
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input type="password" name="password" placeholder="••••••••" required className="form-input"/>
              </div>
              <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Đăng ký</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // Logged in view
  return (
    <div className="account-page">
      <div className="account-container">
        <div className="account-title">
          <h2>Quản lý tài khoản</h2>
          <p className="account-subtitle">Cập nhật thông tin cá nhân và bảo mật</p>
        </div>

        {loading && <div className="account-loading">⏳ Đang tải...</div>}
        {error && <div className="account-error">❌ {error}</div>}

        <div className="account-grid">
          {/* Main Content */}
          <div className="account-card">
            {/* Profile Section */}
            <h3 className="section-title">Thông tin cá nhân</h3>
            <form onSubmit={onUpdate}>
              <div className="form-group">
                <label className="form-label">Họ tên</label>
                <input 
                  value={name} 
                  onChange={e=>setName(e.target.value)} 
                  className="form-input" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input 
                  value={phone} 
                  onChange={e=>setPhone(e.target.value)} 
                  className="form-input"
                  placeholder="0909123456"
                />
              </div>
              
              {/* Avatar Upload Section */}
              <div className="form-group">
                <label className="form-label">Ảnh đại diện</label>
                <div className="avatar-upload-section">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="form-input"
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload" className="avatar-upload-label">
                    📷 Chọn ảnh từ máy tính
                  </label>
                  {avatarPreview && (
                    <div className="avatar-preview">
                      <img src={avatarPreview} alt="Preview" />
                      <p className="avatar-preview-text">Xem trước</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hoặc nhập URL ảnh</label>
                <input 
                  value={avatar} 
                  onChange={e=>{
                    setAvatar(e.target.value);
                    setAvatarPreview(e.target.value);
                  }} 
                  className="form-input"
                  placeholder="https://..."
                />
              </div>

              <button type="submit" className="btn btn-primary">💾 Lưu thông tin</button>
            </form>

            {/* Password Section */}
            <div className="password-section">
              <h3 className="section-title">Đổi mật khẩu</h3>
              <form onSubmit={onChangePassword}>
                <div className="form-group">
                  <label className="form-label">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={curPwd} 
                    onChange={e=>setCurPwd(e.target.value)} 
                    className="form-input" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={newPwd} 
                    onChange={e=>setNewPwd(e.target.value)} 
                    className="form-input" 
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">🔒 Đổi mật khẩu</button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="account-sidebar">
            <div className="user-avatar-section">
              <img 
                src={avatarPreview || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'User') + '&size=120&background=667eea&color=fff'} 
                alt="Avatar" 
                className="user-avatar sparkle"
                onError={(e) => {
                e.currentTarget.src = 'https://ui-avatars.com/api/?name=U&size=120&background=667eea&color=fff';
                }}
              />
            </div>
            <div className="user-info-item">
              <div className="info-label">📧 Email</div>
              <div className="info-value">{me?.email || 'Chưa cập nhật'}</div>
            </div>

            <div className="user-info-item">
              <div className="info-label">👤 Họ tên</div>
              <div className="info-value">{me?.name || 'Chưa cập nhật'}</div>
            </div>

            <div className="user-info-item">
              <div className="info-label">🎭 Vai trò</div>
              <div className="info-value">{me?.role || 'User'}</div>
            </div>

            <button onClick={onLogout} className="btn btn-danger" style={{width: '100%', marginTop: '20px'}}>
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}