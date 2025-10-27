import { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';

export default function SalonsPage(){
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      setLoading(true);
      try{
        const { data } = await api.get('/v1/salons');
        if(!mounted) return;
        setItems(data.items || []);
      }catch(e:any){
        setError(e?.response?.data?.error || 'Không thể tải salons');
      }finally{ setLoading(false); }
    })();
    return ()=>{ mounted = false };
  },[]);

  if(loading) return <div>Đang tải salons...</div>;
  if(error) return <div style={{color:'crimson'}}>{error}</div>;

  return (
    <div>
      <h2>Danh sách Salon</h2>
      {items.length === 0 ? <p>Không có salon.</p> : (
        <ul>
          {items.map(s => (
            <li key={s.id} style={{ marginBottom: 8 }}>
              <Link to={`/salons/${s.id}`}>{s.name}</Link>
              <div style={{ fontSize: 12, color: '#666' }}>{s.address_text ?? ''}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
