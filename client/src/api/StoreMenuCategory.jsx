import axios from "axios";

const API = "https://robmorfood-backend-new.onrender.com/api";

export const createCatagory = async (token, form) => {
  return axios.post(`${API}/store/category`, form, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const listCatagory = async (token) => {
  return axios.get(`${API}/store/category`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateCatagory = async (token, id, data) => {
  return axios.put(`${API}/store/category/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const removeCatagory = async (token, id) => {
  return axios.delete(`${API}/store/category/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
