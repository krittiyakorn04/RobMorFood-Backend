import axios from "axios";

const API_URL = "https://robmorfood-backend-new.onrender.com/api";

export const currentUser = async (token) =>
  await axios.post(
    `${API_URL}/user/current-user`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

export const currentRestau = async (token) =>
  await axios.post(
    `${API_URL}/store/current-restau`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );