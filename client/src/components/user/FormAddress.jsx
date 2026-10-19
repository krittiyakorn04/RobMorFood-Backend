import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Home,
  Navigation,
  Check,
  LocateFixed,
  Pencil,
  Trash2,
  X,
  Save,
  Plus,
  RefreshCw,
  Map,
  ArrowLeft,
} from "lucide-react";
import Swal from "sweetalert2";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import {
  createAddress,
  getAddress,
  updateAddress,
  removeAddress,
} from "../../api/UserProfile";

// =====================================================
// Leaflet marker icon
// =====================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_POSITION = [16.2465, 103.2505];

const EMPTY_FORM = {
  label: "",
  address: "",
  lat: String(DEFAULT_POSITION[0]),
  lng: String(DEFAULT_POSITION[1]),
  isDefault: false,
};

// =====================================================
// Map click handler
// =====================================================

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

function MapCenterUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return null;
}

// =====================================================
// Map in saved address
// =====================================================

function AddressMap({ lat, lng }) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  const valid =
    lat != null &&
    lng != null &&
    String(lat).trim() !== "" &&
    String(lng).trim() !== "" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;

  if (!valid) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
        <Map size={18} />
        ที่อยู่นี้ยังไม่มีพิกัดแผนที่
      </div>
    );
  }

  const position = [latitude, longitude];

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#F0E5DA]">
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{
          height: "170px",
          width: "100%",
          zIndex: 0,
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <Marker position={position} />
      </MapContainer>

      <a
        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-[#FFF7F0] px-3 py-3 text-sm font-semibold text-[#D96B2B] transition hover:bg-[#FFEDDF]"
      >
        <Navigation size={17} />
        เปิดตำแหน่งใน Google Maps
      </a>
    </div>
  );
}

// =====================================================
// Normalize API response
// =====================================================

function getAddressList(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.addresses)) return data.addresses;
  if (Array.isArray(data?.address)) return data.address;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

// =====================================================
// SweetAlert2 notification helper
// =====================================================

const showAlert = (icon, title, text = "") =>
  Swal.fire({
    icon,
    title,
    text,
    confirmButtonColor: "#E87532",
    cancelButtonColor: "#9CA3AF",
    customClass: {
      popup: "rounded-3xl",
      confirmButton: "rounded-xl px-5 py-2.5",
      cancelButton: "rounded-xl px-5 py-2.5",
    },
  });

// =====================================================
// Main component
// =====================================================

