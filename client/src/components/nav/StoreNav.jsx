import { useEffect, useState } from "react";
import {
  Bell,
  User,
  ChevronDown,
  LogOut,
  CheckCheck,
  ShoppingBag,
  CreditCard,
  ChefHat,
  PackageCheck,
  Clock,
  CircleCheck,
  XCircle,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { getStoreProfile } from "../../api/createStore";

const API = "https://robmorfood-backend-new.onrender.com/api";

const StoreNav = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);
  const logout = usefoodDelivery((state) => state.logout);

  const [store, setStore] = useState(null);
  const [open, setOpen] = useState(false);

  // =========================
  // Notification
  // =========================
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // =========================
  // ดึง Notification
  // =========================
  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let mounted = true;
    let loading = false;

    const loadNotifications = async () => {
      if (loading) return;

      loading = true;

      try {
        const res = await axios.get(`${API}/store/notification`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!mounted) return;

        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch (error) {
        console.log(
          "โหลดการแจ้งเตือนไม่สำเร็จ =",
          error?.response?.data || error,
        );
      } finally {
        loading = false;
      }
    };

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token]);

  // =========================
  // ดึงข้อมูลร้าน
  // =========================
  useEffect(() => {
    if (!token) {
      setStore(null);
      return;
    }

    const loadStoreProfile = async () => {
      try {
        const res = await getStoreProfile(token);

        setStore(res.data?.store || res.data);
      } catch (error) {
        console.error(
          "โหลดข้อมูลร้านไม่สำเร็จ =",
          error?.response?.data || error,
        );
      }
    };

    loadStoreProfile();
  }, [token]);

  // =========================
  // อ่านแจ้งเตือน 1 รายการ
  // =========================
  const handleReadNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await axios.patch(
          `${API}/store/notification/${notification.id}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );

      if (!notification.isRead) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      setNotificationOpen(false);

      // =========================
      // แจ้งเตือนเรื่องปัญหาออเดอร์
      // =========================
      if (notification.type === "ORDER_REPORT") {
        navigate("/store/StoreOrderReports");
        return;
      }

      // =========================
      // แจ้งเตือนแชท
      // =========================
      if (notification.type === "CHAT_MESSAGE") {
        if (notification.deliveryId) {
          navigate(`/store/DeliveryChat/${notification.deliveryId}`);
          return;
        }

        navigate("/store/chat");
        return;
      }

      // =========================
      // แจ้งเตือน Order
      // =========================
      if (notification.orderId) {
        const targetPath =
          notification.type === "ORDER_RECEIVED"
            ? `/store/delivery-detail/${notification.orderId}`
            : `/store/order-detail/${notification.orderId}`;

        const currentPath = window.location.pathname;

        if (currentPath === targetPath) {
          window.location.reload();
          return;
        }

        navigate(targetPath);
      }
    } catch (error) {
      console.error(
        "Read notification error =",
        error?.response?.data || error,
      );
    }
  };

  // =========================
  // อ่านทั้งหมด
  // =========================
  const handleReadAll = async () => {
    if (!unreadCount) return;

    try {
      await axios.patch(
        `${API}/store/notification/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.log(
        "อ่านแจ้งเตือนทั้งหมดไม่สำเร็จ =",
        error?.response?.data || error,
      );
    }
  };

  // =========================
  // Icon ของ Notification
  // =========================
  const getNotificationIcon = (type) => {
    switch (type) {
      case "NEW_ORDER":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
            <ShoppingBag className="h-5 w-5 text-orange-500" />
          </div>
        );

      case "PAYMENT_SLIP_UPLOADED":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <CreditCard className="h-5 w-5 text-blue-500" />
          </div>
        );

      case "ORDER_PREPARING":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100">
            <ChefHat className="h-5 w-5 text-yellow-600" />
          </div>
        );

      case "ORDER_READY":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
            <PackageCheck className="h-5 w-5 text-green-600" />
          </div>
        );

      case "ORDER_RECEIVED":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
            <CircleCheck className="h-5 w-5 text-green-600" />
          </div>
        );

      case "ORDER_CANCELLED":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
        );

      case "CHAT_MESSAGE":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
            <MessageCircle className="h-5 w-5 text-purple-500" />
          </div>
        );

      default:
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <Clock className="h-5 w-5 text-gray-500" />
          </div>
        );
    }
  };

  // =========================
  // เวลา Notification
  // =========================
  const formatNotificationTime = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);
    const now = new Date();

    const diff = Math.floor(
      (now.getTime() - notificationDate.getTime()) / 1000,
    );

    if (diff < 60) {
      return "เมื่อสักครู่";
    }

    if (diff < 3600) {
      return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    }

    if (diff < 86400) {
      return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    }

    return notificationDate.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================
  // ชื่อร้าน
  // =========================
  const storeName = store?.storeName || "ร้านของฉัน";

  const storeImage =
    store?.images?.find((image) =>
      image?.public_id?.startsWith("StoreProfile2026"),
    )?.url || null;

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
    logout();
    setOpen(false);
    setNotificationOpen(false);

    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-orange-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* =========================
              LEFT : LOGO
          ========================= */}
          <div
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-200">
              <span className="font-['Kanit'] font-extrabold text-white">
                RF
              </span>
            </div>

            <div>
              <p className="font-['Kanit'] text-lg font-bold leading-none text-[#2A1B12]">
                RobMor<span className="text-orange-500">Food</span>
              </p>

              <p className="mt-1 font-['Noto_Sans_Thai'] text-xs text-[#8A6A54]">
                ระบบจัดการร้านอาหาร
              </p>
            </div>
          </div>

          {/* =========================
              RIGHT
          ========================= */}
          <div className="flex items-center gap-3">
            {/* =========================
                NOTIFICATION
            ========================= */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationOpen((prev) => !prev);
                  setOpen(false);
                }}
                className="relative rounded-full p-2.5 transition hover:bg-orange-50"
              >
                <Bell className="h-5 w-5 text-gray-700" />

                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* =========================
                  NOTIFICATION DROPDOWN
              ========================= */}
              {notificationOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationOpen(false)}
                  />

                  <div
                   className="
  fixed
  top-[72px]
  right-3
  z-[60]
  w-[calc(100vw-24px)]
  max-w-[360px]
  overflow-hidden
  rounded-2xl
  border
  border-orange-100
  bg-white
  shadow-xl
  shadow-gray-200/60
  sm:right-6
  sm:w-[360px]
  lg:right-[max(24px,calc((100vw-1280px)/2+24px))]
