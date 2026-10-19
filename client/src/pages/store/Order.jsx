import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Clock3,
  User,
  Hourglass,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  X,
  Inbox,
  ChevronRight,
} from "lucide-react";

import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";

import {
  getStoreOrders,
  changeStatusOrder,
  changeStatusPayment,
  cancelStoreOrder,
} from "../../api/StoreOrder";

// ==========================================
// ORDER STATUS
// ==========================================

const STATUS_META = {
  PENDING: {
    label: "รอร้านยืนยัน",
    icon: Hourglass,
    bg: "#FFF3D6",
    fg: "#B8860B",
  },

  CONFIRMED: {
    label: "ร้านยืนยันแล้ว",
    icon: CheckCircle2,
    bg: "#DCFCE7",
    fg: "#16A34A",
  },

  WAITING_PAYMENT: {
    label: "รอชำระเงิน",
    icon: Hourglass,
    bg: "#E0F2FE",
    fg: "#0284C7",
  },

  PREPARING: {
    label: "กำลังทำอาหาร",
    icon: ChefHat,
    bg: "#FFE4C4",
    fg: "#E8491D",
  },

  READY: {
    label: "ทำอาหารเสร็จแล้ว",
    icon: PackageCheck,
    bg: "#DBEAFE",
    fg: "#2563EB",
  },

  COMPLETED: {
    label: "สำเร็จแล้ว",
    icon: CheckCircle2,
    bg: "#DCFCE7",
    fg: "#16A34A",
  },

  CANCELLED: {
    label: "ยกเลิก",
    icon: X,
    bg: "#FEE2E2",
    fg: "#DC2626",
  },
};

