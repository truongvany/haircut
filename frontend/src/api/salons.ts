import axios from 'axios';

const API_BASE = '/api/v1';

// Lấy thông tin salon của user hiện tại (chỉ cho role="salon")
export async function getMySalon() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const res = await axios.get(`${API_BASE}/salons/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return res.data;
  } catch (error: any) {
    console.error('getMySalon error:', error?.response?.data || error);
    throw error;
  }
}

// Lấy danh sách salon (public)
export async function listSalons(params?: any) {
  const res = await axios.get(`${API_BASE}/salons`, { params });
  return res.data;
}

// Lấy một salon theo id
export async function getSalon(id: number) {
  const res = await axios.get(`${API_BASE}/salons/${id}`);
  return res.data;
}

// Các thao tác quản lý salon (yêu cầu auth)
export async function createSalon(data: any) {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${API_BASE}/salons`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function updateSalon(id: number, data: any) {
  const token = localStorage.getItem('token');
  const res = await axios.put(`${API_BASE}/salons/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function deleteSalon(id: number) {
  const token = localStorage.getItem('token');
  const res = await axios.delete(`${API_BASE}/salons/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}