"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <div>
                        <h3 className="font-['Kanit'] text-base font-bold text-[#2A1B12]">
                          การแจ้งเตือน
                        </h3>

                        {unreadCount > 0 && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            มี {unreadCount} รายการที่ยังไม่ได้อ่าน
                          </p>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleReadAll}
                          className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 transition hover:text-orange-600"
                        >
                          <CheckCheck className="h-4 w-4" />
                          อ่านทั้งหมด
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[430px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
                            <Bell className="h-6 w-6 text-orange-300" />
                          </div>

                          <p className="mt-4 font-['Kanit'] text-sm font-semibold text-gray-600">
                            ยังไม่มีการแจ้งเตือน
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            เมื่อมีออเดอร์หรือการชำระเงิน จะแสดงที่นี่
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => handleReadNotification(notification)}
                            className={`
                              flex
                              w-full
                              gap-3
                              border-b
                              border-gray-100
                              px-4
                              py-3
                              text-left
                              transition
                              hover:bg-orange-50
                              ${
                                !notification.isRead
                                  ? "bg-orange-50/60"
                                  : "bg-white"
                              }
                            `}
                          >
                            {getNotificationIcon(notification.type)}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={`
                                    font-['Kanit']
                                    text-sm
                                    ${
                                      !notification.isRead
                                        ? "font-bold text-[#2A1B12]"
                                        : "font-semibold text-gray-700"
                                    }
                                  `}
                                >
                                  {notification.title}
                                </p>

                                {!notification.isRead && (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                                )}
                              </div>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                                {notification.message}
                              </p>

                              <p className="mt-1.5 text-[10px] text-gray-400">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* =========================
                PROFILE
            ========================= */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpen((prev) => !prev);
                  setNotificationOpen(false);
                }}
                className="
                  flex
                  items-center
                  gap-2.5
                  rounded-full
                  border
                  border-orange-100
                  bg-white
                  px-0
                  py-1.5
                  shadow-sm
                  transition
                  hover:border-orange-300
                  hover:bg-orange-50
                "
              >
                {/* รูป Profile */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
                  {storeImage ? (
                    <img
                      src={storeImage}
                      alt={storeName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-white" />
                  )}
                </div>

                {/* ชื่อร้าน */}
                <div className="hidden max-w-[150px] text-left sm:block">
                  <p className="text-[10px] leading-none text-gray-400">
                    ร้านอาหาร
                  </p>

                  <p className="mt-1 truncate font-['Kanit'] text-sm font-bold text-[#2A1B12]">
                    {storeName}
                  </p>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* =========================
                  PROFILE DROPDOWN
              ========================= */}
              {open && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                  />
                  <div className=" absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-xl shadow-gray-200/60 ">
                    {/* ข้อมูลร้าน */}
                    <div
                      className="
                        bg-gradient-to-br
                        from-orange-50
                        to-white
                        px-4
                        py-4
                      "
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
                          {storeImage ? (
                            <img
                              src={storeImage}
                              alt={storeName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-white" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">ร้านอาหาร</p>

                          <p className="truncate font-['Kanit'] font-bold text-[#2A1B12]">
                            {storeName}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* จัดการโปรไฟล์ */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate("/store/profile");
                      }}
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        border-t
                        border-gray-100
                        px-4
                        py-3
                        text-left
                        transition
                        hover:bg-orange-50
                      "
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                        <User className="h-4 w-4 text-orange-500" />
                      </div>

                      <span className="font-['Noto_Sans_Thai'] text-sm font-semibold text-[#2A1B12]">
                        โปรไฟล์ร้าน
                      </span>
                    </button>
                    {/* Logout */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="
                        group
                        flex
                        w-full
                        items-center
                        gap-3
                        border-t
                        border-gray-100
                        px-4
                        py-3
                        text-left
                        transition
                        hover:bg-red-50
                      "
                    >
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-xl
                          bg-red-50
                          transition
                          group-hover:bg-red-100
                        "
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                      </div>

                      <span className="font-['Noto_Sans_Thai'] text-sm font-semibold text-red-500">
                        ออกจากระบบ
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default StoreNav;
