import { useEffect, useState } from "react";

import {
  Store,
  Search,
  CheckCircle2,
  Clock3,
  Ban,
  ShieldAlert,
  ChevronDown,
  Loader2,
  Eye,
  X,
  Phone,
  MapPin,
  Mail,
  UtensilsCrossed,
  Navigation,
  Users,
  RefreshCw,
  CircleDot,
} from "lucide-react";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Swal from "sweetalert2";

import AdminNavbar from "../../components/nav/AdminNavbar";

import { getAllStores, changeStoreStatus } from "../../api/AdminStore";

// ==========================================
// LEAFLET ICON
// ==========================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ==========================================
// STATUS META
// ==========================================

const STATUS_META = {
  PENDING: {
    label: "รออนุมัติ",
    icon: Clock3,
    className: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-500",
  },

  ACTIVE: {
    label: "เปิดใช้งาน",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
    dot: "bg-emerald-500",
  },

  SUSPENDED: {
    label: "ระงับชั่วคราว",
    icon: ShieldAlert,
    className: "bg-orange-50 text-orange-600 border-orange-200",
    dot: "bg-orange-500",
  },

  BANNED: {
    label: "แบน",
    icon: Ban,
    className: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
  },
};

// ==========================================
// COMPONENT
// ==========================================

const AdminStoreStatus = () => {
  const [stores, setStores] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [selectedStore, setSelectedStore] = useState(null);

  const [updatingId, setUpdatingId] = useState(null);

  // ==========================================
  // GET STORES
  // ==========================================

  const fetchStores = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("adminToken");

      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "กรุณาเข้าสู่ระบบ",
          text: "ไม่พบ Admin Token",
          confirmButtonText: "เข้าสู่ระบบ",
          confirmButtonColor: "#f97316",
        });

        window.location.href = "/admin/login";
        return;
      }

      const res = await getAllStores(token);


      setStores(Array.isArray(res.data) ? res.data : res.data?.stores || []);
    } catch (error) {
      console.log("fetchStores Error =", error);

      Swal.fire({
        icon: "error",
        title: "โหลดข้อมูลไม่สำเร็จ",
        text:
          error.response?.data?.message ||
          error.message ||
          "ไม่สามารถโหลดข้อมูลร้านอาหารได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchStores();
  }, []);

  // ==========================================
  // CHANGE STATUS
  // ==========================================

  const handleChangeStatus = async (store, newStatus) => {
    if (store.accountStatus === newStatus) {
      return;
    }

    const meta = STATUS_META[newStatus];

    const result = await Swal.fire({
      icon: newStatus === "BANNED" ? "warning" : "question",

      title: "ยืนยันการเปลี่ยนสถานะ",

      html: `
        <div style="font-size:14px;color:#6b7280;">
          ร้าน
          <strong style="color:#111827;">
            ${store.storeName || "ไม่ระบุชื่อร้าน"}
          </strong>
          <br/>
          จะเปลี่ยนเป็น
          <strong style="color:#f97316;">
            ${meta.label}
          </strong>
        </div>
      `,

      showCancelButton: true,

      confirmButtonText: "ยืนยัน",

      cancelButtonText: "ยกเลิก",
      reverseButtons: true,

      confirmButtonColor: newStatus === "BANNED" ? "#dc2626" : "#f97316",

      cancelButtonColor: "#9ca3af",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setUpdatingId(store.id);

      const token = localStorage.getItem("adminToken");

      const res = await changeStoreStatus(token, store.id, newStatus);

      const updatedStore = res.data.store;

      setStores((prev) =>
        prev.map((item) => (item.id === store.id ? updatedStore : item)),
      );

      if (selectedStore?.id === store.id) {
        setSelectedStore(updatedStore);
      }

      await Swal.fire({
        icon: "success",
        title: "เปลี่ยนสถานะสำเร็จ",
        text: `${store.storeName} → ${meta.label}`,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.log("handleChangeStatus Error =", error);

      Swal.fire({
        icon: "error",
        title: "เปลี่ยนสถานะไม่สำเร็จ",
        text: error.response?.data?.message || "เกิดข้อผิดพลาด",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // VERIFY IMAGES
  // ==========================================

  const getVerifyImages = (store) => {
    return (
      store?.images?.filter((image) =>
        image.public_id?.startsWith("Verify2026"),
      ) || []
    );
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const keyword = search.toLowerCase().trim();

  const filteredStores = stores.filter((store) => {
    if (!keyword) {
      return true;
    }

    return (
      store.storeName?.toLowerCase().includes(keyword) ||
      store.username?.toLowerCase().includes(keyword) ||
      store.email?.toLowerCase().includes(keyword) ||
      store.phone?.includes(keyword)
    );
  });

  // ==========================================
  // SUMMARY
  // ==========================================

  const totalStores = stores.length;

  const pendingCount = stores.filter(
    (store) => store.accountStatus === "PENDING",
  ).length;

  const activeCount = stores.filter(
    (store) => store.accountStatus === "ACTIVE",
  ).length;

  const suspendedCount = stores.filter(
    (store) => store.accountStatus === "SUSPENDED",
  ).length;

  const bannedCount = stores.filter(
    (store) => store.accountStatus === "BANNED",
  ).length;

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <AdminNavbar />

        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <Loader2 size={28} className="animate-spin text-orange-500" />
            </div>

            <p className="text-sm font-medium text-gray-600">
              กำลังโหลดข้อมูลร้านอาหาร...
            </p>

            <p className="text-xs text-gray-400 mt-1">กรุณารอสักครู่</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RETURN
  // ==========================================

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <AdminNavbar />

      <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* ======================================
            PAGE HEADER
        ====================================== */}

        <div className="mb-7">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-sm">
                  <Store size={24} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
                    Admin Management
                  </p>

                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    จัดการร้านอาหาร
                  </h1>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                ตรวจสอบข้อมูลร้าน ตรวจสอบเอกสาร และจัดการสถานะร้านอาหาร
              </p>
            </div>

            <button
              type="button"
              onClick={fetchStores}
              className="
                self-start
                md:self-auto
                flex
                items-center
                gap-2
                px-4
                py-2.5
                rounded-xl
                bg-white
                border
                border-gray-200
                text-sm
                font-medium
                text-gray-600
                hover:border-orange-300
                hover:text-orange-500
                transition
                shadow-sm
              "
            >
              <RefreshCw size={16} />
              รีเฟรชข้อมูล
            </button>
          </div>
        </div>

        {/* ======================================
            SUMMARY
        ====================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <SummaryCard
            label="ร้านทั้งหมด"
            value={totalStores}
            icon={Store}
            className="bg-white text-gray-600 border-gray-100"
          />

          <SummaryCard
            label="รออนุมัติ"
            value={pendingCount}
            icon={Clock3}
            className="bg-amber-50 text-amber-600 border-amber-100"
          />

          <SummaryCard
            label="เปิดใช้งาน"
            value={activeCount}
            icon={CheckCircle2}
            className="bg-emerald-50 text-emerald-600 border-emerald-100"
          />

          <SummaryCard
            label="ระงับชั่วคราว"
            value={suspendedCount}
            icon={ShieldAlert}
            className="bg-orange-50 text-orange-600 border-orange-100"
          />

          <SummaryCard
            label="แบน"
            value={bannedCount}
            icon={Ban}
            className="bg-red-50 text-red-600 border-red-100"
          />
        </div>

        {/* ======================================
            SEARCH
        ====================================== */}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={19}
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อร้าน ชื่อผู้ใช้ เบอร์โทร หรืออีเมล..."
                className="
                  w-full
                  pl-11
                  pr-4
                  py-3
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  outline-none
                  text-sm
                  text-gray-700
                  placeholder:text-gray-400
                  focus:bg-white
                  focus:border-orange-400
                  focus:ring-4
                  focus:ring-orange-50
                  transition
                "
              />
            </div>

            <div className="flex items-center justify-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-sm text-gray-500">
                พบ{" "}
                <span className="font-bold text-gray-800">
                  {filteredStores.length}
                </span>{" "}
                ร้าน
              </span>
            </div>
          </div>
        </div>

        {/* ======================================
            STORE LIST
        ====================================== */}

        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">รายการร้านอาหาร</h2>

            <p className="text-xs text-gray-400 mt-1">
              เลือกร้านเพื่อดูข้อมูลเพิ่มเติม
            </p>
          </div>
        </div>

        {filteredStores.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm py-20 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Store size={30} className="text-gray-300" />
            </div>

            <p className="font-semibold text-gray-600">ไม่พบร้านอาหาร</p>

            <p className="text-sm text-gray-400 mt-1">ลองค้นหาด้วยคำอื่น</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                updatingId={updatingId}
                onDetail={() => setSelectedStore(store)}
                onChangeStatus={handleChangeStatus}
              />
            ))}
          </div>
        )}
      </main>

      {/* ========================================
          DETAIL MODAL
      ======================================== */}

      {selectedStore && (
        <StoreDetailModal
          store={selectedStore}
          updatingId={updatingId}
          getVerifyImages={getVerifyImages}
          onClose={() => setSelectedStore(null)}
          onChangeStatus={handleChangeStatus}
        />
      )}
    </div>
  );
};

// ==========================================
// SUMMARY CARD
// ==========================================

const SummaryCard = ({ label, value, icon: Icon, className }) => {
  return (
    <div
      className={`
        rounded-2xl
        border
        p-4
        shadow-sm
        ${className}
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs opacity-70 mb-1">{label}</p>

          <p className="text-2xl font-bold">{value}</p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// STORE CARD
// ==========================================

const StoreCard = ({ store, updatingId, onDetail, onChangeStatus }) => {
  const meta = STATUS_META[store.accountStatus] || STATUS_META.PENDING;

  const StatusIcon = meta.icon;

  const storeImage =
    store.images?.find((image) =>
      image.public_id?.startsWith("StoreProfile2026"),
    ) || store.images?.[0];

  return (
    <div
      className="
      bg-white
      rounded-3xl
      border
      border-gray-100
      shadow-sm
      hover:shadow-md
      hover:border-orange-100
      transition
      p-4
      md:p-5
    "
    >
      <div
        className="
        flex
        flex-col
        lg:flex-row
        lg:items-center
        gap-4
      "
      >
        {/* IMAGE */}

        <div
          className="
          w-20
          h-20
          rounded-2xl
          overflow-hidden
          bg-orange-50
          flex-shrink-0
        "
        >
          {storeImage?.url ? (
            <img
              src={storeImage.url}
              alt={store.storeName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-orange-400">
              <Store size={28} />
            </div>
          )}
        </div>

        {/* INFO */}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-base md:text-lg font-bold text-gray-800 truncate">
              {store.storeName || "ไม่ระบุชื่อร้าน"}
            </h3>

            <span
              className={`
                inline-flex
                items-center
                gap-1.5
                px-2.5
                py-1
                rounded-full
                border
                text-xs
                font-semibold
                ${meta.className}
              `}
            >
              <StatusIcon size={13} />
              {meta.label}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-3">
            @{store.username || "ไม่ระบุชื่อผู้ใช้"}
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-400">
            {store.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={13} />
                {store.phone}
              </span>
            )}

            {store.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={13} />
                {store.email}
              </span>
            )}

            {store.address && (
              <span className="flex items-center gap-1.5 max-w-full">
                <MapPin size={13} className="flex-shrink-0" />

                <span className="truncate">{store.address}</span>
              </span>
            )}
          </div>
        </div>

        {/* ACTION */}

        <div
          className="
          flex
          flex-wrap
          lg:flex-col
          xl:flex-row
          gap-2
          lg:min-w-[220px]
          lg:justify-end
        "
        >
          <button
            type="button"
            onClick={onDetail}
            className="
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              border
              border-gray-200
              bg-white
              text-gray-600
              text-sm
              font-semibold
              hover:border-orange-300
              hover:text-orange-500
              hover:bg-orange-50
              transition
            "
          >
            <Eye size={16} />
            ดูรายละเอียด
          </button>

          {updatingId === store.id ? (
            <div
              className="
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              bg-gray-50
              border
              border-gray-200
              text-sm
              text-gray-500
            "
            >
              <Loader2 size={16} className="animate-spin" />
              กำลังเปลี่ยน...
            </div>
          ) : (
            <div className="relative">
              <select
                value={store.accountStatus}
                onChange={(e) => onChangeStatus(store, e.target.value)}
                className="
                  appearance-none
                  w-full
                  h-10
                  pl-4
                  pr-10
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  text-sm
                  font-semibold
                  text-gray-700
                  outline-none
                  cursor-pointer
                  hover:bg-white
                  focus:bg-white
                  focus:border-orange-400
                  focus:ring-4
                  focus:ring-orange-50
                  transition
                "
              >
                <option value="PENDING">รออนุมัติ</option>

                <option value="ACTIVE">เปิดใช้งาน</option>

                <option value="SUSPENDED">ระงับชั่วคราว</option>

                <option value="BANNED">แบน</option>
              </select>

              <ChevronDown
                size={16}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  pointer-events-none
                  text-gray-400
                "
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// DETAIL MODAL
// ==========================================

const StoreDetailModal = ({
  store,
  updatingId,
  getVerifyImages,
  onClose,
  onChangeStatus,
}) => {
  const verifyImages = getVerifyImages(store);

  const hasLocation =
    store.lat !== null &&
    store.lat !== undefined &&
    store.lng !== null &&
    store.lng !== undefined &&
    !Number.isNaN(Number(store.lat)) &&
    !Number.isNaN(Number(store.lng));

  const storeImage =
    store.images?.find((image) =>
      image.public_id?.startsWith("StoreProfile2026"),
    ) || store.images?.[0];

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        bg-black/50
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-3
        md:p-6
      "
      onClick={onClose}
    >
      <div
        className="
          bg-white
          w-full
          max-w-4xl
          max-h-[94vh]
          overflow-hidden
          rounded-3xl
          shadow-2xl
          flex
          flex-col
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}

        <div
          className="
          flex
          items-center
          justify-between
          px-5
          py-4
          border-b
          border-gray-100
          bg-white
          flex-shrink-0
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
            "
            >
              <Store size={20} />
            </div>

            <div>
              <h2 className="font-bold text-gray-800">ข้อมูลร้านอาหาร</h2>

              <p className="text-xs text-gray-400 mt-0.5">
                ตรวจสอบรายละเอียดร้าน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              w-9
              h-9
              rounded-xl
              bg-gray-100
              text-gray-500
              flex
              items-center
              justify-center
              hover:bg-gray-200
              transition
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}

        <div
          className="
          overflow-y-auto
          p-4
          md:p-6
          space-y-6
        "
        >
          {/* STORE HERO */}

          <div
            className="
            rounded-2xl
            bg-gradient-to-r
            from-orange-50
            to-[#FFF8F0]
            border
            border-orange-100
            p-4
            md:p-5
          "
          >
            <div className="flex items-center gap-4">
              <div
                className="
                w-20
                h-20
                rounded-2xl
                overflow-hidden
                bg-white
                border
                border-orange-100
                flex-shrink-0
              "
              >
                {storeImage?.url ? (
                  <img
                    src={storeImage.url}
                    alt={store.storeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="
                    w-full
                    h-full
                    flex
                    items-center
                    justify-center
                    text-orange-400
                  "
                  >
                    <Store size={30} />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h3
                  className="
                  text-lg
                  md:text-xl
                  font-bold
                  text-gray-800
                "
                >
                  {store.storeName || "ไม่ระบุชื่อร้าน"}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  @{store.username || "ไม่ระบุชื่อผู้ใช้"}
                </p>

                <StatusBadge status={store.accountStatus} />
              </div>
            </div>
          </div>

          {/* BASIC INFO */}

          <SectionTitle icon={Store} title="ข้อมูลทั่วไป" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow
              icon={<Phone size={17} />}
              label="เบอร์โทรศัพท์"
              value={store.phone || "ไม่ระบุ"}
            />

            <InfoRow
              icon={<Mail size={17} />}
              label="อีเมล"
              value={store.email || "ไม่ระบุ"}
            />

            <InfoRow
              icon={<MapPin size={17} />}
              label="ที่อยู่ร้าน"
              value={store.address || "ไม่ระบุ"}
            />
            <InfoRow
              icon={<UtensilsCrossed size={17} />}
              label="ประเภทของร้าน"
              value={
                store.storeCategories?.length > 0
                  ? store.storeCategories
                      .map((item) => item.storeCategory?.name)
                      .filter(Boolean)
                      .join(", ") || "ไม่ระบุ"
                  : "ไม่ระบุ"
              }
            />
            <InfoRow
              icon={<Clock3 size={17} />}
              label="วันเปิดร้าน"
              value={
                store.dayOpen
                  ? store.dayOpen
                      .split(",")
                      .filter(Boolean)
                      .map((day) => {
                        const days = {
                          MON: "จันทร์",
                          TUE: "อังคาร",
                          WED: "พุธ",
                          THU: "พฤหัสบดี",
                          FRI: "ศุกร์",
                          SAT: "เสาร์",
                          SUN: "อาทิตย์",
                        };

                        return days[day.trim()] || day.trim();
                      })
                      .join(", ")
                  : "ไม่ระบุ"
              }
            />

            <InfoRow
              icon={<Clock3 size={17} />}
              label="เวลาเปิด - ปิด"
              value={
                store.timeOpen && store.timeClose
                  ? `${store.timeOpen} - ${store.timeClose}`
                  : "ไม่ระบุ"
              }
            />

            <InfoRow
              icon={<Store size={17} />}
              label="จำนวนเมนู"
              value={store.menus?.length || 0}
            />

            <InfoRow
              icon={<Users size={17} />}
              label="จำนวนรีวิว"
              value={store.reviews?.length || 0}
            />
          </div>

          {/* LOCATION */}

          <div>
            <SectionTitle icon={Navigation} title="ตำแหน่งร้าน" />

            {hasLocation ? (
              <>
                <div
                  className="
                  grid
                  grid-cols-2
                  gap-3
                  mb-3
                "
                >
                  <InfoRow
                    icon={<Navigation size={17} />}
                    label="Latitude"
                    value={Number(store.lat).toFixed(7)}
                  />

                  <InfoRow
                    icon={<Navigation size={17} />}
                    label="Longitude"
                    value={Number(store.lng).toFixed(7)}
                  />
                </div>

                <div
                  className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-gray-200
                  shadow-sm
                "
                >
                  <MapContainer
                    center={[Number(store.lat), Number(store.lng)]}
                    zoom={16}
                    scrollWheelZoom={true}
                    className="h-[300px] md:h-[360px] w-full"
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker position={[Number(store.lat), Number(store.lng)]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold">{store.storeName}</p>

                          <p className="text-xs text-gray-500 mt-1">
                            Lat: {Number(store.lat).toFixed(7)}
                          </p>

                          <p className="text-xs text-gray-500">
                            Lng: {Number(store.lng).toFixed(7)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </>
            ) : (
              <div
                className="
                rounded-2xl
                border
                border-dashed
                border-gray-300
                bg-gray-50
                p-10
                text-center
              "
              >
                <Navigation size={28} className="mx-auto text-gray-300 mb-2" />

                <p className="text-sm text-gray-400">ยังไม่มีข้อมูลพิกัดร้าน</p>
              </div>
            )}
          </div>

          {/* VERIFY */}

          <div>
            <SectionTitle icon={ShieldAlert} title="เอกสารยืนยันร้าน" />

            {verifyImages.length > 0 ? (
              <>
                <div
                  className="
                  flex
                  items-center
                  justify-between
                  mb-3
                  px-1
                "
                >
                  <p className="text-xs text-gray-400">
                    รูปที่ร้านส่งมาเพื่อให้ผู้ดูแลระบบตรวจสอบ
                  </p>

                  <span
                    className="
                    flex
                    items-center
                    gap-1
                    text-xs
                    font-semibold
                    text-emerald-600
                  "
                  >
                    <CheckCircle2 size={15} />
                    {verifyImages.length} รูป
                  </span>
                </div>

                <div
                  className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  gap-4
                "
                >
                  {verifyImages.map((image, index) => (
                    <div
                      key={image.id || image.public_id || index}
                      className="
                          relative
                          overflow-hidden
                          rounded-2xl
                          border
                          border-gray-200
                          bg-gray-100
                        "
                    >
                      <img
                        src={image.url}
                        alt={`รูปยืนยันตัวตน ${index + 1}`}
                        className="
                            h-64
                            md:h-72
                            w-full
                            object-cover
                          "
                      />

                      <div
                        className="
                          absolute
                          bottom-0
                          left-0
                          right-0
                          bg-gradient-to-t
                          from-black/70
                          to-transparent
                          px-4
                          pt-10
                          pb-3
                          text-xs
                          text-white
                        "
                      >
                        รูปยืนยันตัวตน {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div
                className="
                rounded-2xl
                border
                border-amber-200
                bg-amber-50
                p-4
              "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                    w-9
                    h-9
                    rounded-xl
                    bg-white
                    text-amber-500
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                  "
                  >
                    <ShieldAlert size={18} />
                  </div>

                  <div>
                    <p
                      className="
                      text-sm
                      font-semibold
                      text-amber-700
                    "
                    >
                      ร้านยังไม่ได้ส่งรูปยืนยันตัวตน
                    </p>

                    <p
                      className="
                      text-xs
                      text-amber-600
                      mt-1
                    "
                    >
                      กรุณาตรวจสอบข้อมูลก่อนอนุมัติร้าน
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CHANGE STATUS */}

          <div
            className="
            pt-5
            border-t
            border-gray-100
          "
          >
            <SectionTitle icon={CircleDot} title="จัดการสถานะร้าน" />

            <div
              className="
              grid
              grid-cols-2
              md:grid-cols-4
              gap-2
            "
            >
              {Object.entries(STATUS_META).map(([status, meta]) => {
                const Icon = meta.icon;

                const active = store.accountStatus === status;

                return (
                  <button
                    key={status}
                    type="button"
                    disabled={updatingId === store.id}
                    onClick={() => onChangeStatus(store, status)}
                    className={`
                      flex
                      items-center
                      justify-center
                      gap-2
                      px-3
                      py-3
                      rounded-xl
                      border
                      text-sm
                      font-semibold
                      transition
                      disabled:opacity-50
                      ${
                        active
                          ? meta.className
                          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300"
                      }
                    `}
                  >
                    {updatingId === store.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Icon size={16} />
                    )}

                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SECTION TITLE
// ==========================================

const SectionTitle = ({ icon: Icon, title }) => {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="
        w-8
        h-8
        rounded-lg
        bg-orange-50
        text-orange-500
        flex
        items-center
        justify-center
      "
      >
        <Icon size={16} />
      </div>

      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    </div>
  );
};

// ==========================================
// STATUS BADGE
// ==========================================

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.PENDING;

  const Icon = meta.icon;

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        mt-2
        px-3
        py-1
        rounded-full
        border
        text-xs
        font-semibold
        ${meta.className}
      `}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  );
};

// ==========================================
// INFO ROW
// ==========================================

const InfoRow = ({ icon, label, value }) => {
  return (
    <div
      className="
      flex
      items-start
      gap-3
      p-3
      rounded-xl
      bg-gray-50
      border
      border-gray-100
    "
    >
      <div
        className="
        w-9
        h-9
        rounded-lg
        bg-white
        text-orange-500
        flex
        items-center
        justify-center
        flex-shrink-0
        border
        border-gray-100
      "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>

        <p
          className="
          text-sm
          font-medium
          text-gray-700
          mt-0.5
          break-words
        "
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default AdminStoreStatus;