export default function FormAddAddress() {
  const navigate = useNavigate();
  const token = usefoodDelivery((state) => state.token);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [addresses, setAddresses] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [locating, setLocating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const position =
    form.lat !== "" &&
    form.lng !== "" &&
    Number.isFinite(Number(form.lat)) &&
    Number.isFinite(Number(form.lng)) &&
    Math.abs(Number(form.lat)) <= 90 &&
    Math.abs(Number(form.lng)) <= 180
      ? [Number(form.lat), Number(form.lng)]
      : DEFAULT_POSITION;

  // ===================================================
  // Load addresses
  // ===================================================

  const loadAddresses = useCallback(async () => {
    if (!token) {
      setAddresses([]);
      return;
    }

    try {
      setLoadingAddresses(true);

      const response = await getAddress(token);
      setAddresses(getAddressList(response));
    } catch (error) {
      console.error("โหลดที่อยู่ไม่สำเร็จ:", error);

      showAlert(
        "error",
        "โหลดรายการที่อยู่ไม่สำเร็จ",
        error.response?.data?.message || "กรุณาลองอีกครั้ง"
      );
    } finally {
      setLoadingAddresses(false);
    }
  }, [token]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // ===================================================
  // Form handlers
  // ===================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const selectPosition = (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      lat: lat.toFixed(7),
      lng: lng.toFixed(7),
    }));
  };

  // ===================================================
  // Open add form
  // ===================================================

  const handleAddAddress = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);

    setTimeout(() => {
      document
        .getElementById("address-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ===================================================
  // Current GPS location
  // ===================================================

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showAlert("error", "ไม่สามารถระบุตำแหน่งได้", "เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        selectPosition(result.coords.latitude, result.coords.longitude);

        setLocating(false);
        showAlert("success", "ค้นหาพิกัดสำเร็จ", "ระบุตำแหน่งปัจจุบันเรียบร้อยแล้ว");
      },
      (error) => {
        console.error("GPS error:", error);
        setLocating(false);

        if (error.code === 1) {
          showAlert("warning", "ไม่สามารถเข้าถึงตำแหน่งได้", "กรุณาอนุญาตให้เว็บไซต์เข้าถึงตำแหน่ง");
        } else if (error.code === 2) {
          showAlert("error", "ไม่พบตำแหน่ง", "กรุณาตรวจสอบ GPS หรือการตั้งค่าตำแหน่ง");
        } else {
          showAlert("error", "ค้นหาพิกัดไม่สำเร็จ", "กรุณาลองอีกครั้ง");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
  };

  // ===================================================
  // Edit address
  // ===================================================

  const handleEdit = (item) => {
    setEditingId(item.id);
    setShowForm(true);

    setForm({
      label: item.label || "",
      address: item.address || "",
      lat:
        item.lat != null ? String(item.lat) : String(DEFAULT_POSITION[0]),
      lng:
        item.lng != null ? String(item.lng) : String(DEFAULT_POSITION[1]),
      isDefault: Boolean(item.isDefault),
    });

    setTimeout(() => {
      document
        .getElementById("address-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ===================================================
  // Create / Update address
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      showAlert("warning", "กรุณาเข้าสู่ระบบ", "กรุณาเข้าสู่ระบบก่อนจัดการที่อยู่");
      return;
    }

    if (!form.label.trim()) {
      showAlert("warning", "กรุณาระบุชื่อที่อยู่");
      return;
    }

    if (!form.address.trim()) {
      showAlert("warning", "กรุณากรอกรายละเอียดที่อยู่");
      return;
    }

    const lat = Number(form.lat);
    const lng = Number(form.lng);

    if (
      form.lat === "" ||
      form.lng === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      showAlert("warning", "พิกัดไม่ถูกต้อง", "กรุณาเลือกพิกัดบนแผนที่ให้ถูกต้อง");
      return;
    }

    const data = {
      label: form.label.trim(),
      address: form.address.trim(),
      lat,
      lng,
      isDefault: form.isDefault,
    };

    try {
      setLoading(true);

      if (editingId !== null) {
        await updateAddress(token, editingId, data);
        await showAlert("success", "แก้ไขที่อยู่สำเร็จ");
      } else {
        await createAddress(token, data);
        await showAlert("success", "เพิ่มที่อยู่สำเร็จ");
      }

      resetForm();
      await loadAddresses();
    } catch (error) {
      console.error("บันทึกที่อยู่ไม่สำเร็จ:", error);
      console.error("API error:", error.response?.data);

      showAlert(
        "error",
        "บันทึกที่อยู่ไม่สำเร็จ",
        error.response?.data?.message || "กรุณาลองอีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // Delete address
  // ===================================================

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบที่อยู่",
      text: "คุณต้องการลบที่อยู่นี้ใช่หรือไม่?",
      showCancelButton: true,
      confirmButtonText: "ลบที่อยู่",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#E87532",
      cancelButtonColor: "#9CA3AF",
      reverseButtons: true,
      customClass: {
        popup: "rounded-3xl",
        confirmButton: "rounded-xl px-5 py-2.5",
        cancelButton: "rounded-xl px-5 py-2.5",
      },
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(id);

      await removeAddress(token, id);

      if (editingId === id) {
        resetForm();
      }

      await showAlert("success", "ลบที่อยู่สำเร็จ");
      await loadAddresses();
    } catch (error) {
      console.error("ลบที่อยู่ไม่สำเร็จ:", error);

      showAlert(
        "error",
        "ลบที่อยู่ไม่สำเร็จ",
        error.response?.data?.message || "กรุณาลองอีกครั้ง"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-6 pb-12 bp-10 sm:px-6 ">
      <div className="mx-auto max-w-5xl">
        {/* Page header */}
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="กลับ"
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F0E5DA] bg-white text-[#6B5143] transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#D96B2B] active:scale-95"
            >
              <ArrowLeft
                size={20}
                strokeWidth={1.8}
                className="transition-transform group-hover:-translate-x-0.5"
              />
            </button>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#38251B] sm:text-2xl">
                จัดการที่อยู่
              </h1>
              <p className="mt-1 text-sm text-[#947D6F]">
                จัดการที่อยู่สำหรับจัดส่งอาหารของคุณ
              </p>
            </div>
          </div>

          <div className="mt-5 h-px bg-[#F0E5DA]" />
        </header>

        {/* =================================================
            Saved addresses - show first
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-[#F0E5DA] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3EAE2] px-5 py-5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3E8] text-[#E87532]">
                <MapPin size={21} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#38251B]">
                  ที่อยู่ของฉัน
                </h2>
                <p className="mt-1 text-sm text-[#947D6F]">
                  {addresses.length} รายการ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadAddresses}
                disabled={loadingAddresses}
                aria-label="รีเฟรชรายการที่อยู่"
                title="รีเฟรชรายการที่อยู่"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-orange-50 hover:text-[#D96B2B] disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={loadingAddresses ? "animate-spin" : ""}
                />
              </button>

              <button
                type="button"
                onClick={handleAddAddress}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#E87532] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#D96525] active:scale-[0.98]"
              >
                <Plus size={18} />
                <span>เพิ่มที่อยู่</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            {loadingAddresses && addresses.length === 0 ? (
              <div className="py-12 text-center">
                <RefreshCw
                  size={28}
                  className="mx-auto animate-spin text-[#E87532]"
                />
                <p className="mt-3 text-sm text-gray-500">
                  กำลังโหลดที่อยู่...
                </p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#EEDBCB] bg-[#FFFCF8] px-5 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3E8] text-[#E87532]">
                  <MapPin size={28} strokeWidth={1.7} />
                </div>

                <h3 className="mt-4 font-bold text-gray-800">
                  ยังไม่มีที่อยู่
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  เพิ่มที่อยู่ของคุณเพื่อให้การสั่งอาหารสะดวกยิ่งขึ้น
                </p>

                <button
                  type="button"
                  onClick={handleAddAddress}
                  className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-[#E87532] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D96525]"
                >
                  <Plus size={18} />
                  เพิ่มที่อยู่แรกของคุณ
                </button>
              </div>
            ) : (
              addresses.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[#F0E9E2] transition hover:border-[#EED0B7] hover:shadow-sm"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                          item.isDefault
                            ? "bg-[#E87532] text-white"
                            : "bg-[#FFF3E8] text-[#E87532]"
                        }`}
                      >
                        {item.label === "บ้าน" ? (
                          <Home size={21} strokeWidth={1.8} />
                        ) : (
                          <MapPin size={21} strokeWidth={1.8} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-bold text-[#38251B]">
                            {item.label || "ที่อยู่"}
                          </h3>

                          {item.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0E3] px-2.5 py-1 text-[11px] font-semibold text-[#C45D25]">
                              <Check size={12} />
                              ค่าเริ่มต้น
                            </span>
                          )}
                        </div>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">
                          {item.address}
                        </p>

                        {item.lat != null && item.lng != null && (
                          <p className="mt-2 break-all text-[11px] text-gray-400">
                            {item.lat}, {item.lng}
                          </p>
                        )}
                      </div>
                    </div>

                    <AddressMap lat={item.lat} lng={item.lng} />

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[#F0D5C0] px-3 py-2.5 text-sm font-semibold text-[#D96B2B] transition hover:bg-[#FFF6EE]"
                      >
                        <Pencil size={16} />
                        แก้ไข
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2.5 text-sm font-semibold text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === item.id ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}

                        {deletingId === item.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* =================================================
            Add / edit form - hidden until button is clicked
        ================================================= */}

        {showForm && (
          <section
            id="address-form"
            className="mt-6 scroll-mt-6 overflow-hidden rounded-3xl border border-[#F0E5DA] bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-[#F3EAE2] px-5 py-5 sm:px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3E8] text-[#E87532]">
                {editingId !== null ? (
                  <Pencil size={21} strokeWidth={1.8} />
                ) : (
                  <Plus size={23} strokeWidth={1.8} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-[#38251B]">
                  {editingId !== null ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
                </h2>

                <p className="mt-1 text-sm text-[#947D6F]">
                  {editingId !== null
                    ? "แก้ไขข้อมูลและตำแหน่งจัดส่ง"
                    : "กรอกที่อยู่และเลือกตำแหน่งจัดส่ง"}
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                aria-label="ปิดแบบฟอร์ม"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
              {/* Label */}
              <div>
                <label className="mb-3 block text-sm font-bold text-gray-800">
                  ชื่อเรียกที่อยู่
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "บ้าน", icon: Home },
                    { name: "หอพัก", icon: MapPin },
                    { name: "ที่ทำงาน", icon: Navigation },
                  ].map(({ name, icon: Icon }) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          label: name,
                        }))
                      }
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-sm font-semibold transition ${
                        form.label === name
                          ? "border-[#E87532] bg-[#FFF5EC] text-[#D96B2B] ring-2 ring-[#FBE7D6]"
                          : "border-gray-100 bg-gray-50 text-gray-500 hover:border-orange-200 hover:bg-orange-50/50"
                      }`}
                    >
                      <Icon size={21} strokeWidth={1.8} />
                      {name}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  name="label"
                  value={form.label}
                  onChange={handleChange}
                  placeholder="หรือพิมพ์ชื่อ เช่น หอพัก A"
                  className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Address details */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
                  <MapPin size={17} className="text-[#E87532]" />
                  รายละเอียดที่อยู่
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="บ้านเลขที่ อาคาร ห้อง ถนน ตำบล อำเภอ จังหวัด หรือ รายละเอียดที่อยู่อื่น ๆ"
                  rows={3}
                  className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              {/* Map */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <Navigation size={18} className="text-[#E87532]" />
                    ตำแหน่งจัดส่ง
                  </label>

                  <span className="rounded-full bg-[#FFF3E8] px-2.5 py-1 text-xs font-medium text-[#D96B2B]">
                    GPS / แผนที่
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={locating}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F2D9C5] bg-[#FFF8F2] px-4 py-3 text-sm font-semibold text-[#D96B2B] transition hover:bg-[#FFEDDF] disabled:opacity-50"
                >
                  {locating ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <LocateFixed size={19} />
                  )}

                  {locating
                    ? "กำลังค้นหาตำแหน่ง..."
                    : "ใช้ตำแหน่งปัจจุบันของฉัน"}
                </button>

                <div className="mb-3 rounded-xl bg-gray-50 px-3 py-2.5 text-xs leading-5 text-gray-500">
                  แตะตำแหน่งบนแผนที่หรือเลื่อนหมุดสีแดงไปยังจุดส่งอาหาร
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                  <MapContainer
                    key={editingId ?? "new-address"}
                    center={position}
                    zoom={16}
                    scrollWheelZoom
                    style={{
                      height: "300px",
                      width: "100%",
                      zIndex: 0,
                    }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapClickHandler onSelect={selectPosition} />
                    <MapCenterUpdater position={position} />

                    <Marker
                      position={position}
                      draggable
                      eventHandlers={{
                        dragend: (e) => {
                          const point = e.target.getLatLng();
                          selectPosition(point.lat, point.lng);
                        },
                      }}
                    />
                  </MapContainer>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                      Latitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      name="lat"
                      value={form.lat}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                      Longitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      name="lng"
                      value={form.lng}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <p className="mt-2 break-all text-xs text-gray-400">
                  พิกัดที่เลือก: {position[0].toFixed(7)},{" "}
                  {position[1].toFixed(7)}
                </p>
              </div>

              {/* Default address */}
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    isDefault: !prev.isDefault,
                  }))
                }
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  form.isDefault
                    ? "border-[#F0C9A9] bg-[#FFF8F2]"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    form.isDefault
                      ? "bg-[#E87532] text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Check size={21} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">
                    ตั้งเป็นที่อยู่เริ่มต้น
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    เลือกใช้ที่อยู่นี้เป็นค่าเริ่มต้นในการสั่งอาหาร
                  </p>
                </div>

                <div
                  className={`h-6 w-11 shrink-0 rounded-full p-1 transition ${
                    form.isDefault ? "bg-[#E87532]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      form.isDefault ? "translate-x-5" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E87532] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#D96525] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <RefreshCw size={19} className="animate-spin" />
                ) : editingId !== null ? (
                  <Save size={19} />
                ) : (
                  <Plus size={20} />
                )}

                {loading
                  ? "กำลังบันทึก..."
                  : editingId !== null
                    ? "บันทึกการแก้ไข"
                    : "บันทึกที่อยู่"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
