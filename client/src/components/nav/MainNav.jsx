import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  User,
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown,
  Bell,
  CircleCheck,
  Clock,
  ChefHat,
  Utensils,
  Truck,
  PackageCheck,
  XCircle,
  MessageCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { getAddress } from "../../api/UserProfile";

const API = "https://robmorfood-backend-new.onrender.com/api";

const MainNav = () => {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState(null);

  // =========================
  // Notification
  // =========================
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const notificationRef = useRef(null);

  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);
  const user = usefoodDelivery((state) => state.user);
  const logout = usefoodDelivery((state) => state.logout);

  // =========================
  // ชื่อผู้ใช้
  // =========================

  const userName =
    user?.name ||
    user?.username ||
    user?.customerName ||
    user?.firstName ||
    "ผู้ใช้งาน";

  // =========================
  // ดึงที่อยู่จริง
  // =========================

  useEffect(() => {
    if (!token) {
      setAddress(null);
      return;
    }

    const loadAddress = async () => {
      try {
        const res = await getAddress(token);

        const addresses =
          res.data?.addresses || res.data?.address || res.data || [];

        const defaultAddress = Array.isArray(addresses)
          ? addresses.find((item) => item.isDefault) || addresses[0]
          : addresses;

        setAddress(defaultAddress || null);
      } catch (error) {
        console.error("โหลดที่อยู่ไม่สำเร็จ =", error?.response?.data || error);

        setAddress(null);
      }
    };

    loadAddress();
  }, [token]);

  // =========================
  // ดึง Notification
  // =========================

  const loadNotifications = async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await axios.get(`${API}/user/notification`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.log(
        "โหลด Notification ไม่สำเร็จ =",
        error?.response?.data || error,
      );
    }
  };

  // =========================
  // โหลด Notification
  // =========================

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, [token]);

  // =========================
  // ปิด Notification เมื่อคลิกข้างนอก
  // =========================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // =========================
  // Icon Notification
  // =========================

  const getNotificationIcon = (type) => {
    switch (type) {
      case "ORDER_WAITING_PAYMENT":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
        );

      case "PAYMENT_CONFIRMED":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
            <CircleCheck className="h-5 w-5 text-green-600" />
          </div>
        );

      case "ORDER_PREPARING":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <ChefHat className="h-5 w-5 text-blue-600" />
          </div>
        );

      case "ORDER_READY":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
            <Utensils className="h-5 w-5 text-green-600" />
          </div>
        );

      case "DELIVERY_STARTED":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <Truck className="h-5 w-5 text-blue-600" />
          </div>
        );

      case "DELIVERY_ARRIVED":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
            <PackageCheck className="h-5 w-5 text-green-600" />
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
            <Bell className="h-5 w-5 text-orange-600" />
          </div>
        );
    }
  };

  // =========================
  // เวลา Notification
  // =========================

  const formatNotificationTime = (date) => {
    if (!date) return "";

    const now = new Date();
    const created = new Date(date);

    const diff = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (diff < 60) {
      return "เมื่อสักครู่นี้";
    }

    if (diff < 3600) {
      return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    }

    if (diff < 86400) {
      return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
    }

    if (diff < 172800) {
      return "เมื่อวาน";
    }

    return created.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================
  // กด Notification
  // =========================

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await axios.patch(
          `${API}/user/notification/${notification.id}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );

        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      setNotificationOpen(false);

      if (notification.type === "CHAT_MESSAGE") {
        // แชทจัดส่ง: ใช้ deliveryId
        if (notification.deliveryId) {
          navigate(`/user/deliveryChat/${notification.deliveryId}`);
          return;
        }

        // แชทลูกค้า-ร้าน: ใช้ storeId
        // หน้าแชทต้องเรียก API getOrCreateStoreChat
        if (notification.storeId) {
          navigate(`/user/chat/store/${notification.storeId}`);
          return;
        }

        console.warn(
          "Notification แชทไม่มี deliveryId หรือ storeId",
          notification,
        );
        return;
      }

      if (notification.orderId) {
        navigate(`/user/orderDetail/${notification.orderId}`);
      }
    } catch (error) {
      console.error(
        "จัดการ Notification ไม่สำเร็จ =",
        error?.response?.data || error,
      );
    }
  };

  // =========================
  // อ่านทั้งหมด
  // =========================

  const handleReadAll = async () => {
    if (!token || unreadCount === 0) {
      return;
    }

    try {
      await axios.patch(
        `${API}/user/notification/read-all`,
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
        "อ่าน Notification ทั้งหมดไม่สำเร็จ =",
        error?.response?.data || error,
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    logout();
    setOpen(false);
    setNotificationOpen(false);
    setAddress(null);

    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-orange-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* =========================
              ที่อยู่จัดส่ง
          ========================== */}

          <button
            type="button"
            onClick={() => {
              if (token) {
                navigate("/user/AddressSetting");
              } else {
                navigate("/login");
              }
            }}
            className="
              flex
              max-w-[320px]
              items-center
              gap-2
              rounded-xl
              px-2
              py-1.5
              text-left
              transition
              hover:bg-orange-50
            "
          >
            <MapPin
              className="
                h-5
                w-5
                shrink-0
                text-red-500
              "
            />

            <div className="min-w-0">
              <p className="text-[11px] text-gray-400">จัดส่งไปยัง</p>

              <p
                className="
                  max-w-[250px]
                  truncate
                  text-sm
                  font-semibold
                  text-[#2A1B12]
                "
              >
                {address ? address.label : "เลือกที่อยู่"}
              </p>
            </div>
          </button>

          {/* =========================
              RIGHT
          ========================== */}

          <div className="flex items-center gap-2">
            {/* =========================
                NOTIFICATION
            ========================== */}

            {token && (
              <div ref={notificationRef} className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setNotificationOpen((prev) => !prev)}
                  className="
                    relative
                    rounded-xl
                    p-2.5
                    transition
                    hover:bg-orange-50
                  "
                >
                  <Bell className="h-5 w-5 text-gray-700" />

                  {unreadCount > 0 && (
                    <span
                      className="
                        absolute
                        right-0.5
                        top-0.5
                        flex
                        h-4
                        min-w-4
                        items-center
                        justify-center
                        rounded-full
                        bg-red-500
                        px-1
                        text-[10px]
                        font-bold
                        text-white
                      "
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* =========================
                    NOTIFICATION DROPDOWN
                ========================== */}

                {notificationOpen && (
                  <div
                    className="
    fixed
    right-3
    top-[68px]
    z-[60]
    w-[calc(100vw-24px)]
    max-w-[360px]
    overflow-hidden
    rounded-2xl
    border
    border-orange-100
    bg-white
    shadow-xl
    shadow-orange-100/40
  "
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-[#2A1B12]">
                          การแจ้งเตือน
                        </p>

                        {unreadCount > 0 && (
                          <p className="mt-0.5 text-[11px] text-orange-500">
                            มี {unreadCount} รายการที่ยังไม่ได้อ่าน
                          </p>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleReadAll}
                          className="text-xs font-semibold text-orange-500 hover:text-orange-600"
                        >
                          อ่านทั้งหมด
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-[min(420px,calc(100dvh-100px))] overflow-y-auto overscroll-contain">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <Bell className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                          <p className="text-sm text-gray-400">
                            ยังไม่มีการแจ้งเตือน
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-orange-50 ${
                              notification.isRead
                                ? "bg-white"
                                : "bg-orange-50/60"
                            }`}
                          >
                            {getNotificationIcon(notification.type)}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={`break-words text-sm ${
                                    notification.isRead
                                      ? "font-medium text-gray-700"
                                      : "font-bold text-gray-800"
                                  }`}
                                >
                                  {notification.title}
                                </p>

                                {!notification.isRead && (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                                )}
                              </div>

                              <p className="mt-1 break-words text-xs leading-5 text-gray-500">
                                {notification.message}
                              </p>

                              <p className="mt-1 text-[10px] text-gray-400">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================
                PROFILE
            ========================== */}

            <div className="relative mr-0 sm:mr-2">
              {/* Profile Button */}

              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="
                  group
                  flex
                  items-center
                  gap-2.5
                  rounded-2xl
                  border
                  border-orange-100
                  bg-white
                  px-2
                  py-1.5
                  shadow-sm
                  transition-all
                  duration-200
                  hover:border-orange-200
                  hover:bg-orange-50
                  hover:shadow-md
                "
              >
                {/* รูปโปรไฟล์ */}

                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-gradient-to-br
                    from-orange-400
                    to-orange-600
                    text-white
                    shadow-sm
                    transition-transform
                    duration-200
                    group-hover:scale-105
                  "
                >
                  <User className="h-5 w-5" />
                </div>

                {/* ชื่อ */}

                {token && (
                  <div className="hidden min-w-0 text-left sm:block">
                    <p className="text-[10px] leading-none text-gray-400">
                      บัญชีผู้ใช้
                    </p>

                    <p
                      className="
                        mt-1
                        max-w-[120px]
                        truncate
                        text-sm
                        font-bold
                        text-[#2A1B12]
                      "
                    >
                      {userName}
                    </p>
                  </div>
                )}

                {!token && (
                  <span
                    className="
                      hidden
                      text-sm
                      font-semibold
                      text-[#2A1B12]
                      sm:block
                    "
                  >
                    บัญชี
                  </span>
                )}

                <ChevronDown
                  className={`
                    h-4
                    w-4
                    text-gray-400
                    transition-transform
                    duration-200
                    ${open ? "rotate-180 text-orange-500" : ""}
                  `}
                />
              </button>

              {/* =========================
                  DROPDOWN
              ========================== */}

              {open && (
                <>
                  {/* คลิกพื้นที่ด้านนอกเพื่อปิด */}

                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                  />

                  <div
                    className="
                      absolute
                      right-[-8px]
                      top-[52px]
                      z-50
                      w-64
                      overflow-hidden
                      rounded-2xl
                      border
                      border-orange-100
                      bg-white
                      shadow-xl
                      shadow-orange-100/40
                      animate-[fadeIn_.15s_ease-out]
                    "
                  >
                    {/* =========================
                        LOGIN แล้ว
                    ========================== */}

                    {token ? (
                      <>
                        {/* User Header */}

                        <div
                          className="
                            bg-gradient-to-br
                            from-orange-50
                            via-white
                            to-orange-50
                            px-4
                            py-4
                          "
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-gradient-to-br
                                from-orange-400
                                to-orange-600
                                text-white
                                shadow-sm
                              "
                            >
                              <User className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-[11px] text-gray-400">
                                ยินดีต้อนรับ
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  truncate
                                  text-sm
                                  font-bold
                                  text-[#2A1B12]
                                "
                              >
                                {userName}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}

                        <div className="border-t border-gray-100" />

                        {/* ออกจากระบบ */}

                        <div className="p-2">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="
                              group
                              flex
                              w-full
                              items-center
                              gap-3
                              rounded-xl
                              px-3
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
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-red-50
                                transition
                                group-hover:bg-red-100
                              "
                            >
                              <LogOut
                                className="
                                  h-4
                                  w-4
                                  text-red-500
                                "
                              />
                            </div>

                            <div>
                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  text-red-500
                                "
                              >
                                ออกจากระบบ
                              </p>

                              <p className="text-[11px] text-gray-400">
                                ออกจากบัญชีผู้ใช้
                              </p>
                            </div>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* =========================
                         ยังไม่ได้ Login
                      ========================== */

                      <div className="p-2">
                        {/* สมัครสมาชิก */}

                        <Link
                          to="/PreRegister"
                          onClick={() => setOpen(false)}
                          className="
                            group
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            px-3
                            py-3
                            transition
                            hover:bg-orange-50
                          "
                        >
                          <div
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-orange-100
                              transition
                              group-hover:bg-orange-200
                            "
                          >
                            <UserPlus
                              className="
                                h-4
                                w-4
                                text-orange-500
                              "
                            />
                          </div>

                          <span
                            className="
                              text-sm
                              font-semibold
                              text-[#2A1B12]
                            "
                          >
                            สมัครสมาชิก
                          </span>
                        </Link>

                        {/* เข้าสู่ระบบ */}

                        <Link
                          to="/login"
                          onClick={() => setOpen(false)}
                          className="
                            group
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            px-3
                            py-3
                            transition
                            hover:bg-blue-50
                          "
                        >
                          <div
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-blue-100
                              transition
                              group-hover:bg-blue-200
                            "
                          >
                            <LogIn
                              className="
                                h-4
                                w-4
                                text-blue-500
                              "
                            />
                          </div>

                          <span
                            className="
                              text-sm
                              font-semibold
                              text-[#2A1B12]
                            "
                          >
                            เข้าสู่ระบบ
                          </span>
                        </Link>
                      </div>
                    )}
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

export default MainNav;
