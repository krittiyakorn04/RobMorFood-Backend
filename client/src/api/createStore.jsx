import axios from "axios";

const API = "https://robmorfood-backend.onrender.com/api";

export const getStoreProfile = async (token) => {
  return axios.get(`${API}/store/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateStoreProfile = async (token, data) => {
  return axios.put(`${API}/store/profile`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const uploadFiles = async (token, form) => {
  return axios.post(
    `${API}/store/image`,
    { image: form },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const removeFiles = async (token, public_id) => {
  return axios.delete(`${API}/store/removeImage`, {
    data: { public_id },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const uploadFilesBanner = async (token, form) => {
  return axios.post(
    `${API}/store/banner`,
    { image: form },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const removeFilesBanner = async (token, public_id) => {
  return axios.delete(`${API}/store/removeImage`, {
    data: { public_id },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const uploadFilesQR = async (token, form) => {
  return axios.post(
    `${API}/store/storesQR`,
    { image: form },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const removeFilesQR = async (token, public_id) => {
  return axios.delete(`${API}/store/removeQR`, {
    data: { public_id },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const uploadFilesVerify = async (token, data) => {
  return axios.post(
    `${API}/store/storesVerify`,
    { image: data },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const removeFilesVerify = async (token, public_id) => {
  return axios.delete(`${API}/store/removeVerify`, {
    data: { public_id },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getCategoryStore = async () => {
  return axios.get(`${API}/store/categories`);
};

export const changeOrderMode = async (token, value) => {
  return axios.patch(`${API}/store/storeOrderMode`, value, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const toggleStoreStatus = (token, status) => {
  return axios.patch(
    `${API}/store/storeStatus`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getAllStore = async () => {
  return axios.get(`${API}/store`);
};

export const getStoreStaff = async (token) => {
  return axios.get(`${API}/store/staff`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const createStoreStaff = async (token, data) => {
  return axios.post(`${API}/store/staff`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateStoreStaff = async (token, id, data) => {
  return axios.patch(`${API}/store/staff/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteStoreStaff = (token, id) => {
  return axios.delete(`${API}/store/staff/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const changeStoreStaffStatus = async (token, id) => {
  return axios.patch(
    `${API}/store/staff/${id}/status`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getDeliveryJobs = async (token) => {
  return axios.get(`${API}/store/deliveryStaff-list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const assignDeliveryStaff = async (token, deliveryId, staffId) => {
  return axios.patch(
    `${API}/store/delivery/${deliveryId}/assign`,
    {
      staffId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const assignDeliveryStaffBulk = async (token, deliveryIds, staffId) => {
  return axios.patch(
    `${API}/store/delivery/assign-bulk`,
    {
      deliveryIds,
      staffId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const startDelivery = async (token, deliveryId) => {
  return axios.patch(
    `${API}/store/deliveryStaff/start`,
    { deliveryId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const markDelivered = async (token, deliveryId) => {
  return axios.patch(
    `${API}/store/deliveryStaff/delivered`,
    { deliveryId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getDeliveryDetailStaff = (token, id) => {
  return axios.get(`${API}/staff/delivery/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const updateStorePassword = (token, data) => {
  return axios.patch(
    `${API}/store/profile/change-password`,
    {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};
