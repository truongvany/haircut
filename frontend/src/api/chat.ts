import api from "./client";

export async function startConversation(salonId: number) {
  const { data } = await api.post(`/v1/chats/${salonId}/start`);
  return data;
}

export async function listConversations() {
  const { data } = await api.get(`/v1/chats/conversations`);
  return data;
}

export async function getMessages(conversationId: number) {
  const { data } = await api.get(`/v1/chats/${conversationId}/messages`);
  return data;
}

export async function sendMessage(conversationId: number, message: string) {
  const { data } = await api.post(`/v1/chats/${conversationId}/messages`, { message });
  return data;
}

export async function markMessageAsRead(messageId: number) {
  const { data } = await api.put(`/v1/chats/${messageId}/read`);
  return data;
}

export async function getUnreadCount(conversationId: number) {
  const { data } = await api.get(`/v1/chats/${conversationId}/unread-count`);
  return data;
}

export async function getTotalUnread() {
  const { data } = await api.get(`/v1/chats/total-unread`);
  return data;
}
