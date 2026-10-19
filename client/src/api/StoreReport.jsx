import axios from "axios";

const API = "https://robmorfood-backend-new.onrender.com/api";

export const getStoreReport = async (token, params = {}) => {
  return axios.get(`${API}/store/report`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getStoreOrderReports = async (token) => {
  return axios.get(`${API}/store/order-reports`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateStoreOrderReport = async (
  token,
  reportId,
  status,
  adminNote,
) => {
  return axios.patch(
    `${API}/store/order-reports/${reportId}`,
    {
      status,
      adminNote,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};