const StoreOrders = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("PENDING");

  // ==========================================
  // LOAD ORDERS
  // ==========================================

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setOrders([]);
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

        const res = await getStoreOrders(token);

        const allOrders = Array.isArray(res.data) ? res.data : [];

        if (mounted) {
          setOrders(allOrders);
        }
      } catch (error) {
        console.log("โหลด Order ไม่สำเร็จ =", error?.response?.data || error);

        // แสดง Swal เฉพาะตอนโหลดครั้งแรก
        // ไม่ต้องเด้งแจ้งเตือนทุก 3 วินาที
        if (showLoading && mounted) {
          await Swal.fire({
            icon: "error",
            title: "ไม่สามารถโหลดรายการออเดอร์ได้",
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

    // โหลดทันทีเมื่อเข้าหน้า
    loadOrders(true);

    // เช็กออเดอร์ใหม่ทุก 3 วินาที
    const interval = setInterval(() => {
      loadOrders(false);
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token]);

  // ==========================================
  // REFRESH ORDERS
  // ==========================================

  const refreshOrders = async () => {
    if (!token) {
      return;
    }

    try {
      const res = await getStoreOrders(token);


      const allOrders = Array.isArray(res.data) ? res.data : [];

      setOrders(allOrders);
    } catch (error) {
      console.log("Refresh Store Orders Error =", error);
    }
  };

  // ==========================================
  // CONFIRM ORDER
  // ==========================================

  const handleConfirmOrder = async (orderId) => {
    try {
      const result = await Swal.fire({
        icon: "question",
        title: "ยืนยันออเดอร์?",
        text: "เมื่อตกลงแล้ว ลูกค้าจะสามารถไปชำระเงินได้",
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "ยืนยันออเดอร์",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#f97316",
        cancelButtonColor: "#9ca3af",
      });

      if (!result.isConfirmed) {
        return;
      }

      await changeStatusOrder(token, orderId, "WAITING_PAYMENT");

      // ==========================================
      // ดึงข้อมูลล่าสุดจาก Backend
      // ==========================================

      await refreshOrders();

      await Swal.fire({
        icon: "success",
        title: "ยืนยันออเดอร์แล้ว",
        text: "รอลูกค้าชำระเงิน",
        confirmButtonColor: "#f97316",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log("ยืนยัน Order ไม่สำเร็จ =", error);

      await Swal.fire({
        icon: "error",
        title: "ยืนยันออเดอร์ไม่สำเร็จ",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  // ==========================================
  // START COOKING / CONFIRM PAYMENT
  // ==========================================

  const handleStartCooking = async (order) => {
    try {
      const paymentId = order.payment?.id;

      if (!paymentId) {
        await Swal.fire({
          icon: "error",
          title: "ไม่พบข้อมูลการชำระเงิน",
          text: "ไม่พบ Payment ID ของออเดอร์นี้",
          confirmButtonColor: "#f97316",
        });

        return;
      }

      if (order.payment?.status !== "SLIP_UPLOADED") {
        await Swal.fire({
          icon: "warning",
          title: "ยังไม่สามารถเริ่มทำอาหารได้",
          text: "ลูกค้ายังไม่ได้อัปโหลดสลิป",
          confirmButtonColor: "#f97316",
        });

        return;
      }

      const result = await Swal.fire({
        icon: "question",
        title: "เริ่มทำอาหาร?",
        text: `ต้องการยืนยันการชำระเงินและเริ่มทำอาหารออเดอร์ #ORD${String(
          order.id,
        ).padStart(4, "0")} หรือไม่?`,
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "ยืนยันเริ่มทำอาหาร",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#16a34a",
        cancelButtonColor: "#9ca3af",
      });

      if (!result.isConfirmed) {
        return;
      }

      await changeStatusPayment(token, paymentId, "CONFIRMED");

      await refreshOrders();

      await Swal.fire({
        icon: "success",
        title: "เริ่มทำอาหารแล้ว",
        text: "ยืนยันการชำระเงินเรียบร้อย",
        confirmButtonColor: "#f97316",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log("เริ่มทำอาหารไม่สำเร็จ =", error);

      await Swal.fire({
        icon: "error",
        title: "เริ่มทำอาหารไม่สำเร็จ",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  // ==========================================
  // READY ORDER
  // PREPARING -> READY
  // ==========================================

  const handleReadyOrder = async (orderId) => {
    try {
      const result = await Swal.fire({
        icon: "question",
        title: "ทำอาหารเสร็จแล้ว?",
        text: `ต้องการเปลี่ยนสถานะออเดอร์ #ORD${String(orderId).padStart(
          4,
          "0",
        )} เป็น "ทำอาหารเสร็จแล้ว" หรือไม่?`,
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#9ca3af",
      });

      if (!result.isConfirmed) {
        return;
      }

      await changeStatusOrder(token, orderId, "READY");

      await refreshOrders();

      await Swal.fire({
        icon: "success",
        title: "ทำอาหารเสร็จแล้ว",
        text: "ออเดอร์พร้อมจัดส่ง",
        confirmButtonColor: "#f97316",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log("เปลี่ยนเป็น READY ไม่สำเร็จ =", error);

      await Swal.fire({
        icon: "error",
        title: "เปลี่ยนสถานะไม่สำเร็จ",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  // ==========================================
  // CANCEL ORDER
  // ==========================================

  const handleCancelStoreOrder = async (orderId) => {
    try {
      const result = await Swal.fire({
        icon: "warning",
        title: "ยกเลิกออเดอร์?",
        text: "คุณต้องการยกเลิกออเดอร์นี้ใช่หรือไม่",
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "ยืนยันยกเลิก",
        cancelButtonText: "ไม่ยกเลิก",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#9ca3af",
      });

      if (!result.isConfirmed) {
        return;
      }

      await cancelStoreOrder(token, orderId);

      // ==========================================
      // ดึงข้อมูลล่าสุดจาก Backend
      // ==========================================

      await refreshOrders();

      await Swal.fire({
        icon: "success",
        title: "ยกเลิกออเดอร์แล้ว",
        text: "ออเดอร์ถูกยกเลิกเรียบร้อยแล้ว",
        confirmButtonColor: "#f97316",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log("ยกเลิก Order ไม่สำเร็จ =", error);

      await Swal.fire({
        icon: "error",
        title: "ยกเลิกออเดอร์ไม่สำเร็จ",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  // ==========================================
  // PARSE OPTIONS
  // ==========================================

  const parseOptions = (options) => {
    if (!options) {
      return [];
    }

    try {
      const parsed =
        typeof options === "string" ? JSON.parse(options) : options;

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // ==========================================
  // TABS
  // ==========================================

  const tabs = [
    {
      label: "รอร้านยืนยัน",
      value: "PENDING",
    },

    {
      label: "รอชำระเงิน",
      value: "WAITING_PAYMENT",
    },

    {
      label: "ทำอาหาร",
      value: "PREPARING",
    },

    {
      label: "รอจัดส่ง",
      value: "READY",
    },

    {
      label: "เสร็จสิ้น",
      value: "COMPLETED",
    },

    {
      label: "ยกเลิก",
      value: "CANCELLED",
    },
    {
      label: "ทั้งหมด",
      value: "ALL",
    },
  ];

  // ==========================================
  // COUNT
  // ==========================================

  const countFor = (value) => {
    if (value === "ALL") {
      return orders.length;
    }

    return orders.filter((order) => order.status === value).length;
  };

  // ==========================================
  // FILTER
  // ==========================================

  const filtered =
    statusFilter === "ALL"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  // ==========================================
  // LOADING
  // ==========================================
  // ==========================================
  // LOADING SKELETON
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFCF7] via-[#FFF3E4] to-[#FFF8F0] px-4 py-6 pb-28">
        <div className="max-w-6xl mx-auto animate-pulse">
          {/* HEADER */}
          <div className="h-8 w-44 bg-orange-100 rounded-xl" />

          <div className="h-4 w-64 bg-orange-100/80 rounded-lg mt-3 mb-6" />

          {/* TABS */}
          <div className="flex gap-2 overflow-hidden pb-3 mb-5">
            {[100, 100, 90, 90, 80].map((width, index) => (
              <div
                key={index}
                style={{ width }}
                className="h-10 flex-shrink-0 bg-white border border-orange-100 rounded-full"
              />
            ))}
          </div>

          {/* ORDER CARDS */}
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50"
              >
                {/* ORDER HEADER */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="h-6 w-36 bg-orange-100 rounded-lg" />
                    <div className="h-3 w-44 bg-gray-100 rounded-md mt-3" />
                  </div>

                  <div className="h-7 w-24 bg-orange-100 rounded-full" />
                </div>

                {/* CUSTOMER */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex-shrink-0" />

                  <div className="flex-1">
                    <div className="h-3 w-12 bg-gray-100 rounded" />
                    <div className="h-4 w-28 bg-gray-200 rounded mt-2" />
                  </div>
                </div>

                {/* ORDER ROUND */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex-shrink-0" />

                  <div className="flex-1">
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-4 w-40 bg-gray-200 rounded mt-2" />
                  </div>
                </div>

                {/* MENU ITEMS */}
                <div className="mt-5 pt-4 border-t border-dashed border-orange-100 space-y-4">
                  {[1, 2].map((menu) => (
                    <div key={menu}>
                      <div className="flex justify-between gap-4">
                        <div className="h-4 w-36 bg-gray-200 rounded" />
                        <div className="h-4 w-16 bg-gray-100 rounded" />
                      </div>

                      <div className="h-3 w-24 bg-gray-100 rounded mt-2" />
                    </div>
                  ))}
                </div>

                {/* TOTAL */}
                <div className="mt-4 pt-4 border-t border-orange-100 flex justify-between items-center">
                  <div>
                    <div className="h-3 w-12 bg-gray-100 rounded" />
                    <div className="h-6 w-24 bg-orange-100 rounded-lg mt-2" />
                  </div>

                  <div className="h-5 w-24 bg-orange-100 rounded-lg" />
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-4 pt-4 border-t border-orange-100 flex gap-3">
                  <div className="h-12 flex-1 bg-gray-100 rounded-2xl" />
                  <div className="h-12 flex-1 bg-orange-100 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFCF7] via-[#FFF3E4] to-[#FFF8F0] px-4 py-6 pb-28">
      <div className="max-w-6xl mx-auto">
        {/* ====================================== 
            HEADER 
        ====================================== */}

        <h1 className="text-2xl font-bold text-[#2A1B12]">รายการออเดอร์</h1>

        <p className="text-sm text-[#8A6A54] mt-1 mb-5">
          ติดตามและจัดการออเดอร์ของร้าน
        </p>

        {/* ====================================== 
            TABS 
        ====================================== */}

        <div className="flex gap-2 overflow-x-auto pb-3 mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition ${
                statusFilter === tab.value
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-[#8A6A54] border border-orange-100"
              }`}
            >
              {tab.label}

              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  statusFilter === tab.value ? "bg-white/20" : "bg-orange-50"
                }`}
              >
                {countFor(tab.value)}
              </span>
            </button>
          ))}
        </div>

        {/* ====================================== 
            EMPTY 
        ====================================== */}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
              <Inbox size={28} />
            </div>

            <h3 className="font-bold">ไม่มีออเดอร์ในหมวดนี้</h3>

            <p className="text-sm text-gray-500 mt-2">
              ออเดอร์ที่ชำระเงินและแนบสลิปแล้วจะปรากฏที่นี่
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              // ==================================
              // STATUS
              // ==================================

              const statusMeta = STATUS_META[order.status] || {
                label: order.status || "ไม่ทราบสถานะ",
                icon: Hourglass,
                bg: "#F3F4F6",
                fg: "#6B7280",
              };

              const StatusIcon = statusMeta.icon;

              // ==================================
              // MENU
              // ==================================

              const items = Array.isArray(order.menu) ? order.menu : [];

              return (
                <div
                  key={order.id}
                  onClick={() =>
                    navigate(`/store/order-detail/${order.id}`, {
                      state: {
                        order,
                      },
                    })
                  }
                  className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition"
                >
                  {/* ============================== 
                      HEADER 
                  ============================== */}

                  <div className="flex justify-between gap-3 items-start">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="font-bold text-lg text-[#2A1B12]">
                          ออเดอร์
                          <span className="ml-1 text-orange-500">
                            #ORD
                            {String(order.id).padStart(4, "0")}
                          </span>
                        </h2>
                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        กดเพื่อดูรายละเอียดออเดอร์
                      </p>
                    </div>

                    {/* STATUS */}

                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
                      style={{
                        background: statusMeta.bg,
                        color: statusMeta.fg,
                      }}
                    >
                      <StatusIcon size={14} />

                      {statusMeta.label}
                    </span>
                  </div>

                  {/* ============================== 
                      ORDER INFO 
                  ============================== */}

                  <div className="mt-5 space-y-3">
                    {/* CUSTOMER */}

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                        <User size={16} />
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">ลูกค้า</p>

                        <p className="font-medium text-[#2A1B12]">
                          {order.customer?.username || "ไม่พบชื่อลูกค้า"}
                        </p>
                      </div>
                    </div>

                    {/* ORDER ROUND */}

                    {order.orderRound && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                          <Clock3 size={16} />
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            รอบการสั่งอาหาร
                          </p>

                          <p className="font-medium text-[#2A1B12]">
                            รอบ {order.orderRound.roundNumber}
                            {" · "}
                            {order.orderRound.startTime}-
                            {order.orderRound.endTime}
                            {" น."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ============================== 
                      MENU 
                  ============================== */}

                  <div className="mt-5 pt-4 border-t border-dashed border-orange-100">
                    {items.length === 0 ? (
                      <p className="text-sm text-gray-400">ไม่พบรายการอาหาร</p>
                    ) : (
                      items.slice(0, 3).map((item, index) => {
                        const menu = item.menu;

                        const options = parseOptions(item.options);

                        const count = Number(item.quantity ?? item.count ?? 1);

                        return (
                          <div key={item.id || index} className="py-2">
                            <div className="flex justify-between gap-4 text-sm">
                              <p className="font-semibold text-[#2A1B12]">
                                {menu?.menuItem || "ไม่พบชื่อเมนู"}

                                <span className="text-orange-500">
                                  {" "}
                                  x{count}
                                </span>
                              </p>

                              <span className="font-bold whitespace-nowrap">
                                ฿{(Number(item.price || 0) * count).toFixed(2)}
                              </span>
                            </div>

                            {/* OPTIONS */}

                            {options.slice(0, 2).map((option, optionIndex) => (
                              <p
                                key={option.id || optionIndex}
                                className="text-xs text-gray-500 mt-1"
                              >
                                +{" "}
                                {option.choiceName || option.name || "ตัวเลือก"}
                              </p>
                            ))}
                          </div>
                        );
                      })
                    )}

                    {/* MORE ITEMS */}

                    {items.length > 3 && (
                      <p className="text-xs text-gray-400 mt-2">
                        และอีก {items.length - 3} รายการ
                      </p>
                    )}
                  </div>

                  {/* ============================== 
                      FOOTER 
                  ============================== */}

                  <div className="mt-4 pt-4 border-t border-orange-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">ยอดรวม</p>

                      <p className="text-xl font-bold text-[#2A1B12]">
                        ฿{Number(order.totalPrice || 0)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-orange-500 text-sm font-semibold">
                      ดูรายละเอียด
                      <ChevronRight size={18} />
                    </div>
                  </div>

                  {/* ============================== 
    ACTION 
============================== */}

                  {(order.status === "PENDING" ||
                    order.status === "PREPARING" ||
                    (order.status === "WAITING_PAYMENT" &&
                      order.payment?.status === "SLIP_UPLOADED")) && (
                    <div
                      className="mt-4 pt-4 border-t border-orange-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-3">
                        {/* ================================== 
          PENDING 
          ยืนยันออเดอร์ / ยกเลิก 
      ================================== */}

                        {order.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCancelStoreOrder(order.id)}
                              className=" 
              flex-1 
              py-3 
              rounded-2xl 
              border 
              border-red-200 
              bg-white 
              hover:bg-red-50 
              text-red-600 
              font-bold 
              transition 
            "
                            >
                              ยกเลิกออเดอร์
                            </button>

                            <button
                              type="button"
                              onClick={() => handleConfirmOrder(order.id)}
                              className=" 
              flex-1 
              py-3 
              rounded-2xl 
              bg-orange-500 
              hover:bg-orange-600 
              text-white 
              font-bold 
              transition 
            "
                            >
                              ยืนยันออเดอร์
                            </button>
                          </>
                        )}

                        {/* ================================== 
          WAITING_PAYMENT 
          ลูกค้าแนบสลิปแล้ว 
          ยืนยันเงิน + เริ่มทำอาหาร 
      ================================== */}

                        {order.status === "WAITING_PAYMENT" &&
                          order.payment?.status === "SLIP_UPLOADED" && (
                            <button
                              type="button"
                              onClick={() => handleStartCooking(order)}
                              className=" 
              w-full 
              py-3 
              rounded-2xl 
              bg-green-600 
              hover:bg-green-700 
              text-white 
              font-bold 
              transition 
              shadow-sm 
            "
                            >
                              เริ่มทำอาหาร
                            </button>
                          )}

                        {/* ================================== 
          PREPARING 
          ทำอาหารเสร็จ -> READY 
      ================================== */}

                        {order.status === "PREPARING" && (
                          <button
                            type="button"
                            onClick={() => handleReadyOrder(order.id)}
                            className=" 
            w-full 
            py-3 
            rounded-2xl 
            bg-blue-600 
            hover:bg-blue-700 
            text-white 
            font-bold 
            transition 
            shadow-sm 
          "
                          >
                            ทำอาหารเสร็จ
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreOrders;
