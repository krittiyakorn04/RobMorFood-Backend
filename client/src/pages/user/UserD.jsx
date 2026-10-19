import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Store,
  Clock,
  ShoppingBag,
  Package,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle2,
  Hourglass,
  ChefHat,
  X,
  CreditCard,
} from "lucide-react";

import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { getOrder } from "../../api/UserOrder";

// =========================================================
// STATUS TABS
// =========================================================

const STATUS_TABS = [
  {
    key: "PENDING",
    label: "รอร้านยืนยัน",
    icon: Hourglass,
    activeClass: "bg-yellow-400 text-white",
  },
  {
    key: "WAITING_PAYMENT",
    label: "รอชำระเงิน",
    icon: CreditCard,
    activeClass: "bg-sky-500 text-white",
  },
  {
    key: "PREPARING",
    label: "กำลังทำอาหาร",
    icon: ChefHat,
    activeClass: "bg-orange-500 text-white",
  },
  {
    key: "DELIVERING",
    label: "กำลังจัดส่ง",
    icon: Truck,
    activeClass: "bg-blue-500 text-white",
  },
  {
    key: "COMPLETED",
    label: "เสร็จสิ้น",
    icon: CheckCircle2,
    activeClass: "bg-green-500 text-white",
  },
  {
    key: "CANCELLED",
    label: "ยกเลิก",
    icon: X,
    activeClass: "bg-red-500 text-white",
  },
  {
    key: "ALL",
    label: "ทั้งหมด",
    icon: ShoppingBag,
    activeClass: "bg-orange-500 text-white",
  },
];

// =========================================================
// GET DISPLAY STATUS
// =========================================================

const getOrderDisplayStatus = (order) => {
  if (!order) return "UNKNOWN";

  // ยกเลิก
  if (order.status === "CANCELLED") {
    return "CANCELLED";
  }

  // เสร็จสิ้น
  if (order.status === "COMPLETED") {
    return "COMPLETED";
  }

  // รอร้านยืนยัน
  if (order.status === "PENDING") {
    return "PENDING";
  }

  // รอชำระเงิน
  if (order.status === "WAITING_PAYMENT") {
    return "WAITING_PAYMENT";
  }

  // ร้านยืนยันแล้ว
  if (order.status === "CONFIRMED") {
    return "CONFIRMED";
  }

  // กำลังทำอาหาร
  if (order.status === "PREPARING") {
    return "PREPARING";
  }

  // READY ต้องดู Delivery
  if (order.status === "READY") {
    const deliveryStatus = order.delivery?.status;

    if (deliveryStatus === "DELIVERING") {
      return "DELIVERING";
    }

    if (deliveryStatus === "COMPLETED") {
      return "COMPLETED";
    }

    return "READY";
  }

  return "UNKNOWN";
};

// =========================================================
// STATUS META
// =========================================================

