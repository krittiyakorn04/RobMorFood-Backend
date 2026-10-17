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
  RefreshCw,
  Trash2,
  MessageCircle,
} from "lucide-react";

import Swal from "sweetalert2";
import Resizer from "react-image-file-resizer";

import {
  getDeliveryDetailStaff,
  startDelivery,
  markDelivered,
} from "../../api/createStore";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { uploadRiderProof, deleteRiderProof } from "../../api/StoreOrder";

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

    default:
      return {
        label: "รอดำเนินการ",
        className: "bg-orange-100 text-orange-600",
      };
  }
};

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
    } catch {
      return [];
    }
  }

  return [];
};

const addMinutesToTime = (time, minutes) => {
  if (!time) return "-";

  const [hour, minute] = String(time).slice(0, 5).split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "-";
  }

  const total = hour * 60 + minute + minutes;

  const finalHour = Math.floor(total / 60) % 24;
  const finalMinute = total % 60;

  return `${String(finalHour).padStart(2, "0")}:${String(finalMinute).padStart(
    2,
    "0",
  )}`;
};

const DeliveryRiderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const token = usefoodDelivery((state) => state.token);
  const user = usefoodDelivery((state) => state.user);

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [proofUploading, setProofUploading] = useState(false);

  const [proofFiles, setProofFiles] = useState({
    PRIMARY: null,
    ADDITIONAL: null,
  });

  const [proofPreviews, setProofPreviews] = useState({
    PRIMARY: null,
    ADDITIONAL: null,
  });

  const loadDelivery = async () => {
    if (!token || !id) return;

    try {
      setLoading(true);

      const res = await getDeliveryDetailStaff(token, id);

      const data = res?.data?.delivery || res?.data || null;

      setDelivery(data);
    } catch (error) {
      console.error("โหลดงาน Rider ไม่สำเร็จ =", error);

      setDelivery(null);

      await Swal.fire({
        icon: "error",
        title: "ไม่พบงานจัดส่ง",
        text:
          error?.response?.data?.message ||
          "ไม่สามารถโหลดรายละเอียดงานจัดส่งได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDelivery();
  }, [token, id]);

  const resizeProofImage = (file) => {
    return new Promise((resolve, reject) => {
      Resizer.default.imageFileResizer(
        file,
        1200,
        1200,
        "JPEG",
        90,
        0,
        (result) => resolve(result),
        "base64",
      );
    });
  };

  const handleProofChange = (type, event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกรูปภาพ",
        confirmButtonText: "ตกลง",
      });

      event.target.value = "";
      return;
    }

    const preview = URL.createObjectURL(file);

    setProofFiles((prev) => ({
      ...prev,
      [type]: file,
    }));

    setProofPreviews((prev) => ({
      ...prev,
      [type]: preview,
    }));

    event.target.value = "";
  };

  const handleRemovePreview = (type) => {
    const preview = proofPreviews[type];

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setProofFiles((prev) => ({
      ...prev,
      [type]: null,
    }));

    setProofPreviews((prev) => ({
      ...prev,
      [type]: null,
    }));
  };

  const handleUploadProofs = async () => {
    if (!delivery) return false;

    if (!proofFiles.PRIMARY && !proofFiles.ADDITIONAL) {
      await Swal.fire({
        icon: "info",
        title: "ยังไม่ได้เลือกรูป",
        text: "กรุณาเลือกรูปหลักฐานก่อนบันทึก",
        confirmButtonText: "ตกลง",
      });

      return false;
    }

    try {
      setProofUploading(true);

      if (proofFiles.PRIMARY) {
        const image = await resizeProofImage(proofFiles.PRIMARY);

        await uploadRiderProof(token, delivery.id, image, "PRIMARY");
      }

      if (proofFiles.ADDITIONAL) {
        const image = await resizeProofImage(proofFiles.ADDITIONAL);

        await uploadRiderProof(token, delivery.id, image, "ADDITIONAL");
      }

      setProofFiles({
        PRIMARY: null,
        ADDITIONAL: null,
      });

      setProofPreviews({
        PRIMARY: null,
        ADDITIONAL: null,
      });

      await Swal.fire({
        icon: "success",
        title: "บันทึกหลักฐานสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });

      await loadDelivery();

      return true;
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "อัปโหลดหลักฐานไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          "ไม่สามารถบันทึกหลักฐานการจัดส่งได้",
        confirmButtonText: "ตกลง",
      });

      return false;
    } finally {
      setProofUploading(false);
    }
  };

  const handleDeleteProof = async (image) => {
    if (!image?.id || !delivery?.id) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "ลบรูปหลักฐาน?",
      text:
        image.proofType === "PRIMARY"
          ? "ถ้าลบรูปหลักฐานหลัก จะไม่สามารถกดจัดส่งสำเร็จได้"
          : "รูปหลักฐานนี้จะถูกลบออก",
      showCancelButton: true,
      confirmButtonText: "ลบรูป",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#E8491D",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setProofUploading(true);

      await deleteRiderProof(token, delivery.id, image.id);

      await Swal.fire({
        icon: "success",
        title: "ลบรูปสำเร็จ",
        timer: 1200,
        showConfirmButton: false,
      });

      await loadDelivery();
    } catch (error) {
      console.error("ลบหลักฐานไม่สำเร็จ =", error);

      Swal.fire({
        icon: "error",
        title: "ลบรูปไม่สำเร็จ",
        text: error?.response?.data?.message || "เกิดข้อผิดพลาดในการลบรูป",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setProofUploading(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!delivery) return;

    const result = await Swal.fire({
      icon: "question",
      title: "เริ่มจัดส่ง?",
      text: "สถานะงานจะเปลี่ยนเป็นกำลังจัดส่ง",
      showCancelButton: true,
      confirmButtonText: "เริ่มจัดส่ง",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#2563eb",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setProcessing(true);

      await startDelivery(token, delivery.id);

      await Swal.fire({
        icon: "success",
        title: "เริ่มจัดส่งแล้ว",
        timer: 1200,
        showConfirmButton: false,
      });

      await loadDelivery();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "เริ่มจัดส่งไม่สำเร็จ",
        text: error?.response?.data?.message || "ไม่สามารถเริ่มจัดส่งได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!delivery) return;

    const primaryProof = delivery?.images?.find(
      (image) => image?.proofType === "PRIMARY",
    );

    const hasPrimaryProof = Boolean(
      primaryProof?.secure_url || primaryProof?.url,
    );

    if (!hasPrimaryProof) {
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่มีหลักฐานการจัดส่ง",
        text: "กรุณาอัปโหลดรูปหลักฐานการส่งก่อน",
        confirmButtonText: "ตกลง",
      });

      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "จัดส่งสำเร็จ?",
      text: "ยืนยันว่าอาหารถึงลูกค้าแล้ว",
      showCancelButton: true,
      confirmButtonText: "ยืนยันจัดส่งสำเร็จ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#16a34a",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setProcessing(true);

      await markDelivered(token, delivery.id);

      await Swal.fire({
        icon: "success",
        title: "จัดส่งสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });

      await loadDelivery();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "ปิดงานไม่สำเร็จ",
        text: error?.response?.data?.message || "ไม่สามารถปิดงานจัดส่งได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(proofPreviews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [proofPreviews]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50/40">
        {" "}
        <div className="text-center">
          {" "}
          <RefreshCw
            size={40}
            className="mx-auto mb-4 animate-spin text-orange-500"
          />
          <p className="text-gray-500">กำลังโหลดรายละเอียดงานจัดส่ง...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50/40 px-4">
        {" "}
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          {" "}
          <X size={40} className="mx-auto mb-4 text-red-500" />
          <h2 className="mb-2 text-xl font-bold">ไม่พบงานจัดส่ง</h2>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  const isMyJob = Number(delivery.deliveryStaffId) === Number(user?.id);

  if (!isMyJob) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50/40 px-4">
        {" "}
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          {" "}
          <Bike size={40} className="mx-auto mb-4 text-red-500" />
          <h2 className="mb-2 text-xl font-bold">งานนี้ไม่ใช่งานของคุณ</h2>
          <p className="mb-6 text-gray-500">คุณไม่มีสิทธิ์จัดการงานจัดส่งนี้</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white"
          >
            กลับ
          </button>
        </div>
      </div>
    );
  }

  const orders = Array.isArray(delivery.orders) ? delivery.orders : [];

  const statusMeta = STATUS_META[delivery.status] || STATUS_META.PENDING;

  const StatusIcon = statusMeta.icon;

  const primaryProof = delivery.images?.find(
    (image) => image?.proofType === "PRIMARY",
  );

  const additionalProof = delivery.images?.find(
    (image) => image?.proofType === "ADDITIONAL",
  );

  const primaryProofUrl = primaryProof?.secure_url || primaryProof?.url || null;

  const additionalProofUrl =
    additionalProof?.secure_url || additionalProof?.url || null;

  const hasPrimaryProof = Boolean(primaryProofUrl);

  return (
    <div className="min-h-screen bg-orange-50/40 pb-12">
      <div className="sticky top-0 z-20 border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-800">
              รายละเอียดงานจัดส่ง
            </h1>

            <p className="text-sm text-gray-500">
              งานส่ง #ORD
              {String(delivery.id).padStart(4, "0")}
            </p>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${statusMeta.className}`}
          >
            <StatusIcon size={16} />

            <span className="hidden sm:inline">{statusMeta.label}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {delivery.orderRound && (
          <div className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Clock3 className="text-orange-600" />

              <div>
                <h2 className="font-bold">ข้อมูลรอบจัดส่ง</h2>

                <p className="text-xs text-gray-500">รอบของงานจัดส่งนี้</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-xs text-gray-400">รอบที่</p>

                <p className="font-bold">{delivery.orderRound.roundNumber}</p>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-xs text-gray-400">เวลาเริ่ม</p>

                <p className="font-bold">
                  {delivery.orderRound.startTime || "-"} น.
                </p>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-xs text-gray-400">เวลาสิ้นสุด</p>

                <p className="font-bold">
                  {delivery.orderRound.endTime || "-"} น.
                </p>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-xs text-gray-400">ส่งภายใน</p>

                <p className="font-bold text-orange-600">
                  {addMinutesToTime(delivery.orderRound.endTime, 20)} น.
                </p>
              </div>
            </div>
          </div>
        )}

        {orders.map((order, index) => {
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

          const lat = address?.lat ?? address?.latitude ?? null;

          const lng = address?.lng ?? address?.longitude ?? null;

          const hasCoordinates = lat !== null && lng !== null;

          const items = Array.isArray(order?.menu) ? order.menu : [];

          const payment = order?.payment || null;

          const paymentMeta = getPaymentStatus(payment?.status);

          const orderMeta = getOrderStatus(order?.status);

          const openGoogleMaps = () => {
            if (hasCoordinates) {
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
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

          return (
            <div key={order?.id || index}>
              <div className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Receipt className="text-orange-500" />

                    <div>
                      <p className="text-xs text-gray-500">ออเดอร์</p>

                      <p className="font-bold text-orange-500">
                        #ORD
                        {String(order.id).padStart(4, "0")}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${orderMeta.className}`}
                  >
                    {orderMeta.label}
                  </span>
                </div>
              </div>

              {/* =====================================================
DELIVERY CHAT
===================================================== */}

              <div className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      delivery.status === "COMPLETED"
                        ? "bg-gray-100 text-gray-500"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    <MessageCircle size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-800">
                      {delivery.status === "COMPLETED"
                        ? "ประวัติการแชท"
                        : "แชทการจัดส่ง"}
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      {delivery.status === "COMPLETED"
                        ? "ดูประวัติการสนทนาเดิมได้ แต่ไม่สามารถส่งข้อความใหม่"
                        : "ห้องแชทเดียวกันระหว่างร้านค้า ลูกค้า และพนักงานส่งอาหาร"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/store/DeliveryStaffChat/${delivery.id}`, {
                      state: {
                        readOnly: delivery.status === "COMPLETED",
                        deliveryStatus: delivery.status,
                      },
                    })
                  }
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold transition ${
                    delivery.status === "COMPLETED"
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  <MessageCircle size={19} />

                  {delivery.status === "COMPLETED"
                    ? "ดูประวัติแชท"
                    : "เปิดแชทการจัดส่ง"}
                </button>
              </div>

              <div className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <User className="text-orange-600" />

                  <div>
                    <h2 className="font-bold">ข้อมูลลูกค้า</h2>

                    <p className="text-xs text-gray-500">ผู้รับอาหาร</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <User className="text-gray-400" size={18} />

                  <div>
                    <p className="text-xs text-gray-400">ชื่อลูกค้า</p>

                    <p className="font-semibold">{customerName}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <Phone className="text-gray-400" size={18} />

                  <div className="flex-1">
                    <p className="text-xs text-gray-400">เบอร์โทรศัพท์</p>

                    {customerPhone ? (
                      <a
                        href={`tel:${customerPhone}`}
                        className="font-semibold"
                      >
                        {customerPhone}
                      </a>
                    ) : (
                      <p className="text-gray-400">ไม่พบเบอร์โทรศัพท์</p>
                    )}
                  </div>

                  {customerPhone && (
                    <a
                      href={`tel:${customerPhone}`}
                      className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 text-gray-400" size={18} />

                  <div>
                    <p className="text-xs text-gray-400">ที่อยู่จัดส่ง</p>

                    {address?.label && (
                      <p className="font-semibold">{address.label}</p>
                    )}

                    <p className="leading-relaxed">{customerAddress}</p>
                  </div>
                </div>

                {hasCoordinates ? (
                  <div className="mt-5">
                    <iframe
                      title={`ตำแหน่งจัดส่ง ${order.id}`}
                      width="100%"
                      height="280"
                      loading="lazy"
                      className="rounded-2xl border"
                      src={`https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                    />

                    <button
                      type="button"
                      onClick={openGoogleMaps}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-50 py-3 font-semibold text-orange-600"
                    >
                      <Navigation size={16} />
                      เปิดเส้นทาง
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <UtensilsCrossed className="text-orange-600" />

                  <div>
                    <h2 className="font-bold">รายการอาหาร</h2>

                    <p className="text-xs text-gray-500">รายการของออเดอร์นี้</p>
                  </div>
                </div>

                {items.length > 0 ? (
                  <div className="divide-y">
                    {items.map((item, itemIndex) => {
                      const menu = item?.menu || {};

                      const options = parseOptions(item?.options);

                      const quantity = Number(
                        item?.quantity ?? item?.count ?? 1,
                      );

                      const price = Number(item?.price || 0);

                      const image = menu?.images?.find(
                        (item) => item?.secure_url || item?.url,
                      );

                      const imageUrl = image?.secure_url || image?.url || null;

                      return (
                        <div
                          key={item?.id || itemIndex}
                          className="flex items-center gap-3 py-3"
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={menu?.menuItem}
                              className="h-20 w-20 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
                              <UtensilsCrossed />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">
                              {menu?.menuItem || "ไม่พบชื่อเมนู"}

                              <span className="ml-1 text-orange-500">
                                x{quantity}
                              </span>
                            </p>

                            {options.length > 0 && (
                              <div className="mt-1">
                                {options.map((option, optionIndex) => (
                                  <p
                                    key={option?.id || optionIndex}
                                    className="text-xs text-gray-500"
                                  >
                                    +
                                    {option?.choiceName ||
                                      option?.name ||
                                      option?.optionName ||
                                      "ตัวเลือก"}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          <p className="font-bold">
                            ฿{(price * quantity).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-gray-400">
                    ไม่พบรายการอาหาร
                  </p>
                )}
              </div>

              {order.note && (
                <div className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <StickyNote className="text-yellow-600" />

                    <h2 className="font-bold">หมายเหตุจากลูกค้า</h2>
                  </div>

                  <div className="rounded-2xl bg-yellow-50 p-4">
                    {order.note}
                  </div>
                </div>
              )}

              {payment && (
                <div className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <Banknote className="text-green-600" />

                    <h2 className="font-bold">การชำระเงิน</h2>
                  </div>

                  <div className="mb-4 flex justify-between">
                    <span className="text-gray-500">สถานะ</span>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${paymentMeta.className}`}
                    >
                      {paymentMeta.label}
                    </span>
                  </div>

                  {payment.slipImageUrl && (
                    <img
                      src={payment.slipImageUrl}
                      alt="สลิป"
                      className="mx-auto max-h-[500px] w-full max-w-md rounded-2xl object-contain"
                    />
                  )}
                </div>
              )}

              <div className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Banknote className="text-green-600" />

                  <div>
                    <h2 className="font-bold">ยอดรวมออเดอร์</h2>
                    <p className="text-xs text-gray-500">
                      ยอดที่ลูกค้าต้องชำระทั้งหมด
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="font-semibold text-gray-700">ยอดรวม</span>

                  <span className="text-2xl font-bold text-orange-500">
                    ฿{Number(order.totalPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* =====================================================
        RIDER PROOF
    ===================================================== */}

        <div className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <ImageIcon className="text-orange-600" />

            <div>
              <h2 className="font-bold">หลักฐานการจัดส่ง</h2>

              <p className="text-xs text-gray-500">
                ต้องมีรูปหลักฐานหลักก่อนปิดงาน
              </p>
            </div>
          </div>

          {/* PRIMARY */}

          <div className="mb-6">
            <p className="mb-2 font-semibold">
              รูปหลักฐานการส่ง
              <span className="ml-1 text-red-500">*</span>
            </p>

            {proofPreviews.PRIMARY ? (
              <div className="relative mx-auto max-w-md">
                <img
                  src={proofPreviews.PRIMARY}
                  alt="Preview"
                  className="max-h-[500px] w-full rounded-2xl object-contain"
                />

                <button
                  type="button"
                  onClick={() => handleRemovePreview("PRIMARY")}
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={18} />
                </button>
              </div>
            ) : primaryProofUrl ? (
              <div className="mx-auto max-w-md">
                <img
                  src={primaryProofUrl}
                  alt="หลักฐานการส่ง"
                  className="max-h-[500px] w-full rounded-2xl object-contain"
                />

                <button
                  type="button"
                  onClick={() => handleDeleteProof(primaryProof)}
                  disabled={proofUploading || delivery.status === "COMPLETED"}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 size={17} />
                  ลบรูปหลักฐาน
                </button>
              </div>
            ) : (
              <label className="flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40">
                <Upload size={40} className="text-orange-400" />

                <p className="mt-3 font-semibold">เพิ่มรูปหลักฐานการส่ง</p>

                <p className="text-xs text-gray-400">รูปอาหาร ณ จุดส่ง</p>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={proofUploading || delivery.status === "COMPLETED"}
                  onChange={(event) => handleProofChange("PRIMARY", event)}
                />
              </label>
            )}

            {(primaryProofUrl || proofPreviews.PRIMARY) && (
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-50 py-3 font-semibold text-orange-600">
                <Upload size={17} />
                เปลี่ยนรูปหลักฐาน
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={proofUploading || delivery.status === "COMPLETED"}
                  onChange={(event) => handleProofChange("PRIMARY", event)}
                />
              </label>
            )}
          </div>

          {/* ADDITIONAL */}

          <div>
            <p className="font-semibold">
              รูปหลักฐานเพิ่มเติม
              <span className="ml-2 text-xs font-normal text-gray-400">
                (ไม่บังคับ)
              </span>
            </p>

            <p className="mb-2 text-xs text-gray-400">
              เช่น จุดฝากอาหาร โต๊ะรับอาหาร หรือสถานที่ส่ง
            </p>

            {proofPreviews.ADDITIONAL ? (
              <div className="relative mx-auto max-w-md">
                <img
                  src={proofPreviews.ADDITIONAL}
                  alt="Preview"
                  className="max-h-[500px] w-full rounded-2xl object-contain"
                />

                <button
                  type="button"
                  onClick={() => handleRemovePreview("ADDITIONAL")}
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={18} />
                </button>
              </div>
            ) : additionalProofUrl ? (
              <div className="mx-auto max-w-md">
                <img
                  src={additionalProofUrl}
                  alt="หลักฐานเพิ่มเติม"
                  className="max-h-[500px] w-full rounded-2xl object-contain"
                />

                <button
                  type="button"
                  onClick={() => handleDeleteProof(additionalProof)}
                  disabled={proofUploading || delivery.status === "COMPLETED"}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 size={17} />
                  ลบรูปเพิ่มเติม
                </button>
              </div>
            ) : (
              <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                <Upload size={34} className="text-gray-400" />

                <p className="mt-2 font-semibold">เพิ่มรูปเพิ่มเติม</p>

                <p className="text-xs text-gray-400">ไม่บังคับ</p>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={proofUploading || delivery.status === "COMPLETED"}
                  onChange={(event) => handleProofChange("ADDITIONAL", event)}
                />
              </label>
            )}

            {(additionalProofUrl || proofPreviews.ADDITIONAL) && (
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 font-semibold text-gray-600">
                <Upload size={17} />
                เปลี่ยนรูปเพิ่มเติม
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={proofUploading || delivery.status === "COMPLETED"}
                  onChange={(event) => handleProofChange("ADDITIONAL", event)}
                />
              </label>
            )}
          </div>

          {(proofFiles.PRIMARY || proofFiles.ADDITIONAL) && (
            <button
              type="button"
              onClick={handleUploadProofs}
              disabled={proofUploading || delivery.status === "COMPLETED"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 font-bold text-white disabled:opacity-50"
            >
              {proofUploading ? (
                <>
                  <RefreshCw size={19} className="animate-spin" />
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

          {!hasPrimaryProof && delivery.status === "DELIVERING" && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              กรุณาเพิ่มรูปหลักฐานการส่งก่อนกดจัดส่งสำเร็จ
            </div>
          )}
        </div>

        {/* =====================================================
        DELIVERY STATUS
    ===================================================== */}

        <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Truck className="text-orange-600" />

            <div>
              <h2 className="font-bold">สถานะการจัดส่ง</h2>

              <p className="text-xs text-gray-500">จัดการสถานะงานนี้</p>
            </div>
          </div>

          <div className={`rounded-2xl p-4 ${statusMeta.className}`}>
            <div className="flex items-center gap-3">
              <StatusIcon size={24} />

              <div>
                <p className="font-bold">{statusMeta.label}</p>

                <p className="text-xs">
                  {delivery.status === "PENDING" && "พร้อมนำอาหารไปจัดส่ง"}

                  {delivery.status === "DELIVERING" &&
                    "กำลังนำอาหารไปส่งให้ลูกค้า"}

                  {delivery.status === "COMPLETED" &&
                    "งานจัดส่งนี้เสร็จสิ้นแล้ว"}
                </p>
              </div>
            </div>
          </div>

          {delivery.status === "PENDING" && (
            <button
              type="button"
              onClick={handleStartDelivery}
              disabled={processing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-bold text-white disabled:opacity-50"
            >
              {processing ? (
                <>
                  <RefreshCw size={19} className="animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <Bike size={19} />
                  เริ่มจัดส่ง
                </>
              )}
            </button>
          )}

          {delivery.status === "DELIVERING" && (
            <button
              type="button"
              onClick={handleCompleteDelivery}
              disabled={processing || !hasPrimaryProof}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 font-bold text-white disabled:opacity-50"
            >
              {processing ? (
                <>
                  <RefreshCw size={19} className="animate-spin" />
                  กำลังปิดงาน...
                </>
              ) : (
                <>
                  <CheckCircle2 size={19} />
                  จัดส่งสำเร็จ
                </>
              )}
            </button>
          )}

          {delivery.status === "COMPLETED" && (
            <div className="mt-4 rounded-2xl bg-green-50 py-3.5 text-center font-semibold text-green-700">
              งานนี้เสร็จสิ้นแล้ว
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryRiderDetail;
