import api from './api';

export async function getMessages(chatId, { page = 1, limit = 20, search = '' } = {}) {
  const res = await api.get(`/messages/${chatId}`, { params: { page, limit, search } });
  return res.data.data; // { messages, pagination }
}

export async function sendMessageRest({ chatId, content, messageType, fileUrl, fileName }) {
  const res = await api.post('/messages', { chatId, content, messageType, fileUrl, fileName });
  return res.data.data.message;
}

export async function deleteMessage(messageId) {
  await api.delete(`/messages/${messageId}`);
}

export async function clearChat(chatId) {
  await api.delete(`/messages/chat/${chatId}/clear`);
}

export async function getMessageInfo(messageId) {
  const res = await api.get(`/messages/${messageId}/info`);
  return res.data.data; // { seenBy, notSeenBy, totalRecipients }
}

export async function uploadFile(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post('/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
  return res.data.data; // { fileUrl, fileName, messageType, size }
}
