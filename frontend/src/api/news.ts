import api from './client';

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  badge?: string;
  created_at: string;
  updated_at: string;
}

export async function listNews() {
  const { data } = await api.get('/v1/news');
  return data;
}

export async function createNews(title: string, content: string, badge?: string) {
  const { data } = await api.post('/v1/admin/news', { title, content, badge });
  return data;
}

export async function deleteNews(id: number) {
  const { data } = await api.delete(`/v1/admin/news/${id}`);
  return data;
}

export async function updateNews(id: number, title: string, content: string, badge?: string) {
  const { data } = await api.put(`/v1/admin/news/${id}`, { title, content, badge });
  return data;
}