const getStatusMeta = (order) => {
  const displayStatus = getOrderDisplayStatus(order);

  if (displayStatus === "CANCELLED") {
    return {
      label: "ยกเลิก",
      icon: X,
      className: "bg-red-100 text-red-700 border-red-200",
    };
  }

  if (displayStatus === "PENDING") {
    return {
      label: "รอร้านยืนยัน",
      icon: Hourglass,
      className: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }

  if (displayStatus === "WAITING_PAYMENT") {
    return {
      label: "รอชำระเงิน",
      icon: CreditCard,
      className: "bg-sky-100 text-sky-700 border-sky-200",
    };
  }

  if (displayStatus === "CONFIRMED") {
    return {
      label: "ร้านยืนยันแล้ว",
      icon: CheckCircle2,
      className: "bg-blue-100 text-blue-700 border-blue-200",
    };
  }

  if (displayStatus === "PREPARING") {
    return {
      label: "กำลังทำอาหาร",
      icon: ChefHat,
      className: "bg-orange-100 text-orange-700 border-orange-200",
    };
  }

  if (displayStatus === "READY") {
    return {
      label: "รอจัดส่ง",
      icon: Package,
      className: "bg-purple-100 text-purple-700 border-purple-200",
    };
  }

  if (displayStatus === "DELIVERING") {
    return {
      label: "กำลังจัดส่ง",
      icon: Truck,
      className: "bg-blue-100 text-blue-700 border-blue-200",
    };
  }

  if (displayStatus === "COMPLETED") {
    return {
      label: "เสร็จสิ้น",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-700 border-green-200",
    };
  }

  return {
    label: "ไม่ทราบสถานะ",
    icon: Hourglass,
    className: "bg-gray-100 text-gray-600 border-gray-200",
  };
};

// =========================================================
// FORMAT DATE
// =========================================================

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =========================================================
// PARSE OPTIONS
// =========================================================

const parseOptions = (options) => {
  if (!options) return [];

  try {
    const parsed = typeof options === "string" ? JSON.parse(options) : options;

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// =========================================================
// ADD MINUTES
// =========================================================

const addMinutesToTime = (time, minutes) => {
  if (!time) return "-";

  const [hour, minute] = String(time).slice(0, 5).split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "-";
  }

  const totalMinutes = hour * 60 + minute + minutes;

  const finalHour = Math.floor(totalMinutes / 60) % 24;

  const finalMinute = totalMinutes % 60;

  return `${String(finalHour).padStart(
    2,
    "0",
  )}:${String(finalMinute).padStart(2, "0")}`;
};

// =========================================================
// COMPONENT
// =========================================================

const OrderUser = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openOrders, setOpenOrders] = useState({});

  const [activeStatus, setActiveStatus] = useState("PENDING");

  // =========================================================
  // LOAD ORDERS
  // =========================================================

  useEffect(() => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    let isLoading = false;

    const loadOrders = async (showLoading = false) => {
      if (isLoading) return;

      isLoading = true;

      try {
        if (showLoading) {
          setLoading(true);
        }

        const res = await getOrder(token);

        if (!mounted) return;

        const newOrders = Array.isArray(res.data) ? res.data : [];

        setOrders(newOrders);
      } catch (error) {
        console.log("โหลด Order ไม่สำเร็จ =", error);

        console.log("status =", error.response?.status);

        console.log("data =", error.response?.data);

        if (showLoading && mounted) {
          Swal.fire({
            icon: "error",
            title: "ไม่สามารถโหลดรายการสั่งซื้อได้",
            text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
            confirmButtonColor: "#f97316",
          });
        }
      } finally {
        isLoading = false;

        if (showLoading && mounted) {
          setLoading(false);
        }
      }
    };

    // โหลดครั้งแรก
    loadOrders(true);

    // ตรวจสอบทุก 3 วินาที
    const interval = setInterval(() => {
      loadOrders(false);
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token]);

  // =========================================================
  // FILTER ORDERS
  // =========================================================

  const filteredOrders = useMemo(() => {
    if (activeStatus === "ALL") {
      return orders;
    }

    return orders.filter((order) => {
      return getOrderDisplayStatus(order) === activeStatus;
    });
  }, [orders, activeStatus]);

  // =========================================================
  // STATUS COUNT
  // =========================================================

  const getStatusCount = (status) => {
    if (status === "ALL") {
      return orders.length;
    }

    return orders.filter((order) => getOrderDisplayStatus(order) === status)
      .length;
  };

  // =========================================================
  // TOGGLE FOOD LIST
  // =========================================================

  const toggleOrder = (orderId) => {
    setOpenOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] animate-pulse">
        {/* =====================================================
          HEADER
      ===================================================== */}
        <div className="bg-white border-b border-orange-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              {/* ปุ่มย้อนกลับ */}
              <div className="w-10 h-10 rounded-xl bg-orange-100 shrink-0" />

              <div className="space-y-2">
                {/* ชื่อหน้า */}
                <div className="h-5 w-32 rounded-lg bg-gray-200" />

                {/* คำอธิบาย */}
                <div className="h-3 w-44 rounded-lg bg-gray-100" />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
          CONTENT
      ===================================================== */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          {/* =====================================================
            STATUS TABS
        ===================================================== */}
          <div className="flex gap-2 overflow-hidden pb-3 mb-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-10 w-28 shrink-0 rounded-full bg-orange-100"
              />
            ))}
          </div>

          {/* =====================================================
            ORDER CARDS
        ===================================================== */}
          <div className="space-y-5">
            {[1, 2, 3].map((order) => (
              <div
                key={order}
                className="
                bg-white
                rounded-3xl
                shadow-sm
                border
                border-orange-100
                overflow-hidden
              "
              >
                {/* =================================================
                  ORDER HEADER
              ================================================= */}

                {/* ORDER HEADER - SKELETON */}

                <div className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    {/* โครงชื่อร้านและเลขออเดอร์ */}
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-orange-100" />

                      <div className="min-w-0 flex-1 space-y-2 pt-1">
                        <div className="h-5 w-36 max-w-full rounded-lg bg-gray-200" />
                        <div className="h-3 w-28 max-w-full rounded-lg bg-gray-100" />
                      </div>
                    </div>

                    {/* โครงวันที่ */}
                    <div className="h-7 w-36 max-w-full rounded-xl bg-gray-100 sm:ml-auto" />
                  </div>
                </div>

                {/* =================================================
                  STATUS
              ================================================= */}
                <div className="px-5 sm:px-6 pb-5">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                    <div className="h-11 w-full rounded-xl bg-gray-200" />
                  </div>
                </div>

                {/* =================================================
                  ORDER ROUND
              ================================================= */}
                <div className="px-5 sm:px-6 pb-5">
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 shrink-0" />

                        <div className="space-y-2">
                          <div className="h-3 w-20 rounded bg-gray-100" />
                          <div className="h-4 w-16 rounded bg-gray-200" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="h-3 w-24 rounded bg-gray-200" />
                        <div className="h-3 w-20 rounded bg-green-100 ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* =================================================
                  FOOD LIST HEADER
              ================================================= */}
                <div className="px-5 sm:px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-100" />

                      <div className="space-y-2">
                        <div className="h-4 w-24 rounded bg-gray-200" />
                        <div className="h-3 w-16 rounded bg-gray-100" />
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gray-100" />
                  </div>
                </div>

                {/* =================================================
                  TOTAL
              ================================================= */}
                <div
                  className="
                  border-t
                  border-gray-100
                  bg-gray-50/50
                  px-5
                  sm:px-6
                  py-5
                  flex
                  justify-between
                  items-center
                  gap-4
                "
                >
                  <div className="space-y-2">
                    <div className="h-3 w-20 rounded bg-gray-100" />
                    <div className="h-7 w-28 rounded-lg bg-orange-100" />
                  </div>

                  <div className="h-10 w-28 rounded-xl bg-orange-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-20">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="bg-white border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="
                w-10
                h-10
                rounded-xl
                bg-orange-50
                flex
                items-center
                justify-center
                text-orange-500
                hover:bg-orange-100
                active:scale-95
                transition
                shrink-0
              "
            >
              <ArrowLeft size={20} />
            </button>

            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#2A1B12]">
                ออเดอร์ของฉัน
              </h1>

              <p className="text-sm text-gray-400 mt-0.5">
                รายการอาหารที่สั่งไปแล้ว
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {/* =====================================================
    STATUS TABS
===================================================== */}

        {orders.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-5">
            {STATUS_TABS.map((tab) => {
              const count = getStatusCount(tab.key);
              const active = activeStatus === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveStatus(tab.key)}
                  className={`
            flex
            items-center
            gap-2
            whitespace-nowrap
            px-4
            py-2
            rounded-full
            text-sm
            font-semibold
            transition
            ${
              active
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-[#8A6A54] border border-orange-100 hover:bg-orange-50"
            }
          `}
                >
                  {tab.label}

                  <span
                    className={`
              text-xs
              px-2
              py-0.5
              rounded-full
              ${
                active
                  ? "bg-white/20 text-white"
                  : "bg-orange-50 text-[#8A6A54]"
              }
            `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ===================================================
            NO ORDER AT ALL
        ==================================================== */}

        {orders.length === 0 ? (
          <div
            className="
              bg-white
              rounded-3xl
              shadow-sm
              border
              border-orange-100
              p-10
              text-center
              mt-2
            "
          >
            <div
              className="
                w-20
                h-20
                rounded-2xl
                bg-orange-50
                flex
                items-center
                justify-center
                mx-auto
                mb-5
              "
            >
              <ShoppingBag size={38} className="text-orange-400" />
            </div>

            <h2 className="text-xl font-bold text-[#2A1B12] mb-2">
              ยังไม่มีออเดอร์
            </h2>

            <p className="text-gray-400 mb-6">คุณยังไม่มีรายการสั่งซื้อ</p>

            <button
              type="button"
              onClick={() => navigate("/user")}
              className="
                bg-orange-500
                hover:bg-orange-600
                text-white
                px-6
                py-3
                rounded-xl
                font-bold
                shadow-sm
                hover:shadow
                active:scale-95
                transition
              "
            >
              ไปเลือกอาหาร
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* =================================================
             NO ORDER IN CURRENT TAB
          ================================================= */

          <div
            className="
              bg-white
              rounded-3xl
              shadow-sm
              border
              border-orange-100
              p-10
              text-center
            "
          >
            <div
              className="
                w-20
                h-20
                rounded-2xl
                bg-gray-50
                flex
                items-center
                justify-center
                mx-auto
                mb-5
              "
            >
              <Package size={38} className="text-gray-300" />
            </div>

            <h2 className="text-xl font-bold text-[#2A1B12] mb-2">
              ไม่มีออเดอร์ในสถานะนี้
            </h2>

            <p className="text-gray-400">
              ยังไม่มีรายการสั่งซื้อที่อยู่ในสถานะ{" "}
              {STATUS_TABS.find((item) => item.key === activeStatus)?.label}
            </p>
          </div>
        ) : (
          /* =================================================
             ORDER LIST
          ================================================= */

          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const orderItems = Array.isArray(order.menu) ? order.menu : [];

              const totalPrice = Number(order.totalPrice || 0);

              const isOpen = openOrders[order.id] === true;

              const statusMeta = getStatusMeta(order);

              return (
                <div
                  key={order.id}
                  className="
                    bg-white
                    rounded-3xl
                    shadow-[0_4px_20px_rgba(0,0,0,0.04)]
                    border
                    border-orange-100
                    overflow-hidden
                  "
                >
                  {/* ORDER HEADER */}

                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      {/* STORE + ORDER NUMBER */}
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className="
          flex h-12 w-12 shrink-0 items-center justify-center
          rounded-2xl border border-orange-100
          bg-gradient-to-br from-orange-50 to-orange-100
        "
                        >
                          <Store size={22} className="text-orange-500" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="break-words [overflow-wrap:anywhere] text-base font-bold leading-snug text-[#2A1B12] sm:text-lg">
                            {order.store?.storeName || "ไม่พบชื่อร้าน"}
                          </h2>

                          <p className="mt-1 break-words text-xs leading-relaxed text-gray-400">
                            ออเดอร์{" "}
                            <span className="text-orange-500">
                              #ORD{String(order.id).padStart(4, "0")}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* DATE */}
                      <div
                        className="
        flex w-fit max-w-full min-w-0 items-start gap-1.5
        rounded-xl border border-gray-100 bg-gray-50
        px-2.5 py-1.5 text-xs leading-relaxed text-gray-500
        sm:ml-4 sm:shrink-0
      "
                      >
                        <Clock size={13} className="mt-0.5 shrink-0" />

                        <span className="min-w-0 break-words">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      STATUS
                  ================================================= */}

                  <div className="px-5 sm:px-6 pb-5">
                    <div
                      className="
                        bg-gray-50/70
                        border
                        border-gray-100
                        rounded-2xl
                        p-3
                      "
                    >
                      <div className="grid grid-cols-1 gap-2">
                        <div
                          className={`
                            flex
                            items-center
                            gap-2
                            px-3
                            py-2.5
                            rounded-xl
                            border
                            bg-white
                            shadow-sm
                            min-w-0
                            ${statusMeta.className}
                          `}
                        >
                          <div className="shrink-0">
                            <statusMeta.icon size={15} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] opacity-60 leading-none mb-1">
                              สถานะออเดอร์
                            </p>

                            <p className="text-xs font-bold truncate">
                              {statusMeta.label}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* =================================================
                      ORDER ROUND
                  ================================================= */}

                  {order.orderRound && (
                    <div className="px-5 sm:px-6 pb-5">
                      <div
                        className="
                          bg-orange-50
                          border
                          border-orange-100
                          rounded-2xl
                          p-4
                        "
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="
                                w-10
                                h-10
                                rounded-xl
                                bg-white
                                flex
                                items-center
                                justify-center
                                shrink-0
                                shadow-sm
                              "
                            >
                              <Clock size={18} className="text-orange-500" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-[11px] text-gray-400">
                                รอบออเดอร์
                              </p>

                              <p className="text-sm font-bold text-[#2A1B12]">
                                รอบ {order.orderRound.roundNumber}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-gray-700">
                              {order.orderRound.startTime} -{" "}
                              {order.orderRound.endTime}
                            </p>

                            <p className="text-[11px] text-green-600 mt-1">
                              ส่งประมาณ{" "}
                              {addMinutesToTime(order.orderRound.endTime, 20)}{" "}
                              น.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      FOOD LIST HEADER
                  ================================================= */}

                  <button
                    type="button"
                    onClick={() => toggleOrder(order.id)}
                    className="
                      w-full
                      px-5
                      sm:px-6
                      py-4
                      border-t
                      border-gray-100
                      flex
                      items-center
                      justify-between
                      hover:bg-orange-50/60
                      active:bg-orange-50
                      transition
                    "
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="
                          w-9
                          h-9
                          rounded-xl
                          bg-orange-50
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <Package size={18} className="text-orange-500" />
                      </div>

                      <div className="text-left">
                        <p className="font-bold text-[#2A1B12] text-sm">
                          รายการอาหาร
                        </p>

                        <p className="text-xs text-gray-400 mt-0.5">
                          {orderItems.length} รายการ
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        w-8
                        h-8
                        rounded-full
                        bg-gray-50
                        flex
                        items-center
                        justify-center
                      "
                    >
                      {isOpen ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* =================================================
                      FOOD LIST
                  ================================================= */}

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5">
                      {orderItems.length === 0 ? (
                        <div
                          className="
                            bg-gray-50
                            rounded-2xl
                            p-6
                            text-center
                          "
                        >
                          <ShoppingBag
                            size={25}
                            className="text-gray-300 mx-auto mb-2"
                          />

                          <p className="text-gray-400 text-sm">
                            ไม่พบรายการอาหาร
                          </p>
                        </div>
                      ) : (
                        <div
                          className="
                            border
                            border-gray-100
                            rounded-2xl
                            overflow-hidden
                          "
                        >
                          {orderItems.map((item, index) => {
                            const menu = item.menu;

                            const menuName = menu?.menuItem || "ไม่พบชื่อเมนู";

                            const description = menu?.description;

                            const price = Number(item.price || 0);

                            const count = Number(item.count || 1);

                            const options = parseOptions(item.options);

                            const itemTotal = price * count;

                            const image =
                              menu?.images?.[0]?.secure_url ||
                              menu?.images?.[0]?.url ||
                              menu?.image ||
                              menu?.imageUrl ||
                              null;

                            return (
                              <div
                                key={item.id || index}
                                className="
                                    p-4
                                    sm:p-5
                                    border-b
                                    last:border-b-0
                                    border-gray-100
                                  "
                              >
                                <div className="flex gap-4">
                                  {/* IMAGE */}

                                  {image ? (
                                    <img
                                      src={image}
                                      alt={menuName}
                                      className="
                                          w-20
                                          h-20
                                          sm:w-24
                                          sm:h-24
                                          rounded-2xl
                                          object-cover
                                          shrink-0
                                          border
                                          border-gray-100
                                        "
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";

                                        if (e.currentTarget.nextSibling) {
                                          e.currentTarget.nextSibling.style.display =
                                            "flex";
                                        }
                                      }}
                                    />
                                  ) : null}

                                  {/* NO IMAGE */}

                                  <div
                                    className="
                                        w-20
                                        h-20
                                        sm:w-24
                                        sm:h-24
                                        rounded-2xl
                                        bg-orange-50
                                        items-center
                                        justify-center
                                        shrink-0
                                      "
                                    style={{
                                      display: image ? "none" : "flex",
                                    }}
                                  >
                                    <ShoppingBag
                                      size={27}
                                      className="text-orange-300"
                                    />
                                  </div>

                                  {/* INFO */}

                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between gap-3">
                                      <div className="min-w-0">
                                        <p
                                          className="
                                              font-bold
                                              text-[#2A1B12]
                                              text-sm
                                              sm:text-base
                                              truncate
                                            "
                                        >
                                          {menuName}
                                        </p>

                                        {description && (
                                          <p
                                            className="
                                                text-xs
                                                sm:text-sm
                                                text-gray-500
                                                mt-1
                                                line-clamp-2
                                              "
                                          >
                                            {description}
                                          </p>
                                        )}

                                        <p
                                          className="
                                              text-xs
                                              sm:text-sm
                                              text-gray-400
                                              mt-2
                                            "
                                        >
                                          ฿{price.toFixed(2)}
                                          {" × "}
                                          {count}
                                        </p>
                                      </div>

                                      <p
                                        className="
                                            font-bold
                                            text-orange-500
                                            text-sm
                                            sm:text-base
                                            whitespace-nowrap
                                          "
                                      >
                                        ฿{itemTotal.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* OPTIONS */}

                                {options.length > 0 && (
                                  <div
                                    className="
                                        mt-3
                                        bg-[#FFF8F0]
                                        border
                                        border-orange-100
                                        rounded-xl
                                        p-3
                                      "
                                  >
                                    <p
                                      className="
                                          text-xs
                                          font-bold
                                          text-gray-600
                                          mb-2
                                        "
                                    >
                                      ตัวเลือก
                                    </p>

                                    <div className="space-y-1.5">
                                      {options.map((option, optionIndex) => (
                                        <div
                                          key={optionIndex}
                                          className="
                                                flex
                                                justify-between
                                                gap-3
                                                text-sm
                                              "
                                        >
                                          <span className="text-gray-600">
                                            {option.choiceName ||
                                              option.name ||
                                              "ตัวเลือก"}
                                          </span>

                                          <span className="text-orange-500 whitespace-nowrap">
                                            {Number(option.extraPrice || 0) > 0
                                              ? `+฿${Number(
                                                  option.extraPrice,
                                                ).toFixed(2)}`
                                              : "ฟรี"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* ITEM NOTE */}

                                {item.note && (
                                  <div
                                    className="
                                        mt-3
                                        bg-gray-50
                                        border
                                        border-gray-100
                                        rounded-xl
                                        p-3
                                      "
                                  >
                                    <p
                                      className="
                                          text-[11px]
                                          text-gray-400
                                          mb-1
                                        "
                                    >
                                      หมายเหตุเมนู
                                    </p>

                                    <p className="text-sm text-gray-600">
                                      {item.note}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* =================================================
                      ORDER NOTE
                  ================================================= */}

                  {order.note && (
                    <div className="px-5 sm:px-6 pb-5">
                      <div
                        className="
                          bg-[#FFF8F0]
                          border
                          border-orange-100
                          rounded-2xl
                          p-4
                        "
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="
                              w-2
                              h-2
                              rounded-full
                              bg-orange-400
                            "
                          />

                          <p className="text-xs font-bold text-gray-500">
                            หมายเหตุถึงร้าน
                          </p>
                        </div>

                        <p className="text-sm text-gray-700 leading-relaxed">
                          {order.note}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      TOTAL
                  ================================================= */}

                  <div
                    className="
                      border-t
                      border-gray-100
                      bg-gray-50/50
                      px-5
                      sm:px-6
                      py-5
                      flex
                      justify-between
                      items-center
                      gap-4
                    "
                  >
                    <div>
                      <p className="text-xs text-gray-400">ยอดรวมทั้งหมด</p>

                      <p
                        className="
                          text-2xl
                          sm:text-3xl
                          font-bold
                          text-orange-500
                          mt-0.5
                        "
                      >
                        ฿{totalPrice.toFixed(2)}
                      </p>
                    </div>

                    {/* ORDER DETAIL */}

                    <button
                      type="button"
                      onClick={() => navigate(`/user/orderDetail/${order.id}`)}
                      className="
                        flex
                        items-center
                        gap-2
                        bg-orange-500
                        hover:bg-orange-600
                        text-white
                        px-4
                        py-2.5
                        rounded-xl
                        font-semibold
                        text-sm
                        shadow-sm
                        hover:shadow
                        active:scale-95
                        transition
                      "
                    >
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderUser;
