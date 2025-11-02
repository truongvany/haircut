import { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import '../components/Salon.css';

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
  <div className="salons-page">
  <div className="salons-container">
    <div className="salons-header">
      <h2>Danh sách Salon</h2>
      <p>Khám phá các salon làm đẹp uy tín</p>
    </div>
    
    <ul className="salons-list">
      {items.map(s => (
        <li key={s.id} className="salon-card">
          <Link to={`/salons/${s.id}`} className="salon-link">
            <div className="salon-icon"></div>
            <div className="salon-name">{s.name}</div>
            <div className="salon-address">{s.address_text ?? ''}</div>
          </Link>
        </li>
      ))}
    </ul>
  </div>
  </div>
  );
}
