import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listNews, createNews, deleteNews, updateNews } from '../../api/news';
import '../../components/AdminNews.css';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  badge?: string;
  created_at: string;
}

export default function AdminNews() {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formBadge, setFormBadge] = useState('');

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    try {
      setLoading(true);
      const { items } = await listNews();
      setNews(items || []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Không thể tải tin tức');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      setIsCreating(true);
      await createNews(formTitle, formContent, formBadge || undefined);
      setFormTitle('');
      setFormContent('');
      setFormBadge('');
      alert('Tạo tin tức thành công!');
      loadNews();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Lỗi tạo tin tức');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bạn chắc chắn muốn xóa tin tức này?')) return;

    try {
      await deleteNews(id);
      alert('Xóa tin tức thành công!');
      loadNews();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Lỗi xóa tin tức');
    }
  }

  async function handleUpdate(id: number) {
    if (!formTitle.trim() || !formContent.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      await updateNews(id, formTitle, formContent, formBadge || undefined);
      setEditingId(null);
      setFormTitle('');
      setFormContent('');
      setFormBadge('');
      alert('Cập nhật tin tức thành công!');
      loadNews();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Lỗi cập nhật tin tức');
    }
  }

  function startEdit(item: NewsItem) {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormBadge(item.badge || '');
  }

  function cancelEdit() {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormBadge('');
  }

  return (
    <div className="admin-news">
      <div className="news-container">
        <div className="news-header">
          <button className="back-btn" onClick={() => navigate('/admin')}>← Quay lại</button>
          <h1>Quản Lý Tin Tức</h1>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        {/* Create/Edit Form */}
        <div className="news-form-card">
          <h2>{editingId ? '✏️ Sửa Tin Tức' : '📝 Tạo Tin Tức Mới'}</h2>
          <div className="form-group">
            <label>Tiêu Đề</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Nhập tiêu đề tin tức"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Nội Dung</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Nhập nội dung tin tức"
              className="form-textarea"
              rows={5}
            />
          </div>
          <div className="form-group">
            <label>Badge (Tùy Chọn)</label>
            <input
              type="text"
              value={formBadge}
              onChange={(e) => setFormBadge(e.target.value)}
              placeholder="Ví dụ: 🔥 HOT, ✨ NEW, 💰 SALE"
              className="form-input"
            />
          </div>
          <div className="form-actions">
            {editingId ? (
              <>
                <button className="btn-save" onClick={() => handleUpdate(editingId)} disabled={isCreating}>
                  💾 Lưu Thay Đổi
                </button>
                <button className="btn-cancel" onClick={cancelEdit}>
                  ✕ Hủy
                </button>
              </>
            ) : (
              <button className="btn-create" onClick={handleCreate} disabled={isCreating}>
                {isCreating ? '⏳ Đang tạo...' : '➕ Tạo Tin Tức'}
              </button>
            )}
          </div>
        </div>

        {/* News List */}
        {loading ? (
          <div className="loading-message">⏳ Đang tải tin tức...</div>
        ) : news.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có tin tức nào. Hãy tạo một tin tức mới!</p>
          </div>
        ) : (
          <div className="news-list-container">
            <h2>Danh Sách Tin Tức ({news.length})</h2>
            <div className="news-list">
              {news.map((item) => (
                <div key={item.id} className="news-card">
                  <div className="news-card-header">
                    <h3>{item.title}</h3>
                    {item.badge && <span className="news-badge-tag">{item.badge}</span>}
                  </div>
                  <p className="news-card-content">{item.content.substring(0, 100)}...</p>
                  <p className="news-card-date">
                    📅 {new Date(item.created_at).toLocaleDateString('vi-VN')}
                  </p>
                  <div className="news-card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => startEdit(item)}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
