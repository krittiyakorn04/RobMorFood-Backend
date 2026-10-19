import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Upload,
  QrCode,
  Image as ImageIcon,
  X,
  Loader2,
  Store,
  Clock,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
} from "lucide-react";

import Swal from "sweetalert2";
import Resizer from "react-image-file-resizer";

import usefoodDelivery from "../../globalState/fooddeliveryStore";

import { uploadSlip, getOrderDetail } from "../../api/UserOrder";
import { getStoreClient } from "../../api/UserProfile";

const UserPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const token = usefoodDelivery((state) => state.token);

  // =========================
  // DATA
  // =========================

  const orderId = location.state?.orderId;
  const storeId = location.state?.storeId;

  // =========================
  // STATE
  // =========================

  const [store, setStore] = useState(null);
  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);

  // รูปสลิปที่ผู้ใช้กำลังเลือก
  const [slip, setSlip] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);

  const [uploading, setUploading] = useState(false);

  // =========================
  // PAYMENT STATUS
  // =========================

  const paymentStatus = order?.payment?.status || "PENDING";

  // =========================
  // PAYMENT STATUS DATA
  // =========================

  const getPaymentStatusData = (status) => {
    switch (status) {
      case "PENDING":
        return {
          label: "รอชำระเงิน",
          description: "กรุณาชำระเงินและอัปโหลดสลิป",
          className: "bg-yellow-50 border-yellow-200",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          textColor: "text-yellow-700",
        };

      case "SLIP_UPLOADED":
        return {
          label: "รอตรวจสอบการชำระเงิน",
          description: "ระบบได้รับหลักฐานการชำระเงินแล้ว กรุณารอร้านตรวจสอบ",
          className: "bg-blue-50 border-blue-200",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          textColor: "text-blue-700",
        };

      case "CONFIRMED":
        return {
          label: "ชำระเงินแล้ว",
          description: "ร้านยืนยันการชำระเงินเรียบร้อยแล้ว",
          className: "bg-green-50 border-green-200",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          textColor: "text-green-700",
        };

      case "REJECTED":
        return {
          label: "สลิปถูกปฏิเสธ",
          description:
            order?.payment?.rejectedReason || "กรุณาตรวจสอบและอัปโหลดสลิปใหม่",
          className: "bg-red-50 border-red-200",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          textColor: "text-red-700",
        };

      default:
        return {
          label: "ไม่ทราบสถานะ",
          description: "",
          className: "bg-gray-50 border-gray-200",
          iconBg: "bg-gray-100",
          iconColor: "text-gray-500",
          textColor: "text-gray-700",
        };
    }
  };

  const paymentStatusData = getPaymentStatusData(paymentStatus);

  // =========================
  // LOAD ORDER
  // =========================

  const loadOrder = async () => {
    if (!token || !orderId) {
      return;
    }

    try {
      const res = await getOrderDetail(token, orderId);

      setOrder(res.data);
    } catch (error) {
      console.log("โหลดข้อมูล Order ไม่สำเร็จ =", error);

      Swal.fire({
        icon: "error",
        title: "ไม่สามารถโหลดข้อมูลออเดอร์ได้",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  useEffect(() => {
    loadOrder();
  }, [token, orderId]);

  // =========================
  // LOAD STORE
  // =========================

  useEffect(() => {
    const loadStore = async () => {
      if (!token || !storeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await getStoreClient(token, storeId);

        setStore(res.data);
      } catch (error) {
        console.log("โหลดข้อมูลร้านไม่สำเร็จ =", error);

        Swal.fire({
          icon: "error",
          title: "ไม่สามารถโหลดข้อมูลร้านได้",
          text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
          confirmButtonColor: "#f97316",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStore();
  }, [token, storeId]);

  // =========================
  // CHECK ORDER
  // =========================

  useEffect(() => {
    if (!orderId || !storeId) {
      Swal.fire({
        icon: "error",
        title: "ไม่พบข้อมูลการชำระเงิน",
        text: "ไม่พบ Order ID หรือ Store ID",
        confirmButtonColor: "#f97316",
      }).then(() => {
        navigate("/user/userDelivery");
      });
    }
  }, [orderId, storeId, navigate]);

  // =========================
  // STORE QR
  // =========================

  const paymentImage =
    store?.images?.find((image) =>
      image.public_id?.startsWith("StoreQR2026"),
    ) || null;

  const paymentImageUrl = paymentImage?.secure_url || paymentImage?.url || null;

  // =========================
  // CURRENT SLIP
  // =========================

  const currentSlipUrl =
    order?.payment?.slipImageUrl ||
    order?.payment?.images?.find((image) =>
      image.public_id?.startsWith("userPayment2026"),
    )?.secure_url ||
    order?.payment?.images?.find((image) =>
      image.public_id?.startsWith("userPayment2026"),
    )?.url ||
    null;

  // =========================
  // ORDER DATA
  // =========================

  const orderItems = Array.isArray(order?.menu) ? order.menu : [];

  // =========================
  // DELIVERY FEE
  // =========================

  // =========================
  // DELIVERY FEE
  // =========================

  const deliveryFee = Number(store?.deliveryFee || 0);

  const totalPrice = Number(order?.totalPrice || 0);

  const foodPrice = Math.max(totalPrice - deliveryFee, 0);

  // =========================
  // CHECK CAN UPLOAD
  // =========================

  /*
    PENDING = สามารถอัปโหลด
    REJECTED = สามารถอัปโหลดใหม่
    SLIP_UPLOADED = ไม่สามารถเปลี่ยนสลิป
    CONFIRMED = ไม่สามารถอัปโหลด
  */
  const canUploadSlip = ["PENDING", "REJECTED"].includes(paymentStatus);

  // =========================
  // SLIP CHANGE
  // =========================

  const handleSlipChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกรูปภาพ",
        confirmButtonColor: "#f97316",
      });

      event.target.value = "";
      return;
    }

    if (slipPreview) {
      URL.revokeObjectURL(slipPreview);
    }

    const preview = URL.createObjectURL(file);

    setSlip(file);
    setSlipPreview(preview);

    event.target.value = "";
  };

  // =========================
  // REMOVE NEW SLIP
  // =========================

  const handleRemoveSlip = () => {
    if (slipPreview) {
      URL.revokeObjectURL(slipPreview);
    }

    setSlip(null);
    setSlipPreview(null);
  };

  // =========================
  // RESIZE IMAGE
  // =========================

  const resizeImage = (file) => {
    return new Promise((resolve, reject) => {
      try {
        Resizer.default.imageFileResizer(
          file,
          1000,
          1000,
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

  // =========================
  // UPLOAD SLIP
  // =========================

  const handleUploadSlip = async () => {
    if (!orderId) {
      Swal.fire({
        icon: "error",
        title: "ไม่พบ Order ID",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    // =========================
    // CHECK STATUS
    // =========================

    if (!canUploadSlip) {
      Swal.fire({
        icon: "warning",
        title: "ไม่สามารถอัปโหลดสลิปได้",
        text:
          paymentStatus === "SLIP_UPLOADED"
            ? "ระบบได้รับสลิปแล้ว กรุณารอร้านตรวจสอบ"
            : "ร้านยืนยันการชำระเงินแล้ว",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    // =========================
    // CHECK SLIP
    // =========================

    if (!slip) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกสลิป",
        text: "กรุณาเลือกรูปสลิปการโอนเงิน",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    try {
      setUploading(true);

      const data = await resizeImage(slip);

      const res = await uploadSlip(token, orderId, data);

      await Swal.fire({
        icon: "success",
        title: "อัปโหลดสลิปสำเร็จ",
        text: "ระบบได้รับหลักฐานการชำระเงินแล้ว รอร้านตรวจสอบ",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      // โหลด Order ใหม่
      await loadOrder();

      // ล้าง Preview
      handleRemoveSlip();
    } catch (error) {
      console.log("Upload Slip Error =", error);

      Swal.fire({
        icon: "error",
        title: "อัปโหลดสลิปไม่สำเร็จ",
        text:
          error.response?.data?.message || error.message || "เกิดข้อผิดพลาด",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // GO TO ORDER DETAIL
  // =========================

  const handleBackToOrder = () => {
    if (!orderId) {
      navigate("/user/userDelivery");
      return;
    }

    navigate(`/user/orderDetail/${orderId}`);
  };

  // =========================
  // CLEANUP
  // =========================

  useEffect(() => {
    return () => {
      if (slipPreview) {
        URL.revokeObjectURL(slipPreview);
      }
    };
  }, [slipPreview]);

  // =========================
  // LOADING
  // =========================

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#FFF8F0] pb-10">
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-12 sm:px-6 sm:pt-6 sm:pb-12 animate-pulse">
          {/* HEADER — โครงเดียวกับหน้าจริง */}
          <div className="mb-6 rounded-2xl border border-[#F1E5D9] bg-[#FFFCF8] px-6 py-5">
            <div className="mb-3 h-9 w-36 rounded-lg bg-[#EADFD4]" />
            <div className="h-4 w-64 max-w-full rounded-md bg-[#F0E6DC]" />
            <div className="mt-4 h-1 w-10 rounded-full bg-[#F5D2B8]" />
          </div>

          {/* PAYMENT STATUS */}
          <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-yellow-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded-md bg-[#EADFD4]" />
                <div className="h-4 w-40 rounded-md bg-[#EADFD4]" />
                <div className="h-3 w-56 max-w-full rounded-md bg-[#F0E6DC]" />
              </div>
            </div>
          </div>

          {/* STORE */}
          <div className="mb-5 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
            <div className="flex items-center gap-4 p-5">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-[#F0E6DC]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-5 w-40 max-w-full rounded-md bg-[#EADFD4]" />
                <div className="h-3 w-36 max-w-full rounded-md bg-[#F0E6DC]" />
              </div>
              <div className="h-7 w-20 shrink-0 rounded-full bg-[#F0E6DC]" />
            </div>
          </div>

          {/* ORDER ITEMS */}
          <div className="mb-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-[#F0E6DC]" />
              <div className="space-y-2">
                <div className="h-5 w-32 rounded-md bg-[#EADFD4]" />
                <div className="h-3 w-28 rounded-md bg-[#F0E6DC]" />
              </div>
            </div>

            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-[#F0E6DC]" />
                  <div className="min-w-0 flex-1 space-y-3 pt-1">
                    <div className="h-4 w-36 max-w-full rounded-md bg-[#EADFD4]" />
                    <div className="h-3 w-24 rounded-md bg-[#F0E6DC]" />
                  </div>
                  <div className="h-4 w-16 shrink-0 rounded-md bg-[#EADFD4]" />
                </div>
              ))}
            </div>

            {/* PRICE SUMMARY */}
            <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <div className="h-4 w-20 rounded-md bg-[#F0E6DC]" />
                <div className="h-4 w-16 rounded-md bg-[#F0E6DC]" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 rounded-md bg-[#F0E6DC]" />
                <div className="h-4 w-16 rounded-md bg-[#F0E6DC]" />
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="h-5 w-28 rounded-md bg-[#EADFD4]" />
                <div className="h-7 w-28 rounded-md bg-[#F5D2B8]" />
              </div>
            </div>
          </div>

          {/* PAYMENT — QR + SLIP + BUTTON */}
          <div className="mb-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-[#F0E6DC]" />
              <div className="space-y-2">
                <div className="h-5 w-44 rounded-md bg-[#EADFD4]" />
                <div className="h-3 w-36 rounded-md bg-[#F0E6DC]" />
              </div>
            </div>

            {/* QR CODE */}
            <div className="flex flex-col items-center">
              <div className="aspect-square w-full max-w-[400px] rounded-2xl border border-gray-100 bg-[#F0E6DC] p-4" />
              <div className="mt-4 h-4 w-32 rounded-md bg-[#EADFD4]" />
              <div className="mt-2 h-3 w-40 rounded-md bg-[#F0E6DC]" />
            </div>

            {/* SLIP UPLOAD */}
            <div className="mt-8 space-y-3">
              <div className="h-5 w-40 rounded-md bg-[#EADFD4]" />
              <div className="h-36 rounded-xl border-2 border-dashed border-gray-200 bg-[#FFFCF8]" />
              <div className="h-14 rounded-xl bg-[#F5D2B8]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================

  const merchantStatus =
    order?.store?.merchantStatus ?? store?.merchantStatus ?? null;

  const isStoreBlocked = ["BANNED", "SUSPENDED"].includes(merchantStatus);

  return (
    <div className="min-h-screen w-full bg-[#FFF8F0] pb-10">
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-12 sm:px-6 sm:pt-6 sm:pb-12">
        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-6 rounded-2xl border border-[#F1E5D9] bg-[#FFFCF8] px-6 py-5">
          <h1 className="mb-1.5 text-3xl font-extrabold tracking-tight text-[#2A1B12]">
            ชำระเงิน
          </h1>

          <p className="text-sm font-medium text-[#8B8179]">
            กรุณาตรวจสอบรายการและชำระเงินให้เรียบร้อย
          </p>

          <div className="mt-4 h-1 w-10 rounded-full bg-[#FF6B35]" />
        </div>

        {/* =========================
            PAYMENT STATUS
        ========================= */}

        <div
          className={`
            ${paymentStatusData.className}
            border
            rounded-2xl
            px-4
            py-3
            mb-6
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`
                w-10
                h-10
                rounded-xl
                ${paymentStatusData.iconBg}
                flex
                items-center
                justify-center
                shrink-0
              `}
            >
              <Clock size={19} className={paymentStatusData.iconColor} />
            </div>

            <div>
              <p className="text-xs text-gray-500">สถานะการชำระเงิน</p>

              <p
                className={`
                  font-bold
                  ${paymentStatusData.textColor}
                `}
              >
                {paymentStatusData.label}
              </p>

              {paymentStatusData.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {paymentStatusData.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* =========================
            STORE
        ========================= */}

        <div className="mb-5 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#F07836]">
              <Store size={26} strokeWidth={1.8} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium text-gray-400"></p>
              <h2 className="truncate text-lg font-bold text-[#2A1B12]">
                {order?.store?.storeName ||
                  store?.storeName ||
                  "กำลังโหลดข้อมูลร้าน..."}
              </h2>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-[#F07836]" />
                ร้านค้าที่คุณสั่งอาหาร
              </div>
            </div>

            <div className="shrink-0 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#E8491D]">
              <Store size={13} className="mr-1 inline" />
              ร้านอาหาร
            </div>
          </div>
        </div>

        {/* =========================
            ORDER ITEMS
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
          <div
            className="
              flex
              items-center
              gap-3
              mb-5
            "
          >
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
              "
            >
              <ShoppingBag size={22} />
            </div>

            <div>
              <h2
                className="
                  font-bold
                  text-lg
                  text-[#2A1B12]
                "
              >
                รายการอาหาร
              </h2>

              <p className="text-sm text-gray-400">รายการที่สั่งซื้อ</p>
            </div>
          </div>

          {/* ITEMS */}

          <div className="space-y-4">
            {orderItems.length > 0 ? (
              orderItems.map((item, index) => {
                const menu = item.menu || {};

                const count = Number(item.count || 1);

                const price = Number(item.price ?? menu.price ?? 0);

                const itemTotal = price * count;

                let options = [];

                try {
                  if (item.options) {
                    options =
                      typeof item.options === "string"
                        ? JSON.parse(item.options)
                        : item.options;
                  }
                } catch (error) {
                  options = [];
                }

                return (
                  <div
                    key={item.id || index}
                    className="
                        flex
                        gap-3
                        pb-4
                        border-b
                        border-gray-100
                        last:border-0
                        last:pb-0
                      "
                  >
                    {/* IMAGE */}

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
                          src={menu.images[0].secure_url || menu.images[0].url}
                          alt={menu.menuItem || "อาหาร"}
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
                              text-gray-300
                            "
                        >
                          <ImageIcon size={25} />
                        </div>
                      )}
                    </div>

                    {/* INFO */}

                    <div
                      className="
                          flex-1
                          min-w-0
                        "
                    >
                      <div
                        className="
                            flex
                            justify-between
                            gap-3
                          "
                      >
                        <div>
                          <h3
                            className="
                                font-semibold
                                text-[#2A1B12]
                              "
                          >
                            {menu.menuItem || "ไม่พบชื่ออาหาร"}
                          </h3>

                          <p
                            className="
                                text-sm
                                text-gray-400
                                mt-1
                              "
                          >
                            ฿{price.toFixed(2)} × {count}
                          </p>
                        </div>

                        <p
                          className="
                              font-bold
                              text-[#2A1B12]
                              whitespace-nowrap
                            "
                        >
                          ฿{itemTotal.toFixed(2)}
                        </p>
                      </div>

                      {/* OPTIONS */}

                      {Array.isArray(options) && options.length > 0 && (
                        <div
                          className="
                                mt-2
                                space-y-1
                              "
                        >
                          {options.map((option, optionIndex) => {
                            const optionLabel =
                              typeof option === "object"
                                ? option.optionLabel
                                : option;

                            const choiceName =
                              typeof option === "object"
                                ? option.choiceName
                                : null;

                            const extraPrice =
                              typeof option === "object"
                                ? Number(option.extraPrice || 0)
                                : 0;

                            return (
                              <p
                                key={optionIndex}
                                className="
                                        text-xs
                                        text-gray-500
                                      "
                              >
                                • {optionLabel}
                                {choiceName && <>: {choiceName}</>}
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
                );
              })
            ) : (
              <div
                className="
                  py-8
                  text-center
                  text-gray-400
                "
              >
                ไม่พบรายการอาหาร
              </div>
            )}
          </div>

          {/* PRICE SUMMARY */}

          <div
            className="
              mt-5
              pt-4
              border-t
              border-gray-100
              space-y-2
            "
          >
            <div
              className="
                flex
                justify-between
                text-sm
                text-gray-500
              "
            >
              <span>ค่าอาหาร</span>

              <span>฿{foodPrice.toFixed(2)}</span>
            </div>

            <div
              className="
                flex
                justify-between
                text-sm
                text-gray-500
              "
            >
              <span>ค่าจัดส่ง</span>

              <span>฿{deliveryFee.toFixed(2)}</span>
            </div>

            <div
              className="
                flex
                justify-between
                items-center
                pt-3
                mt-2
                border-t
                border-gray-100
              "
            >
              <span
                className="
                  font-bold
                  text-[#2A1B12]
                "
              >
                ยอดที่ต้องชำระ
              </span>

              <span
                className="
                  text-2xl
                  font-bold
                  text-orange-500
                "
              >
                ฿{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* =========================
            PAYMENT
        ========================= */}
        {!isStoreBlocked ? (
          <div>
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
              {/* TITLE */}

              <div
                className="
              flex
              items-center
              gap-3
              mb-5
            "
              >
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
              "
                >
                  <QrCode size={22} />
                </div>

                <div>
                  <h2 className="font-bold text-lg">ชำระเงินผ่าน PromptPay</h2>

                  <p className="text-sm text-gray-400">
                    สแกน QR Code ของร้านค้า
                  </p>
                </div>
              </div>

              {/* QR */}

              {paymentImageUrl ? (
                <div
                  className="
                flex
                flex-col
                items-center
              "
                >
                  <div
                    className="
                  w-full
                  max-w-[400px]
                  rounded-2xl
                  bg-gray-50
                  border
                  p-4
                "
                  >
                    <img
                      src={paymentImageUrl}
                      alt="QR Code ร้านค้า"
                      className="
                    w-full
                    max-h-[400px]
                    object-contain
                    rounded-xl
                  "
                    />
                  </div>

                  <p
                    className="
                  mt-4
                  text-gray-500
                  text-center
                "
                  >
                    สแกน QR Code
                    <br />
                    เพื่อชำระเงินให้ร้านค้า
                  </p>
                </div>
              ) : (
                <div
                  className="
                rounded-2xl
                border-2
                border-dashed
                border-gray-200
                bg-gray-50
                p-10
                text-center
              "
                >
                  <ImageIcon size={35} className="mx-auto text-gray-400" />

                  <p
                    className="
                  mt-4
                  font-semibold
                  text-gray-500
                "
                  >
                    ร้านนี้ยังไม่ได้เพิ่ม QR Code
                  </p>
                </div>
              )}

              {/* =========================
              CURRENT SLIP
          ========================= */}

              {currentSlipUrl && paymentStatus !== "PENDING" && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        สลิปการชำระเงิน
                      </h3>

                      <p className="text-sm text-gray-400 mt-1">
                        หลักฐานการชำระเงินที่ส่งให้ร้าน
                      </p>
                    </div>

                    {paymentStatus === "SLIP_UPLOADED" && (
                      <span
                        className="
                        rounded-full
                        bg-blue-50
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        text-blue-600
                      "
                      >
                        รอตรวจสอบ
                      </span>
                    )}

                    {paymentStatus === "REJECTED" && (
                      <span
                        className="
                        rounded-full
                        bg-red-50
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        text-red-600
                      "
                      >
                        ถูกปฏิเสธ
                      </span>
                    )}

                    {paymentStatus === "CONFIRMED" && (
                      <span
                        className="
                        rounded-full
                        bg-green-50
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        text-green-600
                      "
                      >
                        ยืนยันแล้ว
                      </span>
                    )}
                  </div>

                  <div
                    className="
                    max-w-md
                    mx-auto
                    overflow-hidden
                    rounded-2xl
                    border
                    bg-gray-50
                  "
                  >
                    <img
                      src={currentSlipUrl}
                      alt="สลิปการชำระเงิน"
                      className="
                      w-full
                      max-h-[600px]
                      object-contain
                    "
                    />
                  </div>
                </div>
              )}

              {/* =========================
              PAYMENT CONFIRMED
          ========================= */}

              {paymentStatus === "CONFIRMED" && (
                <div
                  className="
                mt-8
                rounded-xl
                bg-green-50
                border
                border-green-200
                p-5
                text-center
              "
                >
                  <p
                    className="
                  font-bold
                  text-green-700
                "
                  >
                    ร้านยืนยันการชำระเงินแล้ว
                  </p>

                  {order?.payment?.confirmedAt && (
                    <p
                      className="
                    text-sm
                    text-green-600
                    mt-1
                  "
                    >
                      ยืนยันการชำระเงินเรียบร้อย
                    </p>
                  )}
                </div>
              )}

              {/* =========================
              UPLOAD SLIP
          ========================= */}

              {canUploadSlip && (
                <div className="mt-8">
                  <div className="mb-3">
                    <label className="block font-semibold">
                      {paymentStatus === "REJECTED"
                        ? "อัปโหลดสลิปใหม่"
                        : "อัปโหลดสลิปการโอนเงิน"}
                    </label>

                    {paymentStatus === "REJECTED" && (
                      <p className="mt-1 text-sm text-red-500">
                        กรุณาตรวจสอบเหตุผลที่ร้านปฏิเสธ และอัปโหลดสลิปใหม่
                      </p>
                    )}
                  </div>

                  {/* NEW SLIP PREVIEW */}

                  {slipPreview ? (
                    <div
                      className="
                    relative
                    mt-3
                    max-w-md
                    mx-auto
                  "
                    >
                      <img
                        src={slipPreview}
                        alt="Slip Preview"
                        className="
                      w-full
                      rounded-2xl
                      border
                    "
                      />

                      <button
                        type="button"
                        onClick={handleRemoveSlip}
                        disabled={uploading}
                        className="
                      absolute
                      top-3
                      right-3
                      w-10
                      h-10
                      rounded-full
                      bg-black/60
                      hover:bg-red-500
                      text-white
                      flex
                      items-center
                      justify-center
                    "
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="slip"
                      className="
                    border-2
                    border-dashed
                    border-gray-300
                    rounded-xl
                    p-8
                    flex
                    flex-col
                    items-center
                    justify-center
                    cursor-pointer
                    hover:border-orange-500
                    transition
                  "
                    >
                      <Upload size={40} className="text-gray-400" />

                      <p className="mt-3 text-gray-500">
                        {paymentStatus === "REJECTED"
                          ? "คลิกเพื่อเลือกสลิปใหม่"
                          : "คลิกเพื่อเลือกรูปสลิป"}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        รองรับไฟล์รูปภาพ
                      </p>

                      <input
                        id="slip"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={handleSlipChange}
                      />
                    </label>
                  )}

                  {/* =====================
                  UPLOAD BUTTON
              ===================== */}

                  <button
                    type="button"
                    onClick={handleUploadSlip}
                    disabled={uploading || !slip || !paymentImageUrl}
                    className="
                  w-full
                  mt-6
                  bg-green-600
                  hover:bg-green-700
                  disabled:bg-gray-400
                  disabled:cursor-not-allowed
                  text-white
                  py-4
                  rounded-xl
                  text-lg
                  font-bold
                  transition
                  flex
                  items-center
                  justify-center
                  gap-2
                "
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        กำลังอัปโหลดสลิป...
                      </>
                    ) : paymentStatus === "REJECTED" ? (
                      "ส่งสลิปใหม่"
                    ) : (
                      "ยืนยันการชำระเงิน"
                    )}
                  </button>
                </div>
              )}

              {/* =========================
              WAITING STORE
          ========================= */}

              {paymentStatus === "SLIP_UPLOADED" && (
                <div
                  className="
                mt-8
                rounded-xl
                bg-blue-50
                border
                border-blue-200
                p-5
                text-center
              "
                >
                  <p
                    className="
                  font-bold
                  text-blue-700
                "
                  >
                    กำลังรอร้านตรวจสอบสลิป
                  </p>

                  <p
                    className="
                  text-sm
                  text-blue-600
                  mt-1
                "
                  >
                    ระบบได้รับหลักฐานการชำระเงินแล้ว กรุณารอร้านตรวจสอบ
                  </p>
                </div>
              )}

              {/* =========================
              BACK TO ORDER
          ========================= */}

              {(paymentStatus === "SLIP_UPLOADED" ||
                paymentStatus === "CONFIRMED") && (
                <button
                  type="button"
                  onClick={handleBackToOrder}
                  className="
                w-full
                mt-5
                bg-[#FF6B35]
                hover:bg-[#E8491D]
                text-white
                py-4
                rounded-xl
                text-lg
                font-bold
                transition
                flex
                items-center
                justify-center
                gap-2
              "
                >
                  <ArrowLeft size={20} />
                  กลับหน้ารายละเอียดออเดอร์
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <CreditCard size={36} className="mx-auto mb-3 text-red-500" />

            <h2 className="font-bold text-red-700">
              ร้านนี้ถูกระงับหรือถูกแบน
            </h2>

            <p className="mt-2 text-sm text-red-600">
              ไม่สามารถชำระเงินหรืออัปโหลดสลิปได้ในขณะนี้
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPayment;
