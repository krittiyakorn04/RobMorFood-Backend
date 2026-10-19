import axios from "axios";

const API_URL = "https://robmorfood-backend-new.onrender.com/api";

// =====================================================
// บันทึก Push Subscription
// =====================================================

export const subscribePush = async (token, subscription) => {
  return axios.post(
    `${API_URL}/notification/push/subscribe`,
    {
      subscription,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};