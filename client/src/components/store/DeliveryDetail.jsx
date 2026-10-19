import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Navigation,
  UtensilsCrossed,
  Receipt,
  StickyNote,
  CheckCircle2,
  Truck,
  Bike,
  X,
  Banknote,
  Clock3,
  Upload,
  Image as ImageIcon,
  MessageCircle,
} from "lucide-react";

import Swal from "sweetalert2";
import Resizer from "react-image-file-resizer";

import {
  getDeliveryDetail,
  changeStatusDelivery,
  uploadDeliveryProof,
} from "../../api/StoreOrder";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { assignDeliveryStaff } from "../../api/createStore";

// ======================================================
// DELIVERY STATUS
// ======================================================

const STATUS_META = {
  PENDING: {
    label: "พร้อมจัดส่ง",
    className: "bg-orange-100 text-orange-600",
    icon: Clock3,
  },

  DELIVERING: {
    label: "กำลังจัดส่ง",
    className: "bg-blue-100 text-blue-600",
    icon: Truck,
  },

  COMPLETED: {
    label: "จัดส่งสำเร็จ",
    className: "bg-green-100 text-green-600",
    icon: CheckCircle2,
  },
};

// ======================================================
// DELIVERY ACTION
// ======================================================

const ACTION_META = {
  PENDING: {
    label: "เริ่มจัดส่ง",
    nextStatus: "DELIVERING",
    icon: Bike,
  },

  DELIVERING: {
    label: "ส่งถึงลูกค้าแล้ว",
    nextStatus: "COMPLETED",
    icon: CheckCircle2,
  },
};

// ======================================================
// PARSE OPTIONS
// ======================================================

const parseOptions = (options) => {
  if (!options) return [];

  if (Array.isArray(options)) {
    return options;
  }

  if (typeof options === "object") {
    return [options];
  }

  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      if (parsed && typeof parsed === "object") {
        return [parsed];
      }

      return [];
    } catch (error) {
      console.log("parseOptions error =", error);
      return [];
    }
  }

  return [];
};

// ======================================================
// PAYMENT STATUS
// ======================================================

const getPaymentStatus = (status) => {
  switch (status) {
    case "CONFIRMED":
      return {
        label: "ชำระเงินแล้ว",
        className: "bg-green-100 text-green-600",
      };

    case "SLIP_UPLOADED":
      return {
        label: "ส่งสลิปแล้ว",
        className: "bg-blue-100 text-blue-600",
      };

    case "REJECTED":
      return {
        label: "ชำระเงินไม่ผ่าน",
        className: "bg-red-100 text-red-600",
      };

    default:
      return {
        label: "รอตรวจสอบ",
        className: "bg-orange-100 text-orange-600",
      };
  }
};

// ======================================================
// ORDER STATUS
// ======================================================

const getOrderStatus = (status) => {
  switch (status) {
    case "COMPLETED":
      return {
        label: "เสร็จสิ้น",
        className: "bg-green-100 text-green-600",
      };

    case "CANCELLED":
      return {
        label: "ยกเลิก",
        className: "bg-red-100 text-red-600",
      };

    case "PREPARING":
      return {
        label: "กำลังเตรียมอาหาร",
        className: "bg-blue-100 text-blue-600",
      };

    case "READY":
      return {
        label: "พร้อมจัดส่ง",
        className: "bg-orange-100 text-orange-600",
      };

    case "CONFIRMED":
      return {
        label: "ร้านยืนยันแล้ว",
        className: "bg-green-100 text-green-600",
      };

    case "WAITING_PAYMENT":
      return {
        label: "รอชำระเงิน",
        className: "bg-yellow-100 text-yellow-600",
      };

    case "PENDING":
    default:
      return {
        label: "รอดำเนินการ",
        className: "bg-orange-100 text-orange-600",
      };
  }
};

// ======================================================
// COMPONENT
// ======================================================

const DeliveryDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const token = usefoodDelivery((state) => state.token);

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [proofFiles, setProofFiles] = useState({
    PRIMARY: null,
    ADDITIONAL: null,
  });

  const [proofPreviews, setProofPreviews] = useState({
    PRIMARY: null,
    ADDITIONAL: null,
  });

  const [proofUploading, setProofUploading] = useState(false);

  // ====================================================
  // LOAD DELIVERY
  // ====================================================

  useEffect(() => {
    if (!token || !id) return;

    loadDelivery();
  }, [token, id]);

  // ====================================================
  // LOAD DELIVERY
  // ====================================================

  const loadDelivery = async () => {
    try {
      setLoading(true);

      const res = await getDeliveryDetail(token, id);

      setDelivery(res.data);

      setSelectedStaffId(
        res.data?.deliveryStaffId ? String(res.data.deliveryStaffId) : "",
      );
    } catch (error) {
      console.error("โหลดรายละเอียดการจัดส่งไม่สำเร็จ =", error);

      setDelivery(null);

      await Swal.fire({
        icon: "error",
        title: "ไม่พบข้อมูล",
        text:
          error?.response?.data?.message ||
          "ไม่สามารถโหลดรายละเอียดการจัดส่งได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setLoading(false);
    }
  };

  const resizeProofImage = (file) => {
    return new Promise((resolve, reject) => {
      try {
        Resizer.default.imageFileResizer(
          file,
          1200,
          1200,
          "JPEG",
          90,
          0,
          (data) => {
            resolve(data);
          },
          "base64",
        );
      } catch (error) {
        reject(error);
      }
    });
  };

  // ====================================================
  // CHANGE DELIVERY STATUS
  // ====================================================

  const handleChangeStatus = async () => {
    if (!delivery) return;

    const action = ACTION_META[delivery.status];

    if (!action) return;

    const nextStatusLabel =
      STATUS_META[action.nextStatus]?.label || action.nextStatus;

    const result = await Swal.fire({
      icon: "question",
      title: action.label,
      text: `ต้องการเปลี่ยนสถานะเป็น "${nextStatusLabel}" หรือไม่`,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f97316",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setUpdating(true);

      await changeStatusDelivery(token, delivery.id, action.nextStatus);

      await Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text:
          action.nextStatus === "COMPLETED"
            ? "จัดส่งอาหารสำเร็จและปิดออเดอร์แล้ว"
            : "เปลี่ยนสถานะการจัดส่งเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });

      await loadDelivery();
    } catch (error) {
      console.error("เปลี่ยนสถานะการจัดส่งไม่สำเร็จ =", error);

      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text:
          error?.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะการจัดส่งได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setUpdating(false);
    }
  };

  // ====================================================
  // PROOF CHANGE
  // ====================================================

  const handleProofChange = async (proofType, event) => {
    const input = event.target;
    const file = input.files?.[0];

    // เลือกไฟล์เดิมซ้ำได้
    input.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกรูปภาพ",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    if (!delivery || proofUploading) return;

    // สร้างตัวอย่างรูปเท่านั้น ยังไม่อัปโหลด
    const preview = URL.createObjectURL(file);

    setProofFiles((prev) => ({
      ...prev,
      [proofType]: file,
    }));

    setProofPreviews((prev) => ({
      ...prev,
      [proofType]: preview,
    }));
  };

  // ====================================================
  // REMOVE PREVIEW
  // ====================================================

  const handleRemoveProofPreview = (proofType) => {
    setProofFiles((prev) => ({
      ...prev,
      [proofType]: null,
    }));

    setProofPreviews((prev) => ({
      ...prev,
      [proofType]: null,
    }));
  };

  useEffect(() => {
    return () => {
      Object.values(proofPreviews).forEach((preview) => {
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [proofPreviews]);

  // ====================================================
  // CURRENT PROOF
  // ====================================================

  const primaryProof = delivery?.images?.find(
    (image) => image.proofType === "PRIMARY",
  );

  const additionalProof = delivery?.images?.find(
    (image) => image.proofType === "ADDITIONAL",
  );

  const primaryProofUrl = primaryProof?.secure_url || primaryProof?.url || null;

  const additionalProofUrl =
    additionalProof?.secure_url || additionalProof?.url || null;

  const hasPrimaryProof = Boolean(primaryProofUrl);

  // ====================================================
  // UPLOAD PROOF
  // ====================================================

  const handleUploadProofs = async () => {
    if (!delivery) return;

    if (!proofFiles.PRIMARY && !primaryProofUrl) {
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่มีรูปหลักฐานการส่ง",
        text: "กรุณาเลือกรูปหลักฐานการส่งอย่างน้อย 1 รูป",
        confirmButtonColor: "#f97316",
      });

      return false;
    }

    if (!proofFiles.PRIMARY && !proofFiles.ADDITIONAL) {
      await Swal.fire({
        icon: "info",
        title: "ยังไม่ได้เลือกรูปใหม่",
        text: "กรุณาเลือกรูปภาพที่ต้องการบันทึก",
        confirmButtonColor: "#f97316",
      });

      return false;
    }

    try {
      setProofUploading(true);

      // ================================================
      // PRIMARY
      // ================================================

      if (proofFiles.PRIMARY) {
        const primaryImage = await resizeProofImage(proofFiles.PRIMARY);

        await uploadDeliveryProof(token, delivery.id, primaryImage, "PRIMARY");
      }

      // ================================================
      // ADDITIONAL
      // ================================================

      if (proofFiles.ADDITIONAL) {
        const additionalImage = await resizeProofImage(proofFiles.ADDITIONAL);

        await uploadDeliveryProof(
          token,
          delivery.id,
          additionalImage,
          "ADDITIONAL",
        );
      }

      // ================================================
      // SUCCESS
      // ================================================
      await loadDelivery();
      
      await Swal.fire({
        icon: "success",
        title: "บันทึกหลักฐานสำเร็จ",
        text: "บันทึกรูปหลักฐานการจัดส่งเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });

      setProofFiles({
        PRIMARY: null,
        ADDITIONAL: null,
      });

      setProofPreviews({
        PRIMARY: null,
        ADDITIONAL: null,
      });

      return true;
    } catch (error) {
      console.error("Upload Delivery Proof Error =", error);

      await Swal.fire({
        icon: "error",
        title: "อัปโหลดหลักฐานไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          "ไม่สามารถบันทึกหลักฐานการจัดส่งได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return false;
    } finally {
      setProofUploading(false);
    }
  };

  // ====================================================
  // ASSIGN DELIVERY STAFF
  // ====================================================

  const handleAssignDeliveryStaff = async () => {
    if (!delivery) return;

    const staff =
      delivery.deliveryStaffs?.find(
        (item) => String(item.id) === String(selectedStaffId),
      ) || null;

    const result = await Swal.fire({
      icon: "question",
      title: staff ? "มอบหมายคนส่ง?" : "ให้ร้านส่งเอง?",
      text: staff
        ? `ต้องการมอบหมาย Delivery นี้ให้ "${staff.name}" หรือไม่`
        : "Delivery นี้จะไม่มีพนักงานรับผิดชอบ และร้านจะเป็นผู้จัดส่งเอง",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f97316",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setAssigning(true);

      await assignDeliveryStaff(token, delivery.id, selectedStaffId || null);

      await Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: staff
          ? `มอบหมายงานให้ ${staff.name} แล้ว`
          : "ตั้งค่าให้ร้านเป็นผู้จัดส่งแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });

      await loadDelivery();
    } catch (error) {
      console.error("กำหนดคนส่งไม่สำเร็จ =", error);

      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error?.response?.data?.message || "ไม่สามารถกำหนดคนส่งได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setAssigning(false);
    }
  };

  // ======================================================
  // LOADING SKELETON
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50/40 p-4 md:p-6 animate-pulse">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 rounded-lg bg-gray-200" />
              <div className="h-3 w-32 rounded-lg bg-gray-200" />
            </div>
          </div>

          {/* สถานะการจัดส่ง */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-orange-100 space-y-4">
            <div className="h-5 w-40 rounded-lg bg-gray-200" />

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded-lg bg-gray-200" />
                <div className="h-3 w-52 max-w-full rounded-lg bg-gray-100" />
              </div>
              <div className="h-8 w-20 rounded-full bg-gray-200" />
            </div>

            <div className="h-2 w-full rounded-full bg-gray-100" />
          </div>

          {/* ข้อมูลออเดอร์ */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-orange-100 space-y-5">
            <div className="h-5 w-36 rounded-lg bg-gray-200" />

            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 w-40 max-w-full rounded-lg bg-gray-200" />
                <div className="h-3 w-28 rounded-lg bg-gray-100" />
                <div className="h-4 w-24 rounded-lg bg-gray-200" />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between gap-4">
                <div className="h-3 w-24 rounded-lg bg-gray-100" />
                <div className="h-3 w-20 rounded-lg bg-gray-200" />
              </div>
              <div className="flex justify-between gap-4">
                <div className="h-3 w-28 rounded-lg bg-gray-100" />
                <div className="h-4 w-24 rounded-lg bg-gray-200" />
              </div>
            </div>
          </div>

          {/* ข้อมูลผู้รับและที่อยู่ */}
          <div className="bg-white rounded-3xl p-5 md:p-6 border border-orange-100 space-y-4">
            <div className="h-5 w-40 rounded-lg bg-gray-200" />
            <div className="h-4 w-48 max-w-full rounded-lg bg-gray-200" />
            <div className="h-3 w-full rounded-lg bg-gray-100" />
            <div className="h-3 w-3/4 rounded-lg bg-gray-100" />
          </div>

          {/* ปุ่มด้านล่าง */}
          <div className="h-12 w-full rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }

  // ====================================================
  // NOT FOUND
  // ====================================================

  if (!delivery) {
    return (
      <div className="min-h-screen bg-orange-50/40 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={30} />
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ไม่พบข้อมูลการจัดส่ง
          </h2>

          <p className="text-gray-500 mb-6">
            ไม่สามารถค้นหารายละเอียดการจัดส่งรายการนี้ได้
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  // ====================================================
  // ORDERS
  // ====================================================

  const orders = Array.isArray(delivery.orders) ? delivery.orders : [];

  const foodTotal = Number(delivery?.foodTotal || 0);
  const deliveryFee = Number(delivery?.deliveryFee || 0);

  // ====================================================
  // DELIVERY STATUS
  // ====================================================

  const statusMeta = STATUS_META[delivery.status] || STATUS_META.PENDING;

  const StatusIcon = statusMeta.icon;

  const action = ACTION_META[delivery.status];

  const ActionIcon = action?.icon;

  // ====================================================
  // ADD MINUTES
  // ====================================================

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

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-orange-50/40 pb-10 mb-10">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="bg-white border-b border-orange-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-gray-800">
              รายละเอียดการจัดส่ง
            </h1>

            <p className="text-sm text-gray-500">
              Delivery #ORD
              {String(delivery.id).padStart(4, "0")}
              {delivery.orderRound?.roundNumber
                ? ` • รอบที่ ${delivery.orderRound.roundNumber}`
                : ""}
            </p>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold ${statusMeta.className}`}
          >
            <StatusIcon size={16} />

            <span className="hidden sm:inline">{statusMeta.label}</span>
          </div>
        </div>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* =================================================
            DELIVERY ROUND
        ================================================= */}

        {delivery.orderRound && (
          <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 md:p-6 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Clock3 size={20} />
              </div>

              <div>
                <h2 className="font-bold text-gray-800">ข้อมูลรอบจัดส่ง</h2>

                <p className="text-xs text-gray-500">
                  รายละเอียดรอบของ Delivery นี้
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-orange-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">รอบที่</p>

                <p className="font-bold text-gray-800">
                  รอบที่ {delivery.orderRound.roundNumber}
                </p>
              </div>

              <div className="bg-orange-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">เวลาเริ่ม</p>

                <p className="font-bold text-gray-800">
                  {delivery.orderRound.startTime || "-"} น.
                </p>
              </div>

              <div className="bg-orange-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">เวลาสิ้นสุด</p>

                <p className="font-bold text-gray-800">
                  {delivery.orderRound.endTime || "-"} น.
                </p>
              </div>

              <div className="bg-orange-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">ส่งภายใน</p>

                <p className="font-bold text-orange-600">
                  {addMinutesToTime(delivery.orderRound.endTime, 20)} น.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            ORDERS
        ================================================= */}

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8 text-center mb-5">
            <Receipt size={40} className="mx-auto text-gray-300 mb-3" />

            <p className="text-gray-500">ไม่พบออเดอร์ในรอบจัดส่งนี้</p>
          </div>
        ) : (
          orders.map((order, orderIndex) => {
            // ==============================================
            // CUSTOMER
            // ==============================================

            const customer = order?.customer || null;

            const addresses = Array.isArray(customer?.addresses)
              ? customer.addresses
              : [];

            const address =
              addresses.find((item) => item?.isDefault === true) ||
              addresses[0] ||
              null;

            const customerName = customer?.username || "ไม่พบชื่อลูกค้า";

            const customerPhone = customer?.phone || "";

            const customerAddress =
              address?.address || customer?.address || "ไม่พบที่อยู่";

            const customerLat = address?.lat ?? address?.latitude ?? null;

            const customerLng = address?.lng ?? address?.longitude ?? null;

            // ==============================================
            // ORDER
            // ==============================================

            const orderId = order?.id;

            const orderNote = order?.note || "";

            const items = Array.isArray(order?.menu) ? order.menu : [];

            // ==============================================
            // PAYMENT
            // ==============================================

            const payment = order?.payment || null;

            const slipImage = payment?.slipImageUrl || null;

            const paymentMeta = getPaymentStatus(payment?.status);

            // ==============================================
            // MAP
            // ==============================================

            const hasCoordinates =
              customerLat !== null &&
              customerLat !== undefined &&
              customerLng !== null &&
              customerLng !== undefined;

            const openGoogleMaps = () => {
              if (hasCoordinates) {
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${customerLat},${customerLng}`,
                  "_blank",
                );

                return;
              }

              if (customerAddress) {
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    customerAddress,
                  )}`,
                  "_blank",
                );
              }
            };

            const orderStatus = getOrderStatus(order?.status);

            // ==============================================
            // RENDER ORDER
            // ==============================================

            return (
              <div key={order?.id || orderIndex} className="mb-6">
                {/* ========================================
                    ORDER HEADER
                ======================================== */}

                <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 md:p-6 mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                        <Receipt size={21} />
                      </div>

                      <div>
                        <p className="text-x text-gray-500">
                          ออเดอร์{" "}
                          <span className="ml-1 text-orange-500">
                            #ORD
                            {String(order.id).padStart(4, "0")}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${orderStatus.className}`}
                    >
                      {orderStatus.label}
                    </div>
                  </div>
                </div>

                {/* =====================================================
                    CHAT WITH CUSTOMER
                ===================================================== */}

                {delivery?.id && (
                  <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 md:p-6 mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          delivery.status === "COMPLETED" ||
                          order.status === "CANCELLED"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-orange-100 text-orange-500"
                        }`}
                      >
                        <MessageCircle size={21} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400">
                          ออเดอร์ #{String(order.id).padStart(4, "0")}
                        </p>

                        <h2 className="font-bold text-lg text-gray-800">
                          {delivery.status === "COMPLETED" ||
                          order.status === "CANCELLED"
                            ? "ประวัติการแชท"
                            : "ติดตามออเดอร์"}
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                          {delivery.status === "COMPLETED" ||
                          order.status === "CANCELLED"
                            ? "ดูประวัติการสนทนาเดิมได้ แต่ไม่สามารถส่งข้อความใหม่"
                            : "การติดต่อสำหรับออเดอร์"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/store/DeliveryChat/${delivery.id}`, {
                          state: {
                            readOnly:
                              delivery.status === "COMPLETED" ||
                              order.status === "CANCELLED",
                            deliveryStatus: delivery.status,
                            orderStatus: order.status,
                          },
                        })
                      }
                      className={`w-full mt-4 flex items-center justify-center gap-2 rounded-xl py-3 font-bold transition ${
                        delivery.status === "COMPLETED" ||
                        order.status === "CANCELLED"
                          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      }`}
                    >
                      <MessageCircle size={19} />

                      {delivery.status === "COMPLETED" ||
                      order.status === "CANCELLED"
                        ? "ดูประวัติแชท"
                        : "ติดต่อลูกค้า"}
                    </button>
                  </div>
                )}

                {/* ========================================
                    CUSTOMER
                ======================================== */}

                <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 md:p-6 mb-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <User size={20} />
                    </div>

                    <div>
                      <h2 className="font-bold text-gray-800">ข้อมูลลูกค้า</h2>

                      <p className="text-xs text-gray-500">
                        ผู้รับอาหารของออเดอร์{" "}
                        <span className="ml-1 text-orange-500">
                          #ORD
                          {String(order.id).padStart(4, "0")}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* NAME */}

                  <div className="flex items-start gap-3 mb-4">
                    <User size={18} className="text-gray-400 mt-0.5" />

                    <div>
                      <p className="text-xs text-gray-400 mb-1">ชื่อลูกค้า</p>

                      <p className="font-semibold text-gray-800">
                        {customerName}
                      </p>
                    </div>
                  </div>

                  {/* PHONE */}

                  <div className="flex items-center gap-3 mb-4">
                    <Phone size={18} className="text-gray-400" />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-1">
                        เบอร์โทรศัพท์
                      </p>

                      {customerPhone ? (
                        <a
                          href={`tel:${customerPhone}`}
                          className="text-base font-semibold text-gray-800 hover:text-orange-600 transition"
                        >
                          {customerPhone}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400">
                          ไม่พบเบอร์โทรศัพท์
                        </p>
                      )}
                    </div>

                    {customerPhone && (
                      <a
                        href={`tel:${customerPhone}`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold shadow-sm hover:bg-orange-600 active:scale-95 transition-all flex-shrink-0"
                      >
                        <Phone size={16} />

                        <span className="hidden sm:inline">โทรหาลูกค้า</span>
                      </a>
                    )}
                  </div>

                  {/* ADDRESS */}

                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 mt-0.5" />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-1">
                        ที่อยู่จัดส่ง
                      </p>

                      {address?.label && (
                        <p className="font-semibold text-gray-800 mb-1">
                          {address.label}
                        </p>
                      )}

                      <p className="font-medium text-gray-800 leading-relaxed">
                        {customerAddress}
                      </p>
                    </div>
                  </div>

                  {/* MAP */}

                  {hasCoordinates ? (
                    <div className="mt-5">
                      <iframe
                        title={`ตำแหน่งจัดส่งออเดอร์ ${orderId}`}
                        width="100%"
                        height="280"
                        loading="lazy"
                        className="rounded-2xl border border-orange-100"
                        src={`https://www.google.com/maps?q=${customerLat},${customerLng}&z=16&output=embed`}
                      />

                      <button
                        type="button"
                        onClick={openGoogleMaps}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-50 text-orange-600 font-semibold hover:bg-orange-100 transition"
                      >
                        <Navigation size={16} />
                        เปิดเส้นทางใน Google Maps
                      </button>
                    </div>
                  ) : customerAddress ? (
                    <div className="mt-5">
                      <iframe
                        title={`แผนที่ออเดอร์ ${orderId}`}
                        width="100%"
                        height="280"
                        loading="lazy"
                        className="rounded-2xl border border-orange-100"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(
                          customerAddress,
                        )}&z=16&output=embed`}
                      />

                      <button
                        type="button"
                        onClick={openGoogleMaps}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-50 text-orange-600 font-semibold hover:bg-orange-100 transition"
                      >
                        <Navigation size={16} />
                        เปิดเส้นทางใน Google Maps
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* ========================================
                    ORDER ITEMS
                ======================================== */}

                <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 md:p-6 mb-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Receipt size={20} />
                    </div>

                    <div>
                      <h2 className="font-bold text-gray-800">รายการอาหาร</h2>

                      <span className="ml-1 text-orange-500">
                        #ORD
                        {String(order.id).padStart(4, "0")}
                      </span>
                    </div>
                  </div>

                  {items.length > 0 ? (
                    <div className="divide-y divide-orange-50">
                      {items.map((item, index) => {
                        const menu = item?.menu || {};

                        const options = parseOptions(item?.options);

                        const quantity = Number(
                          item?.quantity ?? item?.count ?? 1,
                        );

                        const price = Number(item?.price || 0);

                        const menuImage =
                          menu?.images?.[0]?.url ||
                          menu?.images?.[0]?.secure_url ||
                          null;

                        return (
                          <div
                            key={item?.id || index}
                            className="flex items-center gap-3 py-3"
                          >
                            {menuImage ? (
                              <img
                                src={menuImage}
                                alt={menu?.menuItem || "รูปเมนู"}
                                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                                <UtensilsCrossed size={22} />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800">
                                {menu?.menuItem || "ไม่พบชื่อเมนู"}

                                <span className="text-orange-500 ml-1">
                                  x{quantity}
                                </span>
                              </div>

                              {options.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {options.map((option, optionIndex) => (
                                    <div
                                      key={option?.id || optionIndex}
                                      className="text-xs text-gray-500"
                                    >
                                      +{" "}
                                      {option?.choiceName ||
                                        option?.name ||
                                        option?.optionName ||
                                        "ตัวเลือก"}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="font-bold text-gray-800 whitespace-nowrap">
                              ฿{(price * quantity).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                      ไม่พบรายการอาหาร
                    </div>
                  )}
                </div>

                {/* =================================================
    TOTAL
================================================= */}

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-orange-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                      <Banknote size={21} />
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">สรุปยอดชำระ</p>

                      <p className="text-xs text-gray-400">
                        ค่าอาหารและค่าจัดส่ง
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {/* ค่าอาหาร */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">ค่าอาหาร</span>

                      <span className="font-medium text-gray-800">
                        ฿{foodTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* ค่าจัดส่ง */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">ค่าจัดส่ง</span>

                      <span className="font-medium text-gray-800">
                        ฿{deliveryFee.toFixed(2)}
                      </span>
                    </div>

                    {/* ยอดรวม */}
                    <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                      <span className="font-bold text-gray-700">
                        ยอดรวมทั้งหมด
                      </span>

                      <span className="text-2xl font-bold text-orange-500">
                        ฿{Number(order.totalPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                {/* ========================================
                    NOTE
                ======================================== */}

                {orderNote && (
                  <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 md:p-6 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                        <StickyNote size={19} />
                      </div>

                      <h2 className="font-bold text-gray-800">
                        หมายเหตุจากลูกค้า
                      </h2>
                    </div>

                    <div className="bg-yellow-50 rounded-2xl p-4 text-gray-700 leading-relaxed">
                      {orderNote}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* =================================================
            ASSIGN DELIVERY STAFF
        ================================================= */}

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 md:p-6 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Bike size={20} />
            </div>

            <div>
              <h2 className="font-bold text-gray-800">คนส่งอาหาร</h2>

              <p className="text-xs text-gray-500">
                ร้านสามารถเลือกพนักงานที่จะรับผิดชอบ Delivery นี้
              </p>
            </div>
          </div>

          {/* CURRENT STAFF */}

          {delivery.deliveryStaff ? (
            <div className="mb-4 rounded-2xl bg-green-50 border border-green-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Bike size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-600 mb-1">มอบหมายให้</p>

                  <p className="font-bold text-gray-800">
                    {delivery.deliveryStaff.name}
                  </p>

                  {delivery.deliveryStaff.phone && (
                    <p className="text-sm text-gray-500">
                      {delivery.deliveryStaff.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-2xl bg-orange-50 border border-orange-100 p-4">
              <p className="font-bold text-gray-800">ร้านส่งเอง</p>

              <p className="text-xs text-orange-600 mt-1">
                ไม่มีการมอบหมายพนักงาน
              </p>
            </div>
          )}

          {/* SELECT STAFF */}

          {delivery.status === "PENDING" && (
            <>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ผู้รับผิดชอบการจัดส่ง
              </label>

              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                disabled={assigning}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-gray-800 bg-white outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
              >
                <option value="">ร้านส่งเอง</option>

                {Array.isArray(delivery.deliveryStaffs) &&
                  delivery.deliveryStaffs.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                      {staff.phone ? ` • ${staff.phone}` : ""}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={handleAssignDeliveryStaff}
                disabled={assigning}
                className="mt-3 w-full py-3.5 rounded-2xl bg-orange-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {assigning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : selectedStaffId ? (
                  <>
                    <Bike size={19} />
                    {delivery.deliveryStaff ? "เปลี่ยนคนส่ง" : "มอบหมายคนส่ง"}
                  </>
                ) : (
                  <>
                    <Truck size={19} />
                    {delivery.deliveryStaff
                      ? "เปลี่ยนเป็นร้านส่งเอง"
                      : "ตั้งเป็นร้านส่งเอง"}
                  </>
                )}
              </button>
            </>
          )}

          {delivery.status !== "PENDING" && delivery.deliveryStaff && (
            <div className="mt-3 text-xs text-gray-400">
              Delivery นี้เริ่มดำเนินการแล้ว ไม่สามารถเปลี่ยนคนส่งได้
            </div>
          )}
        </div>

        {/* =================================================
            DELIVERY PROOF
        ================================================= */}

        {delivery.status === "DELIVERING" && (
          <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 md:p-6 mb-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <ImageIcon size={20} />
              </div>

              <div>
                <h2 className="font-bold text-gray-800">หลักฐานการจัดส่ง</h2>

                <p className="text-xs text-gray-500">
                  รูปอาหาร ณ จุดส่งใช้เป็นหลักฐานการจัดส่ง
                </p>
              </div>
            </div>

            {/* ================================================
                PRIMARY
            ================================================= */}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-800">
                    รูปหลักฐานการส่ง
                    <span className="text-red-500 ml-1">*</span>
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    ควรเห็นอาหารและบริเวณจุดส่งอย่างชัดเจน
                  </p>
                </div>

                {primaryProofUrl && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                    มีหลักฐานแล้ว
                  </span>
                )}
              </div>

              {proofPreviews.PRIMARY ? (
                <div className="relative max-w-md mx-auto">
                  <img
                    src={proofPreviews.PRIMARY}
                    alt="Preview หลักฐานการส่ง"
                    className="w-full max-h-[500px] object-contain rounded-2xl border border-orange-100 bg-gray-50"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveProofPreview("PRIMARY")}
                    disabled={proofUploading}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition"
                  >
                    <X size={18} />
                  </button>

                  <div className="mt-2 text-center text-xs text-orange-600">
                    รูปนี้ยังไม่ได้บันทึก
                  </div>
                </div>
              ) : primaryProofUrl ? (
                <div className="max-w-md mx-auto">
                  <img
                    src={primaryProofUrl}
                    alt="หลักฐานการส่ง"
                    className="w-full max-h-[500px] object-contain rounded-2xl border border-orange-100 bg-gray-50"
                  />

                  <div className="mt-3 rounded-xl bg-green-50 border border-green-100 p-3 text-center text-sm text-green-600">
                    บันทึกหลักฐานการส่งเรียบร้อยแล้ว
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="delivery-proof-primary"
                  className="
                    min-h-[250px]
                    border-2
                    border-dashed
                    border-orange-200
                    rounded-2xl
                    bg-orange-50/40
                    flex
                    flex-col
                    items-center
                    justify-center
                    cursor-pointer
                    hover:border-orange-500
                    hover:bg-orange-50
                    transition
                  "
                >
                  <Upload size={40} className="text-orange-400" />

                  <p className="mt-3 font-semibold text-gray-700">
                    เพิ่มรูปหลักฐานการส่ง
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    รูปอาหาร ณ จุดส่ง
                  </p>

                  <input
                    id="delivery-proof-primary"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    disabled={proofUploading}
                    onChange={(event) => handleProofChange("PRIMARY", event)}
                  />
                </label>
              )}
            </div>

            {/* ================================================
                ADDITIONAL
            ================================================= */}

            <div>
              <div className="mb-2">
                <p className="font-semibold text-gray-800">
                  รูปหลักฐานเพิ่มเติม
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    (ไม่บังคับ)
                  </span>
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  เช่น จุดฝากอาหาร โต๊ะรับอาหาร หรือบริเวณสถานที่ส่ง
                </p>
              </div>

              {proofPreviews.ADDITIONAL ? (
                <div className="relative max-w-md mx-auto">
                  <img
                    src={proofPreviews.ADDITIONAL}
                    alt="Preview หลักฐานเพิ่มเติม"
                    className="w-full max-h-[500px] object-contain rounded-2xl border border-orange-100 bg-gray-50"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveProofPreview("ADDITIONAL")}
                    disabled={proofUploading}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition"
                  >
                    <X size={18} />
                  </button>

                  <div className="mt-2 text-center text-xs text-orange-600">
                    รูปนี้ยังไม่ได้บันทึก
                  </div>
                </div>
              ) : additionalProofUrl ? (
                <div className="max-w-md mx-auto">
                  <img
                    src={additionalProofUrl}
                    alt="หลักฐานเพิ่มเติม"
                    className="w-full max-h-[500px] object-contain rounded-2xl border border-orange-100 bg-gray-50"
                  />

                  <div className="mt-3 rounded-xl bg-green-50 border border-green-100 p-3 text-center text-sm text-green-600">
                    บันทึกหลักฐานเพิ่มเติมเรียบร้อยแล้ว
                  </div>
                </div>
              ) : (
                <div className="min-h-[180px] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <label
                    htmlFor="delivery-proof-additional"
                    className="cursor-pointer text-center"
                  >
                    <Upload size={34} className="mx-auto text-gray-400" />

                    <p className="mt-2 text-sm font-semibold text-gray-600">
                      เพิ่มรูปเพิ่มเติม
                    </p>

                    <p className="mt-1 text-xs text-gray-400">ไม่บังคับ</p>

                    <input
                      id="delivery-proof-additional"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      disabled={proofUploading}
                      onChange={(event) =>
                        handleProofChange("ADDITIONAL", event)
                      }
                    />
                  </label>
                </div>
              )}
            </div>

            {/* ================================================
                SAVE
            ================================================= */}

            {(proofFiles.PRIMARY || proofFiles.ADDITIONAL) && (
              <button
                type="button"
                onClick={handleUploadProofs}
                disabled={proofUploading}
                className="
                  mt-6
                  w-full
                  py-3.5
                  rounded-2xl
                  bg-orange-500
                  text-white
                  font-bold
                  flex
                  items-center
                  justify-center
                  gap-2
                  hover:bg-orange-600
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition
                "
              >
                {proofUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังบันทึกหลักฐาน...
                  </>
                ) : (
                  <>
                    <Upload size={19} />
                    บันทึกหลักฐานการจัดส่ง
                  </>
                )}
              </button>
            )}

            {/* ================================================
                REQUIRED MESSAGE
            ================================================= */}

            {!hasPrimaryProof && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                กรุณาเพิ่มรูปหลักฐานการส่งก่อนกดจัดส่งสำเร็จ
              </div>
            )}
          </div>
        )}

        {/* =================================================
            DELIVERY STATUS
        ================================================= */}

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Truck size={20} />
            </div>

            <div>
              <h2 className="font-bold text-gray-800">สถานะการจัดส่ง</h2>

              <p className="text-xs text-gray-500">สถานะของ Delivery นี้</p>
            </div>
          </div>

          {/* CURRENT STATUS */}

          <div
            className={`rounded-2xl p-4 flex items-center gap-3 ${statusMeta.className}`}
          >
            <StatusIcon size={24} />

            <div>
              <p className="font-bold">{statusMeta.label}</p>

              <p className="text-xs opacity-80">
                {delivery.status === "PENDING" && "เตรียมพร้อมสำหรับการจัดส่ง"}

                {delivery.status === "DELIVERING" &&
                  "กำลังนำอาหารไปส่งให้ลูกค้า"}

                {delivery.status === "COMPLETED" &&
                  "จัดส่งอาหารถึงลูกค้าและเสร็จสิ้นแล้ว"}
              </p>
            </div>
          </div>

          {/* DELIVERY ACTION */}

          {delivery.status !== "COMPLETED" && action && (
            <>
              {action.nextStatus === "COMPLETED" && !hasPrimaryProof && (
                <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                  ต้องมีรูปหลักฐานการส่งก่อนจึงจะปิดงานจัดส่งได้
                </div>
              )}

              <button
                type="button"
                onClick={handleChangeStatus}
                disabled={
                  updating ||
                  (action.nextStatus === "COMPLETED" && !hasPrimaryProof)
                }
                className="mt-4 w-full py-3.5 rounded-2xl bg-orange-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {updating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังอัปเดต...
                  </>
                ) : (
                  <>
                    {ActionIcon && <ActionIcon size={19} />}

                    {action.label}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetail;
