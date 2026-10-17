import { useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import {
  MapPin,
  Navigation,
  Loader2,
  Clock3,
  Phone,
  Store,
  Truck,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Minus,
  Plus,
  X,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";

import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";

import { getCart, updateCart, createOrder } from "../../api/UserOrder";

import { getAddress, getStoreClient } from "../../api/UserProfile";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const token = usefoodDelivery((state) => state.token);

  // =========================
  // DATA
  // =========================

  const cartId = location.state?.cartId;
  const storeId = location.state?.storeId;

  // =========================
  // STATE
  // =========================

  const [cart, setCart] = useState(null);
  const [storeData, setStoreData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [creatingOrder, setCreatingOrder] = useState(false);

  const [updatingItem, setUpdatingItem] = useState(false);

  const [addressId, setAddressId] = useState("");

  const [addresses, setAddresses] = useState([]);

  const [loadingAddress, setLoadingAddress] = useState(true);

  const [note, setNote] = useState("");

  // =========================
  // EDIT ITEM MODAL
  // =========================

  const [editingItem, setEditingItem] = useState(null);

  const [editCount, setEditCount] = useState(1);

  const [editOptions, setEditOptions] = useState({});

  // =========================
  // LOAD CART
  // =========================

  useEffect(() => {
    const loadCheckoutData = async () => {
      if (!token || !storeId) {
        setLoading(false);
        setCart(null);
        setStoreData(null);
        return;
      }

      setLoading(true);

      try {
        const cartPromise = getCart(token, storeId);
        const storePromise = getStoreClient(token, storeId);

        const [cartResult, storeResult] = await Promise.allSettled([
          cartPromise,
          storePromise,
        ]);

        if (cartResult.status === "fulfilled") {
          setCart(cartResult.value.data);
        } else {
          console.error("โหลด Cart Checkout ไม่สำเร็จ", cartResult.reason);
          setCart(null);
        }

        if (storeResult.status === "fulfilled") {
          setStoreData(storeResult.value.data);
        } else {
          console.error("โหลดข้อมูลรอบจากร้านไม่สำเร็จ", storeResult.reason);
          setStoreData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [token, storeId]);

  // =========================
  // PARSE OPTIONS
  // =========================

  const parseOptions = (options) => {
    if (!options) {
      return [];
    }

    try {
      const parsed =
        typeof options === "string" ? JSON.parse(options) : options;

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.log("parse options error =", error);

      return [];
    }
  };

  // =========================
  // LOAD ADDRESS
  // =========================

  useEffect(() => {
    const loadAddresses = async () => {
      if (!token) {
        setLoadingAddress(false);
        return;
      }

      try {
        setLoadingAddress(true);

        const res = await getAddress(token);

        console.log("Address Checkout =", res.data);

        const addressList = Array.isArray(res.data) ? res.data : [];

        setAddresses(addressList);

        const defaultAddress = addressList.find(
          (item) => item.isDefault === true,
        );

        if (defaultAddress) {
          setAddressId(String(defaultAddress.id));
        }
      } catch (error) {
        console.log("โหลดที่อยู่ไม่สำเร็จ =", error);
      } finally {
        setLoadingAddress(false);
      }
    };

    loadAddresses();
  }, [token]);

  // =========================
  // DEFAULT ADDRESS
  // =========================

  const defaultAddress =
    addresses.find((item) => item.isDefault === true) || null;

  // =========================
  // CART ITEMS
  // =========================

  const cartItems = cart?.menus || [];

  const isStoreClosed =
    cart?.store?.status === "CLOSED" || cart?.store?.accountStatus !== "ACTIVE";

  // =========================
  // ORDER ROUND
  // =========================

  // =========================
  // ORDER ROUND
  // ใช้หลักการเดียวกับ StoreClient
  // =========================

  const timeToMinutes = (time) => {
    if (!time) return null;

    const [hour, minute] = String(time).slice(0, 5).split(":").map(Number);

    if (
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    return hour * 60 + minute;
  };

  const getCurrentOrderRound = (rounds = []) => {
    const now = new Date();

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const round of rounds) {
      const start = timeToMinutes(round.startTime);
      const end = timeToMinutes(round.endTime);

      if (start === null || end === null) continue;

      // อยู่ในช่วงเวลารับออเดอร์
      if (currentMinutes >= start && currentMinutes < end) {
        return {
          ...round,
          roundStatus: "OPEN",
        };
      }

      // หมดเวลารับออเดอร์แล้ว แต่ยังอยู่ในช่วงเตรียมอาหาร 20 นาที
      if (currentMinutes >= end && currentMinutes < end + 20) {
        return {
          ...round,
          roundStatus: "PREPARING",
        };
      }
    }

    return null;
  };

  const orderRound =
    cart?.store?.orderMode === "ROUND"
      ? getCurrentOrderRound(storeData?.orderRound || [])
      : null;

  const isRoundFull =
    orderRound?.hasOrderLimit === true &&
    Number(orderRound?.currentOrders || 0) >=
      Number(orderRound?.maxOrders || 0);

  const roundStatus = orderRound?.roundStatus || orderRound?.status || null;

  const isRoundOpen = roundStatus === "OPEN";
  // =========================
  // FOOD TOTAL
  // =========================

  const foodTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.price || 0);

      const count = Number(item.count || 1);

      return total + price * count;
    }, 0);
  }, [cartItems]);

  // =========================
  // DELIVERY
  // =========================

  const delivery = Number(cart?.store?.deliveryFee ?? 0);
  // =========================
  // TOTAL
  // =========================

  const total = foodTotal + delivery;

  // =========================
  // OPEN EDIT MODAL
  // =========================

  const handleEditItem = async (item) => {
    try {
      setLoading(true);

      console.log("EDIT ITEM =", item);
      console.log("MENU ID =", item.menuId);

      // ==========================================
      // โหลดข้อมูลร้านใหม่
      // ==========================================

      const res = await getStoreClient(token, storeId);

      console.log("STORE CLIENT RESPONSE =", res.data);

      const storeData = res.data;

      // ==========================================
      // menu อยู่ข้างใน menuCategories
      // ==========================================

      const categories = storeData?.menuCategories || [];

      const storeMenus = categories.flatMap((category) => category.menus || []);

      console.log("STORE MENUS =", storeMenus);

      // ==========================================
      // หาเมนูที่ตรงกับ cart item
      // ==========================================

      const selectedMenu = storeMenus.find(
        (menu) => Number(menu.id) === Number(item.menuId),
      );

      console.log("SELECTED MENU =", selectedMenu);
      console.log("SELECTED MENU OPTIONS =", selectedMenu?.options);

      if (!selectedMenu) {
        Swal.fire({
          icon: "error",
          title: "ไม่พบเมนู",
          text: "ไม่สามารถโหลดข้อมูลเมนูได้",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#f97316",
        });

        return;
      }

      // ==========================================
      // ตัวเลือกเดิมจาก Cart
      // ==========================================

      const currentOptions = parseOptions(item.options);

      console.log("CURRENT CART OPTIONS =", currentOptions);

      // ==========================================
      // แปลงเป็น
      // {
      //   optionId: [choiceId, choiceId]
      // }
      // ==========================================

      const selected = {};

      currentOptions.forEach((option) => {
        if (option?.optionId !== undefined && option?.choiceId !== undefined) {
          const optionId = String(option.optionId);

          if (!selected[optionId]) {
            selected[optionId] = [];
          }

          selected[optionId].push(String(option.choiceId));
        }
      });

      // ==========================================
      // เอาข้อมูล menu ใหม่จาก StoreClient
      // + ข้อมูลจำนวน/ตัวเลือกเดิมจาก Cart
      // ==========================================

      const editItem = {
        ...item,
        menu: selectedMenu,
      };

      console.log("FINAL EDIT ITEM =", editItem);
      console.log("FINAL MENU OPTIONS =", editItem.menu?.options);
      console.log("OLD SELECTED OPTIONS =", selected);

      setEditingItem(editItem);
      setEditCount(Number(item.count || 1));
      setEditOptions(selected);
    } catch (error) {
      console.error("LOAD EDIT MENU ERROR =", error);

      Swal.fire({
        icon: "error",
        title: "โหลดข้อมูลไม่สำเร็จ",
        text:
          error.response?.data?.message || "ไม่สามารถโหลดตัวเลือกของเมนูได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setLoading(false);
    }
  };
  // =========================
  // CLOSE EDIT MODAL
  // =========================

  const closeEditModal = () => {
    if (updatingItem) {
      return;
    }

    setEditingItem(null);
    setEditCount(1);
    setEditOptions({});
  };

  // =========================
  // SELECT OPTION
  // =========================

  const handleSelectOption = (option, choiceId) => {
    setEditOptions((prev) => {
      const optionId = String(option.id);

      const current = Array.isArray(prev[optionId])
        ? prev[optionId]
        : prev[optionId]
          ? [String(prev[optionId])]
          : [];

      const choiceIdString = String(choiceId);

      // ==========================================
      // เลือกได้แค่ 1
      // ==========================================

      if (Number(option.maxRequire || 1) === 1) {
        return {
          ...prev,
          [optionId]: [choiceIdString],
        };
      }

      // ==========================================
      // เลือกหลายตัว
      // ==========================================

      const exists = current.includes(choiceIdString);

      if (exists) {
        return {
          ...prev,
          [optionId]: current.filter((id) => id !== choiceIdString),
        };
      }

      // ถึงจำนวนสูงสุดแล้ว
      if (
        Number(option.maxRequire) > 0 &&
        current.length >= Number(option.maxRequire)
      ) {
        return prev;
      }

      return {
        ...prev,
        [optionId]: [...current, choiceIdString],
      };
    });
  };

  // =========================
  // EDIT PRICE
  // =========================

  const editTotalPrice = useMemo(() => {
    if (!editingItem) {
      return 0;
    }

    const basePrice = Number(
      editingItem.menu?.price ?? editingItem.basePrice ?? 0,
    );

    let optionPrice = 0;

    const menuOptions = editingItem.menu?.options || [];

    menuOptions.forEach((option) => {
      const selectedChoiceIds = Array.isArray(editOptions[String(option.id)])
        ? editOptions[String(option.id)]
        : editOptions[String(option.id)]
          ? [editOptions[String(option.id)]]
          : [];

      selectedChoiceIds.forEach((choiceId) => {
        const choice = (option.choices || []).find(
          (item) => String(item.id) === String(choiceId),
        );

        if (choice) {
          optionPrice += Number(choice.extraPrice || 0);
        }
      });
    });

    const pricePerItem = basePrice + optionPrice;

    return pricePerItem * Number(editCount || 0);
  }, [editingItem, editOptions, editCount]);

  // =========================
  // UPDATE CART ITEM
  // =========================

  const isOptionsChanged = () => {
    if (!editingItem) {
      return false;
    }

    const oldOptions = parseOptions(editingItem.options);

    const oldSelected = {};

    oldOptions.forEach((option) => {
      if (option.optionId !== undefined && option.choiceId !== undefined) {
        const optionId = String(option.optionId);

        if (!oldSelected[optionId]) {
          oldSelected[optionId] = [];
        }

        oldSelected[optionId].push(String(option.choiceId));
      }
    });

    const normalize = (data) => {
      const result = {};

      Object.keys(data || {}).forEach((optionId) => {
        const values = Array.isArray(data[optionId])
          ? data[optionId]
          : [data[optionId]];

        result[String(optionId)] = values.map(String).sort();
      });

      return result;
    };

    const oldNormalized = normalize(oldSelected);
    const newNormalized = normalize(editOptions);

    const oldKeys = Object.keys(oldNormalized).sort();
    const newKeys = Object.keys(newNormalized).sort();

    if (oldKeys.length !== newKeys.length) {
      return true;
    }

    for (const key of oldKeys) {
      if (!newNormalized[key]) {
        return true;
      }

      if (
        JSON.stringify(oldNormalized[key]) !==
        JSON.stringify(newNormalized[key])
      ) {
        return true;
      }
    }

    return false;
  };

  const handleSaveEdit = async () => {
    if (!editingItem) {
      return;
    }

    // ==========================================
    // ลบรายการ
    // ==========================================

    if (Number(editCount) <= 0) {
      const result = await Swal.fire({
        icon: "warning",
        title: "ลบรายการนี้หรือไม่?",
        text: "รายการนี้จะถูกลบออกจากตะกร้า",
        showCancelButton: true,
        confirmButtonText: "ลบรายการ",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#9ca3af",
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    try {
      setUpdatingItem(true);

      // ==========================================
      // DELETE
      // ==========================================

      if (Number(editCount) <= 0) {
        await updateCart(token, editingItem.id, {
          count: 0,
        });

        const res = await getCart(token, storeId);

        setCart(res.data);

        setEditingItem(null);
        setEditCount(1);
        setEditOptions({});

        await Swal.fire({
          icon: "success",
          title: "ลบรายการเรียบร้อย",
          timer: 1200,
          showConfirmButton: false,
        });

        return;
      }

      // ==========================================
      // ตรวจว่าแก้ OPTIONS หรือไม่
      // ==========================================

      const optionsChanged = isOptionsChanged();

      console.log("Options เปลี่ยนหรือไม่ =", optionsChanged);

      // ==========================================
      // ข้อมูลที่จะส่ง
      // ==========================================

      const data = {
        // จำนวนใหม่
        count: Number(editCount),
      };

      // ==========================================
      // ถ้าแก้ OPTIONS จริง
      // ค่อยส่ง options ใหม่
      // ==========================================

      if (optionsChanged) {
        const menuOptions = editingItem.menu?.options || [];

        const newOptions = [];

        menuOptions.forEach((option) => {
          const selectedChoiceIds = Array.isArray(
            editOptions[String(option.id)],
          )
            ? editOptions[String(option.id)]
            : editOptions[String(option.id)]
              ? [editOptions[String(option.id)]]
              : [];

          selectedChoiceIds.forEach((selectedChoiceId) => {
            const choice = (option.choices || []).find(
              (item) => String(item.id) === String(selectedChoiceId),
            );

            if (!choice) {
              return;
            }

            newOptions.push({
              optionId: Number(option.id),
              optionLabel: option.label || "ตัวเลือก",
              choiceId: Number(choice.id),
              choiceName: choice.name || "",
              extraPrice: Number(choice.extraPrice || 0),
            });
          });
        });

        // ตรวจ required
        for (const option of menuOptions) {
          if (!option.required) {
            continue;
          }

          const selectedChoiceIds = Array.isArray(
            editOptions[String(option.id)],
          )
            ? editOptions[String(option.id)]
            : [];

          if (selectedChoiceIds.length === 0) {
            await Swal.fire({
              icon: "warning",
              title: "กรุณาเลือกตัวเลือก",
              text: `กรุณาเลือก ${option.label || "ตัวเลือก"}`,
              confirmButtonColor: "#f97316",
            });

            return;
          }
        }

        data.options = newOptions;
      }

      // ==========================================
      // LOG
      // ==========================================

      console.log("========== UPDATE CART ==========");

      console.log("แก้ Options =", optionsChanged);

      console.log("ข้อมูลที่ส่ง Backend =", data);

      // ==========================================
      // UPDATE BACKEND
      // ==========================================

      const updateRes = await updateCart(token, editingItem.id, data);

      console.log("Update Cart Response =", updateRes.data);

      // ==========================================
      // LOAD CART ใหม่
      // ==========================================

      const res = await getCart(token, storeId);

      console.log("Cart หลังแก้ไข =", res.data);

      // ==========================================
      // หาข้อมูล Option ที่ต้องแสดง
      // ==========================================

      const oldOptions = parseOptions(editingItem.options);

      const finalOptions = optionsChanged ? data.options : oldOptions;

      // ==========================================
      // คำนวณราคา
      // ==========================================

      let finalPrice;

      if (optionsChanged) {
        const basePrice = Number(
          editingItem.menu?.price ?? editingItem.basePrice ?? 0,
        );

        const optionPrice = finalOptions.reduce(
          (total, option) => total + Number(option.extraPrice || 0),
          0,
        );

        finalPrice = basePrice + optionPrice;
      } else {
        // ไม่ได้แก้ Option
        // ใช้ราคาเดิม
        finalPrice = Number(editingItem.price || 0);
      }

      // ==========================================
      // UPDATE LOCAL CART
      // ==========================================

      const updatedCart = {
        ...res.data,

        menus: (res.data?.menus || []).map((item) => {
          if (String(item.id) !== String(editingItem.id)) {
            return item;
          }

          return {
            ...item,

            // จำนวนใหม่
            count: Number(editCount),

            // ราคาใหม่/ราคาเดิม
            price: finalPrice,

            // Options
            options: finalOptions,

            // เก็บ menu เดิมไว้
            // เพื่อให้ Modal ยังมี Options
            menu: {
              ...editingItem.menu,

              options: editingItem.menu?.options || [],
            },

            menuName:
              item.menuName ||
              editingItem.menuName ||
              editingItem.menu?.menuItem ||
              "สินค้า",

            image:
              item.image ||
              editingItem.image ||
              editingItem.menu?.images?.[0]?.url ||
              "",
          };
        }),
      };

      console.log("Cart ที่แสดงหลังแก้ไข =", updatedCart);

      setCart(updatedCart);

      // ==========================================
      // CLOSE MODAL
      // ==========================================

      setEditingItem(null);
      setEditCount(1);
      setEditOptions({});

      // ==========================================
      // SUCCESS
      // ==========================================

      await Swal.fire({
        icon: "success",
        title: "แก้ไขรายการเรียบร้อย",
        text: optionsChanged
          ? "เปลี่ยนตัวเลือกและจำนวนเรียบร้อยแล้ว"
          : "เปลี่ยนจำนวนเรียบร้อยแล้ว",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log("แก้ไขสินค้าไม่สำเร็จ =", error);

      Swal.fire({
        icon: "error",
        title: "แก้ไขรายการไม่สำเร็จ",
        text:
          error.response?.data?.message || error.message || "เกิดข้อผิดพลาด",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setUpdatingItem(false);
    }
  };
  // =========================
  // ADD MINUTES
  // =========================

  const addMinutesToTime = (time, minutes) => {
    if (!time) {
      return "";
    }

    const [hour, minute] = String(time).slice(0, 5).split(":").map(Number);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return "";
    }

    const totalMinutes = hour * 60 + minute + minutes;

    const finalHour = Math.floor(totalMinutes / 60) % 24;

    const finalMinute = totalMinutes % 60;

    return `${String(finalHour).padStart(2, "0")}:${String(
      finalMinute,
    ).padStart(2, "0")}`;
  };

  // =========================
  // CREATE ORDER
  // =========================

  const handleCreateOrder = async () => {
    if (!cart?.cartId) {
      Swal.fire({
        icon: "error",
        title: "ไม่พบ Cart ID",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (cartItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "ไม่มีรายการอาหาร",
        text: "กรุณาเพิ่มอาหารลงในตะกร้าก่อน",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    // =========================
    // ร้านปิด
    // =========================

    if (isStoreClosed) {
      Swal.fire({
        icon: "warning",
        title: "ร้านปิดอยู่",
        text: "ขณะนี้ร้านยังไม่เปิดให้สั่งซื้อ กรุณารอร้านเปิดให้บริการ",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (cart?.store?.orderMode === "ROUND" && !orderRound) {
      await Swal.fire({
        icon: "info",
        title: "ขณะนี้ไม่มีรอบรับออเดอร์",
        text: "กรุณารอรอบถัดไปของร้าน",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (isRoundFull) {
      Swal.fire({
        icon: "warning",
        title: "รอบนี้เต็มแล้ว",
        text: "กรุณารอรอบถัดไป",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (orderRound && !isRoundOpen) {
      Swal.fire({
        icon: "info",
        title: "รอบนี้ยังไม่เปิด",
        text: "กรุณารอรอบถัดไป",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (!addressId) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกที่อยู่",
        text: "กรุณาเลือกที่อยู่สำหรับจัดส่งก่อน",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    try {
      setCreatingOrder(true);

      const data = {
        cartId: cart.cartId,
        addressId: Number(addressId),
        note: note || "",
      };

      const res = await createOrder(token, data);

      const orderId = res.data?.order?.id || res.data?.id || res.data?.orderId;

      if (!orderId) {
        throw new Error("สร้างออเดอร์สำเร็จ แต่ไม่พบ Order ID");
      }

      await Swal.fire({
        icon: "success",
        title: "สั่งซื้อเรียบร้อยแล้ว",
        text: "รอร้านยืนยันออเดอร์",
        confirmButtonText: "ดูออเดอร์",
        confirmButtonColor: "#f97316",
      });

      navigate(`/user/orderDetail/${orderId}`);
    } catch (error) {
      console.log("สร้าง Order ไม่สำเร็จ =", error);

      Swal.fire({
        icon: "error",
        title: "สั่งซื้อไม่สำเร็จ",
        text:
          error.response?.data?.message || error.message || "เกิดข้อผิดพลาด",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  // =========================
  // LOADING CHECKOUT
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen mb-10 bg-[#FFF8F0] animate-pulse">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 pb-32">
          {/* Header */}
          <div className="mb-7 flex items-center gap-4">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-orange-100" />

            <div className="space-y-2">
              <div className="h-7 w-48 rounded-lg bg-orange-100" />
              <div className="h-4 w-56 max-w-full rounded bg-gray-200" />
            </div>
          </div>

          {/* Store + Order Round */}
          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Store Information */}
            <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 p-5">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-orange-100" />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-5 w-40 max-w-full rounded bg-gray-200" />
                </div>

                <div className="h-7 w-24 rounded-full bg-emerald-100" />
              </div>

              <div className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded bg-gray-200" />
                  <div className="h-4 w-40 max-w-full rounded bg-gray-100" />
                </div>

                <div className="h-12 w-28 rounded-2xl bg-orange-50" />
              </div>
            </div>

            {/* Order Round */}
            <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 p-5">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-orange-100" />

                <div className="space-y-2">
                  <div className="h-3 w-28 rounded bg-gray-200" />
                  <div className="h-5 w-24 rounded bg-gray-200" />
                </div>

                <div className="ml-auto h-7 w-24 rounded-full bg-emerald-100" />
              </div>

              <div className="space-y-3 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-36 rounded-2xl bg-orange-50" />
                  <div className="h-36 rounded-2xl bg-gray-100" />
                </div>

                <div className="h-16 rounded-2xl bg-emerald-50" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-5 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-28 rounded bg-gray-200" />
                <div className="h-4 w-48 max-w-full rounded bg-gray-100" />
              </div>

              <div className="h-4 w-20 rounded bg-orange-100" />
            </div>

            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-orange-200" />

                <div className="flex-1 space-y-3">
                  <div className="h-4 w-28 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-100" />
                  <div className="h-3 w-36 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          </div>

          {/* Food Items */}
          <div className="mb-5 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-5 w-28 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-100" />
            </div>

            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 border-b border-gray-100 py-4 last:border-0"
                >
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-gray-100" />

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="h-4 w-40 max-w-full rounded bg-gray-200" />
                    <div className="h-3 w-28 rounded bg-gray-100" />
                    <div className="h-3 w-16 rounded bg-orange-100" />
                  </div>

                  <div className="h-5 w-20 shrink-0 rounded bg-orange-100" />
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-5 space-y-4">
              <div className="flex justify-between">
                <div className="h-4 w-20 rounded bg-gray-100" />
                <div className="h-4 w-24 rounded bg-gray-100" />
              </div>

              <div className="flex justify-between">
                <div className="h-4 w-20 rounded bg-gray-100" />
                <div className="h-4 w-16 rounded bg-gray-100" />
              </div>

              <div className="flex justify-between border-t border-gray-100 pt-4">
                <div className="h-6 w-24 rounded bg-gray-200" />
                <div className="h-6 w-28 rounded bg-orange-100" />
              </div>
            </div>

            <div className="mt-5 h-12 rounded-2xl bg-orange-50" />
          </div>

          {/* Note */}
          <div className="mb-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-3 h-5 w-28 rounded bg-gray-200" />
            <div className="h-24 rounded-xl bg-gray-100" />
          </div>

          {/* Confirm Order */}
          <div className="h-14 w-full rounded-xl bg-green-100" />
        </div>
      </div>
    );
  }

  // =========================
  // NO CART
  // =========================

  if (!cart) {
    return (
      <div
        className="
        min-h-screen
        bg-[#FFF8F0]
        flex
        flex-col
        items-center
        justify-center
      "
      >
        <p className="text-gray-500 mb-4">ตะกร้าว่าง</p>

        <button
          type="button"
          onClick={() => navigate(`/user/storeRead/${storeId}`)}
          className="
          bg-orange-500
          hover:bg-orange-600
          text-white
          px-5
          py-2
          rounded-xl
          font-bold
        "
        >
          กลับไปหน้าร้าน
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen mb-6 pb-12 bg-[#FFF8F0]">
      {" "}
      <div
        className="
       max-w-6xl
       mx-auto
       p-4
       sm:p-6
       pb-4
     "
      >
        {/* =========================
HEADER
========================= */}

        <div className="flex items-center gap-4 mb-7">
          <button
            type="button"
            onClick={() => navigate(`/user/storeRead/${storeId}`)}
            className="group w-11 h-11 flex items-center justify-center rounded-2xl
               bg-white border border-orange-100 shadow-sm
               text-[#2A1B12] hover:bg-orange-50 hover:border-orange-200
               hover:-translate-x-0.5 transition-all duration-200 shrink-0"
            aria-label="กลับไปหน้าที่แล้ว"
          >
            <ArrowLeft
              size={20}
              strokeWidth={2}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2A1B12]">
              ยืนยันการสั่งซื้อ
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              ตรวจสอบรายการอาหารก่อนสั่งซื้อ
            </p>
          </div>
        </div>

        {/* =========================
        STORE
    ========================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* STORE INFORMATION */}
          <div className="bg-white rounded-3xl border border-orange-100/80 shadow-sm overflow-hidden">
            <div className="px-5 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                  <Store
                    size={21}
                    className="text-[#F07836]"
                    strokeWidth={1.8}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 mb-1">ข้อมูลร้านอาหาร</p>
                  <h2 className="text-lg font-semibold text-[#2A1B12] truncate">
                    {cart.store?.storeName || "ไม่พบชื่อร้าน"}
                  </h2>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${
                    isStoreClosed
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isStoreClosed ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />
                  {isStoreClosed ? "ปิดให้บริการ" : "เปิดให้บริการ"}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">
                    สถานะการให้บริการ
                  </p>
                  <p className="text-sm font-medium text-[#2A1B12]">
                    {isStoreClosed
                      ? "ขณะนี้ร้านยังไม่รับออเดอร์"
                      : "ขณะนี้ร้านพร้อมรับออเดอร์"}
                  </p>
                </div>

                {cart.store?.phone && (
                  <a
                    href={`tel:${cart.store.phone}`}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#FFF8F0] hover:bg-orange-50 transition-colors shrink-0"
                  >
                    <Phone
                      size={17}
                      className="text-[#F07836]"
                      strokeWidth={1.8}
                    />
                    <div>
                      <p className="text-[10px] text-gray-400">โทรหาร้าน</p>
                      <p className="text-sm font-semibold text-[#2A1B12]">
                        {cart.store.phone}
                      </p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ORDER ROUND */}

          {/* ORDER ROUND */}
          {orderRound ? (
            <div className="bg-white rounded-3xl border border-orange-100/80 shadow-sm overflow-hidden">
              <div className="px-5 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                      <Clock3
                        size={21}
                        className="text-[#F07836]"
                        strokeWidth={1.8}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        รอบการสั่งอาหาร
                      </p>
                      <h2 className="text-lg font-semibold text-[#2A1B12]">
                        รอบที่ {orderRound.roundNumber}
                      </h2>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 ${
                      isRoundFull
                        ? "bg-red-50 text-red-600"
                        : isRoundOpen
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {isRoundFull ? (
                      <AlertCircle size={13} />
                    ) : isRoundOpen ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <Clock3 size={13} />
                    )}

                    {isRoundFull
                      ? "เต็มแล้ว"
                      : isRoundOpen
                        ? "เปิดรับออเดอร์"
                        : "ยังไม่เปิด"}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#FFF9F4] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock3 size={15} className="text-[#F07836]" />
                      <p className="text-xs text-gray-500">เวลาของรอบ</p>
                    </div>
                    <p className="text-lg font-semibold text-[#2A1B12]">
                      {orderRound.startTime}
                    </p>
                    <p className="text-xs text-gray-400 my-1">ถึง</p>
                    <p className="text-lg font-semibold text-[#2A1B12]">
                      {orderRound.endTime}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50/80 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingBag size={15} className="text-gray-500" />
                      <p className="text-xs text-gray-500">จำนวนออเดอร์</p>
                    </div>
                    <p className="text-lg font-semibold text-[#2A1B12]">
                      {orderRound.currentOrders || 0}
                      <span className="text-sm font-normal text-gray-400">
                        {orderRound.hasOrderLimit
                          ? ` / ${orderRound.maxOrders}`
                          : " ออเดอร์"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {orderRound.hasOrderLimit
                        ? "จำนวนสูงสุดของรอบ"
                        : "ไม่จำกัดจำนวน"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                    <Truck
                      size={19}
                      className="text-emerald-600"
                      strokeWidth={1.8}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">เวลาส่งโดยประมาณ</p>
                    <p className="text-sm font-semibold text-[#2A1B12] mt-0.5">
                      ภายใน {addMinutesToTime(orderRound.endTime, 20)} น.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 shrink-0">
                    +20 นาที
                  </span>
                </div>

                {isRoundFull && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-red-50/80 px-4 py-3">
                    <AlertCircle size={19} className="text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-600">
                        รอบนี้เต็มแล้ว
                      </p>
                      <p className="text-xs text-red-500 mt-0.5">
                        กรุณารอรอบถัดไป
                      </p>
                    </div>
                  </div>
                )}

                {!isRoundFull && !isRoundOpen && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-amber-50/80 px-4 py-3">
                    <Clock3 size={19} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">
                        รอบนี้ยังไม่เปิด
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        กรุณารอจนถึงเวลาเปิดรับออเดอร์
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : cart?.store?.orderMode === "ROUND" ? (
            <div className="bg-white rounded-3xl border border-orange-100/80 shadow-sm p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock3
                  size={22}
                  className="text-amber-600"
                  strokeWidth={1.8}
                />
              </div>
              <div>
                <p className="font-semibold text-[#2A1B12]">
                  ขณะนี้ไม่อยู่ในช่วงรับออเดอร์
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  กรุณารอรอบถัดไปของร้าน
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-orange-100/80 shadow-sm p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <Store size={22} className="text-[#F07836]" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-semibold text-[#2A1B12]">
                  รับออเดอร์ตลอดเวลา
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  ร้านไม่มีการกำหนดรอบออเดอร์
                </p>
              </div>
            </div>
          )}
        </div>

        {/* =========================
        ADDRESS
    ========================= */}

        <div
          className="
        bg-white
        rounded-2xl
        shadow-sm
        border
        border-orange-100
        p-5
        mb-5
      "
        >
          <div
            className="
          flex
          items-center
          justify-between
          mb-4
        "
          >
            <div>
              <h2
                className="
              font-bold
              text-lg
              text-[#2A1B12]
            "
              >
                ที่อยู่จัดส่ง
              </h2>

              <p
                className="
              text-sm
              text-gray-400
              mt-1
            "
              >
                เลือกที่อยู่สำหรับจัดส่งอาหาร
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/user/AddressSetting")}
              className="
            text-sm
            text-orange-500
            font-semibold
          "
            >
              จัดการที่อยู่
            </button>
          </div>

          {loadingAddress ? (
            <p className="py-5 text-center text-gray-400">
              กำลังโหลดที่อยู่...
            </p>
          ) : !defaultAddress ? (
            <div
              className="
            border
            border-dashed
            border-gray-300
            rounded-xl
            p-5
            text-center
          "
            >
              <MapPin size={35} className="mx-auto text-gray-300 mb-3" />

              <p className="text-gray-500">ยังไม่มีที่อยู่เริ่มต้น</p>

              <button
                type="button"
                onClick={() => navigate("/user/AddressSetting")}
                className="
              mt-4
              px-4
              py-2
              rounded-xl
              bg-orange-500
              text-white
              text-sm
              font-semibold
              hover:bg-orange-600
              transition
            "
              >
                เพิ่มที่อยู่
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddressId(String(defaultAddress.id))}
              className={`
            w-full
            text-left
            p-4
            rounded-xl
            border
            transition
            ${
              String(defaultAddress.id) === String(addressId)
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 bg-gray-50"
            }
          `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                w-5
                h-5
                rounded-full
                border-2
                mt-0.5
                flex
                items-center
                justify-center
                shrink-0
                ${
                  String(defaultAddress.id) === String(addressId)
                    ? "border-orange-500"
                    : "border-gray-300"
                }
              `}
                >
                  {String(defaultAddress.id) === String(addressId) && (
                    <div
                      className="
                    w-2.5
                    h-2.5
                    rounded-full
                    bg-orange-500
                  "
                    />
                  )}
                </div>

                <div>
                  <p className="font-bold">
                    {defaultAddress.label || "ที่อยู่จัดส่ง"}
                  </p>

                  <p className="text-sm text-gray-600 mt-2">
                    {defaultAddress.address}
                  </p>

                  {defaultAddress.lat !== null &&
                    defaultAddress.lng !== null && (
                      <div
                        className="
                      flex
                      gap-1
                      text-xs
                      text-gray-400
                      mt-2
                    "
                      >
                        <Navigation size={13} />
                        {defaultAddress.lat}, {defaultAddress.lng}
                      </div>
                    )}
                </div>
              </div>
            </button>
          )}
        </div>

        {/* =========================
        ITEMS
    ========================= */}

        <div
          className="
        bg-white
        rounded-2xl
        shadow-sm
        border
        border-orange-100
        p-5
        mb-5
      "
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="
            font-bold
            text-lg
          "
            >
              รายการอาหาร
            </h2>

            <span className="text-sm text-gray-400">
              {cartItems.length} รายการ
            </span>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => {
              const price = Number(item.price || 0);

              const count = Number(item.count || 1);

              const itemTotal = price * count;

              const options = parseOptions(item.options);

              const menuOptions = item.menu?.options || [];

              const displayOptions = options.map((selectedOption) => {
                const option = menuOptions.find(
                  (item) => String(item.id) === String(selectedOption.optionId),
                );

                const choice = option?.choices?.find(
                  (item) => String(item.id) === String(selectedOption.choiceId),
                );

                return {
                  ...selectedOption,
                  optionLabel:
                    selectedOption.optionLabel || option?.label || "ตัวเลือก",
                  choiceName:
                    selectedOption.choiceName || choice?.name || "ไม่ได้ระบุ",
                  extraPrice:
                    selectedOption.extraPrice ?? choice?.extraPrice ?? 0,
                };
              });

              const menuImage =
                item.image ||
                item.menu?.image ||
                item.images?.[0]?.url ||
                item.menu?.images?.[0]?.url ||
                "";

              return (
                <div
                  key={item.id}
                  className="
                py-4
                border-b
                last:border-0
              "
                >
                  <div className="flex justify-between gap-4">
                    <div className="flex gap-3 min-w-0">
                      {menuImage ? (
                        <img
                          src={menuImage}
                          alt={item.menuName || item.menu?.menuItem || "Menu"}
                          className="
                        w-20
                        h-20
                        object-cover
                        rounded-xl
                        shrink-0
                      "
                        />
                      ) : (
                        <div
                          className="
                        w-20
                        h-20
                        bg-gray-100
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        text-xs
                        text-gray-400
                        shrink-0
                      "
                        >
                          ไม่มีรูป
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-semibold">
                          {item.menuName || item.menu?.menuItem || "สินค้า"}
                        </p>

                        {displayOptions.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {displayOptions.length > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {displayOptions.map((option, optionIndex) => {
                                  const optionName =
                                    option.choiceName ||
                                    option.name ||
                                    option.choice ||
                                    "ตัวเลือก";

                                  const extraPrice = Number(
                                    option.extraPrice ?? option.price ?? 0,
                                  );

                                  return (
                                    <div
                                      key={
                                        option.optionId
                                          ? `${option.optionId}-${option.choiceId}`
                                          : optionIndex
                                      }
                                      className="
            flex
            items-center
            justify-between
            gap-3
            text-xs
            text-gray-500
          "
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span>+</span>

                                        <span className="truncate">
                                          {option.optionLabel
                                            ? `${option.optionLabel}: `
                                            : ""}
                                          {optionName}
                                        </span>
                                      </div>

                                      {extraPrice > 0 && (
                                        <span className="text-orange-500 whitespace-nowrap">
                                          + ฿{extraPrice.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-sm text-gray-500 mt-2">
                          จำนวน {count}
                        </p>

                        <button
                          type="button"
                          onClick={() => handleEditItem(item)}
                          className="
                        mt-2
                        inline-flex
                        items-center
                        gap-1.5
                        text-sm
                        text-orange-500
                        font-semibold
                        hover:text-orange-600
                      "
                        >
                          <Pencil size={14} />
                          แก้ไขรายการ
                        </button>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className="
                      font-bold
                      text-orange-500
                      whitespace-nowrap
                    "
                      >
                        ฿{itemTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TOTAL */}

          <div className="mt-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">ค่าอาหาร</span>

              <span>฿{foodTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">ค่าจัดส่ง</span>

              <span>฿{delivery.toFixed(2)}</span>
            </div>

            <hr />

            <div
              className="
            flex
            justify-between
            text-xl
            font-bold
          "
            >
              <span>ยอดชำระ</span>

              <span className="text-orange-500">฿{total.toFixed(2)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/user/storeRead/${storeId}`)}
            className="mt-5 w-full flex items-center justify-center gap-2
             py-3.5 rounded-2xl border border-orange-200
             bg-[#FFF8F0] text-[#C65D24] font-semibold text-sm
             hover:bg-orange-50 hover:border-orange-300
             active:scale-[0.99] transition-all duration-200"
          >
            <Plus size={18} strokeWidth={2} />
            สั่งอาหารเพิ่ม
          </button>
        </div>

        {/* =========================
        NOTE
    ========================= */}

        <div
          className="
        bg-white
        rounded-2xl
        shadow-sm
        border
        border-orange-100
        p-5
        mb-6
      "
        >
          <h2
            className="
          font-bold
          text-lg
          mb-3
        "
          >
            หมายเหตุถึงร้าน
          </h2>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น ไม่ใส่ผัก, เผ็ดน้อย..."
            className="
          w-full
          border
          border-gray-200
          rounded-xl
          p-3
          min-h-[100px]
          resize-none
        "
          />
        </div>

        {/* =========================
        CONFIRM
    ========================= */}

        <button
          type="button"
          onClick={handleCreateOrder}
          disabled={creatingOrder || isStoreClosed}
          className={`
    w-full
    py-4
    rounded-xl
    text-lg
    font-bold
    transition
    flex
    items-center
    justify-center
    gap-2
    ${
      isStoreClosed
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-700 text-white"
    }
    ${creatingOrder ? "bg-gray-400 text-white cursor-not-allowed" : ""}
  `}
        >
          {creatingOrder ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              กำลังสร้างออเดอร์...
            </>
          ) : isStoreClosed ? (
            <>
              <AlertCircle size={20} />
              ร้านปิดอยู่ ไม่สามารถสั่งซื้อได้
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              ยืนยันการสั่งซื้อ
            </>
          )}
        </button>
      </div>
      {/* =====================================================
      EDIT ITEM MODAL
  ===================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-[9999] bg-black/50">
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-xl">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    แก้ไขรายการอาหาร
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {editingItem.menuName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 p-6">
                {/* =========================
            ตัวเลือกเมนู
        ========================== */}
                {editingItem.menu?.options?.length > 0 ? (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-gray-800">
                        ตัวเลือกเมนู
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        สามารถเปลี่ยนตัวเลือกที่เลือกไว้ได้
                      </p>
                    </div>

                    {editingItem.menu.options.map((option) => {
                      const selectedChoiceIds = Array.isArray(
                        editOptions[String(option.id)],
                      )
                        ? editOptions[String(option.id)]
                        : editOptions[String(option.id)]
                          ? [String(editOptions[String(option.id)])]
                          : [];

                      const maxRequire = Number(option.maxRequire || 1);

                      return (
                        <div
                          key={option.id}
                          className="rounded-2xl border border-gray-200 p-4"
                        >
                          <div className="mb-3">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-800">
                                {option.label || "ตัวเลือก"}
                              </p>

                              {option.required && (
                                <span className="text-xs font-medium text-red-500">
                                  จำเป็น
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                              {maxRequire > 1
                                ? `เลือกได้สูงสุด ${maxRequire} รายการ`
                                : "เลือก 1 รายการ"}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {(option.choices || []).map((choice) => {
                              const isSelected = selectedChoiceIds.some(
                                (id) => String(id) === String(choice.id),
                              );

                              const extraPrice = Number(choice.extraPrice || 0);

                              return (
                                <button
                                  key={choice.id}
                                  type="button"
                                  onClick={() =>
                                    handleSelectOption(option, choice.id)
                                  }
                                  className={`
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                border
                px-4
                py-3
                text-left
                transition
                ${
                  isSelected
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }
              `}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`
                    flex
                    h-5
                    w-5
                    items-center
                    justify-center
                    border
                    ${maxRequire === 1 ? "rounded-full" : "rounded-md"}
                    ${isSelected ? "border-orange-500" : "border-gray-300"}
                  `}
                                    >
                                      {isSelected && (
                                        <div
                                          className={`
                        ${
                          maxRequire === 1
                            ? "h-2.5 w-2.5 rounded-full"
                            : "h-3 w-3 rounded-sm"
                        }
                        bg-orange-500
                      `}
                                        />
                                      )}
                                    </div>

                                    <span
                                      className={
                                        isSelected
                                          ? "font-medium text-orange-600"
                                          : "text-gray-700"
                                      }
                                    >
                                      {choice.name}
                                    </span>
                                  </div>

                                  <span
                                    className={`text-sm ${
                                      extraPrice > 0
                                        ? "font-medium text-orange-600"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {extraPrice > 0
                                      ? `+฿${extraPrice.toFixed(2)}`
                                      : ""}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gray-50 p-4 text-center">
                    <p className="text-sm text-gray-500">
                      เมนูนี้ไม่มีตัวเลือกเพิ่มเติม
                    </p>
                  </div>
                )}
                {/* =========================
            จำนวน
        ========================== */}
                <div className="rounded-2xl border border-gray-200 p-4">
                  <div className="mb-3">
                    <p className="font-semibold text-gray-800">จำนวน</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      จำนวนที่ต้องการ
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setEditCount((prev) => Math.max(0, Number(prev) - 1))
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="w-8 text-center font-semibold">
                        {editCount}
                      </span>

                      <button
                        type="button"
                        onClick={() => setEditCount((prev) => Number(prev) + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-300 text-orange-500 hover:bg-orange-50"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                {/* =========================
            ราคา
        ========================== */}
                <div className="rounded-2xl bg-orange-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">ราคารวม</span>

                    <span className="text-xl font-bold text-orange-600">
                      ฿{editTotalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                {/* =========================
            ปุ่ม
        ========================== */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 rounded-xl border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={updatingItem}
                    className="flex-1 rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingItem ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
