import axios from "axios";

const API = "https://robmorfood-backend-new.onrender.com/api";

export const getUserProfile = async (token) => {
  return axios.get(`${API}/user/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getStoreClient = async (token, id) => {
  return axios.get(`${API}/store/profile/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getStoreClientPublic = async (id) => {
  return axios.get(`${API}/store/profile-public/${id}`);
};

export const updateUserProfile = async (token, data) => {
  return axios.put(`${API}/user/profile`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createAddress = async (token, data) => {
  return axios.post(`${API}/user/address`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getAddress = async (token) => {
  return axios.get(`${API}/user/address`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateAddress = async (token, id, data) => {
  return axios.put(`${API}/user/address/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const removeAddress = async (token, id) => {
  return axios.delete(`${API}/user/address/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateUserPassword = (token, data) => {
  return axios.patch(
    `${API}/user/change-password`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};
