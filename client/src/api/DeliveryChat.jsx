import axios from "axios";

const API = "https://robmorfood-backend-new.onrender.com/api";

// ==========================================
// CUSTOMER
// ==========================================

export const getCustomerDeliveryChat = (token, deliveryId) => {
  return axios.get(`${API}/chat/delivery/${deliveryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getCustomerDeliveryMessages = (token, roomId) => {
  return axios.get(`${API}/chat/delivery/${roomId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const sendCustomerDeliveryMessage = (token, roomId, message) => {
  return axios.post(
    `${API}/chat/delivery/${roomId}/message`,
    {
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

// ==========================================
// STORE
// ==========================================

export const getStoreDeliveryChat = (token, deliveryId) => {
  return axios.get(`${API}/store/chat/delivery/${deliveryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getStoreDeliveryMessages = (token, roomId) => {
  return axios.get(`${API}/store/chat/delivery/${roomId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const sendStoreDeliveryMessage = (token, roomId, message) => {
  return axios.post(
    `${API}/store/chat/delivery/${roomId}/message`,
    {
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

// ==========================================
// DELIVERY STAFF
// ==========================================

export const getStaffDeliveryChat = (token, deliveryId) => {
  return axios.get(
    `${API}/store/staff/chat/delivery/${deliveryId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getStaffDeliveryMessages = (token, roomId) => {
  return axios.get(`${API}/store/staff/chat/delivery/${roomId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const sendStaffDeliveryMessage = (token, roomId, message) => {
  return axios.post(
    `${API}/store/staff/chat/delivery/${roomId}/message`,
    {
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};