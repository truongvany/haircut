import api from './client';

export async function getMe() {
  const { data } = await api.get('/v1/me');
  return data.user as any;
}

export async function updateMe(payload: { name: string; phone?: string | null; avatar?: string | null }) {
  const { data } = await api.put('/v1/me', payload);
  return data;
}

export async function changePassword(current: string, ny: string) {
  const { data } = await api.put('/v1/me/password', { current_password: current, new_password: ny });
  return data;
}

export default { getMe, updateMe, changePassword };
