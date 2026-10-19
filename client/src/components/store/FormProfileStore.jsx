import { useEffect, useState } from "react";
import usefoodDelivery from "../../globalState/fooddeliveryStore";

import {
  Store,
  User,
  Phone,
  MapPin,
  Mail,
  Clock,
  CalendarDays,
  Power,
  Settings,
  Star,
  ShoppingBag,
  MessageCircle,
  Zap,
  Clock3,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { toggleStoreStatus } from "../../api/createStore";
import { getMyStoreReviews } from "../../api/StoreOrder";
import Swal from "sweetalert2";

/* =====================================================
ส่วนประกอบย่อยสำหรับดีไซน์ (ไม่มีลอจิก)
===================================================== */

const SectionTitle = ({ icon: Icon, title, hint, right }) => (
  <div className="mb-6 flex items-start justify-between gap-4">
    <div className="flex items-center gap-3">
      {Icon && (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FDEBE4] text-[#E8491D]">
          <Icon size={20} />
        </span>
      )}
      <div>
        <h2 className="text-lg font-bold leading-tight text-[#2A1B12]">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-sm text-[#8A6A54]">{hint}</p>}
      </div>
    </div>
    {right}
  </div>
);

const InfoRow = ({ icon: Icon, label, value, tone }) => (
  <div className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
    >
      <Icon size={18} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-[#A8968A]">{label}</p>
      <p className="mt-0.5 break-words font-semibold leading-relaxed text-[#2A1B12]">
        {value}
      </p>
    </div>
  </div>
);

const FormProfileStore = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);
  const getStore = usefoodDelivery((state) => state.getStore);
  const stores = usefoodDelivery((state) => state.stores);

  const [reviewData, setReviewData] = useState({
    totalReviews: 0,
    averageRating: 0,
  });

  // =====================================================
  // โหลดข้อมูลร้าน + คะแนนรีวิว
  // =====================================================

  useEffect(() => {
    if (!token) return;

    const loadStoreData = async () => {
      try {
        await getStore(token);

        const reviewRes = await getMyStoreReviews(token);

        setReviewData({
          totalReviews: Number(reviewRes.data?.totalReviews || 0),
          averageRating: Number(reviewRes.data?.averageRating || 0),
        });
      } catch (error) {
        console.error("โหลดข้อมูลร้าน / รีวิวไม่สำเร็จ =", error);

        Swal.fire({
          title: "โหลดข้อมูลไม่สำเร็จ",
          text:
            error.response?.data?.message ||
            "ไม่สามารถโหลดข้อมูลร้านหรือรีวิวได้",
          icon: "error",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#F97316",
        });
      }
    };

    loadStoreData();
  }, [token, getStore]);

  // =====================================================
  // รูป QR Code ร้าน
  // =====================================================

  const qrImage = stores?.images?.find((image) =>
    image.public_id?.startsWith("StoreQR"),
  );

  // =====================================================
  // รูป Banner ร้าน
  // =====================================================

  const bannerImage = stores?.images?.find((image) =>
    image.public_id?.startsWith("StoreBanner2026"),
  );

  // =====================================================
  // รูปยืนยันตัวตน
  // =====================================================

  const verifyImages =
    stores?.images?.filter((image) =>
      image.public_id?.startsWith("Verify2026"),
    ) || [];

  // =====================================================
  // รูปโปรไฟล์ร้าน
  // =====================================================

  const storeImage = stores?.images?.find((image) =>
    image.public_id?.startsWith("StoreProfile2026"),
  );

  // =====================================================
  // วันเปิดร้าน
  // =====================================================

  const dayTH = {
    MON: "วันจันทร์",
    TUE: "วันอังคาร",
    WED: "วันพุธ",
    THU: "วันพฤหัสบดี",
    FRI: "วันศุกร์",
    SAT: "วันเสาร์",
    SUN: "วันอาทิตย์",
  };

  // =====================================================
  // เปิด / ปิดร้าน
  // =====================================================

  const handleToggleStatus = async () => {
    const isCurrentlyOpen = stores?.status === "OPEN";
    const newStatus = isCurrentlyOpen ? "CLOSED" : "OPEN";
    const actionText = isCurrentlyOpen ? "ปิดร้าน" : "เปิดร้าน";

    const result = await Swal.fire({
      title: `ยืนยัน${actionText}?`,
      text: isCurrentlyOpen
        ? "เมื่อตั้งค่าปิดร้าน ลูกค้าจะไม่สามารถสั่งอาหารจากร้านได้ตามปกติ"
        : "คุณต้องการเปิดร้านเพื่อรับออเดอร์ใช่หรือไม่",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `ยืนยัน${actionText}`,
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: isCurrentlyOpen ? "#DC2626" : "#10B981",
      cancelButtonColor: "#9CA3AF",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await toggleStoreStatus(token, newStatus);
      await getStore(token);

      await Swal.fire({
        title: "สำเร็จ",
        text: `เปลี่ยนสถานะร้านเป็น${isCurrentlyOpen ? "ปิดร้าน" : "เปิดร้าน"}เรียบร้อย`,
        icon: "success",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#F97316",
      });
    } catch (err) {
      console.error(err);

      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะร้านได้",
        icon: "error",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#F97316",
      });
    }
  };

  // =====================================================
  // คะแนนรีวิวจริง
  // =====================================================

  const rating = Number(reviewData.averageRating || 0);
  const totalReviews = Number(reviewData.totalReviews || 0);

  // =====================================================
  // จำนวนออเดอร์
  // =====================================================

  const orderCount = Number(stores?.completedOrderCount || 0);

  // =====================================================
  // ค่าที่ใช้แสดงผลเท่านั้น (ดีไซน์)
  // =====================================================

  const isOpen = stores?.status === "OPEN";

  const openDays =
    stores?.dayOpen
      ?.split(",")
      .map((day) => day.trim().replace(/^["']|["']$/g, ""))
      .filter((day) => day !== "") || [];

  const accountBadge = {
    ACTIVE: { text: "อนุมัติแล้ว", cls: "bg-emerald-50 text-emerald-700" },
    PENDING: { text: "รอตรวจสอบ", cls: "bg-amber-50 text-amber-700" },
    SUSPENDED: { text: "ถูกระงับ", cls: "bg-orange-50 text-orange-700" },
    BANNED: { text: "ถูกแบน", cls: "bg-red-50 text-red-700" },
  }[stores?.accountStatus] || { text: "-", cls: "bg-red-50 text-red-700" };

  const glassBtn =
    "flex h-10 items-center justify-center gap-2 rounded-full bg-white/90 text-sm font-semibold text-[#E8491D] shadow-md backdrop-blur transition hover:bg-white active:scale-95";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFCF7] via-[#FFF3E4] to-[#FFF8F0] px-4 pb-24 pt-5 sm:px-6">
      {" "}
      <div className="mx-auto max-w-5xl space-y-6">
        {/* HEADER */}{" "}
        <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_10px_40px_-18px_rgba(43,26,18,0.35)]">
          {" "}
          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#F7A23B] via-[#F2682B] to-[#E8491D] sm:h-52">
            {bannerImage?.url ? (
              <img
                src={bannerImage.url}
                alt="Banner ร้าน"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                {" "}
                <div className="absolute -right-10 -top-14 h-52 w-52 rounded-full bg-white/10" />{" "}
                <div className="absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-white/10" />{" "}
                <div className="absolute right-1/3 top-6 h-16 w-16 rounded-full bg-[#FFC145]/30" />
              </>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-black/10" />

            <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-5 sm:top-5">
              <button
                type="button"
                className={`${glassBtn} px-3 sm:px-4`}
                title="แชทกับลูกค้า"
                onClick={() => navigate("/store/chat")}
              >
                <MessageCircle size={17} />
                <span className="hidden sm:inline">แชทลูกค้า</span>
              </button>

              <button
                type="button"
                className={`${glassBtn} px-3 sm:px-4`}
                title="ดูรายงาน"
                onClick={() => navigate("/store/StoreReport")}
              >
                <ShoppingBag size={17} />
                <span className="hidden sm:inline">ดูรายงาน</span>
              </button>

              <button
                type="button"
                className={`${glassBtn} w-10`}
                title="ตั้งค่าร้าน"
                onClick={() => navigate("/store/StoreSetting")}
              >
                <Settings size={17} />
              </button>
            </div>
          </div>
          {/* ข้อมูลร้าน */}
          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:gap-6">
              <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[32px] border-[5px] border-white bg-gradient-to-br from-[#FFE9DC] to-[#FFF6EF] shadow-lg">
                  {storeImage?.url ? (
                    <img
                      src={storeImage.url}
                      alt="รูปโปรไฟล์ร้าน"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store size={46} className="text-[#E8491D]" />
                  )}
                </div>

                <span
                  className={`absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-[5px] border-white ${
                    isOpen ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1 sm:pb-1">
                <h1 className="truncate text-2xl font-bold text-[#2A1B12] sm:text-3xl">
                  {stores?.storeName || "ร้านของฉัน"}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stores?.storeCategories?.length > 0 ? (
                    stores.storeCategories
                      .filter((item) => item?.storeCategory)
                      .map((item) => (
                        <span
                          key={item.storeCategory.id}
                          className="rounded-full bg-[#FDEBE4] px-3 py-1 text-xs font-semibold text-[#C73A12]"
                        >
                          {item.storeCategory.name}
                        </span>
                      ))
                  ) : (
                    <p className="text-sm text-[#8A6A54]">
                      ยังไม่ได้เลือกประเภทร้าน
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold sm:mb-1 ${
                  isOpen
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${
                      isOpen ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                      isOpen ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                </span>
                {isOpen ? "กำลังเปิดรับออเดอร์" : "ร้านปิดอยู่"}
              </div>
            </div>

            {/* สถิติ */}
            <div className="mt-6 grid grid-cols-2 divide-x divide-[#F0E8E0] overflow-hidden rounded-2xl bg-[#FBF8F4] ring-1 ring-[#F0E8E0]">
              <div className="px-4 py-4 text-center sm:px-6">
                <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-[#2A1B12]">
                  <Star size={20} className="fill-[#FFC145] text-[#FFC145]" />
                  {totalReviews > 0 ? rating.toFixed(1) : "0.0"}
                </div>
                <p className="mt-1 text-xs font-medium text-[#A8968A]">
                  คะแนนเฉลี่ย
                  {totalReviews > 0 && ` • จาก ${totalReviews} รีวิว`}
                </p>
              </div>

              <div className="px-4 py-4 text-center sm:px-6">
                <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-[#2A1B12]">
                  <ShoppingBag size={20} className="text-[#E8491D]" />
                  {orderCount}
                </div>
                <p className="mt-1 text-xs font-medium text-[#A8968A]">
                  ออเดอร์ที่สำเร็จ
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* เนื้อหา 2 คอลัมน์ */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* คอลัมน์ซ้าย */}
          <div className="space-y-6 lg:col-span-3">
            {/* เวลาเปิดร้าน */}
            <section className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_-20px_rgba(43,26,18,0.4)]">
              <SectionTitle
                icon={Clock}
                title="เวลาเปิดร้าน"
                hint="วันและเวลาที่ลูกค้าสั่งอาหารได้"
              />

              <div className="mb-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#8A6A54]">
                  <CalendarDays size={16} className="text-[#E8491D]" />
                  วันเปิดร้าน
                </div>

                <div className="flex flex-wrap gap-2">
                  {openDays.map((day) => (
                    <span
                      key={day}
                      className="rounded-xl bg-[#FDEBE4] px-3.5 py-2 text-sm font-semibold text-[#C73A12]"
                    >
                      {dayTH[day] || day}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-700/70">
                    เปิด
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
                    {stores?.timeOpen || "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-xs font-medium text-red-600/70">ปิด</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">
                    {stores?.timeClose || "-"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-[#FBF8F4] p-4 ring-1 ring-[#F0E8E0] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isOpen
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-red-100 text-red-500"
                    }`}
                  >
                    <Power size={21} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-[#2A1B12]">สถานะร้าน</p>
                    <p className="text-sm leading-relaxed text-[#8A6A54]">
                      {isOpen ? "ร้านกำลังเปิดรับออเดอร์" : "ร้านปิดอยู่"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`w-full shrink-0 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition active:scale-95 sm:w-auto ${
                    isOpen
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
                >
                  {isOpen ? "ปิดร้าน" : "เปิดร้าน"}
                </button>
              </div>
            </section>

            {/* รูปแบบการรับออเดอร์ */}
            <section className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_-20px_rgba(43,26,18,0.4)]">
              <SectionTitle
                icon={ShoppingBag}
                title="รูปแบบการรับออเดอร์"
                hint="วิธีที่ลูกค้าสั่งอาหารจากร้านคุณ"
              />

              {stores?.orderMode === "REALTIME" && (
                <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-white p-5 ring-1 ring-emerald-100">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-800">
                      รับออเดอร์ตลอดเวลา
                    </h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-emerald-900/70">
                      ลูกค้าสามารถสั่งอาหารได้ทันที ในช่วงเวลาที่ร้านเปิด
                    </p>
                  </div>
                </div>
              )}

              {stores?.orderMode === "ROUND" && (
                <div className="rounded-2xl bg-gradient-to-br from-[#FFF3EA] to-white p-5 ring-1 ring-orange-100">
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8491D] text-white shadow-md shadow-orange-500/30">
                      <Clock3 size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#B8360F]">
                        รับออเดอร์เป็นรอบ
                      </h3>
                      <p className="text-sm text-[#8A6A54]">
                        ทั้งหมด {stores?.orderRound?.length || 0} รอบ
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {stores?.orderRound?.slice(0, 3).map((round) => (
                      <div
                        key={round.id}
                        className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#F0E8E0]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-1 rounded-full bg-[#E8491D]/70" />
                          <div>
                            <p className="font-semibold text-[#2A1B12]">
                              รอบที่ {round.roundNumber}
                            </p>
                            <p className="text-sm tabular-nums text-[#8A6A54]">
                              {round.startTime} - {round.endTime}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            round.status === "OPEN"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {round.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {stores?.orderRound?.length > 3 && (
                    <p className="mt-4 text-center text-sm text-[#8A6A54]">
                      และอีก {stores.orderRound.length - 3} รอบ
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* การยืนยันตัวตน */}
            <section className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_-20px_rgba(43,26,18,0.4)]">
              <SectionTitle
                title="การยืนยันตัวตน"
                hint="รูปที่ใช้สำหรับยืนยันตัวตนกับผู้ดูแลระบบ"
                right={
                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${accountBadge.cls}`}
                  >
                    {accountBadge.text}
                  </span>
                }
              />

              {verifyImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {verifyImages.map((image) => (
                    <div
                      key={image.id}
                      className="flex min-w-0 items-center justify-center overflow-hidden rounded-2xl bg-[#FBF8F4] p-2 ring-1 ring-[#F0E8E0]"
                    >
                      <img
                        src={image.url}
                        alt="รูปยืนยันตัวตน"
                        className="block h-auto max-h-80 w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-[#E6DCD2] bg-[#FBF8F4] p-8 text-center">
                  <div className="mb-2 text-4xl">📷</div>
                  <p className="font-semibold text-[#5A4638]">
                    ยังไม่มีการยืนยันตัวตน
                  </p>
                  <p className="mt-1 text-sm text-[#A8968A]">
                    กรุณาเพิ่มรูปสำหรับให้ผู้ดูแลระบบตรวจสอบ
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* คอลัมน์ขวา */}
          <div className="space-y-6 lg:col-span-2">
            {/* ข้อมูลร้าน */}
            <section className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_-20px_rgba(43,26,18,0.4)]">
              <SectionTitle title="ข้อมูลร้าน" />
              <div className="divide-y divide-[#F3ECE5]">
                <InfoRow
                  icon={Store}
                  label="ชื่อร้าน"
                  value={stores?.storeName || "-"}
                  tone="bg-[#FDEBE4] text-[#E8491D]"
                />
                <InfoRow
                  icon={User}
                  label="ชื่อผู้ใช้"
                  value={stores?.username || "-"}
                  tone="bg-sky-50 text-sky-600"
                />
                <InfoRow
                  icon={Mail}
                  label="อีเมล"
                  value={stores?.email || "-"}
                  tone="bg-indigo-50 text-indigo-600"
                />
                <InfoRow
                  icon={Phone}
                  label="เบอร์โทร"
                  value={stores?.phone || "-"}
                  tone="bg-emerald-50 text-emerald-600"
                />
                <InfoRow
                  icon={MapPin}
                  label="ที่อยู่"
                  value={stores?.address || "-"}
                  tone="bg-rose-50 text-rose-500"
                />
              </div>
            </section>

            {/* PAYMENT QR CODE */}
            <section className="overflow-hidden rounded-3xl bg-[#2A1B12] p-6 text-white shadow-[0_16px_40px_-20px_rgba(43,26,18,0.7)]">
              <div className="mb-5">
                <h2 className="text-lg font-bold">การรับชำระเงิน</h2>
                <p className="mt-0.5 text-sm text-white/60">
                  สแกน QR Code เพื่อชำระเงิน
                </p>
              </div>

              {qrImage?.url ? (
                <div className="flex flex-col items-center">
                  <div className="rounded-3xl bg-white p-4 shadow-xl">
                    <img
                      src={qrImage.url}
                      alt="QR Code สำหรับชำระเงิน"
                      className="h-56 w-56 object-contain"
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold">
                    สแกนเพื่อชำระเงิน
                  </p>
                  <p className="mt-0.5 text-sm text-white/60">
                    {stores?.storeName}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/store/UploadQr")}
                    className="mt-5 w-full rounded-xl bg-[#E8491D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#F2592D] active:scale-95"
                  >
                    เปลี่ยน QR Code
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-white/20 px-4 py-10 text-center">
                  <div className="mb-3 text-5xl">📱</div>
                  <p className="font-semibold">ยังไม่ได้เพิ่ม QR Code</p>
                  <p className="mt-1 text-sm text-white/60">
                    กรุณาเพิ่ม QR Code สำหรับรับชำระเงิน
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/store/UploadQr")}
                    className="mt-5 rounded-xl bg-[#E8491D] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#F2592D] active:scale-95"
                  >
                    เพิ่ม QR Code
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormProfileStore;
