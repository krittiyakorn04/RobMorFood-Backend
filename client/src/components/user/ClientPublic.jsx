import { useEffect, useMemo, useRef, useState } from "react";

import { useParams, useNavigate, useLocation } from "react-router-dom";
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
} from "lucide-react";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

import { addToCart, getCart } from "../../api/UserOrder";
import { getStoreClientPublic } from "../../api/UserProfile";

import UserCart from "./UserCart";

const ClientPublic = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const location = useLocation();
  const token = usefoodDelivery((state) => state.token);
  const processedAutoAddRef = useRef(null);
  const [store, setStore] = useState(null);
  const [cart, setCart] = useState(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");

  const [showCart, setShowCart] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);

  const [showOrderRounds, setShowOrderRounds] = useState(false);
  const [showStoreLocation, setShowStoreLocation] = useState(false);

  // =========================================================
  // โหลดข้อมูลร้าน
  // Public สามารถเข้าดูร้านได้โดยไม่ต้อง Login
  // =========================================================

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await getStoreClientPublic(id);

        setStore(res.data);

        // โหลดตะกร้าเฉพาะคนที่ Login
        if (token) {
          await reloadCart();
        } else {
          setCart(null);
        }
      } catch (error) {
        console.log("โหลดข้อมูลร้านไม่สำเร็จ =", error);
      }
    };

    if (id) {
      fetchStore();
    }
  }, [id, token]);

  // =========================================================
  // โหลดตะกร้า
  // =========================================================

  const reloadCart = async () => {
    if (!token) {
      setCart(null);
      return;
    }

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
  // Banner ร้าน
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

  // =========================================================
  // รวมเมนูทั้งหมด
  // =========================================================

  const menus = useMemo(() => {
    return categories.flatMap((category) =>
      (category.menus || []).map((menu) => ({
        ...menu,
        categoryId: Number(category.id),
      })),
    );
  }, [categories]);

  useEffect(() => {
    const autoAddMenuId = location.state?.autoAddMenuId;

    /*
    ยังไม่มีข้อมูลสำหรับทำต่อ
  */
    if (!token) return;
    if (!autoAddMenuId) return;
    if (!store) return;
    if (!menus.length) return;

    /*
    ป้องกันการทำงานซ้ำ
  */
    if (processedAutoAddRef.current === String(autoAddMenuId)) {
      return;
    }

    const menu = menus.find(
      (item) => String(item.id) === String(autoAddMenuId),
    );

    /*
    หาเมนูไม่เจอ
  */
    if (!menu) {
      processedAutoAddRef.current = String(autoAddMenuId);

      navigate(location.pathname, {
        replace: true,
        state: {},
      });

      Swal.fire({
        icon: "warning",
        title: "ไม่พบเมนู",
        text: "ไม่พบเมนูที่คุณเลือกก่อนเข้าสู่ระบบ",
        confirmButtonColor: "#FF6B35",
      });

      return;
    }

    /*
    จำว่าเมนูนี้กำลังถูกดำเนินการ
    เพื่อไม่ให้เพิ่มซ้ำ
  */
    processedAutoAddRef.current = String(autoAddMenuId);

    /*
    ล้าง state ทันที
    สำคัญมาก เพราะถ้า Refresh หน้า
    จะได้ไม่เพิ่มเมนูซ้ำ
  */
    navigate(location.pathname, {
      replace: true,
      state: {},
    });

    /*
    ร้านไม่ได้เปิด
  */
    if (store.status !== "OPEN") {
      Swal.fire({
        icon: "warning",
        title: "ร้านยังไม่เปิด",
        text: "ขณะนี้ร้านยังไม่สามารถรับออเดอร์ได้",
        confirmButtonColor: "#FF6B35",
      });

      return;
    }

    /*
    เมนูหมด / ปิดขาย
  */
    if (!menu.isAvailable) {
      Swal.fire({
        icon: "warning",
        title: "เมนูไม่พร้อมจำหน่าย",
        text: "เมนูนี้ไม่สามารถสั่งได้ในขณะนี้",
        confirmButtonColor: "#FF6B35",
      });

      return;
    }

    /*
    ถ้ามีตัวเลือก
    เปิด Modal ของเมนูเดิมทันที
  */
    if (Array.isArray(menu.options) && menu.options.length > 0) {
      setSelectedMenu(menu);
      return;
    }

    /*
    ไม่มีตัวเลือก
    เพิ่มเมนูเดิมเข้าตะกร้าอัตโนมัติ
  */
    const addMenuAfterLogin = async () => {
      try {
        await addToCart(token, {
          menuId: menu.id,
          count: 1,
          options: [],
        });

        await reloadCart();

        Swal.fire({
          icon: "success",
          title: "เพิ่มลงตะกร้าแล้ว",
          text: `${menu.nameMenu || menu.name || "เมนู"} ถูกเพิ่มลงตะกร้าแล้ว`,
          confirmButtonColor: "#FF6B35",
          timer: 1600,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("เพิ่มเมนูหลัง Login ไม่สำเร็จ:", error);

        const message =
          error.response?.data?.message || "ไม่สามารถเพิ่มเมนูลงตะกร้าได้";

        Swal.fire({
          icon: "error",
          title: "เพิ่มเมนูไม่สำเร็จ",
          text: message,
          confirmButtonColor: "#FF6B35",
        });
      }
    };

    addMenuAfterLogin();
  }, [
    token,
    store,
    menus,
    location.state?.autoAddMenuId,
    location.pathname,
    navigate,
  ]);

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

  // =========================================================
  // เมนูแนะนำ
  // =========================================================

  const recommendedMenus = useMemo(() => {
    return [...menus]
      .filter((menu) => menu.isAvailable)
      .sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
      .slice(0, 2);
  }, [menus]);

  // =========================================================
  // เพิ่มเมนูลงตะกร้า
  // =========================================================

  const handleAddToCart = async (menu) => {
    /*
    ยังไม่ได้ Login
    จำทั้ง URL ร้าน + menuId
  */
    if (!token) {
      setSelectedMenu(null);

      navigate("/UserLogin", {
        state: {
          from: `/user/storeRead/${id}`,
          menuId: menu.id,
        },
      });

      return;
    }

    /*
    ร้านไม่เปิด
  */
    if (store.status !== "OPEN") {
      Swal.fire({
        icon: "warning",
        title: "ร้านยังไม่เปิด",
        text: "ขณะนี้ร้านยังไม่สามารถรับออเดอร์ได้",
        confirmButtonColor: "#FF6B35",
      });

      return;
    }

    /*
    เมนูไม่พร้อมขาย
  */
    if (!menu.isAvailable) {
      Swal.fire({
        icon: "warning",
        title: "เมนูไม่พร้อมจำหน่าย",
        text: "เมนูนี้ไม่สามารถสั่งได้ในขณะนี้",
        confirmButtonColor: "#FF6B35",
      });

      return;
    }

    /*
    มีตัวเลือก
    เปิด Modal
  */
    if (Array.isArray(menu.options) && menu.options.length > 0) {
      setSelectedMenu(menu);
      return;
    }

    /*
    ไม่มีตัวเลือก
    เพิ่มทันที
  */
    try {
      await addToCart(token, {
        menuId: menu.id,
        count: 1,
        options: [],
      });

      await reloadCart();

      Swal.fire({
        icon: "success",
        title: "เพิ่มลงตะกร้าแล้ว",
        text: "เพิ่มเมนูลงตะกร้าเรียบร้อยแล้ว",
        confirmButtonColor: "#FF6B35",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("เพิ่มเมนูลงตะกร้าไม่สำเร็จ:", error);

      const message =
        error.response?.data?.message || "ไม่สามารถเพิ่มเมนูลงตะกร้าได้";

      Swal.fire({
        icon: "error",
        title: "เพิ่มเมนูไม่สำเร็จ",
        text: message,
        confirmButtonColor: "#FF6B35",
      });
    }
  };

  // =========================================================
  // เพิ่มเมนูที่มีตัวเลือก
  // =========================================================

  const handleAddMenuWithOptions = async (menu, selectedOptions) => {
    /*
    เผื่อ token หลุดระหว่างเปิด Modal
  */
    if (!token) {
      navigate("/UserLogin", {
        state: {
          from: `/user/storeRead/${id}`,
          menuId: menu.id,
        },
      });

      return;
    }

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
        title: "เพิ่มลงตะกร้าแล้ว",
        text: "เพิ่มเมนูพร้อมตัวเลือกลงตะกร้าเรียบร้อยแล้ว",
        confirmButtonColor: "#FF6B35",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("เพิ่มเมนูพร้อมตัวเลือกไม่สำเร็จ:", error);

      const message =
        error.response?.data?.message || "ไม่สามารถเพิ่มเมนูลงตะกร้าได้";

      Swal.fire({
        icon: "error",
        title: "เพิ่มเมนูไม่สำเร็จ",
        text: message,
        confirmButtonColor: "#FF6B35",
      });
    }
  };

  // =========================================================
  // Loading
  // =========================================================

  if (!store) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] animate-pulse">
        {/* Header / Banner */}
        <div className="h-56 bg-orange-100" />

        <div className="mx-auto max-w-6xl px-4 py-6">
          {/* Store info */}
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-2xl bg-orange-200" />

            <div className="flex-1 space-y-3">
              <div className="h-6 w-56 rounded-lg bg-orange-200" />
              <div className="h-4 w-40 rounded-lg bg-orange-100" />
              <div className="h-4 w-64 rounded-lg bg-orange-100" />
            </div>
          </div>

          {/* Category */}
          <div className="mt-8 flex gap-3 overflow-hidden">
            <div className="h-10 w-24 rounded-full bg-orange-200" />
            <div className="h-10 w-28 rounded-full bg-orange-100" />
            <div className="h-10 w-24 rounded-full bg-orange-100" />
            <div className="h-10 w-28 rounded-full bg-orange-100" />
          </div>

          {/* Menu */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-3xl bg-white shadow-sm"
              >
                <div className="h-48 bg-orange-100" />

                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/4 rounded-lg bg-orange-200" />
                  <div className="h-4 w-full rounded-lg bg-orange-100" />
                  <div className="h-4 w-1/2 rounded-lg bg-orange-100" />

                  <div className="flex items-center justify-between pt-2">
                    <div className="h-5 w-20 rounded-lg bg-orange-200" />
                    <div className="h-9 w-9 rounded-full bg-orange-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    <div className="min-h-screen w-full bg-[#FFF8F0]">
     
      <div className="mx-auto mb-1 w-full max-w-6xl px-4 py-6">
        {/* ================================================= */}
        {/* Banner */}
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

          {/* ประเภทร้าน */}

          {/* ประเภทร้าน */}

          <div className="mt-2 flex flex-wrap gap-2">
            {store.storeCategories?.length > 0 ? (
              store.storeCategories
                .filter((item) => item?.storeCategory)
                .map((item) => (
                  <span
                    key={item.storeCategory.id}
                    className="
            rounded-full
            bg-orange-100
            px-3
            py-1
            text-sm
            text-orange-600
          "
                  >
                    {item.storeCategory.name}
                  </span>
                ))
            ) : (
              <p className="text-[#8A6A54]">-</p>
            )}
          </div>

          {/* Rating / Delivery */}

          <div className="flex items-center gap-5 mt-4 pb-5 border-b border-orange-100">
        

            <div className="flex items-center gap-1.5 text-[#8A6A54] text-sm">
              <Bike size={16} className="text-[#FF6B35]" />
              ส่งภายใน 20-30 นาที
            </div>
          </div>

          {/* เวลาเปิดร้าน + ที่ตั้ง */}

          <div className="flex flex-wrap items-center gap-2.5 mt-5">
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

              <span className="text-gray-400 text-base">
                {showStoreLocation ? "−" : "+"}
              </span>
            </button>
          </div>

          {/* ================================================= */}
          {/* แผนที่ */}
          {/* ================================================= */}

          {showStoreLocation && (
            <div className="mt-4">
              {store.lat !== null &&
              store.lat !== undefined &&
              store.lng !== null &&
              store.lng !== undefined ? (
                <div
                  className="
                rounded-2xl
                overflow-hidden
                border
                border-orange-100
                bg-white
              "
                >
                  <MapContainer
                    center={[Number(store.lat), Number(store.lng)]}
                    zoom={16}
                    scrollWheelZoom={false}
                    dragging={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                    boxZoom={false}
                    keyboard={false}
                    className="w-full h-64"
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position={[Number(store.lat), Number(store.lng)]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold">{store.storeName}</p>

                          <p className="text-sm text-gray-500 mt-1">
                            ที่ตั้งร้าน
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>

                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        const lat = Number(store.lat);
                        const lng = Number(store.lng);

                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                          "_blank",
                        );
                      }}
                      className="
                    w-full
                    py-2.5
                    rounded-xl
                    bg-orange-500
                    hover:bg-orange-600
                    text-white
                    font-bold
                    transition
                  "
                    >
                      นำทางไปร้าน
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="
                rounded-xl
                border
                border-orange-100
                bg-[#FFF8F0]
                p-4
                text-center
                text-sm
                text-gray-500
              "
                >
                  ร้านยังไม่ได้ระบุตำแหน่งบนแผนที่
                </div>
              )}
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
        {/* รอบออเดอร์ */}
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
            <button
              type="button"
              onClick={() => setShowOrderRounds((prev) => !prev)}
              className="
            w-full
            flex
            items-center
            justify-between
            p-4
            text-left
            hover:bg-orange-50
            transition
          "
            >
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
                    {store.orderRound?.length > 0
                      ? `มี ${store.orderRound.length} รอบรับออเดอร์`
                      : "รับออเดอร์ตลอดเวลา"}
                  </p>
                </div>
              </div>

              <span className="text-gray-400 text-2xl font-light leading-none">
                {showOrderRounds ? "−" : "+"}
              </span>
            </button>

            {showOrderRounds && (
              <div className="border-t border-orange-100 p-4">
                {store.orderRound?.length > 0 ? (
                  <div className="space-y-3">
                    {store.orderRound.map((round) => (
                      <div
                        key={round.id}
                        className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      rounded-xl
                      border
                      border-orange-100
                      bg-[#FFF8F0]
                      p-4
                    "
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#2A1B12]">
                            รอบที่ {round.roundNumber}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {round.startTime} - {round.endTime}
                          </p>

                          {round.hasOrderLimit && (
                            <p className="text-xs text-gray-400 mt-1">
                              รับสูงสุด {round.maxOrders} ออเดอร์
                            </p>
                          )}
                        </div>

                        <span
                          className={`
                        flex-shrink-0
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        font-medium
                        ${
                          round.status === "OPEN"
                            ? "bg-green-100 text-green-700"
                            : round.status === "PENDING"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-600"
                        }
                      `}
                        >
                          {round.status === "OPEN"
                            ? "เปิดรับ"
                            : round.status === "PENDING"
                              ? "รอเปิด"
                              : "ปิด"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="
                  border
                  border-green-200
                  bg-green-50
                  rounded-xl
                  p-4
                "
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-green-600" />

                      <h3 className="font-bold text-green-700">
                        รับออเดอร์ตลอดเวลา
                      </h3>
                    </div>

                    <p className="text-gray-600 text-sm mt-1">
                      ลูกค้าสามารถสั่งอาหารได้ทันที ในช่วงเวลาที่ร้านเปิด
                    </p>
                  </div>
                )}
              </div>
            )}
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
        {/* หมวดหมู่ */}
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
        {/* เมนู */}
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
      {token && totalItems > 0 && (
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
      {/* ================================================= */}
      {/* Cart */}
      {/* ================================================= */}
      {showCart && token && (
        <UserCart
          token={token}
          storeId={id}
          cart={cart}
          setCart={setCart}
          onClose={() => setShowCart(false)}
        />
      )}
    </div>
  );
};

// =============================================================
// Menu Card
// =============================================================

const MenuCard = ({ menu, store, onAdd, isRecommended = false }) => {
  const isUnavailable = !menu.isAvailable;

  return (
    <div
      className="
     bg-white
     rounded-2xl
     shadow-sm
     border
     border-orange-100
     overflow-hidden
     hover:shadow-md
     transition
     cursor-pointer
   "
    >
      {" "}
      <div className="relative">
        <img
          src={menu.images?.[0]?.url || "https://picsum.photos/400/300"}
          alt={menu.menuItem}
          className={`             w-full
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

const MenuOptionModal = ({ menu, onClose, onAdd }) => {
  const [selected, setSelected] = useState({});

  const handleChoice = (option, choice) => {
    setSelected((prev) => {
      if (option.maxRequire === 1) {
        return {
          ...prev,
          [option.id]: [choice],
        };
      }

      const current = prev[option.id] || [];

      const exists = current.some((item) => item.id === choice.id);

      if (exists) {
        return {
          ...prev,
          [option.id]: current.filter((item) => item.id !== choice.id),
        };
      }

      if (current.length >= option.maxRequire) {
        return prev;
      }

      return {
        ...prev,
        [option.id]: [...current, choice],
      };
    });
  };

  const handleSubmit = () => {
    const result = [];

    for (const option of menu.options || []) {
      const choices = selected[option.id] || [];

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
      {" "}
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
        {" "}
        <div className="flex justify-between items-start">
          {" "}
          <div>
            {" "}
            <h2 className="text-xl font-bold text-[#2A1B12]">
              {menu.menuItem}{" "}
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

export default ClientPublic;
