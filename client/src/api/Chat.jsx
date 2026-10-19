import axios from "axios";

const API = "https://robmorfood-backend-new.onrender.com/api";

// ==============================
// CUSTOMER
// ==============================

export const getOrCreateStoreChat = (token, storeId) => {
  return axios.get(`${API}/chat/store/${storeId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getChatMessages = (token, roomId) => {
  return axios.get(`${API}/chat/${roomId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const sendChatMessage = (token, roomId, message) => {
  return axios.post(
    `${API}/chat/${roomId}/message`,
    {
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

// ==============================
// STORE
// ==============================

export const getStoreChatRooms = (token) => {
  return axios.get(`${API}/store/chat`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getStoreChatMessages = (token, roomId) => {
  return axios.get(`${API}/store/chat/${roomId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const sendStoreMessage = (token, roomId, message) => {
  return axios.post(
    `${API}/store/chat/${roomId}/message`,
    {
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};
