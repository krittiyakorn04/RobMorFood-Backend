import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  Clock,
  MapPin,
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  ChefHat,
  CircleAlert,
  XCircle,
  Image as ImageIcon,
  CreditCard,
  Star,
  MessageCircle,
  Home,
  Phone,
} from "lucide-react";

import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";

import {
  getOrderDetail,
  cancelOrder,
  getReview,
  createReview,
  updateReview,
  removeReview,
  createOrderReport,
  getMyOrderReports,
} from "../../api/UserOrder";

const reportStatusText = {
  PENDING: "รอตรวจสอบ",
  REVIEWING: "กำลังตรวจสอบ",
  RESOLVED: "ดำเนินการแล้ว",
  REJECTED: "ไม่รับเรื่อง",
};

const reportStatusClass = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  REVIEWING: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const OrderDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const token = usefoodDelivery((state) => state.token);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [orderReport, setOrderReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // =====================================================
  // REVIEW
  // =====================================================

  const [review, setReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(false);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30 * 1000);

    return () => clearInterval(timer);
  }, []);

  const isOrderOverOneHour =
    order?.createdAt &&
    now - new Date(order.createdAt).getTime() >= 60 * 60 * 1000 &&
    !["COMPLETED", "CANCELLED"].includes(order?.status);

  // =====================================================
  // LOAD ORDER
  // =====================================================

  useEffect(() => {
    if (!token || !id) return;

    let mounted = true;

    const fetchOrderDetail = async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const res = await getOrderDetail(token, id);

        if (mounted) {
          setOrder(res.data);
        }
      } catch (error) {
        console.error("Get Order Detail Error =", error);

        if (showLoading && mounted) {
          await Swal.fire({
            icon: "error",
            title: "ไม่สามารถโหลดรายละเอียดออเดอร์ได้",
            text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
            confirmButtonColor: "#f97316",
          });

          navigate("/user/orderUser");
        }
      } finally {
        if (showLoading && mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrderDetail(true);

    const interval = setInterval(() => {
      fetchOrderDetail(false);
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token, id, navigate, location.key]);

  useEffect(() => {
    if (!token || !id) return;

    const loadOrderReport = async () => {
      try {
        setReportLoading(true);

        const res = await getMyOrderReports(token);

        const reports = res.data?.reports || [];

        const currentReport = reports.find(
          (report) => Number(report.order?.id || report.orderId) === Number(id),
        );

        setOrderReport(currentReport || null);
      } catch (error) {
        console.error("GET ORDER REPORT ERROR =", error);
        setOrderReport(null);
      } finally {
        setReportLoading(false);
      }
    };

    loadOrderReport();
  }, [token, id]);

  // =====================================================
  // LOAD REVIEW
  // รีวิวจะแสดงเมื่อ Order = COMPLETED เท่านั้น
  // =====================================================

  useEffect(() => {
    if (!token || !id) return;

    if (order?.status !== "COMPLETED") {
      setReview(null);
      setReviewRating(0);
      setReviewComment("");
      setEditingReview(false);
      return;
    }

    const loadReview = async () => {
      try {
        setReviewLoading(true);

        const res = await getReview(token, id);

        const reviewData = res.data?.review ?? res.data ?? null;

        setReview(reviewData);

        if (reviewData) {
          setReviewRating(Number(reviewData.rating || 0));
          setReviewComment(reviewData.comment || "");
        } else {
          setReviewRating(0);
          setReviewComment("");
        }
      } catch (error) {
        console.error("Get Review Error =", error);
      } finally {
        setReviewLoading(false);
      }
    };

    loadReview();
  }, [token, id, order?.status]);

  // =====================================================
  // CURRENT PROCESS
  // =====================================================

  const getCurrentProcess = (orderStatus, deliveryStatus) => {
    if (orderStatus === "CANCELLED") {
      return "CANCELLED";
    }

    if (orderStatus === "COMPLETED") {
      return "ORDER_COMPLETED";
    }

    if (orderStatus === "PENDING") {
      return "ORDER_PENDING";
    }

    if (orderStatus === "WAITING_PAYMENT") {
      return "WAITING_PAYMENT";
    }

    if (orderStatus === "CONFIRMED") {
      return "ORDER_CONFIRMED";
    }

    if (orderStatus === "PREPARING") {
      return "ORDER_PREPARING";
    }

    if (orderStatus === "READY") {
      if (deliveryStatus === "PENDING") {
        return "DELIVERY_PENDING";
      }

      if (deliveryStatus === "DELIVERING") {
        return "DELIVERY_DELIVERING";
      }

      if (deliveryStatus === "COMPLETED") {
        return "DELIVERY_COMPLETED";
      }
    }

    return "ORDER_PENDING";
  };

  // =====================================================
  // CURRENT STATUS DATA
  // =====================================================

  const getCurrentStatusData = (orderStatus, deliveryStatus) => {
    const process = getCurrentProcess(orderStatus, deliveryStatus);

    switch (process) {
      case "CANCELLED":
        return {
          text: "ออเดอร์ถูกยกเลิก",
          description: "ออเดอร์นี้ถูกยกเลิกแล้ว",
          icon: XCircle,
          bg: "bg-red-50",
          border: "border-red-200",
          iconBg: "bg-red-100",
          iconColor: "text-red-500",
          textColor: "text-red-700",
          bar: "bg-red-500",
        };

      case "ORDER_PENDING":
        return {
          text: "รอร้านยืนยัน",
          description: "กำลังรอร้านอาหารยืนยันออเดอร์",
          icon: Clock,
          bg: "bg-orange-50",
          border: "border-orange-200",
          iconBg: "bg-orange-100",
          iconColor: "text-orange-500",
          textColor: "text-orange-700",
          bar: "bg-orange-500",
        };

      case "WAITING_PAYMENT":
        return {
          text: "รอชำระเงิน",
          description: "ร้านยืนยันออเดอร์แล้ว กรุณาชำระเงิน",
          icon: CreditCard,
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          textColor: "text-yellow-700",
          bar: "bg-yellow-500",
        };

      case "ORDER_CONFIRMED":
        return {
          text: "ร้านยืนยันแล้ว",
          description: "ร้านอาหารยืนยันออเดอร์แล้ว",
          icon: CheckCircle2,
          bg: "bg-blue-50",
          border: "border-blue-200",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-500",
          textColor: "text-blue-700",
          bar: "bg-blue-500",
        };

      case "ORDER_PREPARING":
        return {
          text: "กำลังเตรียมอาหาร",
          description: "ร้านอาหารกำลังจัดเตรียมอาหารของคุณ",
          icon: ChefHat,
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          textColor: "text-yellow-700",
          bar: "bg-yellow-500",
        };

      case "DELIVERY_PENDING":
        return {
          text: "รอจัดส่ง",
          description: "อาหารพร้อมแล้ว กำลังรอจัดส่ง",
          icon: Package,
          bg: "bg-purple-50",
          border: "border-purple-200",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-500",
          textColor: "text-purple-700",
          bar: "bg-purple-500",
        };

      case "DELIVERY_DELIVERING":
        return {
          text: "กำลังจัดส่ง",
          description: "ออเดอร์กำลังเดินทางมาหาคุณ",
          icon: Truck,
          bg: "bg-indigo-50",
          border: "border-indigo-200",
          iconBg: "bg-indigo-100",
          iconColor: "text-indigo-500",
          textColor: "text-indigo-700",
          bar: "bg-indigo-500",
        };

      case "DELIVERY_COMPLETED":
        return {
          text: "จัดส่งสำเร็จ",
          description: "จัดส่งอาหารเรียบร้อยแล้ว",
          icon: CheckCircle2,
          bg: "bg-green-50",
          border: "border-green-200",
          iconBg: "bg-green-100",
          iconColor: "text-green-500",
          textColor: "text-green-700",
          bar: "bg-green-500",
        };

      case "ORDER_COMPLETED":
        return {
          text: "ออเดอร์เสร็จสิ้น",
          description: "ออเดอร์นี้เสร็จสิ้นเรียบร้อยแล้ว",
          icon: CheckCircle2,
          bg: "bg-green-50",
          border: "border-green-200",
          iconBg: "bg-green-100",
          iconColor: "text-green-500",
          textColor: "text-green-700",
          bar: "bg-green-500",
        };

      default:
        return {
          text: "ไม่ทราบสถานะ",
          description: "",
          icon: CircleAlert,
          bg: "bg-gray-50",
          border: "border-gray-200",
          iconBg: "bg-gray-100",
          iconColor: "text-gray-500",
          textColor: "text-gray-700",
          bar: "bg-gray-500",
        };
    }
  };

  // =====================================================
  // PROCESS STEP
  // =====================================================

  const getProcessStep = (orderStatus, deliveryStatus) => {
    const process = getCurrentProcess(orderStatus, deliveryStatus);

    switch (process) {
      case "ORDER_PENDING":
        return 1;

      case "WAITING_PAYMENT":
        return 2;

      case "ORDER_CONFIRMED":
        return 2;

      case "ORDER_PREPARING":
        return 3;

      case "DELIVERY_PENDING":
        return 4;

      case "DELIVERY_DELIVERING":
        return 5;

      case "DELIVERY_COMPLETED":
        return 6;

      case "ORDER_COMPLETED":
        return 6;

      default:
        return 0;
    }
  };

  // =====================================================
  // PAYMENT STATUS
  // =====================================================

  const getPaymentStatusData = (status) => {
    switch (status) {
      case "PENDING":
        return {
          label: "รอชำระเงิน",
          description: "กรุณาชำระเงินและอัปโหลดสลิป",
          className: "bg-yellow-50 border-yellow-200 text-yellow-700",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
        };

      case "SLIP_UPLOADED":
        return {
          label: "รอตรวจสอบสลิป",
          description: "ระบบได้รับสลิปแล้ว รอร้านตรวจสอบ",
          className: "bg-blue-50 border-blue-200 text-blue-700",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        };

      case "CONFIRMED":
        return {
          label: "ชำระเงินแล้ว",
          description: "ร้านยืนยันการชำระเงินเรียบร้อยแล้ว",
          className: "bg-green-50 border-green-200 text-green-700",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
        };

      case "REJECTED":
        return {
          label: "สลิปถูกปฏิเสธ",
          description: "กรุณาตรวจสอบและชำระเงินใหม่",
          className: "bg-red-50 border-red-200 text-red-700",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
        };

      default:
        return {
          label: "ไม่พบสถานะการชำระเงิน",
          description: "",
          className: "bg-gray-50 border-gray-200 text-gray-600",
          iconBg: "bg-gray-100",
          iconColor: "text-gray-500",
        };
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =====================================================
  // ADD MINUTES TO TIME
  // =====================================================

  const addDeliveryTime = (time, minutes = 20) => {
    if (!time) {
      return "-";
    }

    const [hour, minute] = String(time).split(":").map(Number);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return "-";
    }

    const date = new Date();

    date.setHours(hour, minute, 0, 0);

    date.setMinutes(date.getMinutes() + minutes);

    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // PARSE OPTIONS
  // =====================================================

  const parseOptions = (options) => {
    if (!options) {
      return [];
    }

    if (Array.isArray(options)) {
      return options;
    }

    try {
      const parsed = JSON.parse(options);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // =====================================================
  // SUBMIT REVIEW
  // =====================================================

  const handleSubmitReview = async () => {
    if (!order) return;

    if (order.status !== "COMPLETED") {
      return;
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณาให้คะแนน",
        text: "กรุณาเลือกคะแนนตั้งแต่ 1 ถึง 5 ดาว",
        confirmButtonColor: "#f97316",
        confirmButtonText: "ตกลง",
      });

      return;
    }

    try {
      setReviewSubmitting(true);

      const data = {
        rating: Number(reviewRating),
        comment: reviewComment.trim() || null,
      };

      let res;

      if (review) {
        res = await updateReview(token, review.id, data);
      } else {
        res = await createReview(token, order.id, data);
      }

      const savedReview = res.data?.review ?? res.data;

      setReview(savedReview);

      setReviewRating(Number(savedReview?.rating || reviewRating));

      setReviewComment(savedReview?.comment || reviewComment.trim() || "");

      setEditingReview(false);

      await Swal.fire({
        icon: "success",
        title: review ? "แก้ไขรีวิวสำเร็จ" : "รีวิวสำเร็จ",
        text: review ? "แก้ไขรีวิวเรียบร้อยแล้ว" : "ขอบคุณสำหรับการรีวิว",
        confirmButtonColor: "#f97316",
        confirmButtonText: "ตกลง",
      });
    } catch (error) {
      console.error("Submit Review Error =", error);

      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถบันทึกรีวิวได้",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setReviewSubmitting(false);
    }
  };
  const handleReportOrder = async () => {
    try {
      const result = await Swal.fire({
        icon: "warning",
        title: "แจ้งปัญหาออเดอร์",
        text: "เลือกประเภทปัญหาที่พบ",
        input: "select",
        inputOptions: {
          ORDER_NOT_DELIVERED: "ร้านยังไม่จัดส่ง",
          WRONG_ORDER: "ได้รับอาหารไม่ตรงกับที่สั่ง",
          MISSING_ITEM: "ได้รับอาหารไม่ครบ",
          OTHER: "อื่น ๆ",
        },
        inputPlaceholder: "เลือกปัญหา",
        showCancelButton: true,
        confirmButtonText: "ถัดไป",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#E8491D",
        cancelButtonColor: "#9CA3AF",
        reverseButtons: true,
        customClass: {
          popup: "rounded-[28px]",
          title: "text-xl font-bold text-gray-800",
          input: "rounded-xl border-gray-200",
          confirmButton: "rounded-xl px-5 py-3 font-semibold",
          cancelButton: "rounded-xl px-5 py-3 font-semibold",
        },
        inputValidator: (value) => {
          if (!value) {
            return "กรุณาเลือกประเภทปัญหา";
          }

          return null;
        },
      });

      if (!result.isConfirmed) return;

      const type = result.value;

      const detailResult = await Swal.fire({
        icon: "edit",
        title: "รายละเอียดปัญหา",
        html: `
        <div class="text-left">
          <p class="text-sm text-gray-500 mb-3">
            คุณสามารถอธิบายรายละเอียดเพิ่มเติมได้
          </p>

          <textarea
            id="report-detail"
            class="swal2-textarea"
            placeholder="เช่น ได้รับอาหารไม่ครบ 1 รายการ..."
            style="
              width:100%;
              min-height:120px;
              margin:0;
              border-radius:16px;
              border:1px solid #E5E7EB;
              padding:14px;
              font-size:14px;
              resize:none;
              box-sizing:border-box;
            "
          ></textarea>
        </div>
      `,
        showCancelButton: true,
        confirmButtonText: "ส่งเรื่องร้องเรียน",
        cancelButtonText: "ย้อนกลับ",
        confirmButtonColor: "#E8491D",
        cancelButtonColor: "#9CA3AF",
        reverseButtons: true,
        customClass: {
          popup: "rounded-[28px]",
          title: "text-xl font-bold text-gray-800",
          confirmButton: "rounded-xl px-5 py-3 font-semibold",
          cancelButton: "rounded-xl px-5 py-3 font-semibold",
        },
        preConfirm: () => {
          const detail = document.getElementById("report-detail")?.value || "";

          return detail.trim();
        },
      });

      if (!detailResult.isConfirmed) return;

      const detail = detailResult.value;

      await createOrderReport(token, order.id, type, detail);

      try {
        const reportRes = await getMyOrderReports(token);

        const reports = reportRes.data?.reports || [];

        const currentReport = reports.find(
          (report) =>
            Number(report.order?.id || report.orderId) === Number(order.id),
        );

        setOrderReport(currentReport || null);
      } catch (error) {
        console.error("RELOAD ORDER REPORT ERROR =", error);
      }

      await Swal.fire({
        icon: "success",
        title: "ส่งเรื่องเรียบร้อย",
        text: "ระบบได้รับเรื่องร้องเรียนของคุณแล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#E8491D",
        customClass: {
          popup: "rounded-[28px]",
          confirmButton: "rounded-xl px-6 py-3 font-semibold",
        },
      });
    } catch (error) {
      console.error(
        "CREATE ORDER REPORT ERROR =",
        error?.response?.data || error,
      );

      Swal.fire({
        icon: "error",
        title: "ไม่สามารถส่งเรื่องได้",
        text:
          error?.response?.data?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#E8491D",
        customClass: {
          popup: "rounded-[28px]",
          confirmButton: "rounded-xl px-6 py-3 font-semibold",
        },
      });
    }
  };

  // =====================================================
  // REMOVE REVIEW
  // =====================================================

  const handleRemoveReview = async () => {
    if (!review || !order) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "ลบรีวิว?",
      text: "คุณต้องการลบรีวิวของออเดอร์นี้ใช่หรือไม่",
      showCancelButton: true,
      confirmButtonText: "ลบรีวิว",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setReviewSubmitting(true);

      await removeReview(token, order.id);

      setReview(null);
      setReviewRating(0);
      setReviewComment("");
      setEditingReview(false);

      await Swal.fire({
        icon: "success",
        title: "ลบรีวิวสำเร็จ",
        text: "รีวิวถูกลบแล้ว",
        confirmButtonColor: "#f97316",
        confirmButtonText: "ตกลง",
      });
    } catch (error) {
      console.error("Remove Review Error =", error);

      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถลบรีวิวได้",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  // =====================================================
  // LOADING SKELETON
  // =====================================================
  if (loading) {
    return (
      <div className="min-h-screen animate-pulse bg-[#FFF8F0]">
        {/* HEADER */}
        <div className="sticky top-0 z-20 border-b border-orange-100 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-[#F0E6DC]" />

            <div className="flex-1 space-y-2">
              <div className="h-5 w-36 rounded-md bg-[#EADFD4]" />
              <div className="h-3 w-20 rounded bg-[#F0E6DC]" />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 pb-10 sm:p-6">
          {/* ORDER STATUS */}
          <section className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-100" />

              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-[#EADFD4]" />
                <div className="h-3 w-48 max-w-full rounded bg-[#F0E6DC]" />
              </div>

              <div className="h-7 w-20 rounded-full bg-orange-100" />
            </div>

            {/* PROCESS STEPS */}
            <div className="flex items-start">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="relative flex-1">
                  {step !== 6 && (
                    <div className="absolute left-1/2 top-3.5 h-0.5 w-full bg-[#F0E6DC]" />
                  )}

                  <div className="relative z-10 mx-auto h-7 w-7 rounded-full bg-[#F0E6DC]" />
                  <div className="mx-auto mt-2 h-2 w-10 max-w-full rounded bg-[#F0E6DC]" />
                  <div className="mx-auto mt-1 h-2 w-7 max-w-full rounded bg-[#F5EDE5]" />
                </div>
              ))}
            </div>
          </section>

          {/* ORDER ROUND */}
          <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-orange-100" />

              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-[#F0E6DC]" />
                <div className="h-5 w-28 rounded bg-[#EADFD4]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((item) => (
                <div key={item} className="rounded-xl bg-[#FFF5EA] p-3">
                  <div className="mb-2 h-3 w-20 rounded bg-[#EADFD4]" />
                  <div className="h-5 w-16 rounded bg-orange-100" />
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl bg-blue-50 p-3">
              <div className="mb-2 h-3 w-24 rounded bg-blue-100" />
              <div className="h-5 w-20 rounded bg-blue-100" />
            </div>
          </section>

          {/* CHAT */}
          <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-orange-100" />

              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-[#F0E6DC]" />
                <div className="h-5 w-40 max-w-full rounded bg-[#EADFD4]" />
                <div className="h-3 w-52 max-w-full rounded bg-[#F0E6DC]" />
              </div>
            </div>

            <div className="mt-4 h-12 rounded-xl bg-orange-100" />
          </section>

          {/* PAYMENT STATUS */}
          <section className="rounded-2xl border border-orange-100 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-yellow-100" />

              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 rounded bg-[#F0E6DC]" />
                <div className="h-5 w-32 rounded bg-[#EADFD4]" />
                <div className="h-3 w-44 max-w-full rounded bg-[#F0E6DC]" />
              </div>

              <div className="h-10 w-20 shrink-0 rounded-xl bg-orange-100" />
            </div>
          </section>

          {/* STORE */}
          <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
            <div className="flex items-center gap-4 p-5">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-orange-100" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-5 w-40 max-w-full rounded bg-[#EADFD4]" />
                <div className="h-3 w-32 rounded bg-[#F0E6DC]" />
              </div>

              <div className="h-7 w-20 shrink-0 rounded-full bg-orange-100" />
            </div>
          </section>

          {/* DELIVERY ADDRESS */}
          <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
            <div className="flex items-start gap-3 p-5">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-orange-100" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-[#F0E6DC]" />
                <div className="h-5 w-32 rounded bg-[#EADFD4]" />
                <div className="h-3 w-full rounded bg-[#F0E6DC]" />
                <div className="h-3 w-3/4 rounded bg-[#F0E6DC]" />
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="h-4 w-28 rounded bg-[#EADFD4]" />
                <div className="h-3 w-20 rounded bg-orange-100" />
              </div>

              {/* MAP */}
              <div className="h-52 rounded-2xl bg-[#EAE8E2]" />

              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#FFF8F0] p-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-[#F0E6DC]" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 rounded bg-[#F0E6DC]" />
                  <div className="h-4 w-36 max-w-full rounded bg-[#EADFD4]" />
                </div>

                <div className="h-5 w-5 shrink-0 rounded-full bg-orange-100" />
              </div>
            </div>
          </section>

          {/* FOOD ITEMS */}
          <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-orange-100" />

              <div className="space-y-2">
                <div className="h-5 w-28 rounded bg-[#EADFD4]" />
                <div className="h-3 w-32 rounded bg-[#F0E6DC]" />
              </div>
            </div>

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex gap-3 border-b border-gray-100 py-4 last:border-0"
              >
                <div className="h-20 w-20 shrink-0 rounded-xl bg-[#F0E6DC]" />

                <div className="min-w-0 flex-1 space-y-3 pt-1">
                  <div className="h-4 w-40 max-w-full rounded bg-[#EADFD4]" />
                  <div className="h-3 w-24 rounded bg-[#F0E6DC]" />
                  <div className="h-3 w-32 max-w-full rounded bg-[#F0E6DC]" />
                </div>

                <div className="h-4 w-14 shrink-0 rounded bg-[#EADFD4]" />
              </div>
            ))}
          </section>

          {/* PAYMENT SLIP */}
          <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-green-100" />

              <div className="space-y-2">
                <div className="h-3 w-28 rounded bg-[#F0E6DC]" />
                <div className="h-5 w-36 rounded bg-[#EADFD4]" />
              </div>
            </div>

            <div className="mx-auto h-64 w-full max-w-md rounded-2xl bg-[#F0E6DC]" />
          </section>

          {/* DELIVERY PROOF */}
          <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-green-100" />

              <div className="space-y-2">
                <div className="h-3 w-28 rounded bg-[#F0E6DC]" />
                <div className="h-5 w-40 rounded bg-[#EADFD4]" />
              </div>
            </div>

            <div className="mx-auto h-64 w-full max-w-md rounded-2xl bg-[#F0E6DC]" />
          </section>

          {/* ORDER NOTE */}
          <section className="rounded-2xl border border-orange-100 bg-white p-5">
            <div className="mb-4 h-5 w-24 rounded bg-[#EADFD4]" />
            <div className="mb-2 h-3 w-full rounded bg-[#F0E6DC]" />
            <div className="h-3 w-2/3 rounded bg-[#F0E6DC]" />
          </section>

          {/* REVIEW */}
          <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-orange-100" />

              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-[#F0E6DC]" />
                <div className="h-5 w-36 rounded bg-[#EADFD4]" />
              </div>
            </div>

            <div className="mb-5 flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="h-8 w-8 rounded-lg bg-orange-100" />
              ))}
            </div>

            <div className="h-24 rounded-xl bg-[#F0E6DC]" />
            <div className="mt-4 h-11 rounded-xl bg-orange-100" />
          </section>

          {/* ORDER REPORT */}
          <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-red-100" />

              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-[#F0E6DC]" />
                <div className="h-5 w-40 rounded bg-[#EADFD4]" />
              </div>
            </div>

            <div className="mb-4 h-7 w-28 rounded-full bg-yellow-100" />
            <div className="mb-3 h-16 rounded-xl bg-red-50" />
            <div className="h-20 rounded-xl bg-[#F0E6DC]" />
          </section>

          {/* ORDER SUMMARY */}
          <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <div className="mb-5 h-6 w-36 rounded bg-[#EADFD4]" />

            {[1, 2].map((item) => (
              <div key={item} className="mb-4 flex justify-between gap-4">
                <div className="h-4 w-24 rounded bg-[#F0E6DC]" />
                <div className="h-4 w-20 rounded bg-[#EADFD4]" />
              </div>
            ))}

            <div className="flex justify-between border-t border-gray-100 pt-4">
              <div className="h-5 w-20 rounded bg-[#EADFD4]" />
              <div className="h-6 w-28 rounded bg-orange-100" />
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="h-3 w-48 max-w-full rounded bg-[#F0E6DC]" />
            </div>

            <div className="mt-4 h-12 rounded-2xl bg-red-100" />
          </section>

          {/* LOADING MESSAGE */}
          <div className="flex items-center justify-center gap-3 py-3">
            <div className="h-4 w-4 rounded-full border-2 border-orange-200 border-t-orange-500" />
            <p className="text-sm font-medium text-[#8B8179]">
              กำลังโหลดรายละเอียดออเดอร์...
            </p>
          </div>
        </div>
      </div>
    );
  }
  // =====================================================
  // DATA
  // =====================================================

  const orderItems = Array.isArray(order.menu) ? order.menu : [];

  const defaultAddress =
    order.customer?.addresses?.find((item) => item.isDefault === true) ||
    order.customer?.addresses?.[0] ||
    null;

  // ==========================================
  // คำนวณค่าอาหารจากรายการอาหารจริง
  // ==========================================
  const foodPrice = orderItems.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const count = Number(item.count || 1);

    return sum + price * count;
  }, 0);

  // ==========================================
  // ค่าจัดส่ง
  // ==========================================
  const deliveryFee = Number(order.store?.deliveryFee ?? 0);

  // ==========================================
  // ยอดรวม = ค่าอาหาร + ค่าจัดส่ง
  // ==========================================
  const totalPrice = foodPrice + deliveryFee;

  const deliveryStatus = order.delivery?.status || null;

  const paymentStatus = order.payment?.status || null;

  const currentStatus = getCurrentStatusData(order.status, deliveryStatus);

  const CurrentStatusIcon = currentStatus.icon;

  const currentStep = getProcessStep(order.status, deliveryStatus);

  const paymentStatusData = getPaymentStatusData(paymentStatus);

  const orderRound = order.orderRound || null;

  // สำคัญ:
  // รีวิวได้เมื่อ Order เป็น COMPLETED เท่านั้น
  const canReview = order.status === "COMPLETED";

  // =====================================================
  // PROCESS STEPS
  // =====================================================

  const processSteps = [
    {
      label: "รอร้านยืนยัน",
      icon: Clock,
      type: "order",
    },
    {
      label: "รอชำระเงิน",
      icon: CreditCard,
      type: "payment",
    },
    {
      label: "กำลังเตรียมอาหาร",
      icon: ChefHat,
      type: "order",
    },
    {
      label: "รอจัดส่ง",
      icon: Package,
      type: "delivery",
    },
    {
      label: "กำลังจัดส่ง",
      icon: Truck,
      type: "delivery",
    },
    {
      label: "เสร็จสิ้น",
      icon: CheckCircle2,
      type: "order",
    },
  ];

  // =====================================================
  // SLIP
  // =====================================================

  const slipImage =
    order.payment?.images?.find((image) =>
      image.public_id?.startsWith("userPayment2026"),
    ) ||
    order.payment?.images?.[0] ||
    null;

  const slipUrl = slipImage?.secure_url || slipImage?.url || null;

  // =====================================================
  // GO PAYMENT
  // =====================================================

  const handleGoPayment = () => {
    navigate("/user/UserPayment", {
      state: {
        orderId: order.id,
        storeId: order.storeId || order.store?.id,
        paymentStatus: paymentStatus,
      },
    });
  };

  // =====================================================
  // CANCEL ORDER
  // =====================================================

  const handleCancelOrder = async () => {
    if (!order) return;

    if (order.status !== "PENDING") {
      await Swal.fire({
        icon: "warning",
        title: "ไม่สามารถยกเลิกได้",
        text: "ร้านยืนยันออเดอร์แล้ว ไม่สามารถยกเลิกได้",
        confirmButtonColor: "#f97316",
        confirmButtonText: "ตกลง",
      });

      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "ยกเลิกออเดอร์?",
      text: "คุณต้องการยกเลิกออเดอร์นี้ใช่หรือไม่",
      showCancelButton: true,
      confirmButtonText: "ยืนยันยกเลิก",
      cancelButtonText: "ไม่ยกเลิก",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setCancellingOrder(true);

      await cancelOrder(token, order.id);

      await Swal.fire({
        icon: "success",
        title: "ยกเลิกออเดอร์สำเร็จ",
        text: "ออเดอร์ถูกยกเลิกแล้ว",
        confirmButtonColor: "#f97316",
        confirmButtonText: "ตกลง",
      });

      const res = await getOrderDetail(token, id);

      setOrder(res.data);
    } catch (error) {
      console.error("Cancel Order Error =", error);

      await Swal.fire({
        icon: "error",
        title: "ยกเลิกออเดอร์ไม่สำเร็จ",
        text: error?.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setCancellingOrder(false);
    }
  };

  const hasAddressCoords =
    defaultAddress?.lat != null &&
    defaultAddress?.lng != null &&
    Number.isFinite(Number(defaultAddress.lat)) &&
    Number.isFinite(Number(defaultAddress.lng));

  const addressPosition = hasAddressCoords
    ? [Number(defaultAddress.lat), Number(defaultAddress.lng)]
    : null;

  const navigationUrl = addressPosition
    ? `https://www.google.com/maps/dir/?api=1&destination=${addressPosition[0]},${addressPosition[1]}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(defaultAddress?.address || "")}`;

  return (
    <div
      className="
     min-h-screen
     bg-[#FFF8F0]
     mb-10 pb-10
   "
    >
      {/* =====================================================
HEADER
===================================================== */}

      <div
        className="
      sticky
      top-0
      z-20
      bg-white
      border-b
      border-orange-100
    "
      >
        <div
          className="
        max-w-6xl
        mx-auto
        px-4
        py-4
        flex
        items-center
        gap-3
      "
        >
          <button
            type="button"
            onClick={() => navigate("/user/userDelivery")}
            className="
          w-10
          h-10
          rounded-xl
          bg-gray-100
          hover:bg-orange-100
          flex
          items-center
          justify-center
          transition
        "
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1
              className="
            font-bold
            text-lg
            text-[#2A1B12]
          "
            >
              รายละเอียดออเดอร์
            </h1>

            <p
              className="
            text-xs
            text-gray-400
          "
            >
              <span className="ml-1 text-orange-500">
                #ORD
                {String(order.id).padStart(4, "0")}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div
        className="
      max-w-6xl
      mx-auto
      p-4
      sm:p-6
      pb-10
    "
      >
        {/* =====================================================
        CURRENT STATUS
    ===================================================== */}
        <div
          className={`
        ${currentStatus.bg}
        ${currentStatus.border}
        border
        rounded-xl
        p-3
        mb-4
      `}
        >
          <div
            className="
          flex
          items-center
          gap-2.5
          mb-3
        "
          >
            <div
              className={`
            w-9
            h-9
            rounded-lg
            ${currentStatus.iconBg}
            flex
            items-center
            justify-center
            shrink-0
          `}
            >
              <CurrentStatusIcon
                size={19}
                className={currentStatus.iconColor}
              />
            </div>

            <div className="min-w-0">
              <p
                className={`
              text-sm
              font-bold
              ${currentStatus.textColor}
            `}
              >
                {currentStatus.text}
              </p>

              <p
                className="
              text-[11px]
              text-gray-500
              truncate
            "
              >
                {currentStatus.description}
              </p>
            </div>
          </div>

          {order.status !== "CANCELLED" && (
            <div className="w-full">
              <div
                className="
              w-full
              flex
              items-start
            "
              >
                {processSteps.map((step, index) => {
                  const StepIcon = step.icon;

                  const stepNumber = index + 1;

                  const active = currentStep >= stepNumber;

                  const isLast = index === processSteps.length - 1;

                  return (
                    <div
                      key={step.label}
                      className="
                      flex-1
                      relative
                      min-w-0
                    "
                    >
                      <div
                        className="
                        flex
                        flex-col
                        items-center
                      "
                      >
                        <div
                          className={`
                          w-7
                          h-7
                          rounded-full
                          flex
                          items-center
                          justify-center
                          relative
                          z-10
                          ${
                            active
                              ? `${currentStatus.bar} text-white`
                              : "bg-gray-200 text-gray-400"
                          }
                        `}
                        >
                          <StepIcon size={13} />
                        </div>

                        <p
                          className={`
                          mt-1.5
                          text-[9px]
                          sm:text-[10px]
                          text-center
                          leading-tight
                          ${
                            active
                              ? "font-semibold text-gray-700"
                              : "text-gray-400"
                          }
                        `}
                        >
                          {step.label}
                        </p>
                      </div>

                      {!isLast && (
                        <div
                          className={`
                          absolute
                          top-[13px]
                          left-1/2
                          w-full
                          h-0.5
                          ${
                            currentStep > stepNumber
                              ? currentStatus.bar
                              : "bg-gray-200"
                          }
                        `}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!order.orderRoundId &&
            order.status !== "CANCELLED" &&
            order.createdAt && (
              <p className="mt-3 border-t border-gray-200 pt-3 text-center text-xs text-gray-500">
                คาดว่าจะได้รับอาหารภายใน{" "}
                <span className="font-semibold text-[#C4511A]">
                  {new Date(
                    new Date(order.createdAt).getTime() + 60 * 60 * 1000,
                  ).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Bangkok",
                  })}{" "}
                  น.
                </span>
              </p>
            )}
        </div>

        {/* =====================================================
        ORDER ROUND
    ===================================================== */}
        {orderRound && (
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
            gap-3
            mb-4
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
                <Clock size={21} />
              </div>

              <div>
                <p className="text-xs text-gray-400">รอบจัดส่ง</p>

                <h2 className="font-bold text-lg">
                  รอบที่ {orderRound.roundNumber ?? "-"}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                className="
              bg-orange-50
              rounded-xl
              p-3
            "
              >
                <p className="text-xs text-gray-400 mb-1">เวลาเริ่มรอบ</p>

                <p className="font-bold text-orange-600">
                  {orderRound.startTime || "-"} น.
                </p>
              </div>

              <div
                className="
              bg-orange-50
              rounded-xl
              p-3
            "
              >
                <p className="text-xs text-gray-400 mb-1">เวลาสิ้นสุดรอบ</p>

                <p className="font-bold text-orange-600">
                  {orderRound.endTime || "-"} น.
                </p>
              </div>
            </div>

            {orderRound.endTime && (
              <div
                className="
              mt-3
              bg-blue-50
              border
              border-blue-200
              rounded-xl
              p-3
            "
              >
                <p className="text-xs text-blue-500 mb-1">เวลาจัดส่งภายใน</p>

                <p className="font-bold text-blue-700">
                  {addDeliveryTime(orderRound.endTime, 20)} น.
                </p>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
CHAT DELIVERY
===================================================== */}
        {order.delivery?.id && (
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
            <div className="flex items-center gap-3">
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
                <MessageCircle size={21} />
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
                    : "สามารถติดต่อกับร้ารอาหารได้"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(`/user/DeliveryChat/${order.delivery.id}`, {
                  state: {
                    readOnly:
                      order.status === "CANCELLED" ||
                      order.delivery.status === "COMPLETED",

                    deliveryStatus: order.delivery.status,
                    orderStatus: order.status,
                  },
                })
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

              {order.status === "CANCELLED" ||
              order.delivery.status === "COMPLETED"
                ? "ดูประวัติแชท"
                : "ติดต่อร้านอาหาร"}
            </button>
          </div>
        )}
        {/* =====================================================
        PAYMENT STATUS
    ===================================================== */}
        {paymentStatus && !["PENDING", "CANCELLED"].includes(order.status) && (
          <div
            className={`
            ${paymentStatusData.className}
            border
            rounded-2xl
            p-4
            mb-5
          `}
          >
            <div
              className="
              flex
              items-center
              justify-between
              gap-4
            "
            >
              <div
                className="
                flex
                items-center
                gap-3
                min-w-0
              "
              >
                <div
                  className={`
                  w-11
                  h-11
                  rounded-xl
                  ${paymentStatusData.iconBg}
                  flex
                  items-center
                  justify-center
                  shrink-0
                `}
                >
                  <CreditCard
                    size={21}
                    className={paymentStatusData.iconColor}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs opacity-70">สถานะการชำระเงิน</p>

                  <p className="font-bold">{paymentStatusData.label}</p>

                  {paymentStatusData.description && (
                    <p className="text-xs opacity-70 mt-1">
                      {paymentStatusData.description}
                    </p>
                  )}
                </div>
              </div>

              {paymentStatus === "PENDING" &&
                !["PENDING", "CANCELLED"].includes(order.status) && (
                  <button
                    type="button"
                    onClick={handleGoPayment}
                    className="
        shrink-0
        bg-orange-500
        hover:bg-orange-600
        text-white
        px-4
        py-2
        rounded-xl
        text-sm
        font-bold
        transition
        shadow-sm
      "
                  >
                    ชำระเงิน
                  </button>
                )}
            </div>
          </div>
        )}

        {!order.orderRoundId && isOrderOverOneHour && (
          <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#F07836]">
                <Clock size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-[#C4511A]">
                  {order.status === "PENDING"
                    ? "ร้านยังไม่ยืนยันออเดอร์"
                    : order.status === "WAITING_PAYMENT" &&
                        paymentStatus === "PENDING"
                      ? "กรุณาชำระเงิน"
                      : "ออเดอร์ใช้เวลามากกว่า 1 ชั่วโมง"}
                </h3>

                <p className="mt-1 text-sm leading-6 text-orange-800">
                  {order.status === "PENDING"
                    ? "ออเดอร์นี้ผ่านมามากกว่า 1 ชั่วโมงแล้ว หากไม่ต้องการรอต่อ คุณสามารถยกเลิกออเดอร์ได้จากปุ่มยกเลิกด้านล่าง"
                    : order.status === "WAITING_PAYMENT" &&
                        paymentStatus === "PENDING"
                      ? "ร้านยืนยันออเดอร์มากกว่า 1 ชั่วโมงแล้ว แต่คุณยังไม่ได้ชำระเงิน โปรดชำระเงินเพื่อดำเนินการสั่งซื้อต่อ"
                      : "ออเดอร์นี้ถูกสั่งมาแล้วมากกว่า 1 ชั่วโมง กรุณาตรวจสอบสถานะออเดอร์ หากต้องการสอบถามเพิ่มเติม สามารถติดต่อร้านอาหาร หรือหากพบปัญหา สามารถแจ้งปัญหาออเดอร์ได้"}
                </p>

                {order.status !== "PENDING" &&
                  !(
                    order.status === "WAITING_PAYMENT" &&
                    paymentStatus === "PENDING"
                  ) && (
                    <button
                      type="button"
                      onClick={handleReportOrder}
                      className="mt-3 rounded-xl bg-[#F07836] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#E8491D]"
                    >
                      แจ้งปัญหาออเดอร์
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
        CANCEL
    ===================================================== */}
        {order.status === "PENDING" && (
          <div className="mb-5">
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={cancellingOrder}
              className="
            w-full
            rounded-xl
            border
            border-red-200
            bg-white
            py-3
            font-bold
            text-red-600
            transition
            hover:bg-red-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
            >
              {cancellingOrder ? (
                <span className="flex items-center justify-center gap-2">
                  <div
                    className="
                  h-5
                  w-5
                  animate-spin
                  rounded-full
                  border-2
                  border-red-200
                  border-t-red-600
                "
                  />
                  กำลังยกเลิก...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <XCircle size={18} />
                  ยกเลิกออเดอร์
                </span>
              )}
            </button>
          </div>
        )}

        {/* ===================== STORE ===================== */}
        <div className="mb-5 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
          <div className="flex items-start gap-3 p-4 sm:items-center sm:gap-4 sm:p-5">
            {/* STORE ICON */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#F07836] sm:h-14 sm:w-14">
              <Store size={26} strokeWidth={1.8} />
            </div>

            {/* STORE INFO */}
            <div className="min-w-0 flex-1">
              {/* ชื่อร้านอยู่คนละบรรทัดกับเบอร์โทรบนมือถือ */}
              <button
                type="button"
                onClick={() => navigate(`/user/storeRead/${order.storeId}`)}
                className="block w-fit max-w-full text-left text-lg font-bold leading-snug text-[#2A1B12] transition hover:text-[#F07836] [overflow-wrap:anywhere]"
              >
                {order.store?.storeName || "ไม่พบชื่อร้าน"}
              </button>

              {order.store?.phone && (
                <a
                  href={`tel:${order.store.phone}`}
                  className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-[#F07836] transition hover:text-[#E8491D]"
                >
                  <Phone size={15} className="shrink-0" />
                  <span className="break-all">{order.store.phone}</span>
                </a>
              )}

              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#F07836]" />
                ร้านค้าที่คุณสั่งอาหาร
              </div>
            </div>

            {/* STORE BADGE */}
            <div className="hidden shrink-0 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#E8491D] sm:block">
              <Store size={13} className="mr-1 inline" />
              ร้านอาหาร
            </div>
          </div>
        </div>

        {/* ===================== ADDRESS ===================== */}
        {defaultAddress && (
          <div className="mb-5 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
            {/* หัวข้อที่อยู่ */}
            <div className="p-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#F07836]">
                  <MapPin size={24} strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-medium text-gray-400">
                    ที่อยู่ของคุณ
                  </p>
                  <h2 className="text-lg font-bold text-[#2A1B12]">
                    {defaultAddress.label || "ที่อยู่จัดส่ง"}
                  </h2>
                  <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                    {defaultAddress.address || "ไม่มีรายละเอียดที่อยู่"}
                  </p>
                </div>
              </div>
            </div>

            {/* แผนที่ */}
            <div className="px-5 pb-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={17} className="text-[#F07836]" />
                  <span className="text-sm font-semibold text-[#2A1B12]">
                    ตำแหน่งจัดส่ง
                  </span>
                </div>
                {hasAddressCoords && (
                  <a
                    href={navigationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#E8491D] hover:underline"
                  >
                    เปิดแผนที่ <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>

              {/* แถบข้อมูลด้านล่าง */}
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#FFF8F0] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#F07836]">
                  <Home size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">ที่อยู่สำหรับจัดส่ง</p>
                  <p className="mt-0.5 break-words text-sm font-semibold text-[#2A1B12]">
                    {defaultAddress.label || "ที่อยู่ของฉัน"}
                  </p>
                </div>
                <MapPin size={18} className="shrink-0 text-[#F07836]" />
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
        FOOD ITEMS
    ===================================================== */}
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
        </div>
        {/* =====================================================
        PAYMENT SLIP
    ===================================================== */}
        {slipUrl && (
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
            gap-3
            mb-4
          "
            >
              <div
                className="
              w-11
              h-11
              rounded-xl
              bg-green-100
              text-green-600
              flex
              items-center
              justify-center
            "
              >
                <CreditCard size={21} />
              </div>

              <div>
                <p className="text-xs text-gray-400">หลักฐานการชำระเงิน</p>

                <h2 className="font-bold text-lg">สลิปการโอนเงิน</h2>
              </div>
            </div>

            <img
              src={slipUrl}
              alt="หลักฐานการชำระเงิน"
              className="
            w-full
            max-w-md
            mx-auto
            rounded-2xl
            border
          "
            />
          </div>
        )}
        {/* =====================================================
DELIVERY PROOF
===================================================== */}
        {order.delivery?.images?.length > 0 && (
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
        gap-3
        mb-4
      "
            >
              <div
                className="
          w-11
          h-11
          rounded-xl
          bg-green-100
          text-green-600
          flex
          items-center
          justify-center
        "
              >
                <CheckCircle2 size={21} />
              </div>

              <div>
                <p className="text-xs text-gray-400">หลักฐานการจัดส่ง</p>

                <h2 className="font-bold text-lg">หลักฐานการส่งอาหาร</h2>
              </div>
            </div>

            <div className="space-y-5">
              {/* PRIMARY */}
              {order.delivery.images
                .filter((image) => image?.proofType === "PRIMARY")
                .map((image) => {
                  const imageUrl = image?.secure_url || image?.url || null;

                  if (!imageUrl) return null;

                  return (
                    <div key={image.id}>
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        หลักฐานการส่ง
                      </p>

                      <img
                        src={imageUrl}
                        alt="หลักฐานการจัดส่ง"
                        className="
                  w-full
                  max-w-md
                  mx-auto
                  max-h-[500px]
                  rounded-2xl
                  border
                  object-contain
                  bg-gray-50
                "
                      />
                    </div>
                  );
                })}

              {/* ADDITIONAL */}
              {order.delivery.images
                .filter((image) => image?.proofType === "ADDITIONAL")
                .map((image) => {
                  const imageUrl = image?.secure_url || image?.url || null;

                  if (!imageUrl) return null;

                  return (
                    <div key={image.id}>
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        หลักฐานเพิ่มเติม
                      </p>

                      <img
                        src={imageUrl}
                        alt="หลักฐานการจัดส่งเพิ่มเติม"
                        className="
                  w-full
                  max-w-md
                  mx-auto
                  max-h-[500px]
                  rounded-2xl
                  border
                  object-contain
                  bg-gray-50
                "
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        {/* =====================================================
        ORDER NOTE
    ===================================================== */}
        {order.note && (
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
            <h2
              className="
            font-bold
            text-lg
            mb-2
          "
            >
              หมายเหตุ
            </h2>

            <p className="text-gray-600 text-sm">{order.note}</p>
          </div>
        )}
        {/* =====================================================
        REVIEW
        แสดงเฉพาะ COMPLETED
    ===================================================== */}
        {canReview && (
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
                <Star size={21} fill="currentColor" />
              </div>

              <div>
                <p className="text-xs text-gray-400">รีวิวออเดอร์</p>

                <h2 className="font-bold text-lg">
                  {review ? "รีวิวของคุณ" : "ให้คะแนนออเดอร์นี้"}
                </h2>
              </div>
            </div>

            {reviewLoading ? (
              <div className="text-center py-5 text-sm text-gray-400">
                กำลังโหลดรีวิว...
              </div>
            ) : review && !editingReview ? (
              <div>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={26}
                      className={
                        star <= Number(review.rating)
                          ? "text-orange-400"
                          : "text-gray-300"
                      }
                      fill={
                        star <= Number(review.rating) ? "currentColor" : "none"
                      }
                    />
                  ))}
                </div>

                {review.comment && (
                  <div
                    className="
                  bg-gray-50
                  rounded-xl
                  p-4
                  text-sm
                  text-gray-600
                  leading-6
                "
                  >
                    {review.comment}
                  </div>
                )}

                {!review.comment && (
                  <p className="text-sm text-gray-400">
                    ไม่มีความคิดเห็นเพิ่มเติม
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingReview(true)}
                    className="
                  flex-1
                  rounded-xl
                  border
                  border-orange-200
                  bg-orange-50
                  text-orange-600
                  py-2.5
                  text-sm
                  font-bold
                  hover:bg-orange-100
                  transition
                "
                  >
                    แก้ไขรีวิว
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveReview}
                    disabled={reviewSubmitting}
                    className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  text-red-600
                  px-5
                  py-2.5
                  text-sm
                  font-bold
                  hover:bg-red-100
                  transition
                  disabled:opacity-50
                "
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  {editingReview
                    ? "แก้ไขคะแนนและความคิดเห็นของคุณ"
                    : "คุณสามารถให้คะแนนและแสดงความคิดเห็นเกี่ยวกับออเดอร์นี้ได้"}
                </p>

                {/* STAR */}
                <div className="flex items-center gap-2 mb-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="
                    p-1
                    rounded-lg
                    hover:bg-orange-50
                    transition
                  "
                      aria-label={`ให้ ${star} ดาว`}
                    >
                      <Star
                        size={34}
                        className={
                          star <= reviewRating
                            ? "text-orange-400"
                            : "text-gray-300"
                        }
                        fill={star <= reviewRating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>

                {/* COMMENT */}
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="เขียนความคิดเห็นเพิ่มเติม (ไม่บังคับ)"
                  className="
                w-full
                rounded-xl
                border
                border-gray-200
                px-4
                py-3
                text-sm
                outline-none
                resize-none
                focus:border-orange-400
                focus:ring-2
                focus:ring-orange-100
              "
                />

                <div className="flex gap-2 mt-4">
                  {editingReview && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReview(false);

                        setReviewRating(Number(review?.rating || 0));

                        setReviewComment(review?.comment || "");
                      }}
                      disabled={reviewSubmitting}
                      className="
                    flex-1
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    text-gray-600
                    py-3
                    font-bold
                    text-sm
                    hover:bg-gray-100
                    transition
                    disabled:opacity-50
                  "
                    >
                      ยกเลิก
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting || reviewRating === 0}
                    className="
                  flex-1
                  rounded-xl
                  bg-orange-500
                  hover:bg-orange-600
                  text-white
                  py-3
                  font-bold
                  text-sm
                  transition
                  disabled:bg-gray-300
                  disabled:cursor-not-allowed
                "
                  >
                    {reviewSubmitting
                      ? "กำลังบันทึก..."
                      : review
                        ? "บันทึกการแก้ไข"
                        : "ส่งรีวิว"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* =====================================================
ORDER REPORT
===================================================== */}
        {reportLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 mb-5">
            <p className="text-sm text-gray-400 text-center">
              กำลังโหลดสถานะเรื่องร้องเรียน...
            </p>
          </div>
        ) : orderReport ? (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
                <CircleAlert size={21} />
              </div>

              <div>
                <p className="text-xs text-gray-400">เรื่องร้องเรียน</p>

                <h2 className="font-bold text-lg">สถานะการแจ้งปัญหา</h2>
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <span
                className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border ${
                  reportStatusClass[orderReport.status] ||
                  "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {reportStatusText[orderReport.status] ||
                  orderReport.status ||
                  "ไม่ทราบสถานะ"}
              </span>
            </div>

            {/* Problem type */}
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 mb-3">
              <p className="text-xs text-red-500 mb-1">ปัญหาที่แจ้ง</p>

              <p className="font-semibold text-red-700">
                {{
                  ORDER_NOT_DELIVERED: "ร้านยังไม่จัดส่ง",
                  WRONG_ORDER: "ได้รับอาหารไม่ตรงกับที่สั่ง",
                  MISSING_ITEM: "ได้รับอาหารไม่ครบ",
                  OTHER: "อื่น ๆ",
                }[orderReport.type] || "ไม่ระบุ"}
              </p>
            </div>

            {/* Customer detail */}
            {orderReport.detail && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  รายละเอียดที่แจ้ง
                </p>

                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600 whitespace-pre-wrap">
                  {orderReport.detail}
                </div>
              </div>
            )}

            {/* Admin response */}
            {orderReport.adminNote && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                <p className="text-sm font-semibold text-blue-700 mb-2">
                  การตอบกลับจาก Admin
                </p>

                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">
                  {orderReport.adminNote}
                </p>
              </div>
            )}

            {/* Waiting message */}
            {!orderReport.adminNote &&
              ["PENDING", "REVIEWING"].includes(orderReport.status) && (
                <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-4">
                  <p className="text-sm text-yellow-700">
                    {orderReport.status === "PENDING"
                      ? "ระบบได้รับเรื่องร้องเรียนแล้ว กรุณารอตรวจสอบ"
                      : "กำลังตรวจสอบเรื่องร้องเรียนของคุณ"}
                  </p>
                </div>
              )}
          </div>
        ) : null}
        {/* =====================================================
        ORDER SUMMARY
    ===================================================== */}
        <div
          className="
        bg-white
        rounded-2xl
        shadow-sm
        border
        border-orange-100
        p-5
      "
        >
          <h2
            className="
          font-bold
          text-lg
          mb-4
        "
          >
            สรุปคำสั่งซื้อ
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ค่าอาหาร</span>

              <span>฿{foodPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">ค่าจัดส่ง</span>

              <span>฿{deliveryFee.toFixed(2)}</span>
            </div>

            <div
              className="
            border-t
            pt-3
            flex
            justify-between
            text-base
            font-bold
          "
            >
              <span>ยอดรวม</span>

              <span className="text-orange-500">฿{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div
            className="
          mt-5
          pt-4
          border-t
          text-xs
          text-gray-400
        "
          >
            สั่งซื้อเมื่อ {formatDate(order.createdAt)}
          </div>

          {order &&
            ["CONFIRMED", "PREPARING", "READY", "COMPLETED"].includes(
              order.status,
            ) && (
              <button
                type="button"
                onClick={handleReportOrder}
                className="w-full mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 font-semibold hover:bg-red-100 transition"
              >
                แจ้งปัญหาออเดอร์
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
