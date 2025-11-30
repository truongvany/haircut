import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useUser } from '../../hooks/useUser';
import '../../components/AdminUsers.css';

interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'salon' | 'customer';
  created_at: string;
  status?: string;
}

export default function AdminUsers() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'salon' | 'customer'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Bạn không có quyền truy cập trang này');
      setLoading(false);
      return;
    }
    loadUsers();
  }, [user]);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/v1/admin/users');
      setUsers(data.items || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Không thể tải danh sách user');
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(u => {
    const roleMatch = filterRole === 'all' || u.role === filterRole;
    const searchMatch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return roleMatch && searchMatch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="role-badge admin">👨‍💼 Admin</span>;
      case 'salon':
        return <span className="role-badge salon">🏢 Salon Owner</span>;
      case 'customer':
        return <span className="role-badge customer">👥 Customer</span>;
      default:
        return <span className="role-badge">{role}</span>;
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="admin-unauthorized"><h2>Không có quyền truy cập</h2></div>;
  }

  if (loading) return <div className="admin-loading">⏳ Đang tải...</div>;

  return (
    <div className="admin-users">
      <button onClick={() => navigate('/admin')} className="btn-back">
        <span className="back-icon">←</span>
        <span className="back-text">back</span>
      </button>

      <div className="admin-header">
        <h1>👥 Quản Lý User</h1>
        <p>Quản lý tài khoản admin, salon owner và customer</p>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {/* Summary Stats */}
      <div className="user-stats">
        <div className="stat">
          <span className="stat-number">{users.filter(u => u.role === 'admin').length}</span>
          <span className="stat-label">Admin</span>
        </div>
        <div className="stat">
          <span className="stat-number">{users.filter(u => u.role === 'salon').length}</span>
          <span className="stat-label">Salon Owner</span>
        </div>
        <div className="stat">
          <span className="stat-number">{users.filter(u => u.role === 'customer').length}</span>
          <span className="stat-label">Customer</span>
        </div>
        <div className="stat">
          <span className="stat-number">{users.length}</span>
          <span className="stat-label">Tổng</span>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="role-filters">
          <button
            className={`filter-btn ${filterRole === 'all' ? 'active' : ''}`}
            onClick={() => setFilterRole('all')}
          >
            Tất cả ({users.length})
          </button>
          <button
            className={`filter-btn ${filterRole === 'admin' ? 'active' : ''}`}
            onClick={() => setFilterRole('admin')}
          >
            Admin ({users.filter(u => u.role === 'admin').length})
          </button>
          <button
            className={`filter-btn ${filterRole === 'salon' ? 'active' : ''}`}
            onClick={() => setFilterRole('salon')}
          >
            Salon ({users.filter(u => u.role === 'salon').length})
          </button>
          <button
            className={`filter-btn ${filterRole === 'customer' ? 'active' : ''}`}
            onClick={() => setFilterRole('customer')}
          >
            Customer ({users.filter(u => u.role === 'customer').length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>Không tìm thấy user nào</p>
        </div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Vai Trò</th>
                <th>Ngày Tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td className="user-id">
                    <strong>#{u.id}</strong>
                  </td>
                  <td>{u.full_name}</td>
                  <td className="email">{u.email}</td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="actions">
                    <button className="btn-view" disabled title="Chức năng đang được phát triển">
                      👁 Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
