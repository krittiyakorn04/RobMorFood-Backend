import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Star,
  Bike,
  Megaphone,
  PencilSparkles,
  MessageCircle,
} from "lucide-react";
import { getMyStoreReviews } from "../../api/StoreOrder";

const FirstPagesStore = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);

  // =========================
  // ตรวจสอบสิทธิ์แจ้งเตือน
  // =========================

  useEffect(() => {
    if (!token) return;

    // แสดงครั้งเดียวต่อแท็บ ไม่แสดงซ้ำเมื่อรีเฟรช
    const promptKey = `robmorfood_store_notification_prompted_${token}`;

    if (sessionStorage.getItem(promptKey)) return;
    sessionStorage.setItem(promptKey, "true");

    const checkNotification = async () => {
      // เบราว์เซอร์ไม่รองรับ Notification
      if (!("Notification" in window)) {
        await Swal.fire({
          icon: "info",
          title: "การแจ้งเตือนยังไม่รองรับ",
          html: `
          <div style="
            width: 100%;
            box-sizing: border-box;
            text-align: left;
            line-height: 1.8;
            overflow-wrap: anywhere;
            font-size: 14px;
          ">
            <p style="margin: 0;">
              หากต้องการรับการแจ้งเตือนออเดอร์
              กรุณาใช้เบราว์เซอร์และอุปกรณ์ที่รองรับการแจ้งเตือน
            </p>
          </div>
        `,
          confirmButtonText: "เข้าใจแล้ว",
          confirmButtonColor: "#f97316",
          width: "min(90vw, 420px)",
          padding: "1.25em",
        });
        return;
      }

      // อนุญาตแล้ว ไม่ต้องแสดงข้อความ
      if (Notification.permission === "granted") return;

      // ยังไม่อนุญาตหรือเคยปฏิเสธ
      await Swal.fire({
        icon: "warning",
        title: "กรุณาเปิดการแจ้งเตือน",
        html: `
        <div style="
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          text-align: left;
          line-height: 1.8;
          overflow-wrap: anywhere;
          font-size: 14px;
        ">
          <p style="margin: 0 0 12px;">
            เพื่อไม่ให้พลาดการแจ้งเตือนออเดอร์จากลูกค้า
            กรุณาไปที่การตั้งค่าเบราว์เซอร์
            และอนุญาตให้เว็บไซต์ RobMorFood ส่งการแจ้งเตือน
          </p>

          <p style="margin: 0; color: #c2410c;">
            เมื่ออนุญาตแล้ว คุณจะได้รับการแจ้งเตือนจากร้านได้สะดวกยิ่งขึ้น
          </p>
        </div>
      `,
        confirmButtonText: "เข้าใจแล้ว",
        confirmButtonColor: "#f97316",
        width: "min(90vw, 420px)",
        padding: "1.25em",
      });
    };

    checkNotification().catch((error) => {
      console.error("ตรวจสอบสิทธิ์แจ้งเตือนร้านไม่สำเร็จ:", error);
    });
  }, [token]);

  // =========================
  // CATEGORY / MENU / STORE
  // =========================

  const getCategory = usefoodDelivery((state) => state.getCategory);
  const categories = usefoodDelivery((state) => state.catagories);

  const getMenus = usefoodDelivery((state) => state.getMenus);
  const menus = usefoodDelivery((state) => state.menus);

  const getStore = usefoodDelivery((state) => state.getStore);
  const stores = usefoodDelivery((state) => state.stores);

  // =========================
  // STATE
  // =========================

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [selectedMenu, setSelectedMenu] = useState(null);

  const [isEditNotice, setIsEditNotice] = useState(false);

  const [notice, setNotice] = useState(
    "ตัวอย่างประกาศร้าน [วันนี้เปิดปกติ | ช่วง 11:30 - 13:00 อาจใช้เวลาจัดส่งเพิ่มประมาณ 10 นาที]",
  );

  // =========================
  // REVIEW
  // =========================

  const [reviewSummary, setReviewSummary] = useState({
    totalReviews: 0,
    averageRating: 0,
  });

  const [showOrderRounds, setShowOrderRounds] = useState(false);

  const isRoundMode = stores?.orderMode === "ROUND";

  const orderRounds = stores?.orderRound || [];

  // =====================================================
  // เวลาปัจจุบัน
  // =====================================================

  const getCurrentTimeInMinutes = () => {
    const now = new Date();

    return now.getHours() * 60 + now.getMinutes();
  };

  const timeToMinutes = (time) => {
    if (!time) return null;

    const [hours, minutes] = String(time).split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return hours * 60 + minutes;
  };

  const currentTime = getCurrentTimeInMinutes();

  // =====================================================
  // หารอบปัจจุบัน
  // =====================================================

  // รอบที่กำลังรับออเดอร์
  const openRound = orderRounds.find((round) => {
    const start = timeToMinutes(round.startTime);
    const end = timeToMinutes(round.endTime);

    if (start === null || end === null) {
      return false;
    }

    // ใช้เวลาเป็นหลัก เพื่อให้ตรงกับฝั่งลูกค้า
    if (start < end) {
      return currentTime >= start && currentTime < end;
    }

    if (start > end) {
      return currentTime >= start || currentTime < end;
    }

    return false;
  });

  // =====================================================
  // รอบที่เพิ่งหมดเวลารับออเดอร์
  // ถือเป็น "กำลังเตรียม/จัดส่ง"
  // 20 นาทีตาม DELIVERY_BUFFER
  // =====================================================

  const preparingRound = orderRounds.find((round) => {
    const start = timeToMinutes(round.startTime);
    const end = timeToMinutes(round.endTime);

    if (start === null || end === null) {
      return false;
    }

    const preparingEnd = end + 20;

    return currentTime >= end && currentTime < preparingEnd;
  });

  // =====================================================
  // รอบที่เอาไปแสดง
  // =====================================================

  const currentOrderRound = openRound || preparingRound || null;

  // =====================================================
  // ตรวจว่ากำลังเตรียมอาหาร/จัดส่งหรือไม่
  // =====================================================

  const isPreparingRound = !!preparingRound && !openRound;

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    if (!token) return;

    getCategory(token);
    getMenus(token);
    getStore(token);
  }, [token, getCategory, getMenus, getStore]);

  // =========================
  // LOAD STORE REVIEWS
  // =========================

  useEffect(() => {
    const fetchReviewSummary = async () => {
      if (!token) return;

      try {
        const res = await getMyStoreReviews(token);


        setReviewSummary({
          totalReviews: Number(res.data?.totalReviews || 0),
          averageRating: Number(res.data?.averageRating || 0),
        });
      } catch (error) {
        console.log("โหลดคะแนนร้านไม่สำเร็จ =", error);

        setReviewSummary({
          totalReviews: 0,
          averageRating: 0,
        });
      }
    };

    fetchReviewSummary();
  }, [token]);

  // =========================
  // SAVE NOTICE
  // =========================

  const handleSaveNotice = () => {
    // TODO:
    // เรียก API บันทึกประกาศร้าน
    // await updateNotice(token, notice)

    setIsEditNotice(false);
  };

  // =========================
  // FILTER MENU
  // =========================

  const filteredMenus = (menus || []).filter((menu) => {
    const menuName = menu.menuItem || "";

    const matchSearch = menuName.toLowerCase().includes(search.toLowerCase());

    if (activeCategory === "ทั้งหมด") {
      return matchSearch;
    }

    const category = (categories || []).find(
      (cat) => cat.nameCate === activeCategory,
    );

    return matchSearch && menu.categoryId === category?.id;
  });

  const recommendedMenus = [...(menus || [])]
    .filter((menu) => menu.isAvailable)
    .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
    .slice(0, 2);

  // =========================
  // STORE CATEGORIES
  // =========================

  const storeCategories = (stores?.storeCategories || []).filter(
    (item) => item?.storeCategory,
  );

  // =========================
  // BANNER
  // =========================

  const bannerImage = stores?.images?.find((image) =>
    image.public_id?.startsWith("StoreBanner2026"),
  );

  return (
    <div className="max-w-6xl mx-auto px-1 py-6 mb-20">
      {/* =====================================================
STORE HEADER
===================================================== */}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* =========================
        STORE COVER
    ========================= */}

        <div className="relative">
          {bannerImage?.url ? (
            <img
              src={bannerImage.url}
              alt="Banner ร้าน"
              className="w-full h-56 object-cover rounded-t-3xl"
            />
          ) : (
            <div className="w-full h-56 bg-orange-100 rounded-t-3xl flex items-center justify-center">
              <span className="text-gray-400">ยังไม่มีรูป Banner</span>
            </div>
          )}

          
        </div>

        {/* =====================================================
        STORE INFORMATION CARD
    ===================================================== */}

        <div
          className="
        relative
        -mt-10
        w-full
        bg-white
        rounded-3xl
        p-7
        border
        border-orange-100
        shadow-[0_20px_45px_-15px_rgba(42,27,18,0.25)]
        mb-10
      "
        >
          {/* =========================
          STORE STATUS
      ========================= */}

          <div
            className={`
          absolute
          top-7
          right-7
          flex
          items-center
          gap-2
          px-4
          py-1.5
          rounded-full
          border

          ${
            stores?.status === "OPEN"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }
        `}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`
              animate-ping
              absolute
              inline-flex
              h-full
              w-full
              rounded-full
              opacity-75

              ${stores?.status === "OPEN" ? "bg-green-400" : "bg-red-400"}
            `}
              />

              <span
                className={`
              relative
              inline-flex
              rounded-full
              h-2
              w-2

              ${stores?.status === "OPEN" ? "bg-green-500" : "bg-red-500"}
            `}
              />
            </span>

            <span
              className={`
            text-sm
            font-semibold
            whitespace-nowrap

            ${stores?.status === "OPEN" ? "text-green-600" : "text-red-600"}
          `}
            >
              {stores?.status === "OPEN" ? "เปิดร้านอยู่" : "ปิดร้าน"}
            </span>
          </div>

          {/* =========================
          STORE NAME
      ========================= */}

          <h1
            className="
          text-3xl
          font-bold
          text-[#2A1B12]
          pr-28
          break-words
        "
          >
            {stores?.storeName || "กำลังโหลด..."}
          </h1>

          {/* =========================
    SOCIAL LINKS
========================= */}

          {(stores?.facebookUrl ||
            stores?.instagramUrl ||
            stores?.tiktokUrl ||
            stores?.lineUrl) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {stores?.facebookUrl && (
                <a
                  href={stores.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
          inline-flex
          items-center
          gap-2
          px-3
          py-1.5
          rounded-full
          bg-blue-50
          border
          border-blue-200
          text-blue-600
          text-sm
          font-medium
          hover:bg-blue-100
          transition
        "
                >
                  <span className="font-bold">f</span>
                  Facebook
                </a>
              )}

              {stores?.instagramUrl && (
                <a
                  href={stores.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
          inline-flex
          items-center
          gap-2
          px-3
          py-1.5
          rounded-full
          bg-pink-50
          border
          border-pink-200
          text-pink-600
          text-sm
          font-medium
          hover:bg-pink-100
          transition
        "
                >
                  <span className="font-bold">◎</span>
                  Instagram
                </a>
              )}

              {stores?.tiktokUrl && (
                <a
                  href={stores.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
          inline-flex
          items-center
          gap-2
          px-3
          py-1.5
          rounded-full
          bg-gray-100
          border
          border-gray-300
          text-gray-700
          text-sm
          font-medium
          hover:bg-gray-200
          transition
        "
                >
                  <span className="font-bold">♪</span>
                  TikTok
                </a>
              )}

              {stores?.lineUrl && (
                <a
                  href={stores.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
          inline-flex
          items-center
          gap-2
          px-3
          py-1.5
          rounded-full
          bg-green-50
          border
          border-green-200
          text-green-600
          text-sm
          font-medium
          hover:bg-green-100
          transition
        "
                >
                  <MessageCircle size={15} />
                  Line
                </a>
              )}
            </div>
          )}

          {/* =====================================================
STORE CATEGORIES
===================================================== */}

          <div className="mt-2">
            <p className="text-sm text-[#8A6A54] mb-2">ประเภทร้าน</p>

            {storeCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {storeCategories.map((item) => (
                  <span
                    key={item.storeCategory?.id || item.id}
                    className="
            inline-flex
            items-center
            px-3
            py-1.5
            rounded-full
            bg-orange-50
            border
            border-orange-200
            text-orange-600
            text-sm
            font-medium
          "
                  >
                    {item.storeCategory?.name || "ไม่ระบุประเภท"}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[#8A6A54] text-sm">
                ยังไม่ได้ระบุประเภทร้าน
              </span>
            )}
          </div>

          {/* =========================
          RATING + DELIVERY
      ========================= */}

          <div
            className="
          flex
          flex-wrap
          items-center
          gap-5
          mt-5
          pb-5
          border-b
          border-orange-100
        "
          >
            {/* Rating */}

            <div className="flex items-center gap-2">
              <Star size={16} className="fill-[#FFC145] text-[#FFC145]" />

              <span className="font-bold text-[#2A1B12]">
                {reviewSummary.totalReviews > 0
                  ? reviewSummary.averageRating.toFixed(1)
                  : "0.0"}
              </span>

              <span className="text-[#B7A390] text-sm">
                ({reviewSummary.totalReviews} รีวิว)
              </span>

              <button
                type="button"
                onClick={() => navigate("/store/reviews")}
                className="
              text-sm
              font-semibold
              text-orange-500
              hover:text-orange-600
              hover:underline
              transition
            "
              >
                ดูรีวิวทั้งหมด
              </button>
            </div>

            <div className="w-px h-4 bg-orange-100" />

            {/* Delivery */}

            <div
              className="
    flex
    items-center
    gap-1.5
    text-[#8A6A54]
    text-sm
  "
            >
              <Bike size={16} className="text-[#FF6B35]" />
              ค่าส่ง {Number(stores?.deliveryFee ?? 0)} บาท
            </div>
          </div>

          {/* =========================
          OPEN / CLOSE TIME
      ========================= */}

          <div
            className="
          flex
          flex-wrap
          items-center
          gap-2.5
          mt-5
        "
          >
            <span
              className="
            inline-flex
            items-center
            gap-1.5
            px-4
            py-2
            rounded-full
            border
            border-orange-200
            bg-[#FFF8F0]
            text-[#8A6A54]
            text-sm
            font-medium
          "
            >
              <Clock size={14} />
              เปิด {stores?.timeOpen || "--:--"} น.
              {" - "}
              ปิด {stores?.timeClose || "--:--"} น.
            </span>
          </div>

          {/* =====================================================
          STORE NOTICE
      ===================================================== */}

          <div
            className="
          mt-6
          flex
          gap-3
          rounded-2xl
          border
          border-orange-200
          bg-gradient-to-r
          from-[#FFF8F0]
          to-[#FFF0DC]
          p-5
        "
          >
            <div
              className="
            flex-shrink-0
            w-9
            h-9
            rounded-full
            bg-[#E8491D]
            flex
            items-center
            justify-center
          "
            >
              <Megaphone size={16} className="text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#E8491D]">ประกาศร้าน</p>

              {isEditNotice ? (
                <div className="mt-2">
                  <textarea
                    value={notice}
                    onChange={(e) => setNotice(e.target.value)}
                    rows={3}
                    className="
                  w-full
                  rounded-xl
                  border
                  border-orange-200
                  px-3
                  py-2
                  text-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-orange-400
                "
                  />

                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleSaveNotice}
                      className="
                    px-4
                    py-2
                    rounded-lg
                    bg-orange-500
                    text-white
                    text-sm
                    font-semibold
                  "
                    >
                      บันทึก
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditNotice(false)}
                      className="
                    px-4
                    py-2
                    rounded-lg
                    bg-gray-100
                    text-gray-600
                    text-sm
                  "
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  className="
                text-[#8A6A54]
                text-sm
                mt-1
                leading-relaxed
              "
                >
                  {stores?.Notice || notice}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
    ORDER MODE
===================================================== */}

        <div className="mt-5">
          <div
            className="
      bg-white
      border
      border-orange-100
      rounded-2xl
      shadow-sm
      overflow-hidden
    "
          >
            {/* HEADER */}

            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="
              w-10
              h-10
              rounded-xl
              bg-orange-100
              text-orange-500
              flex
              items-center
              justify-center
              flex-shrink-0
            "
                  >
                    <Clock size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold text-lg text-[#2A1B12]">
                      รูปแบบรับออเดอร์
                    </h2>

                    <p className="text-sm text-gray-500">
                      {isRoundMode
                        ? `รับออเดอร์เป็นรอบ • ${orderRounds.length} รอบ`
                        : "รับออเดอร์ตลอดเวลา"}
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================
          REALTIME
      ================================================= */}

              {!isRoundMode && (
                <div
                  className="
            mt-4
            border
            border-green-200
            bg-green-50
            rounded-2xl
            p-4
          "
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="
                w-10
                h-10
                rounded-full
                bg-green-100
                flex
                items-center
                justify-center
              "
                    >
                      <Clock size={20} className="text-green-600" />
                    </div>

                    <div>
                      <p className="font-bold text-green-700">
                        รับออเดอร์ตลอดเวลา
                      </p>

                      <p className="text-sm text-green-600 mt-0.5">
                        สามารถสั่งอาหารได้ทันทีในช่วงที่ร้านเปิด
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
          ROUND
      ================================================= */}

              {isRoundMode && (
                <>
                  {/* ไม่มีรอบ */}

                  {orderRounds.length === 0 && (
                    <div
                      className="
                mt-4
                border
                border-gray-200
                bg-gray-50
                rounded-2xl
                p-4
                text-center
              "
                    >
                      <p className="text-gray-500 text-sm">
                        ขณะนี้ยังไม่มีรอบรับออเดอร์
                      </p>
                    </div>
                  )}

                  {/* =================================================
              รอบปัจจุบัน
          ================================================= */}

                  {currentOrderRound && (
                    <div
                      className={`
      mt-4
      rounded-2xl
      border-2
      p-5
      ${
        isPreparingRound
          ? "border-orange-300 bg-orange-50"
          : "border-green-300 bg-green-50"
      }
    `}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`
              px-3
              py-1
              rounded-full
              text-xs
              font-bold
              text-white
              ${isPreparingRound ? "bg-orange-500" : "bg-green-500"}
            `}
                            >
                              {isPreparingRound ? "กำลังเตรียม" : "รอบปัจจุบัน"}
                            </span>
                          </div>

                          <h3
                            className={`
            text-2xl
            font-bold
            mt-3
            ${isPreparingRound ? "text-orange-700" : "text-green-700"}
          `}
                          >
                            รอบที่ {currentOrderRound.roundNumber}
                          </h3>

                          <p className="text-lg font-semibold text-[#2A1B12] mt-1">
                            {currentOrderRound.startTime} -{" "}
                            {currentOrderRound.endTime} น.
                          </p>
                        </div>

                        <div
                          className={`
          w-14
          h-14
          rounded-full
          flex
          items-center
          justify-center
          ${isPreparingRound ? "bg-orange-100" : "bg-green-100"}
        `}
                        >
                          <Clock
                            size={28}
                            className={
                              isPreparingRound
                                ? "text-orange-600"
                                : "text-green-600"
                            }
                          />
                        </div>
                      </div>

                      <p
                        className={`
        text-sm
        mt-3
        ${isPreparingRound ? "text-orange-700" : "text-green-700"}
      `}
                      >
                        {isPreparingRound
                          ? "รอบนี้ปิดรับออเดอร์แล้ว กำลังเตรียมอาหารและจัดส่ง"
                          : "ตอนนี้ร้านกำลังรับออเดอร์ในรอบนี้"}
                      </p>

                      <div
                        className={`
        mt-3
        pt-3
        border-t
        ${isPreparingRound ? "border-orange-200" : "border-green-200"}
        space-y-1
      `}
                      >
                        <p className="text-sm font-semibold text-[#2A1B12]">
                          มี {Number(currentOrderRound.orderCount || 0)} ออเดอร์
                        </p>

                        {currentOrderRound.hasOrderLimit && (
                          <p className="text-sm text-gray-600">
                            รับสูงสุด {currentOrderRound.maxOrders} ออเดอร์
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* =================================================
              ยังไม่มีรอบปัจจุบัน
          ================================================= */}

                  {!currentOrderRound && orderRounds.length > 0 && (
                    <div
                      className="
                mt-4
                border
                border-gray-200
                bg-gray-50
                rounded-2xl
                p-4
              "
                    >
                      <p className="font-semibold text-gray-600">
                        ขณะนี้ยังไม่อยู่ในช่วงรับออเดอร์
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        สามารถดูรอบถัดไปได้จากรายการด้านล่าง
                      </p>
                    </div>
                  )}

                  {/* =================================================
              ปุ่มดูรอบทั้งหมด
          ================================================= */}

                  {orderRounds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowOrderRounds((prev) => !prev)}
                      className="
                mt-4
                w-full
                flex
                items-center
                justify-between
                px-4
                py-3
                rounded-xl
                border
                border-orange-200
                bg-[#FFF8F0]
                hover:bg-orange-50
                transition
              "
                    >
                      <span className="font-semibold text-orange-600">
                        {showOrderRounds
                          ? "ซ่อนรอบทั้งหมด"
                          : "ดูรอบรับออเดอร์ทั้งหมด"}
                      </span>

                      <span className="text-orange-500 text-lg">
                        {showOrderRounds ? "−" : "+"}
                      </span>
                    </button>
                  )}

                  {/* =================================================
              รายการรอบทั้งหมด
          ================================================= */}

                  {showOrderRounds && orderRounds.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {orderRounds.map((round) => {
                        const isCurrent = currentOrderRound?.id === round.id;
                        const isPreparing = round.roundStatus === "PREPARING";

                        return (
                          <div
                            key={round.id}
                            className={`
        flex
        items-center
        justify-between
        gap-4
        rounded-xl
        border
        p-4
        ${
          isCurrent && isPreparing
            ? "border-orange-300 bg-orange-50"
            : isCurrent
              ? "border-green-300 bg-green-50"
              : "border-orange-100 bg-[#FFF8F0]"
        }
      `}
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-[#2A1B12]">
                                  รอบที่ {round.roundNumber}
                                </p>

                                {isCurrent && !isPreparing && (
                                  <span
                                    className="
                px-2
                py-0.5
                rounded-full
                bg-green-500
                text-white
                text-xs
                font-semibold
              "
                                  >
                                    รอบปัจจุบัน
                                  </span>
                                )}

                                {isPreparing && (
                                  <span
                                    className="
                px-2
                py-0.5
                rounded-full
                bg-orange-500
                text-white
                text-xs
                font-semibold
              "
                                  >
                                    กำลังเตรียม
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-gray-500 mt-1">
                                {round.startTime} - {round.endTime} น.
                              </p>

                              {isPreparing && (
                                <p className="text-xs text-orange-600 mt-1">
                                  รอบนี้ปิดรับออเดอร์แล้ว
                                  กำลังเตรียมอาหารและจัดส่ง
                                </p>
                              )}

                              <p className="text-xs text-gray-500 mt-1">
                                มี {Number(round.orderCount || 0)} ออเดอร์
                              </p>

                              {round.hasOrderLimit && (
                                <p className="text-xs text-gray-400 mt-1">
                                  รับสูงสุด {round.maxOrders} ออเดอร์
                                </p>
                              )}
                            </div>

                            <Clock
                              size={18}
                              className={
                                isPreparing
                                  ? "text-orange-600"
                                  : isCurrent
                                    ? "text-green-600"
                                    : "text-gray-400"
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
        RECOMMENDED MENU
    ===================================================== */}

        {recommendedMenus.length > 0 && (
          <div className="mt-8 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-7 bg-orange-500 rounded-full" />

              <div>
                <h2 className="text-2xl font-bold text-[#2A1B12]">เมนูแนะนำ</h2>

                <p className="text-sm text-gray-500 mt-1">เมนูขายดีของร้าน</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full">
              {" "}
              {recommendedMenus.map((menu) => (
                <div
                  key={`recommended-${menu.id}`}
                  onClick={() => navigate(`/store/menu/${menu.id}`)}
                  className="
                bg-white
                rounded-2xl
                shadow-sm
                border
                overflow-hidden
                hover:shadow-md
                transition
                cursor-pointer
              "
                >
                  <div className="relative">
                    {menu.images?.[0]?.url ? (
                      <img
                        src={menu.images[0].url}
                        alt={menu.menuItem}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div
                        className="
                      w-full
                      h-40
                      bg-gray-100
                      flex
                      items-center
                      justify-center
                      text-gray-400
                    "
                      >
                        ไม่มีรูปภาพ
                      </div>
                    )}

                    <div
                      className="
                    absolute
                    top-3
                    left-3
                    bg-orange-500
                    text-white
                    px-3
                    py-1
                    rounded-full
                    text-xs
                    font-bold
                    shadow
                  "
                    >
                      ขายดี
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg line-clamp-1">
                      {menu.menuItem}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {menu.description || "ไม่มีรายละเอียด"}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-bold text-orange-500">
                        ฿{Number(menu.price || 0).toFixed(2)}
                        <span className="text-xs text-gray-400 mt-1 block">
                          ขายแล้ว {Number(menu.sold || 0)} รายการ
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          if (!menu.isAvailable) return;

                          setSelectedMenu(menu);
                        }}
                        className="
                      w-9
                      h-9
                      rounded-full
                      bg-orange-500
                      hover:bg-orange-600
                      text-white
                      transition
                    "
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================
        SEARCH MENU
    ===================================================== */}

        <input
          className="
        w-full
        border
        rounded-xl
        p-3
        mt-5
        focus:outline-none
        focus:ring-2
        focus:ring-orange-400
      "
          placeholder="ค้นหาเมนู..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* =====================================================
        MENU CATEGORY FILTER
    ===================================================== */}

        <div
          className="
        flex
        gap-3
        overflow-x-auto
        py-5
        no-scrollbar
      "
        >
          <button
            type="button"
            onClick={() => setActiveCategory("ทั้งหมด")}
            className={`
          px-4
          py-2
          rounded-full
          whitespace-nowrap

          ${
            activeCategory === "ทั้งหมด"
              ? "bg-orange-500 text-white"
              : "bg-gray-100"
          }
        `}
          >
            ทั้งหมด
          </button>

          {(categories || []).map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveCategory(cat.nameCate)}
              className={`
            px-4
            py-2
            rounded-full
            whitespace-nowrap

            ${
              activeCategory === cat.nameCate
                ? "bg-orange-500 text-white"
                : "bg-gray-100"
            }
          `}
            >
              {cat.nameCate}
            </button>
          ))}
        </div>

        {/* =====================================================
        MENU LIST
    ===================================================== */}

        {(categories || []).length === 0 ? (
          <div
            className="
          bg-white
          rounded-2xl
          border
          p-8
          text-center
          text-gray-500
        "
          >
            ยังไม่มีการเพิ่มหมวดหมู่เมนู
          </div>
        ) : activeCategory === "ทั้งหมด" && filteredMenus.length === 0 ? (
          <div
            className="
          bg-white
          rounded-2xl
          border
          p-8
          text-center
          text-gray-500
        "
          >
            ยังไม่มีการเพิ่มเมนู
          </div>
        ) : (
          (categories || [])
            .filter(
              (cat) =>
                activeCategory === "ทั้งหมด" || activeCategory === cat.nameCate,
            )
            .map((cat) => {
              const list = filteredMenus.filter(
                (menu) => menu.categoryId === cat.id,
              );

              return (
                <div
                  key={cat.id}
                  className="
                mb-10
                border-t
                border-gray-200
                pt-6
                first:border-t-0
                first:pt-0
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
                    w-1.5
                    h-7
                    bg-orange-500
                    rounded-full
                  "
                    />

                    <h2
                      className="
                    text-2xl
                    font-bold
                    text-gray-800
                  "
                    >
                      {cat.nameCate}
                    </h2>
                  </div>

                  {list.length === 0 ? (
                    <div
                      className="
                    bg-gray-50
                    border
                    rounded-2xl
                    p-6
                    text-center
                    text-gray-500
                  "
                    >
                      ยังไม่มีเมนูในหมวดหมู่นี้
                    </div>
                  ) : (
                    <div
                      className="
    grid
    grid-cols-2
    lg:grid-cols-3
    xl:grid-cols-4
    gap-5
    w-full
  "
                    >
                      {list.map((menu) => (
                        <div
                          key={menu.id}
                          onClick={() => navigate(`/store/menu/${menu.id}`)}
                          className="
                        bg-white
                        rounded-2xl
                        shadow-sm
                        border
                        overflow-hidden
                        hover:shadow-md
                        transition
                        cursor-pointer
                      "
                        >
                          <div className="relative">
                            {menu.images?.[0]?.url ? (
                              <img
                                src={menu.images[0].url}
                                alt={menu.menuItem}
                                className="w-full h-40 object-cover"
                              />
                            ) : (
                              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                                ไม่มีรูปภาพ
                              </div>
                            )}

                            {!menu.isAvailable && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <span className="bg-white px-5 py-2 rounded-full font-bold text-gray-700">
                                  หมด
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <h3
                              className="
                            font-bold
                            text-lg
                            line-clamp-1
                          "
                            >
                              {menu.menuItem}
                            </h3>

                            <p
                              className="
                            text-sm
                            text-gray-500
                            mt-1
                            line-clamp-2
                          "
                            >
                              {menu.description || "ไม่มีรายละเอียด"}
                            </p>

                            <div
                              className="
                            mt-4
                            flex
                            items-center
                            justify-between
                          "
                            >
                              <span
                                className="
                              font-bold
                              text-orange-500
                            "
                              >
                                ฿{Number(menu.price || 0).toFixed(2)}
                                <span className="text-xs text-gray-400 mt-1 block">
                                  ขายแล้ว {Number(menu.sold || 0)} รายการ
                                </span>
                              </span>

                              <button
                                type="button"
                                disabled={!menu.isAvailable}
                                onClick={(e) => {
                                  e.stopPropagation();

                                  if (!menu.isAvailable) return;

                                  setSelectedMenu(menu);
                                }}
                                className={`
                              w-9
                              h-9
                              rounded-full
                              text-white
                              transition

                              ${
                                menu.isAvailable
                                  ? "bg-orange-500 hover:bg-orange-600"
                                  : "bg-gray-300 cursor-not-allowed"
                              }
                            `}
                              >
                                {menu.isAvailable ? "+" : "หมด"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* =====================================================
      MENU OPTION MODAL
  ===================================================== */}

      {selectedMenu && (
        <div
          className="
        fixed
        inset-0
        bg-black/40
        flex
        items-center
        justify-center
        z-50
        p-4
      "
          onClick={() => setSelectedMenu(null)}
        >
          <div
            className="
          bg-white
          rounded-3xl
          p-6
          w-full
          max-w-md
          max-h-[80vh]
          overflow-y-auto
        "
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold">{selectedMenu.menuItem}</h2>

            <p className="text-gray-500 mt-1">{selectedMenu.description}</p>

            <div
              className="
            mt-3
            text-lg
            font-bold
            text-orange-500
          "
            >
              ฿{Number(selectedMenu.price || 0).toFixed(2)}
            </div>

            {selectedMenu.options?.length > 0 ? (
              <div className="mt-5 space-y-5">
                {selectedMenu.options.map((option) => (
                  <div
                    key={option.id}
                    className="
                  border-t
                  pt-4
                "
                  >
                    <div
                      className="
                    flex
                    justify-between
                  "
                    >
                      <h3 className="font-bold">{option.label}</h3>

                      {option.required && (
                        <span
                          className="
                        text-red-500
                        text-sm
                      "
                        >
                          จำเป็น
                        </span>
                      )}
                    </div>

                    <div
                      className="
                    mt-3
                    space-y-2
                  "
                    >
                      {option.choices?.map((choice) => (
                        <label
                          key={choice.id}
                          className="
                        flex
                        items-center
                        justify-between
                        border
                        rounded-xl
                        p-3
                        cursor-pointer
                        hover:bg-orange-50
                      "
                        >
                          <div
                            className="
                          flex
                          items-center
                          gap-3
                        "
                          >
                            {option.maxRequire === 1 ? (
                              <input
                                type="radio"
                                name={`option-${option.id}`}
                              />
                            ) : (
                              <input type="checkbox" />
                            )}

                            <span>{choice.name}</span>
                          </div>

                          {Number(choice.extraPrice || 0) > 0 && (
                            <span
                              className="
                            text-orange-500
                          "
                            >
                              +{Number(choice.extraPrice).toFixed(2)} บาท
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="
              text-gray-500
              mt-5
              bg-gray-50
              rounded-xl
              p-4
              text-center
            "
              >
                ไม่มีตัวเลือกเพิ่มเติม
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedMenu(null)}
              className="
            mt-6
            w-full
            bg-orange-500
            hover:bg-orange-600
            text-white
            py-3
            rounded-xl
            font-semibold
            transition
          "
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirstPagesStore;
