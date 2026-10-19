import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import {
  ArrowLeft,
  Clock3,
  User,
  Bike,
  Store as StoreIcon,
  Receipt,
  Banknote,
  StickyNote,
  Hourglass,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  X,
  MapPin,
  Image as ImageIcon,
  Phone,
  MessageCircle,
  Store,
} from "lucide-react";

import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";

import {
  changeStatusOrder,
  changeStatusPayment,
  readOrder,
  cancelStoreOrder,
} from "../../api/StoreOrder";

const STATUS_META = {
  PENDING: {
    label: "รอร้านยืนยัน",
    icon: Hourglass,
    bg: "#FFF3D6",
    fg: "#B8860B",
  },

  WAITING_PAYMENT: {
    label: "รอชำระเงิน",
    icon: Banknote,
    bg: "#FEF3C7",
    fg: "#D97706",
  },

  CONFIRMED: {
    label: "ยืนยันแล้ว",
    icon: CheckCircle2,
    bg: "#DCFCE7",
    fg: "#16A34A",
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
    label: "ออเดอร์สำเร็จ",
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

const DELIVERY_META = {
  DELIVERY: {
    label: "จัดส่งถึงที่อยู่",
    icon: Bike,
  },

  PICKUP: {
    label: "รับหน้าร้าน",
    icon: StoreIcon,
  },
};

const ACTION_META = {
  PENDING: {
    label: "ยืนยันออเดอร์",
    cls: "confirm",
  },

  WAITING_PAYMENT: {
    label: "รอลูกค้าชำระเงิน",
    cls: "waiting",
  },

  CONFIRMED: {
    label: "เริ่มทำอาหาร",
    cls: "cook",
  },

  PREPARING: {
    label: "ทำอาหารเสร็จ",
    cls: "done",
  },

  READY: {
    label: "อาหารพร้อมแล้ว",
    cls: "ready",
  },

  COMPLETED: {
    label: "ออเดอร์สำเร็จ",
    cls: "disabled",
  },

  CANCELLED: {
    label: "ออเดอร์ถูกยกเลิก",
    cls: "disabled",
  },
};

const StoreOrderDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const token = usefoodDelivery((state) => state.token);

  const [order, setOrder] = useState(location.state?.order || null);

  const [loading, setLoading] = useState(true);

  const [previewSlip, setPreviewSlip] = useState(null);

  const [paymentLoading, setPaymentLoading] = useState(false);

  const [orderLoading, setOrderLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30 * 1000);

    return () => clearInterval(timer);
  }, []);

  // =====================================================
  // LOAD ORDER
  // =====================================================

  useEffect(() => {
    const loadOrder = async () => {
      if (!token || !id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await readOrder(token, id);


        setOrder(res.data);
      } catch (error) {
        console.log("โหลดรายละเอียดออเดอร์ไม่สำเร็จ =", error);

        await Swal.fire({
          icon: "error",
          title: "ไม่สามารถโหลดรายละเอียดออเดอร์ได้",
          text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
          confirmButtonColor: "#f97316",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [token, id]);

  // =====================================================
  // REFRESH ORDER
  // ดึงข้อมูลล่าสุดจาก Backend หลังเปลี่ยนสถานะ
  // =====================================================

  const refreshOrder = async () => {
    if (!token || !id) {
      return;
    }

    try {
      const res = await readOrder(token, id);


      setOrder(res.data);
    } catch (error) {
      console.log("Refresh order error =", error);
    }
  };

  // =====================================================
  // PARSE OPTIONS
  // =====================================================

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

  // =====================================================
  // CONFIRM PAYMENT
  // =====================================================

  const handleConfirmPayment = async () => {
    if (!order) {
      return;
    }

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
        title: "ไม่สามารถยืนยันการชำระเงินได้",
        text: "ลูกค้ายังไม่ได้อัปโหลดสลิป",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "เริ่มทำอาหาร",
      text: `ต้องเริ่มทำอาหารของออเดอร์ #ORD${String(order.id).padStart(
        4,
        "0",
      )} หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: "ยืนยันเริ่มทำอาหาร",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#9CA3AF",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setPaymentLoading(true);

      const res = await changeStatusPayment(token, paymentId, "CONFIRMED");


      // =====================================================
      // ดึงข้อมูลล่าสุดจาก Backend
      // =====================================================

      await refreshOrder();

      await Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "ยืนยันเริ่มทำอาหารแล้ว",
        confirmButtonColor: "#f97316",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log("ยืนยันเริ่มทำอาหารไม่สำเร็จ =", error);

      await Swal.fire({
        icon: "error",
        title: "ดำเนินการไม่สำเร็จ",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // =====================================================
  // CHANGE ORDER STATUS
  // =====================================================

  const handleChangeStatus = async () => {
    if (!order) {
      return;
    }

    let nextStatus = "";

    // PENDING -> WAITING_PAYMENT
    if (order.status === "PENDING") {
      nextStatus = "WAITING_PAYMENT";
    }

    // PREPARING -> READY
    else if (order.status === "PREPARING") {
      nextStatus = "READY";
    } else {
      return;
    }

    const statusText = {
      WAITING_PAYMENT: "ยืนยันออเดอร์",
      READY: "ทำอาหารเสร็จ",
    };

    const descriptionText = {
      WAITING_PAYMENT: "เมื่อตกลงแล้ว ลูกค้าจะสามารถชำระเงินและส่งสลิปได้",

      READY: "ต้องการเปลี่ยนสถานะเป็นทำอาหารเสร็จแล้วหรือไม่?",
    };

    const result = await Swal.fire({
      icon: "question",

      title: statusText[nextStatus],

      text:
        descriptionText[nextStatus] ||
        `ต้องการเปลี่ยนสถานะออเดอร์ #ORD${String(order.id).padStart(
          4,
          "0",
        )} หรือไม่?`,

      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#9CA3AF",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setOrderLoading(true);

      const res = await changeStatusOrder(token, order.id, nextStatus);


      // =====================================================
      // สำคัญ
      // ดึงข้อมูล Order ล่าสุดจาก Backend
      // =====================================================

      await refreshOrder();

      await Swal.fire({
        icon: "success",

        title: "สำเร็จ",

        text:
          nextStatus === "WAITING_PAYMENT"
            ? "ยืนยันออเดอร์แล้ว รอลูกค้าชำระเงิน"
            : "เปลี่ยนสถานะเป็นอาหารพร้อมแล้ว",

        confirmButtonColor: "#f97316",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log("เปลี่ยนสถานะออเดอร์ไม่สำเร็จ =", error);

      await Swal.fire({
        icon: "error",
        title: "เปลี่ยนสถานะไม่สำเร็จ",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setOrderLoading(false);
    }
  };

  // =====================================================
  // CANCEL ORDER
  // =====================================================

  const handleCancelOrder = async () => {
    if (!order) {
      return;
    }

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

    try {
      setCancelLoading(true);

      await cancelStoreOrder(token, order.id);

      await refreshOrder();

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
    } finally {
      setCancelLoading(false);
    }
  };

  // =====================================================
  // LOADING ORDER
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] px-4 py-6">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100" />
            <div>
              <div className="h-5 w-40 rounded bg-orange-100" />
              <div className="mt-2 h-3 w-24 rounded bg-orange-50" />
            </div>
          </div>

          <div className="rounded-3xl border border-orange-50 bg-white p-5 shadow-sm">
            <div className="h-4 w-24 rounded bg-orange-100" />
            <div className="mt-3 h-6 w-48 rounded bg-orange-100" />
            <div className="mt-5 h-16 rounded-xl bg-orange-50" />
          </div>

          <div className="mt-4 rounded-3xl border border-orange-50 bg-white p-5 shadow-sm">
            <div className="h-5 w-36 rounded bg-orange-100" />
            <div className="mt-5 h-12 rounded-xl bg-orange-50" />
            <div className="mt-3 h-12 rounded-xl bg-orange-50" />
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // NO ORDER
  // =====================================================

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">ไม่พบออเดอร์</h2>

          <p className="text-gray-500 mt-2">ไม่พบข้อมูลออเดอร์นี้</p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              mt-5
              px-5
              py-3
              rounded-xl
              bg-orange-500
              text-white
              font-semibold
            "
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  const orderCreatedAt = order.createdAt
    ? new Date(order.createdAt).getTime()
    : null;

  const isUnfinishedOrder =
    order.status !== "COMPLETED" && order.status !== "CANCELLED";

  const isOrderOverOneHour =
    orderCreatedAt !== null &&
    Number.isFinite(orderCreatedAt) &&
    currentTime - orderCreatedAt >= 60 * 60 * 1000;

  const showOrderTimeWarning = isUnfinishedOrder && isOrderOverOneHour;

  // =====================================================
  // STATUS
  // =====================================================

  const statusMeta = STATUS_META[order.status] || {
    label: order.status || "ไม่ทราบสถานะ",
    icon: Hourglass,
    bg: "#F3F4F6",
    fg: "#6B7280",
  };

  const StatusIcon = statusMeta.icon;

  // =====================================================
  // DELIVERY
  // =====================================================

  const deliveryMeta = DELIVERY_META[order.deliveryType] || {
    label: order.deliveryType || "ไม่ระบุ",
    icon: StoreIcon,
  };

  const DeliveryIcon = deliveryMeta.icon;

  // =====================================================
  // PAYMENT
  // =====================================================

  const paymentStatus = order.payment?.status || null;

  const paymentId = order.payment?.id || null;

  const paymentStatusMeta = {
    PENDING: {
      label: "รอชำระเงิน",
      bg: "#FFF3D6",
      fg: "#B8860B",
    },

    SLIP_UPLOADED: {
      label: "รอตรวจสอบสลิป",
      bg: "#DBEAFE",
      fg: "#2563EB",
    },

    CONFIRMED: {
      label: "ชำระเงินแล้ว",
      bg: "#DCFCE7",
      fg: "#16A34A",
    },

    REJECTED: {
      label: "สลิปถูกปฏิเสธ",
      bg: "#FEE2E2",
      fg: "#DC2626",
    },
  };

  const currentPaymentMeta = paymentStatusMeta[paymentStatus] || {
    label: paymentStatus || "ไม่ทราบสถานะ",
    bg: "#F3F4F6",
    fg: "#6B7280",
  };

  // =====================================================
  // ACTION
  // =====================================================

  const action = ACTION_META[order.status];

  // =====================================================
  // ITEMS
  // =====================================================

  const items = Array.isArray(order.menu) ? order.menu : [];

  // =====================================================
  // ADDRESS
  // =====================================================

  const defaultAddress =
    order.delivery?.address ||
    order.address ||
    order.customer?.addresses?.find((address) => address.isDefault) ||
    order.customer?.addresses?.[0];

  // =====================================================
  // PAYMENT SLIP
  // =====================================================

  const slipUrl =
    paymentStatus === "SLIP_UPLOADED" || paymentStatus === "CONFIRMED"
      ? order.payment?.slipImageUrl || null
      : null;

  // =====================================================
  // SHOW PAYMENT
  // =====================================================

  const showPaymentSection =
    order.status !== "PENDING" && order.status !== "CANCELLED";

  // =====================================================
  // ADD DELIVERY TIME
  // =====================================================

  const addMinutesToTime = (time, minutes) => {
    if (!time) {
      return "-";
    }

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

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFCF7] via-[#FFF3E4] to-[#FFF8F0] pb-10">
      {/* HEADER */}

      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              w-10
              h-10
              rounded-full
              bg-orange-50
              text-orange-500
              flex
              items-center
              justify-center
              hover:bg-orange-100
            "
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="font-bold text-lg">รายละเอียดออเดอร์</h1>

            <p className="text-xs text-gray-400">
              #ORD
              {String(order.id).padStart(4, "0")}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-4">
        {/* ORDER STATUS */}

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">สถานะออเดอร์</p>

              <h2 className="text-xl font-bold mt-1">
                ออเดอร์ #ORD
                {String(order.id).padStart(4, "0")}
              </h2>
            </div>

            <span
              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                rounded-full
                text-sm
                font-bold
                whitespace-nowrap
              "
              style={{
                background: statusMeta.bg,
                color: statusMeta.fg,
              }}
            >
              <StatusIcon size={17} />
              {statusMeta.label}
            </span>
          </div>
        </div>

        {showOrderTimeWarning && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-orange-300 bg-orange-50 p-4 text-orange-800 shadow-sm">
            <Clock3 size={24} className="mt-0.5 shrink-0 text-orange-600" />

            <div>
              <p className="font-bold">
                ออเดอร์นี้ใช้เวลานานกว่า 1 ชั่วโมงแล้ว
              </p>

              <p className="mt-1 text-sm leading-relaxed">
                {order.status === "PENDING"
                  ? "กรุณารีบยืนยันออเดอร์ เพื่อให้ลูกค้าสามารถชำระเงินต่อได้"
                  : order.status === "WAITING_PAYMENT" &&
                      (!order.payment || order.payment.status === "PENDING")
                    ? "ลูกค้ายังไม่ได้ชำระเงิน กรุณาติดต่อสอบถามลูกค้าเกี่ยวกับการชำระเงิน"
                    : "ออเดอร์นี้ยังไม่เสร็จสิ้น กรุณาตรวจสอบคำสั่งซื้อและดำเนินการต่อ"}
              </p>

              <p className="mt-1 text-xs text-orange-700">
                สร้างออเดอร์เมื่อ
                {new Date(order.createdAt).toLocaleString("th-TH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
CHAT DELIVERY
===================================================== */}

        {order.delivery?.id &&
          order.status !== "CANCELLED" &&
          order.delivery.status !== "COMPLETED" && (
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
              {" "}
              <div className="flex items-center gap-3">
                {" "}
                <div
                  className="
         w-11
         h-11
         rounded-xl
         bg-orange-100
         text-orange-500
         flex
         items-center
         justify-center
         shrink-0
       "
                >
                  {" "}
                  <MessageCircle size={21} />{" "}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">ติดตามออเดอร์</p>

                  <h2 className="font-bold text-lg">
                    {order.status === "CANCELLED" ||
                    order.delivery.status === "COMPLETED"
                      ? "ประวัติการแชท"
                      : "การติดต่อสำหรับอเดอร์"}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {order.status === "CANCELLED" ||
                    order.delivery.status === "COMPLETED"
                      ? "ดูประวัติการสนทนาเดิมได้ แต่ไม่สามารถส่งข้อความใหม่"
                      : "สามารถติดต่อกับลูกค้าได้"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate(`/store/DeliveryChat/${order.delivery.id}`)
                }
                className="
      w-full
      mt-4
      flex
      items-center
      justify-center
      gap-2
      rounded-xl
      bg-orange-500
      hover:bg-orange-600
      text-white
      py-3
      font-bold
      transition
    "
              >
                <MessageCircle size={19} />
                ติดต่อลูกค้า
              </button>
            </div>
          )}

        {/* CUSTOMER / DELIVERY */}

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50">
          <h3 className="font-bold text-lg mb-4">ข้อมูลการรับออเดอร์</h3>

          <div className="space-y-4">
            {/* CUSTOMER */}

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <User size={19} />
              </div>

              <div>
                <p className="text-xs text-gray-400">ลูกค้า</p>

                <p className="font-semibold">
                  {order.customer?.username || "ไม่พบชื่อลูกค้า"}
                </p>
              </div>
            </div>

            {/* PHONE */}

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                <Phone size={19} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">เบอร์โทรศัพท์</p>

                {order.customer?.phone ? (
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {order.customer.phone}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 mt-0.5">
                    ไม่พบเบอร์โทรศัพท์
                  </p>
                )}
              </div>

              {order.customer?.phone && (
                <a
                  href={`tel:${order.customer.phone}`}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2.5
                    rounded-xl
                    bg-orange-500
                    text-white
                    text-sm
                    font-semibold
                    shadow-sm
                    hover:bg-orange-600
                    active:scale-95
                    transition-all
                    shrink-0
                  "
                >
                  <Phone size={16} />
                  โทร
                </a>
              )}
            </div>

            {/* STORE */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                <Store size={19} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">ร้านอาหาร</p>
                <p className="font-semibold text-red-600">
                  ต้องส่งภายใน{" "}
                  {order.orderRound
                    ? addMinutesToTime(order.orderRound.endTime, 20)
                    : new Date(
                        new Date(order.createdAt).getTime() + 60 * 60 * 1000,
                      ).toLocaleTimeString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Bangkok",
                      })}
                  {" น."}
                </p>
              </div>
            </div>

            {/* ORDER ROUND */}

            {order.orderRound && (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Clock3 size={19} />
                </div>

                <div>
                  <p className="text-xs text-gray-400">รอบรับออเดอร์</p>

                  <p className="font-semibold">
                    รอบ {order.orderRound.roundNumber}
                    {" · "}
                    {order.orderRound.startTime}
                    {" - "}
                    {order.orderRound.endTime}
                    {" น."}
                  </p>

                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    ต้องส่งภายใน{" "}
                    {addMinutesToTime(order.orderRound.endTime, 20)}
                    {" น."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOD ITEMS */}

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50">
          <h3 className="font-bold text-lg mb-4">รายการอาหาร</h3>

          {items.length === 0 ? (
            <p className="text-sm text-gray-400">ไม่พบรายการอาหาร</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const menu = item.menu || {};

                const options = parseOptions(item.options);

                const count = Number(item.count || 1);

                const price = Number(item.price || 0);

                const itemTotal = price * count;

                return (
                  <div
                    key={item.id || index}
                    className="
                      py-3
                      border-b
                      border-dashed
                      border-orange-100
                      last:border-0
                    "
                  >
                    <div className="flex gap-3">
                      <div
                        className="
                          w-20
                          h-20
                          rounded-xl
                          overflow-hidden
                          bg-gray-100
                          shrink-0
                        "
                      >
                        {menu.images?.[0]?.url ? (
                          <img
                            src={menu.images[0].url}
                            alt={menu.menuItem || "รูปเมนู"}
                            className="
                              w-full
                              h-full
                              object-cover
                            "
                          />
                        ) : (
                          <div
                            className="
                              w-full
                              h-full
                              flex
                              items-center
                              justify-center
                              text-gray-400
                            "
                          >
                            <ImageIcon size={25} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-4">
                          <div>
                            <p className="font-bold">
                              {menu.menuItem || "ไม่พบชื่อเมนู"}

                              <span className="ml-1 text-orange-500">
                                x{count}
                              </span>
                            </p>

                            <p className="text-sm text-gray-400 mt-1">
                              ฿{price.toFixed(2)} / ชิ้น
                            </p>
                          </div>

                          <p className="font-bold whitespace-nowrap">
                            ฿{itemTotal.toFixed(2)}
                          </p>
                        </div>

                        {options.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {options.map((option, optionIndex) => {
                              const optionLabel =
                                typeof option === "object"
                                  ? option.optionLabel || option.name
                                  : null;

                              const choiceName =
                                typeof option === "object"
                                  ? option.choiceName
                                  : option;

                              const extraPrice =
                                typeof option === "object"
                                  ? Number(option.extraPrice || 0)
                                  : 0;

                              return (
                                <p
                                  key={optionIndex}
                                  className="text-xs text-gray-500"
                                >
                                  + {optionLabel && `${optionLabel}: `}
                                  {choiceName || "ตัวเลือก"}
                                  {extraPrice > 0 && (
                                    <span className="text-orange-500 ml-1">
                                      (+฿
                                      {extraPrice.toFixed(2)})
                                    </span>
                                  )}
                                </p>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NOTE */}

        {order.note && (
          <div className="bg-[#FFF8F0] border-l-4 border-orange-500 rounded-2xl p-4 flex gap-3">
            <StickyNote size={19} className="text-orange-500 shrink-0" />

            <div>
              <p className="font-bold text-sm">หมายเหตุจากลูกค้า</p>

              <p className="text-sm text-gray-600 mt-1">{order.note}</p>
            </div>
          </div>
        )}

        {/* DELIVERY ADDRESS */}

        {order.deliveryType === "DELIVERY" && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <MapPin size={21} />
              </div>

              <div className="flex-1">
                <p className="font-bold text-lg">ที่อยู่จัดส่ง</p>

                {defaultAddress ? (
                  <div className="mt-2">
                    {defaultAddress.label && (
                      <p className="font-semibold">{defaultAddress.label}</p>
                    )}

                    <p className="text-sm text-gray-600 leading-relaxed mt-1">
                      {defaultAddress.address ||
                        defaultAddress.addressText ||
                        "ไม่พบรายละเอียดที่อยู่"}
                    </p>

                    {defaultAddress.lat != null &&
                      defaultAddress.lng != null && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-orange-100">
                          <iframe
                            title="แผนที่ที่อยู่จัดส่ง"
                            src={`https://www.google.com/maps?q=${defaultAddress.lat},${defaultAddress.lng}&output=embed`}
                            width="100%"
                            height="280"
                            style={{
                              border: 0,
                            }}
                            loading="lazy"
                            allowFullScreen
                          />
                        </div>
                      )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mt-2">
                    ไม่พบที่อยู่จัดส่งของลูกค้า
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TOTAL */}

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <Banknote size={21} />
              </div>

              <div>
                <p className="text-sm text-gray-500">ยอดรวมทั้งหมด</p>
                <p className="text-xs text-gray-400">รวมค่าอาหารและค่าจัดส่ง</p>
              </div>
            </div>

            <p className="text-2xl font-bold text-orange-500">
              ฿{Number(order.totalPrice || 0).toFixed(2)}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
            {/* ค่าอาหาร */}
            <div className="flex justify-between">
              <span className="text-gray-500">ค่าอาหาร</span>

              <span className="font-medium">
                ฿
                {(
                  Number(order.totalPrice || 0) -
                  Number(order.store?.deliveryFee || 0)
                ).toFixed(2)}
              </span>
            </div>

            {/* ค่าจัดส่ง */}
            <div className="flex justify-between">
              <span className="text-gray-500">ค่าจัดส่ง</span>

              <span className="font-medium">
                ฿{Number(order.store?.deliveryFee || 0).toFixed(2)}
              </span>
            </div>

            {/* ยอดรวม */}
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="font-bold text-[#2A1B12]">ยอดรวม</span>

              <span className="font-bold text-orange-500">
                ฿{Number(order.totalPrice || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* PAYMENT */}

        {showPaymentSection && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Receipt size={21} />
                </div>

                <div>
                  <h3 className="font-bold text-lg">การชำระเงิน</h3>

                  <p className="text-xs text-gray-400">
                    ตรวจสอบสถานะและสลิปการโอน
                  </p>
                </div>
              </div>

              {paymentStatus && (
                <span
                  className="
                    px-3
                    py-1.5
                    rounded-full
                    text-xs
                    font-bold
                    whitespace-nowrap
                  "
                  style={{
                    background: currentPaymentMeta.bg,
                    color: currentPaymentMeta.fg,
                  }}
                >
                  {currentPaymentMeta.label}
                </span>
              )}
            </div>

            {!order.payment ? (
              <div
                className="
                  bg-gray-50
                  rounded-2xl
                  p-6
                  text-center
                  text-sm
                  text-gray-400
                "
              >
                <Receipt size={32} className="mx-auto mb-3 text-gray-300" />
                ไม่พบข้อมูลการชำระเงิน
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      สถานะการชำระเงิน
                    </span>

                    <span
                      className="font-bold"
                      style={{
                        color: currentPaymentMeta.fg,
                      }}
                    >
                      {currentPaymentMeta.label}
                    </span>
                  </div>

                  {order.payment.confirmedAt && (
                    <div className="mt-2 text-xs text-gray-400">
                      ยืนยันเมื่อ{" "}
                      {new Date(order.payment.confirmedAt).toLocaleString(
                        "th-TH",
                      )}
                    </div>
                  )}

                  {order.payment.rejectedReason && (
                    <div className="mt-2 text-sm text-red-500">
                      เหตุผลที่ปฏิเสธ: {order.payment.rejectedReason}
                    </div>
                  )}
                </div>

                {/* SLIP */}

                {slipUrl ? (
                  <>
                    <p className="text-sm font-semibold mb-3">สลิปการโอน</p>

                    <img
                      src={slipUrl}
                      alt="สลิปการโอนเงิน"
                      onClick={() => setPreviewSlip(slipUrl)}
                      className="
                        w-48
                        sm:w-56
                        h-auto
                        mx-auto
                        rounded-2xl
                        border
                        border-orange-100
                        cursor-pointer
                        hover:opacity-90
                        transition
                        object-contain
                      "
                    />

                    <p className="text-xs text-gray-400 text-center mt-2">
                      กดที่รูปเพื่อดูขนาดเต็ม
                    </p>
                  </>
                ) : (
                  <div
                    className="
                      bg-gray-50
                      rounded-2xl
                      p-8
                      text-center
                      text-sm
                      text-gray-400
                    "
                  >
                    <Receipt size={32} className="mx-auto mb-3 text-gray-300" />

                    {paymentStatus === "PENDING"
                      ? "ลูกค้ายังไม่ได้อัปโหลดสลิป"
                      : "ยังไม่มีสลิปการโอน"}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ACTION BUTTON */}

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="bg-white border border-orange-100 shadow-sm rounded-3xl p-4">
          {/* =====================================================
    CANCEL ORDER
    PENDING -> CANCELLED
   ===================================================== */}

          {order.status === "PENDING" && (
            <button
              type="button"
              disabled={cancelLoading || orderLoading}
              onClick={handleCancelOrder}
              className="
      w-full
      py-4
      mb-3
      rounded-xl
      font-bold
      border
      border-red-200
      bg-white
      hover:bg-red-50
      text-red-600
      active:scale-[0.98]
      transition
      disabled:bg-gray-100
      disabled:text-gray-400
      disabled:cursor-not-allowed
    "
            >
              {cancelLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="
        w-5 h-5
        border-2
        border-red-300
        border-t-red-600
        rounded-full
        animate-spin
      "
                  />
                  กำลังยกเลิก...
                </span>
              ) : (
                "ยกเลิกออเดอร์"
              )}
            </button>
          )}

          {/* =====================================================
              ยืนยันการชำระเงิน + เริ่มทำอาหาร
             ===================================================== */}

          {paymentStatus === "SLIP_UPLOADED" && (
            <button
              type="button"
              disabled={paymentLoading || !paymentId}
              onClick={handleConfirmPayment}
              className="
                w-full
                py-4
                rounded-xl
                font-bold
                bg-green-600
                hover:bg-green-700
                active:scale-[0.98]
                text-white
                transition
                disabled:bg-gray-300
                disabled:text-gray-500
                disabled:cursor-not-allowed
              "
            >
              {paymentLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="
                      w-5
                      h-5
                      border-2
                      border-white/40
                      border-t-white
                      rounded-full
                      animate-spin
                    "
                  />
                  กำลังเริ่มทำอาหาร...
                </span>
              ) : (
                "เริ่มทำอาหาร"
              )}
            </button>
          )}

          {/* =====================================================
              ORDER ACTION

              PENDING -> WAITING_PAYMENT
              PREPARING -> READY
             ===================================================== */}

          {paymentStatus !== "SLIP_UPLOADED" && action && (
            <button
              type="button"
              disabled={
                action.cls === "disabled" ||
                action.cls === "waiting" ||
                orderLoading ||
                cancelLoading
              }
              onClick={handleChangeStatus}
              className={`
                  w-full
                  py-4
                  rounded-xl
                  font-bold
                  transition-all
                  duration-200

                  ${
                    action.cls === "confirm"
                      ? "bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white shadow-sm"
                      : ""
                  }

                  ${
                    action.cls === "waiting"
                      ? "bg-yellow-100 text-yellow-700 cursor-not-allowed"
                      : ""
                  }

                  ${
                    action.cls === "cook"
                      ? "bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white shadow-sm"
                      : ""
                  }

                  ${
                    action.cls === "done"
                      ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-sm"
                      : ""
                  }

                  ${
                    action.cls === "ready"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : ""
                  }

                  ${
                    action.cls === "disabled"
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : ""
                  }

                  ${orderLoading ? "opacity-70 cursor-wait" : ""}
                `}
            >
              {orderLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="
                        w-5
                        h-5
                        border-2
                        border-white/40
                        border-t-white
                        rounded-full
                        animate-spin
                      "
                  />
                  กำลังดำเนินการ...
                </span>
              ) : (
                action.label
              )}
            </button>
          )}
        </div>
      </div>

      {/* SLIP PREVIEW */}

      {previewSlip && (
        <div
          className="
            fixed
            inset-0
            z-50
            bg-black/80
            flex
            items-center
            justify-center
            p-4
          "
          onClick={() => setPreviewSlip(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewSlip(null)}
            className="
              absolute
              top-5
              right-5
              w-11
              h-11
              rounded-full
              bg-white
              flex
              items-center
              justify-center
              shadow-lg
            "
          >
            <X size={22} />
          </button>

          <img
            src={previewSlip}
            alt="สลิปการโอนเงิน"
            onClick={(e) => e.stopPropagation()}
            className="
              max-w-full
              max-h-[85vh]
              rounded-2xl
              shadow-2xl
            "
          />
        </div>
      )}
    </div>
  );
};

export default StoreOrderDetail;
