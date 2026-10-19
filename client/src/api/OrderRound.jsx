import axios from "axios";

const API = "https://robmorfood-backend-new.onrender.com/api";

export const getOrderRound = async (token) => {
  return axios.get(`${API}/store/order-round`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createOrderRound = async (token, value) => {
  return axios.post(`${API}/store/order-round`, value, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateOrderRound = async (token, roundId, data) => {
  return axios.put(
    `${API}/store/order-round/${roundId}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const removeOrderRound = async (token, id) => {
  return axios.delete(`${API}/store/order-round/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const removeAllOrderRound = async (token) => {
  return axios.delete(`${API}/store/order-round`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};