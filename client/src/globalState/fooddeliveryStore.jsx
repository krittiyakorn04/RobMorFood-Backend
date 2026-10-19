import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { listCatagory } from "../api/StoreMenuCategory";
import { listMenu } from "../api/StoreMenu";
import {
  getAllStore,
  getCategoryStore,
  getStoreProfile,
} from "../api/createStore";
import { getOrderRound } from "../api/OrderRound";
import { getUserProfile } from "../api/UserProfile";

const API = "https://robmorfood-backend-new.onrender.com/api";

const foodDelivery = (set) => ({
  user: null,
  token: null,
  catagories: [],
  menus: [],
  stores: null,
  storeCategory: [],
  orderRound: [],
  stores: [],
  users: [],
  staff: null,

  actionRegisterStore: async (form) => {
    const res = await axios.post(`${API}/store/register`, form);


    set({
      user: res.data.payload,
      token: res.data.token,
    });

    return res;
  },

  actionLoginStore: async (form) => {
    const res = await axios.post(`${API}/store/login`, form);


    set({
      user: res.data.payload,
      token: res.data.token,
    });

    return res;
  },

  actionRegisterUser: async (form) => {
    const res = await axios.post(`${API}/user/register`, form);


    set({
      user: res.data.payload,
      token: res.data.token,
    });

    return res;
  },

  actionLoginUser: async (form) => {
    const res = await axios.post(`${API}/user/login`, form);


    set({
      user: res.data.payload,
      token: res.data.token,
    });

    return res;
  },

  getCategory: async (token) => {
    try {
      const res = await listCatagory(token);

      set({
        catagories: res.data,
      });
    } catch (error) {
      console.log(error);
    }
  },

  getMenus: async (token) => {
    try {
      const res = await listMenu(token);

      set({
        menus: res.data,
      });
    } catch (error) {
      console.log(error);
    }
  },

  getStore: async (token) => {
    try {
      const res = await getStoreProfile(token);

      set({
        stores: res.data,
      });
    } catch (error) {
      console.log(error);
    }
  },

  getStoreCategory: async (token) => {
    try {
      const res = await getCategoryStore();

      set({
        storeCategory: res.data,
      });
    } catch (error) {
      console.log(error);
    }
  },

  getOrderRound: async (token) => {
    try {
      const res = await getOrderRound(token);

      set({
        orderRound: res.data,
      });
    } catch (error) {
      console.log(error);
    }
  },

  getAllStore: async (token) => {
    try {
      const res = await getAllStore(token);

      set({
        stores: res.data,
      });
    } catch (error) {
      console.log(error);
    }
  },

  getUser: async (token) => {
    try {
      const res = await getUserProfile(token);

      set({
        users: res.data,
      });
    } catch (error) {
      console.log(error);
    }
  },

  logout: () => {
    localStorage.removeItem("foodDelivery");

    set({
      token: null,
      user: null,
      staff: null,
    });
  },

  setStaff: (staff) =>
    set({
      staff,
    }),

  clearStaff: () =>
    set({
      staff: null,
    }),
});

const usePersist = {
  name: "foodDelivery",
  storage: createJSONStorage(() => localStorage),
};

const usefoodDelivery = create(persist(foodDelivery, usePersist));

export default usefoodDelivery;