import axios from "axios";

const API = "https://robmorfood-backend-new.onrender.com/api";

// =====================================================
// CART
// =====================================================

export const getAllUserCarts = (token) => {
  return axios.get(`${API}/user/carts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getUserCart = (token) => {
  return axios.get(`${API}/user/cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const addToCart = async (token, value) => {
  return axios.post(`${API}/user/cart`, value, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getCart = async (token, storeId) => {
  return axios.get(`${API}/user/cart/${storeId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateCart = async (token, id, data) => {
  return axios.patch(`${API}/user/cart/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const removeCart = async (token, id) => {
  return axios.delete(`${API}/user/cart/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// =====================================================
// ORDER
// =====================================================

export const createOrder = async (token, value) => {
  return axios.post(`${API}/user/order`, value, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const cancelOrder = (token, orderId) => {
  return axios.post(
    `${API}/user/order/${orderId}/cancel`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getOrder = async (token) => {
  return axios.get(`${API}/user/order`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getOrderDetail = async (token, id) => {
  return axios.get(`${API}/user/order/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const uploadSlip = (token, orderId, image) => {
  return axios.post(
    `${API}/user/order/${orderId}/slip`,
    {
      image,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const removeSlip = async (token, id, public_id) => {
  return axios.delete(`${API}/user/payment/${id}`, {
    data: {
      public_id,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const confirmReceived = async (token, orderId) => {
  return axios.patch(
    `${API}/user/order/${orderId}/confirm-received`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

// =====================================================
// REVIEW
// =====================================================

export const getReview = (token, orderId) => {
  return axios.get(`${API}/user/review/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createReview = (token, orderId, data) => {
  return axios.post(
    `${API}/user/review/${Number(orderId)}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const updateReview = (token, reviewId, data) => {
  return axios.put(`${API}/user/review/${reviewId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const removeReview = (token, reviewId) => {
  return axios.delete(`${API}/user/review/${reviewId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getStoreReviews = (token, storeId) => {
  return axios.get(
    `${API}/user/store/${Number(storeId)}/reviews`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

// =====================================================
// ORDER REPORT
// =====================================================

export const createOrderReport = (
  token,
  orderId,
  type,
  detail = "",
) => {
  return axios.post(
    `${API}/order-report`,
    {
      orderId,
      type,
      detail,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

// =========================
// ดูเรื่องร้องเรียนของตัวเอง
// =========================

export const getMyOrderReports = (token) => {
  return axios.get(`${API}/order-report/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};