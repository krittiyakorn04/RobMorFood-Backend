import axios from "axios";

const API = "https://robmorfood-backend-new.onrender.com/api";

// =====================================================
// STORE ORDER
// =====================================================

export const getStoreOrders = async (token) => {
  return axios.get(`${API}/store/order`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const readOrder = async (token, id) => {
  return axios.get(`${API}/store/order/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// =====================================================
// DELIVERY
// =====================================================

export const getStoreDelivery = async (token) => {
  return axios.get(`${API}/store/delivery`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getDeliveryDetail = (token, id) => {
  return axios.get(`${API}/store/delivery/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const changeStatusOrder = async (token, id, status) => {
  return axios.patch(
    `${API}/store/order/${id}`,
    {
      status,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const cancelStoreOrder = (token, orderId) => {
  return axios.post(
    `${API}/store/order/${orderId}/cancel`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const changeStatusDelivery = async (token, id, status) => {
  return axios.patch(
    `${API}/store/delivery/${id}`,
    {
      status,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const confirmOrderCompleted = (token, orderId) => {
  return axios.patch(
    `${API}/store/order/${orderId}/confirm-completed`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

// =====================================================
// PAYMENT
// =====================================================

export const changeStatusPayment = async (
  token,
  id,
  status,
  rejectedReason = null,
) => {
  return axios.patch(
    `${API}/store/payment/${id}/status`,
    {
      status,
      rejectedReason,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

// =====================================================
// STORE REVIEWS
// =====================================================

export const getMyStoreReviews = (token) => {
  return axios.get(`${API}/store/reviews`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// =====================================================
// DELIVERY PROOF
// =====================================================

export const uploadDeliveryProof = (
  token,
  deliveryId,
  image,
  proofType,
) => {
  return axios.post(
    `${API}/store/delivery/${deliveryId}/proof`,
    {
      image,
      proofType,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const uploadRiderProof = (
  token,
  deliveryId,
  image,
  proofType,
) => {
  return axios.post(
    `${API}/store/deliverystaff/${deliveryId}/proof`,
    {
      image,
      proofType,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const removeDeliveryProof = (
  token,
  deliveryId,
  proofType,
) => {
  return axios.delete(
    `${API}/store/delivery/${deliveryId}/proof`,
    {
      data: {
        proofType,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const deleteRiderProof = (
  token,
  deliveryId,
  imageId,
) => {
  return axios.delete(
    `${API}/store/staff/delivery/${deliveryId}/proof/${imageId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

// =====================================================
// DELIVERY STAFF NOTIFICATIONS
// =====================================================

export const getDeliveryNotifications = (token) => {
  return axios.get(`${API}/store/staff/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const markDeliveryNotificationRead = (
  token,
  notificationId,
) => {
  return axios.patch(
    `${API}/store/staff/notification/${notificationId}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const markAllDeliveryNotificationsRead = (token) => {
  return axios.patch(
    `${API}/store/staff/notification/read-all`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};