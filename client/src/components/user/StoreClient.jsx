import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  Clock,
  Star,
  Bike,
  Megaphone,
  ShoppingCart,
  Plus,
  X,
  MapPin,
  MessageCircle,
} from "lucide-react";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

import usefoodDelivery from "../../globalState/fooddeliveryStore";

import {
  addToCart,
  getCart,
  getStoreReviews,
  updateCart,
} from "../../api/UserOrder";
import { getStoreClient } from "../../api/UserProfile";

import UserCart from "./UserCart";

const timeToMinutes = (time) => {
  if (!time) return 0;

  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
};

const getCurrentOrderRound = (rounds = []) => {
  const now = new Date();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const round of rounds) {
    const start = timeToMinutes(round.startTime);
    const end = timeToMinutes(round.endTime);

    // กำลังรับออเดอร์
    if (currentMinutes >= start && currentMinutes < end) {
      return {
        ...round,
        roundStatus: "OPEN",
      };
    }

    // ช่วงเตรียมอาหาร / จัดส่ง 20 นาที
    if (currentMinutes >= end && currentMinutes < end + 20) {
      return {
        ...round,
        roundStatus: "PREPARING",
      };
    }
  }

  return null;
};

const StoreClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showStoreLocation, setShowStoreLocation] = useState(false);

  const token = usefoodDelivery((state) => state.token);

  const [store, setStore] = useState(null);
  const [cart, setCart] = useState(null);

  const [reviews, setReviews] = useState({
    totalReviews: 0,
    averageRating: 0,
  });

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");

  const [showCart, setShowCart] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [editingCartItem, setEditingCartItem] = useState(null);

  // เปิด/ปิดรายละเอียดรอบออเดอร์
  const [showOrderRounds, setShowOrderRounds] = useState(false);

  // =========================================================
  // โหลดข้อมูลร้าน
  // =========================================================

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await getStoreClient(token, id);



        setStore(res.data);

        // ร้านถูกระงับ/แบน ไม่ต้องโหลดตะกร้าของร้านนี้
        if (
          res.data?.merchantStatus !== "SUSPENDED" &&
          res.data?.merchantStatus !== "BANNED"
        ) {
          await reloadCart();
        } else {
          setCart(null);
        }
      } catch (error) {
        console.log("โหลดข้อมูลร้านไม่สำเร็จ =", error);
      }
    };

    if (id && token) {
      fetchStore();
    }
  }, [id, token]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id || !token) return;

      try {
        const res = await getStoreReviews(token, id);


        setReviews({
          totalReviews: Number(res.data?.totalReviews || 0),
          averageRating: Number(res.data?.averageRating || 0),
        });
      } catch (error) {
        console.log("โหลดคะแนนร้านไม่สำเร็จ =", error);

        setReviews({
          totalReviews: 0,
          averageRating: 0,
        });
      }
    };

    fetchReviews();
  }, [id, token]);

  // =========================================================
  // โหลดตะกร้า
  // =========================================================

  const reloadCart = async () => {
    try {
      const res = await getCart(token, id);



      setCart(res.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setCart(null);
      } else {
        console.log("โหลดตะกร้าไม่สำเร็จ =", error);
      }
    }
  };

  // =========================================================
  // BANNER ร้าน
  // หาเฉพาะรูปที่ public_id ขึ้นต้นด้วย StoreBanner2026
  // =========================================================

  const bannerImage = useMemo(() => {
    return (
      store?.images?.find((image) =>
        image.public_id?.startsWith("StoreBanner2026"),
      ) || null
    );
  }, [store]);

  // =========================================================
  // หมวดหมู่เมนู
  // =========================================================

  const categories = store?.menuCategories || [];

  const orderRounds = store?.orderRound || [];

  const currentOrderRound = useMemo(() => {
    return getCurrentOrderRound(orderRounds);
  }, [orderRounds]);

  const isRoundMode = store?.orderMode === "ROUND";

  // =========================================================
  // รวมเมนูทั้งหมดจากทุกหมวด
  // =========================================================

  const menus = useMemo(() => {
    return categories.flatMap((category) =>
      (category.menus || []).map((menu) => ({
        ...menu,
        categoryId: Number(category.id),
      })),
    );
  }, [categories]);

  // =========================================================
  // ค้นหาเมนู
  // =========================================================

  const filteredMenus = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return menus.filter((menu) => {
      const menuName = menu.menuItem?.toLowerCase() || "";

      const matchSearch = menuName.includes(keyword);

      if (activeCategory === "ทั้งหมด") {
        return matchSearch;
      }

      const category = categories.find(
        (cat) => String(cat.id) === String(activeCategory),
      );

      const matchCategory = Number(menu.categoryId) === Number(category?.id);

      return matchSearch && matchCategory;
    });
  }, [menus, categories, search, activeCategory]);

  const recommendedMenus = useMemo(() => {
    return [...menus]
      .filter((menu) => menu.isAvailable)
      .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
      .slice(0, 2);
  }, [menus]);

  const handleEditCartItem = (item) => {
    if (!item?.menu) return;

    setEditingCartItem(item);
  };

  const handleUpdateCartItem = async (item, selectedOptions) => {
    try {
      await updateCart(token, item.id, item.count, selectedOptions);

      setEditingCartItem(null);

      await reloadCart();

      Swal.fire({
        icon: "success",
        title: "แก้ไขเมนูเรียบร้อย",
        text: `${item.menu?.menuItem || "สินค้า"} ถูกอัปเดตแล้ว`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } catch (error) {
      console.log("แก้ไขเมนูไม่สำเร็จ =", error);

      Swal.fire({
        icon: "error",
        title: "แก้ไขเมนูไม่สำเร็จ",
        text:
          error.response?.data?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  // =========================================================
  // เพิ่มเมนูลงตะกร้า
  // =========================================================

  const handleAddToCart = async (menu) => {
    if (!token) {
      navigate("/ChooseLoing");
      return;
    }
    if (store.status !== "OPEN") {
      Swal.fire({
        icon: "warning",
        title: "ร้านยังไม่เปิด",
        text: "ไม่สามารถสั่งอาหารจากร้านนี้ได้ในขณะนี้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (!menu.isAvailable) {
      Swal.fire({
        icon: "warning",
        title: "เมนูหมด",
        text: "เมนูนี้ไม่พร้อมให้บริการในขณะนี้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    // ถ้ามีตัวเลือก ให้เปิด Modal
    if (menu.options?.length > 0) {
      setSelectedMenu(menu);
      return;
    }

    try {
      await addToCart(token, {
        menuId: menu.id,
        count: 1,
        options: [],
      });

      await reloadCart();

      Swal.fire({
        icon: "success",
        title: "เพิ่มลงตะกร้าสำเร็จ",
        text: `เพิ่ม ${menu.menuItem} ลงในตะกร้าแล้ว`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log("เพิ่มตะกร้าไม่สำเร็จ =", error);

      Swal.fire({
        icon: "error",
        title: "เพิ่มลงตะกร้าไม่สำเร็จ",
        text:
          error.response?.data?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  // =========================================================
  // เพิ่มเมนูที่มีตัวเลือก
  // =========================================================

  const handleAddMenuWithOptions = async (menu, selectedOptions) => {
    try {
      await addToCart(token, {
        menuId: menu.id,
        count: 1,
        options: selectedOptions,
      });

      setSelectedMenu(null);

      await reloadCart();

      Swal.fire({
        icon: "success",
        title: "เพิ่มลงตะกร้าสำเร็จ",
        text: `เพิ่ม ${menu.menuItem} ลงในตะกร้าแล้ว`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log("เพิ่มเมนูไม่สำเร็จ =", error);

      Swal.fire({
        icon: "error",
        title: "เพิ่มเมนูไม่สำเร็จ",
        text:
          error.response?.data?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  // =========================================================
  // Loading
  // =========================================================

  if (!store) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] font-kanit animate-pulse">
        <div className="mx-auto max-w-6xl px-3 py-6 mb-14">
          {/* Banner — ขนาดเดียวกับหน้าจริง */}
          <div className="h-56 w-full rounded-t-3xl bg-orange-100" />

          {/* Store Header */}
          <div className="relative -mt-10 mb-8 rounded-3xl border border-orange-100 bg-white p-7 shadow-xl">
            {/* สถานะร้าน */}
            <div className="absolute right-7 top-7 h-8 w-28 rounded-full bg-green-100" />

            {/* ชื่อร้าน */}
            <div className="h-9 w-2/3 max-w-64 rounded-lg bg-orange-200" />

            {/* Social links */}
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="h-8 w-24 rounded-full bg-orange-100" />
              <div className="h-8 w-28 rounded-full bg-orange-100" />
              <div className="h-8 w-20 rounded-full bg-orange-100" />
            </div>

            {/* ประเภทร้าน */}
            <div className="mt-3 flex gap-2">
              <div className="h-7 w-24 rounded-full bg-orange-100" />
              <div className="h-7 w-28 rounded-full bg-orange-100" />
            </div>

            {/* คะแนนและค่าส่ง */}
            <div className="mt-4 flex gap-5 border-b border-orange-100 pb-5">
              <div className="h-5 w-36 rounded-lg bg-orange-100" />
              <div className="h-5 w-28 rounded-lg bg-orange-100" />
            </div>

            {/* เวลาเปิดปิด / ที่ตั้ง / แชท */}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <div className="h-10 w-52 rounded-full bg-orange-100" />
              <div className="h-10 w-32 rounded-full bg-orange-100" />
              <div className="h-10 w-36 rounded-full bg-orange-100" />
            </div>

            {/* ประกาศร้าน */}
            <div className="mt-6 flex gap-3 rounded-2xl border border-orange-100 bg-[#FFF8F0] p-5">
              <div className="h-9 w-9 shrink-0 rounded-full bg-orange-200" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-24 rounded-lg bg-orange-200" />
                <div className="h-4 w-full rounded-lg bg-orange-100" />
                <div className="h-4 w-3/4 rounded-lg bg-orange-100" />
              </div>
            </div>
          </div>

          {/* รูปแบบรับออเดอร์ */}
          <div className="mt-5 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-100" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-40 rounded-lg bg-orange-200" />
                <div className="h-4 w-48 rounded-lg bg-orange-100" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-green-100" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 rounded-lg bg-green-100" />
                <div className="h-4 w-56 max-w-full rounded-lg bg-green-100" />
              </div>
            </div>
          </div>

          {/* เมนูแนะนำ */}
          <div className="mt-8 mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-7 w-1.5 rounded-full bg-orange-300" />
              <div className="space-y-2">
                <div className="h-7 w-32 rounded-lg bg-orange-200" />
                <div className="h-4 w-36 rounded-lg bg-orange-100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
                >
                  <div className="h-40 bg-orange-100" />
                  <div className="space-y-3 p-4">
                    <div className="h-5 w-3/4 rounded-lg bg-orange-200" />
                    <div className="h-8 w-full rounded-lg bg-orange-100" />
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-20 rounded-lg bg-orange-200" />
                      <div className="h-10 w-10 rounded-full bg-orange-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ช่องค้นหา */}
          <div className="mt-5 h-12 w-full rounded-xl border border-orange-100 bg-white" />

          {/* หมวดหมู่ */}
          <div className="flex gap-3 overflow-hidden py-5">
            <div className="h-10 w-24 shrink-0 rounded-full bg-orange-200" />
            <div className="h-10 w-28 shrink-0 rounded-full bg-orange-100" />
            <div className="h-10 w-24 shrink-0 rounded-full bg-orange-100" />
            <div className="h-10 w-28 shrink-0 rounded-full bg-orange-100" />
          </div>

          {/* รายการเมนู */}
          {[1, 2].map((section) => (
            <div key={section} className="mb-10 border-t border-gray-200 pt-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-7 w-1.5 rounded-full bg-orange-300" />
                <div className="h-7 w-36 rounded-lg bg-orange-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm"
                  >
                    <div className="h-40 bg-orange-100" />
                    <div className="space-y-3 p-4">
                      <div className="h-5 w-3/4 rounded-lg bg-orange-200" />
                      <div className="h-4 w-full rounded-lg bg-orange-100" />
                      <div className="h-4 w-1/2 rounded-lg bg-orange-100" />
                      <div className="flex items-center justify-between pt-1">
                        <div className="h-5 w-20 rounded-lg bg-orange-200" />
                        <div className="h-10 w-10 rounded-full bg-orange-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================
  // แจ้งเตือนร้านที่ถูกระงับหรือแบน
  // =========================================================

  if (
    store.merchantStatus === "SUSPENDED" ||
    store.merchantStatus === "BANNED"
  ) {
    const isBanned = store.merchantStatus === "BANNED";

    return (
      <div className="min-h-screen bg-[#FFF8F0] font-kanit flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl border border-orange-100 bg-white p-7 sm:p-10 text-center shadow-xl">
          <div
            className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
              isBanned ? "bg-red-100" : "bg-amber-100"
            }`}
            aria-hidden="true"
          >
            {isBanned ? "🚫" : "⏸️"}
          </div>

          <h1
            className={`text-2xl sm:text-3xl font-bold ${
              isBanned ? "text-red-600" : "text-amber-600"
            }`}
          >
            {isBanned
              ? "ร้านนี้ถูกแบน"
              : "ร้านนี้ถูกระงับการให้บริการ"}
          </h1>

          <p className="mt-3 text-lg font-semibold text-[#2A1B12]">
            {store.storeName || "ร้านอาหาร"}
          </p>

          <p className="mt-3 leading-relaxed text-gray-600">
            {isBanned
              ? "ขออภัย ร้านค้านี้ถูกแบนและไม่สามารถสั่งอาหารได้ในขณะนี้"
              : "ขออภัย ร้านค้านี้ถูกระงับการให้บริการชั่วคราว กรุณาลองใหม่ภายหลัง"}
          </p>

          <button
            type="button"
            onClick={() => navigate("/user/store")}
            className="mt-7 w-full rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600 sm:w-auto"
          >
            กลับไปหน้าร้านอาหาร
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // ข้อมูลตะกร้า
  // =========================================================

  const cartItems = cart?.menus || [];

  const totalItems = cartItems.reduce(
    (total, item) => total + Number(item.count || 0),
    0,
  );

  const calculatedCartTotal = cartItems.reduce((total, item) => {
    return total + Number(item.price || 0) * Number(item.count || 0);
  }, 0);

  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="min-h-screen bg-[#FFF8F0] font-kanit">
      <div className="max-w-6xl mx-auto px-3 py-6 mb-14">
        {/* ================================================= */}
        {/* Banner ร้าน */}
        {/* ================================================= */}

        <div className="relative">
          {bannerImage?.url ? (
            <img
              src={bannerImage.url}
              alt="Banner ร้าน"
              className="w-full h-56 object-cover rounded-t-3xl"
            />
          ) : (
            <div
              className="
                w-full
                h-56
                bg-orange-100
                rounded-t-3xl
                flex
                items-center
                justify-center
                text-gray-400
              "
            >
              ยังไม่มีรูป Banner ร้าน
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* Store Header */}
        {/* ================================================= */}

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
            shadow-xl
            mb-8
          "
        >
          {/* Status */}

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
                store.status === "OPEN"
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
                  ${store.status === "OPEN" ? "bg-green-400" : "bg-red-400"}
                `}
              />

              <span
                className={`
                  relative
                  inline-flex
                  rounded-full
                  h-2
                  w-2
                  ${store.status === "OPEN" ? "bg-green-500" : "bg-red-500"}
                `}
              />
            </span>

            <span
              className={`
                text-sm
                font-semibold
                ${store.status === "OPEN" ? "text-green-600" : "text-red-600"}
              `}
            >
              {store.status === "OPEN"
                ? "เปิดร้านอยู่"
                : store.status === "BUSY"
                  ? "ไม่รับออเดอร์ชั่วคราว"
                  : "ปิดร้าน"}
            </span>
          </div>

          {/* ชื่อร้าน */}

          <h1 className="text-3xl font-bold text-[#2A1B12] pr-32">
            {store.storeName}
          </h1>

          {/* =========================
    SOCIAL LINKS
========================= */}

          {(store.facebookUrl ||
            store.instagramUrl ||
            store.tiktokUrl ||
            store.lineUrl) && (
            <div className="flex flex-wrap items-center gap-2 mt-3 mb-4">
              {/* Facebook */}
              {store.facebookUrl && (
                <a
                  href={store.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
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
                  <span className="font-bold text-base">f</span>
                  Facebook
                </a>
              )}

              {/* Instagram */}
              {store.instagramUrl && (
                <a
                  href={store.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
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
                  <span className="font-bold text-base">◎</span>
                  Instagram
                </a>
              )}

              {/* TikTok */}
              {store.tiktokUrl && (
                <a
                  href={store.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
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
                  <span className="font-bold text-base">♪</span>
                  TikTok
                </a>
              )}

              {/* Line */}
              {store.lineUrl && (
                <a
                  href={store.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
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

          {/* ประเภทร้าน */}

          <div className="flex flex-wrap gap-2 mt-2">
            {store.storeCategories?.length > 0 ? (
              store.storeCategories.map((category) => (
                <span
                  key={category.id}
                  className="
          px-3
          py-1
          rounded-full
          bg-orange-100
          text-orange-600
          text-sm
        "
                >
                  {category.storeCategory?.name}
                </span>
              ))
            ) : (
              <p className="text-[#8A6A54]">-</p>
            )}
          </div>

          {/* Rating / Delivery */}

          <div
            className="
    flex
    items-center
    gap-3
    sm:gap-5
    mt-4
    pb-5
    border-b
    border-orange-100
    whitespace-nowrap
    overflow-hidden
  "
          >
            {/* คะแนน */}
            <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
              <Star
                size={15}
                className="fill-[#FFC145] text-[#FFC145] flex-shrink-0"
              />

              <span className="font-bold text-sm">
                {reviews?.totalReviews > 0
                  ? Number(reviews.averageRating).toFixed(1)
                  : "0.0"}
              </span>

              <span className="text-[#B7A390] text-xs sm:text-sm">
                ({reviews?.totalReviews || 0} รีวิว)
              </span>

              <button
                type="button"
                onClick={() => navigate(`/user/store/${id}/reviews`)}
                className="
        text-xs
        sm:text-sm
        font-semibold
        text-orange-500
        hover:text-orange-600
        hover:underline
        ml-1
      "
              >
                ดูรีวิวทั้งหมด
              </button>
            </div>

            {/* เวลา */}
            <div className="flex items-center gap-1.5 text-[#8A6A54] text-xs sm:text-sm flex-shrink-0">
              <Bike size={15} className="text-[#FF6B35] flex-shrink-0" />

              <span>ค่าส่ง {Number(store?.deliveryFee ?? 0)} บาท</span>
            </div>
          </div>

          {/* เวลาเปิดร้าน + ที่ตั้งร้าน */}

          {/* เวลาเปิดร้าน + ที่ตั้งร้าน + แชท */}

          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            {/* เวลาเปิดปิด */}

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
    "
            >
              <Clock size={14} />
              เปิด {store.timeOpen || "--:--"} น.
              {" - "}
              ปิด {store.timeClose || "--:--"} น.
            </span>

            {/* ที่ตั้งร้าน */}

            <button
              type="button"
              onClick={() => setShowStoreLocation((prev) => !prev)}
              className="
    inline-flex
    items-center
    gap-2
    px-4
    py-2
    rounded-full
    border
    border-orange-200
    bg-[#FFF8F0]
    text-[#8A6A54]
    text-sm
    hover:bg-orange-100
    hover:text-orange-600
    transition
  "
            >
              <MapPin size={15} className="text-orange-500" />
              <span>ที่ตั้งร้าน</span>
              <span className="text-gray-400">
                {showStoreLocation ? "−" : "+"}
              </span>
            </button>
            {/* แชทกับร้าน */}

            <button
              type="button"
              onClick={() => navigate(`/user/chat/store/${store.id}`)}
              className="
      inline-flex
      items-center
      gap-2
      px-4
      py-2
      rounded-full
      border
      border-orange-200
      bg-[#FFF8F0]
      text-orange-500
      text-sm
      font-semibold
      hover:bg-orange-100
      hover:text-orange-600
      transition
    "
            >
              <MessageCircle size={15} />
              <span>แชทกับร้าน</span>
            </button>
          </div>

          {showStoreLocation && (
            <div className="mt-4 w-full">
              <div className="rounded-2xl overflow-hidden border border-orange-100 bg-white">
                <div className="px-4 py-3 bg-[#FFF8F0]">
                  <div className="flex items-center gap-2">
                    <MapPin size={17} className="text-orange-500" />

                    <span className="text-sm font-semibold text-[#2A1B12]">
                      ที่ตั้งร้าน
                    </span>
                  </div>
                </div>

                {store?.lat != null && store?.lng != null ? (
                  <div className="w-full h-[250px]">
                    <iframe
                      title="แผนที่ร้าน"
                      src={`https://www.google.com/maps?q=${store.lat},${store.lng}&output=embed`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-gray-500">
                    ยังไม่มีข้อมูลตำแหน่งร้าน
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ประกาศร้าน */}

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

            <div>
              <p className="font-bold text-[#E8491D]">ประกาศร้าน</p>

              <p className="text-[#8A6A54] text-sm mt-1 leading-relaxed">
                {store.Notice || "ขณะนี้ยังไม่มีข้อมูลประกาศร้าน"}
              </p>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* รูปแบบรับออเดอร์ */}
        {/* ================================================= */}

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
            {/* Header */}

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

              {/* ================================================= */}
              {/* REALTIME */}
              {/* ================================================= */}

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

              {/* ================================================= */}
              {/* ROUND */}
              {/* ================================================= */}

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

                  {/* ================================================= */}
                  {/* รอบปัจจุบัน */}
                  {/* ================================================= */}

                  {currentOrderRound && (
                    <div
                      className={`
                mt-4
                rounded-2xl
                border-2
                p-5
                ${
                  currentOrderRound.roundStatus === "OPEN"
                    ? "border-green-300 bg-green-50"
                    : "border-orange-300 bg-orange-50"
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
                        ${
                          currentOrderRound.roundStatus === "OPEN"
                            ? "bg-green-500 text-white"
                            : "bg-orange-500 text-white"
                        }
                      `}
                            >
                              {currentOrderRound.roundStatus === "OPEN"
                                ? "รอบปัจจุบัน"
                                : "กำลังเตรียม"}
                            </span>
                          </div>

                          <h3
                            className={`
                      text-2xl
                      font-bold
                      mt-3
                      ${
                        currentOrderRound.roundStatus === "OPEN"
                          ? "text-green-700"
                          : "text-orange-700"
                      }
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
                    ${
                      currentOrderRound.roundStatus === "OPEN"
                        ? "bg-green-100"
                        : "bg-orange-100"
                    }
                  `}
                        >
                          <Clock
                            size={28}
                            className={
                              currentOrderRound.roundStatus === "OPEN"
                                ? "text-green-600"
                                : "text-orange-600"
                            }
                          />
                        </div>
                      </div>

                      {currentOrderRound.roundStatus === "OPEN" && (
                        <p className="text-sm text-green-700 mt-3">
                          ตอนนี้ร้านกำลังรับออเดอร์ในรอบนี้
                        </p>
                      )}

                      {currentOrderRound.roundStatus === "PREPARING" && (
                        <p className="text-sm text-orange-700 mt-3">
                          รอบนี้ปิดรับออเดอร์แล้ว กำลังเตรียมอาหารและจัดส่ง
                        </p>
                      )}

                      {currentOrderRound.hasOrderLimit && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-sm text-gray-600">
                            รับสูงสุด {currentOrderRound.maxOrders} ออเดอร์
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ================================================= */}
                  {/* ยังไม่มีรอบปัจจุบัน */}
                  {/* ================================================= */}

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

                  {/* ================================================= */}
                  {/* ปุ่มดูรอบทั้งหมด */}
                  {/* ================================================= */}

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

                  {/* ================================================= */}
                  {/* รายการรอบทั้งหมด */}
                  {/* ================================================= */}

                  {showOrderRounds && orderRounds.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {orderRounds.map((round) => {
                        const isCurrent = currentOrderRound?.id === round.id;

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
                        isCurrent
                          ? "border-green-300 bg-green-50"
                          : "border-orange-100 bg-[#FFF8F0]"
                      }
                    `}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-[#2A1B12]">
                                  รอบที่ {round.roundNumber}
                                </p>

                                {isCurrent && (
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
                              </div>

                              <p className="text-sm text-gray-500 mt-1">
                                {round.startTime} - {round.endTime} น.
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
                                isCurrent ? "text-green-600" : "text-gray-400"
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

        {/* ================================================= */}
        {/* เมนูแนะนำ */}
        {/* ================================================= */}

        {recommendedMenus.length > 0 && (
          <div className="mt-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-7 bg-orange-500 rounded-full" />

              <div>
                <h2 className="text-2xl font-bold text-[#2A1B12]">เมนูแนะนำ</h2>

                <p className="text-sm text-gray-500 mt-1">เมนูขายดีของร้าน</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {recommendedMenus.map((menu) => (
                <MenuCard
                  key={`recommended-${menu.id}`}
                  menu={menu}
                  store={store}
                  onAdd={handleAddToCart}
                  onClick={() => navigate(`/user/menu/${menu.id}`)}
                  isRecommended
                />
              ))}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* Search */}
        {/* ================================================= */}

        <input
          className="
            w-full
            border
            border-orange-100
            rounded-xl
            p-3
            mt-5
            bg-white
            outline-none
            focus:ring-2
            focus:ring-orange-300
          "
          placeholder="ค้นหาเมนู..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* ================================================= */}
        {/* หมวดหมู่เมนู */}
        {/* ================================================= */}

        {categories.length > 0 && (
          <div className="flex gap-3 overflow-x-auto py-5 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveCategory("ทั้งหมด")}
              className={`
                px-5
                py-2
                rounded-full
                whitespace-nowrap
                font-semibold
                ${
                  activeCategory === "ทั้งหมด"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 border border-orange-100"
                }
              `}
            >
              ทั้งหมด
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => setActiveCategory(String(category.id))}
                className={`
                  px-5
                  py-2
                  rounded-full
                  whitespace-nowrap
                  font-semibold
                  ${
                    String(activeCategory) === String(category.id)
                      ? "bg-orange-500 text-white"
                      : "bg-white text-gray-600 border border-orange-100"
                  }
                `}
              >
                {category.nameCate}
              </button>
            ))}
          </div>
        )}

        {/* ================================================= */}
        {/* ไม่มีหมวดหมู่ */}
        {/* ================================================= */}

        {categories.length === 0 ? (
          <div
            className="
              bg-white
              rounded-2xl
              border
              border-orange-100
              p-8
              text-center
              text-gray-500
            "
          >
            ร้านนี้ยังไม่มีการเพิ่มหมวดหมู่เมนู
          </div>
        ) : (
          <>
            {/* ================================================= */}
            {/* แสดงทั้งหมด */}
            {/* ================================================= */}

            {activeCategory === "ทั้งหมด"
              ? categories.map((category) => {
                  const categoryMenus = filteredMenus.filter(
                    (menu) => Number(menu.categoryId) === Number(category.id),
                  );

                  return (
                    <div
                      key={category.id}
                      className="
                          mb-10
                          border-t
                          border-gray-200
                          pt-6
                          first:border-t-0
                          first:pt-0
                        "
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-1.5 h-7 bg-orange-500 rounded-full" />

                        <h2 className="text-2xl font-bold text-gray-800">
                          {category.nameCate}
                        </h2>
                      </div>

                      {categoryMenus.length === 0 ? (
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
                          {search
                            ? "ไม่พบเมนูที่ค้นหา"
                            : "ยังไม่มีเมนูในหมวดหมู่นี้"}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {categoryMenus.map((menu) => (
                            <MenuCard
                              key={menu.id}
                              menu={menu}
                              store={store}
                              onAdd={handleAddToCart}
                              onClick={() => navigate(`/user/menu/${menu.id}`)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              : (() => {
                  const category = categories.find(
                    (cat) => String(cat.id) === String(activeCategory),
                  );

                  const categoryMenus = filteredMenus.filter(
                    (menu) => Number(menu.categoryId) === Number(category?.id),
                  );

                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-1.5 h-7 bg-orange-500 rounded-full" />

                        <h2 className="text-2xl font-bold text-gray-800">
                          {category?.nameCate || ""}
                        </h2>
                      </div>

                      {categoryMenus.length === 0 ? (
                        <div
                          className="
                            bg-white
                            rounded-2xl
                            border
                            border-orange-100
                            p-8
                            text-center
                            text-gray-500
                          "
                        >
                          {search
                            ? "ไม่พบเมนูที่ค้นหา"
                            : "ยังไม่มีเมนูในหมวดหมู่นี้"}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {categoryMenus.map((menu) => (
                            <MenuCard
                              key={menu.id}
                              menu={menu}
                              store={store}
                              onAdd={handleAddToCart}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
          </>
        )}
      </div>

      {/* ================================================= */}
      {/* Floating Cart */}
      {/* ================================================= */}

      {totalItems > 0 && (
        <button
          type="button"
          onClick={() => setShowCart(true)}
          className="
            fixed
            bottom-20
            right-6
            z-40
            bg-orange-500
            hover:bg-orange-600
            text-white
            rounded-full
            px-5
            py-3
            shadow-xl
            flex
            items-center
            gap-3
          "
        >
          <div className="relative">
            <ShoppingCart size={24} />

            <span
              className="
                absolute
                -top-3
                -right-3
                w-5
                h-5
                rounded-full
                bg-red-500
                text-xs
                flex
                items-center
                justify-center
              "
            >
              {totalItems}
            </span>
          </div>

          <span className="font-bold">฿{calculatedCartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* ================================================= */}
      {/* Menu Option Modal */}
      {/* ================================================= */}

      {selectedMenu && (
        <MenuOptionModal
          menu={selectedMenu}
          onClose={() => setSelectedMenu(null)}
          onAdd={handleAddMenuWithOptions}
        />
      )}

      {editingCartItem && (
        <MenuOptionModal
          menu={editingCartItem.menu}
          initialOptions={editingCartItem.options || []}
          mode="edit"
          onClose={() => setEditingCartItem(null)}
          onAdd={(menu, selectedOptions) =>
            handleUpdateCartItem(editingCartItem, selectedOptions)
          }
        />
      )}

      {/* ================================================= */}
      {/* Cart */}
      {/* ================================================= */}

      {showCart && (
        <UserCart
          token={token}
          storeId={id}
          cart={cart}
          setCart={setCart}
          onClose={() => setShowCart(false)}
          onEditItem={handleEditCartItem}
        />
      )}
    </div>
  );
};

// =============================================================
// Menu Card
// =============================================================

const MenuCard = ({ menu, store, onAdd, onClick, isRecommended = false }) => {
  const isUnavailable = !menu.isAvailable;

  return (
    <div
      onClick={onClick}
      className="
        bg-white
        rounded-2xl
        shadow-sm
        border
        border-orange-100
        overflow-hidden
        hover:shadow-md
        transition
      "
    >
      {/* รูปเมนู */}
      <div className="relative">
        <img
          src={menu.images?.[0]?.url || "https://picsum.photos/400/300"}
          alt={menu.menuItem}
          className={`
      w-full
      h-40
      object-cover
      ${isUnavailable ? "grayscale opacity-60" : ""}
    `}
        />

        {isRecommended && !isUnavailable && (
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
        shadow-md
      "
          >
            ขายดี
          </div>
        )}

        {/* สินค้าหมด */}
        {isUnavailable && (
          <div
            className="
        absolute
        inset-0
        flex
        items-center
        justify-center
        bg-black/25
      "
          >
            <span
              className="
          bg-red-500
          text-white
          px-4
          py-2
          rounded-full
          font-bold
          text-sm
          shadow-lg
        "
            >
              สินค้าหมด
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg line-clamp-1 text-[#2A1B12]">
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
            disabled={store.status !== "OPEN" || isUnavailable}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(menu);
            }}
            className={`
              w-10
              h-10
              rounded-full
              text-white
              flex
              items-center
              justify-center
              ${
                store.status === "OPEN" && !isUnavailable
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-gray-300 cursor-not-allowed"
              }
            `}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================
// Menu Option Modal
// =============================================================

const MenuOptionModal = ({
  menu,
  onClose,
  onAdd,
  initialOptions = [],
  mode = "add",
}) => {
  const [selected, setSelected] = useState({});

  // ===========================================================
  // เลือก Option
  // ===========================================================

  const handleChoice = (option, choice) => {
    setSelected((prev) => {
      // เลือกได้ 1 รายการ

      if (option.maxRequire === 1) {
        return {
          ...prev,
          [option.id]: [choice],
        };
      }

      // เลือกได้หลายรายการ

      const current = prev[option.id] || [];

      const exists = current.some((item) => item.id === choice.id);

      if (exists) {
        return {
          ...prev,
          [option.id]: current.filter((item) => item.id !== choice.id),
        };
      }

      // ถึงจำนวนสูงสุดแล้ว

      if (current.length >= option.maxRequire) {
        return prev;
      }

      return {
        ...prev,
        [option.id]: [...current, choice],
      };
    });
  };

  // ===========================================================
  // ยืนยันเพิ่มลงตะกร้า
  // ===========================================================

  const handleSubmit = () => {
    const result = [];

    for (const option of menu.options || []) {
      const choices = selected[option.id] || [];

      // ตรวจสอบ required

      if (option.required && choices.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "กรุณาเลือกตัวเลือก",
          text: `กรุณาเลือก ${option.label}`,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#f97316",
        });

        return;
      }

      choices.forEach((choice) => {
        result.push({
          optionId: option.id,

          optionLabel: option.label,

          choiceId: choice.id,

          choiceName: choice.name,

          extraPrice: Number(choice.extraPrice || 0),
        });
      });
    }

    onAdd(menu, result);
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]
        bg-black/40
        flex
        items-center
        justify-center
        p-4
      "
    >
      <div
        className="
          bg-white
          rounded-3xl
          p-6
          w-full
          max-w-md
          max-h-[85vh]
          overflow-y-auto
        "
      >
        {/* Header */}

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-[#2A1B12]">
              {menu.menuItem}
            </h2>

            <p className="text-sm text-gray-500 mt-1">{menu.description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              w-9
              h-9
              rounded-full
              bg-gray-100
              flex
              items-center
              justify-center
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* Options */}

        <div className="mt-5 space-y-5">
          {menu.options?.map((option) => (
            <div key={option.id} className="border-t pt-4">
              <div className="flex justify-between">
                <h3 className="font-bold">{option.label}</h3>

                {option.required && (
                  <span className="text-red-500 text-sm">จำเป็น</span>
                )}
              </div>

              {option.maxRequire > 1 && (
                <p className="text-xs text-gray-400 mt-1">
                  เลือกได้สูงสุด {option.maxRequire} รายการ
                </p>
              )}

              <div className="mt-3 space-y-2">
                {option.choices?.map((choice) => {
                  const checked = (selected[option.id] || []).some(
                    (item) => item.id === choice.id,
                  );

                  return (
                    <label
                      key={choice.id}
                      className={`
                            flex
                            items-center
                            justify-between
                            border
                            rounded-xl
                            p-3
                            cursor-pointer
                            ${
                              checked
                                ? "border-orange-500 bg-orange-50"
                                : "hover:bg-orange-50"
                            }
                          `}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type={option.maxRequire === 1 ? "radio" : "checkbox"}
                          name={
                            option.maxRequire === 1
                              ? `option-${option.id}`
                              : undefined
                          }
                          checked={checked}
                          onChange={() => handleChoice(option, choice)}
                        />

                        <span>{choice.name}</span>
                      </div>

                      {Number(choice.extraPrice || 0) > 0 && (
                        <span className="text-orange-500">
                          +{Number(choice.extraPrice).toFixed(2)} บาท
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Add */}

        <button
          type="button"
          onClick={handleSubmit}
          className="
            mt-6
            w-full
            bg-orange-500
            hover:bg-orange-600
            text-white
            py-3
            rounded-xl
            font-bold
          "
        >
          เพิ่มลงตะกร้า
        </button>
      </div>
    </div>
  );
};

export default StoreClient;
