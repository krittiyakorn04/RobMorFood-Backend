import axios from "axios";

const API_URL = "https://robmorfood-backend-new.onrender.com/api";

export const getAllStores = (token) => {
  return axios.get(`${API_URL}/admin/stores`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const changeStoreStatus = async (token, storeId, status) => {
  return axios.patch(
    `${API_URL}/admin/${storeId}/storeStatus`,
    {
      status,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getAllCustomer = (token) => {
  return axios.get(`${API_URL}/admin/customer`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const changeCustomerStatus = (token, id, status) => {
  return axios.patch(
    `${API_URL}/admin/${id}/customerStatus`,
    {
      status,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const adminLogin = async (data) => {
  return axios.post(`${API_URL}/admin/login`, data);
};

export const getAllOrderReports = (token) => {
  return axios.get(`${API_URL}/admin/order-reports`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Admin อัปเดตเรื่องร้องเรียน
export const updateOrderReport = (token, reportId, status, adminNote = "") => {
  return axios.patch(
    `${API_URL}/admin/order-report/${reportId}`,
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
