import { useEffect, useState } from 'react';
import { getUser, setAuth, clearAuth } from '../store/auth';
import api from '../api/client';
import { getMe, updateMe, changePassword } from '../api/user';

export default function AccountPage(){
  const u = getUser();
  const [me, setMe] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

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
      setName(data.name || ''); setPhone(data.phone || ''); setAvatar(data.avatar || '');
    }catch(e:any){ setError(e?.response?.data?.error || 'Cannot load profile'); }
    finally{ setLoading(false); }
  }

  async function onUpdate(e:any){
    e.preventDefault(); setError(null);
    try{
      await updateMe({ name, phone, avatar });
      alert('Profile updated');
      // refresh
      await loadProfile();
    }catch(e:any){ alert(e?.response?.data?.error || 'Update failed'); }
  }

  async function onChangePassword(e:any){
    e.preventDefault();
    try{
      await changePassword(curPwd, newPwd);
      alert('Password changed'); setCurPwd(''); setNewPwd('');
    }catch(e:any){ alert(e?.response?.data?.error || 'Change password failed'); }
  }

  async function onLogout(){ clearAuth(); location.href = '/login'; }

  // If not logged in show login/register forms
  if (!u) return (
    <div style={{ maxWidth: 640, margin: 'auto' }}>
      <h2>Account</h2>
      <p>Bạn chưa đăng nhập. Bạn có thể đăng nhập hoặc đăng ký tài khoản mới.</p>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex:1 }}>
          <h3>Đăng nhập</h3>
          <form onSubmit={async (e)=>{ e.preventDefault(); const f=new FormData(e.target as HTMLFormElement); const email=f.get('email'); const password=f.get('password'); try{ const res = await api.post('/v1/auth/login',{ email, password }); setAuth(res.data.token, res.data.user); location.href='/'; } catch(err:any){ alert(err?.response?.data?.error || 'Login failed'); } }}>
            <div><input name="email" placeholder="Email" required style={{width:'100%'}}/></div>
            <div style={{ marginTop:8 }}><input type="password" name="password" placeholder="Password" required style={{width:'100%'}}/></div>
            <div style={{ marginTop:8 }}><button type="submit">Đăng nhập</button></div>
          </form>
        </div>
        <div style={{ flex:1 }}>
          <h3>Đăng ký</h3>
          <form onSubmit={async (e)=>{ e.preventDefault(); const f=new FormData(e.target as HTMLFormElement); const name=f.get('name'); const email=f.get('email'); const password=f.get('password'); try{ await api.post('/v1/auth/register',{ full_name: name, email, password }); alert('Đăng ký thành công, vui lòng đăng nhập'); location.href='/account'; } catch(err:any){ alert(err?.response?.data?.error || 'Register failed'); } }}>
            <div><input name="name" placeholder="Họ tên" required style={{width:'100%'}}/></div>
            <div style={{ marginTop:8 }}><input name="email" placeholder="Email" required style={{width:'100%'}}/></div>
            <div style={{ marginTop:8 }}><input type="password" name="password" placeholder="Password" required style={{width:'100%'}}/></div>
            <div style={{ marginTop:8 }}><button type="submit">Đăng ký</button></div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: 'auto' }}>
      <h2>Quản lý tài khoản</h2>
      {loading && <p>Đang tải...</p>}
      {error && <p style={{color:'crimson'}}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div>
          <h3>Thông tin cá nhân</h3>
          <form onSubmit={onUpdate}>
            <div><label>Họ tên</label><br/><input value={name} onChange={e=>setName(e.target.value)} style={{width:'100%'}} required/></div>
            <div style={{ marginTop:8 }}><label>Phone</label><br/><input value={phone} onChange={e=>setPhone(e.target.value)} style={{width:'100%'}}/></div>
            <div style={{ marginTop:8 }}><label>Avatar URL</label><br/><input value={avatar} onChange={e=>setAvatar(e.target.value)} style={{width:'100%'}}/></div>
            <div style={{ marginTop:8 }}><button type="submit">Lưu thông tin</button></div>
          </form>

          <h3 style={{ marginTop: 18 }}>Đổi mật khẩu</h3>
          <form onSubmit={onChangePassword}>
            <div><input type="password" placeholder="Mật khẩu hiện tại" value={curPwd} onChange={e=>setCurPwd(e.target.value)} style={{width:'100%'}} required/></div>
            <div style={{ marginTop:8 }}><input type="password" placeholder="Mật khẩu mới" value={newPwd} onChange={e=>setNewPwd(e.target.value)} style={{width:'100%'}} required/></div>
            <div style={{ marginTop:8 }}><button type="submit">Đổi mật khẩu</button></div>
          </form>
        </div>
        <aside style={{ borderLeft: '1px solid #eee', paddingLeft: 12 }}>
          <h3>Tài khoản</h3>
          <p><strong>Email:</strong> {me?.email}</p>
          <p><strong>Vai trò:</strong> {me?.role}</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={onLogout}>Logout</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
