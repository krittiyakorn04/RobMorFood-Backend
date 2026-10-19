import axios from "axios";

const API = "https://robmorfood-backend-new.onrender.com/api";

export const getUserMenu = async (token, menuId) => {
  const response = await axios.get(`${API}/user/Menu/${menuId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
