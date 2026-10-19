import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Navigation,
  Store,
  Check,
  Circle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import usefoodDelivery from "../../globalState/fooddeliveryStore";

/* =============================================================
   LEAFLET MARKER ICON FIX
============================================================= */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* =============================================================
   CONSTANTS
============================================================= */


const DEFAULT_LAT = 16.2465;
const DEFAULT_LNG = 103.2505;

const MAX_CATEGORY = 3;
const INITIAL_CATEGORY_LIMIT = 6;

const BRAND = "#f97316";

const PHONE_REGEX = /^0\d{9}$/;

const inputBase =
  "w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm transition focus:outline-none focus:ring-2";
const inputOk = "border-gray-200 focus:ring-orange-400 focus:border-orange-400";
const inputErr =
  "border-red-300 bg-red-50/40 focus:ring-red-300 focus:border-red-400";

const PASSWORD_RULES = [
  { id: "len", label: "ความยาว 8-64 ตัวอักษร", test: (p) => p.length >= 8 && p.length <= 64 },
  { id: "lower", label: "มีตัวพิมพ์เล็ก (a-z)", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "มีตัวพิมพ์ใหญ่ (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "digit", label: "มีตัวเลขอย่างน้อย 1 ตัว", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "มีอักขระพิเศษ เช่น @ หรือ !", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { id: "space", label: "ไม่มีช่องว่าง", test: (p) => p.length > 0 && !/\s/.test(p) },
];

/* =============================================================
   HELPERS
============================================================= */

const showAlert = (icon, title, text = "") =>
  Swal.fire({
    icon,
    title,
    ...(text ? { text } : {}),
    confirmButtonText: "ตกลง",
    confirmButtonColor: BRAND,
  });

const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

// ขั้นที่ 1: บัญชีผู้ใช้
const validateAccount = (form) => {
  const errors = {};

  if (!form.username.trim()) errors.username = "กรุณากรอกชื่อผู้ใช้งาน";


  if (!PASSWORD_RULES.every((r) => r.test(form.password)))
    errors.password = "รหัสผ่านยังไม่ตรงตามเงื่อนไขด้านล่าง";

  if (!form.confirmPassword) errors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
  else if (form.password !== form.confirmPassword)
    errors.confirmPassword = "รหัสผ่านไม่ตรงกัน";

  return errors;
};

// ขั้นที่ 2: ข้อมูลร้าน (เรียงตามลำดับที่แสดงบนหน้าจอ)
const validateStore = (form) => {
  const errors = {};

  if (!form.storeName.trim()) errors.storeName = "กรุณากรอกชื่อร้านอาหาร";

  if (form.storeCategoryIds.length === 0)
    errors.storeCategoryIds = "กรุณาเลือกประเภทร้านอย่างน้อย 1 ประเภท";
  else if (form.storeCategoryIds.length > MAX_CATEGORY)
    errors.storeCategoryIds = `เลือกได้สูงสุด ${MAX_CATEGORY} ประเภท`;

  if (!PHONE_REGEX.test(form.phone))
    errors.phone = "กรอกเบอร์โทร 10 หลัก และขึ้นต้นด้วย 0";

  if (
    form.lat == null ||
    form.lng == null ||
    !Number.isFinite(Number(form.lat)) ||
    !Number.isFinite(Number(form.lng))
  )
    errors.location = "กรุณาระบุตำแหน่งร้านบนแผนที่";

  if (!form.address.trim()) errors.address = "กรุณากรอกรายละเอียดที่อยู่ร้าน";

  return errors;
};

const focusField = (id) => document.getElementById(id)?.focus();

/* =============================================================
   SMALL COMPONENTS
============================================================= */

const Field = ({ id, label, error, hint, aside, children }) => (
  <div className="mb-5">
    <div className="flex items-center justify-between mb-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-600">
        {label}
      </label>
      {aside}
    </div>
    {children}
    {hint && !error && <p className="mt-2 text-xs text-gray-400">{hint}</p>}
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-500">
        {error}
      </p>
    )}
  </div>
);

const PasswordInput = ({ id, error, describedBy, ...props }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder="********"
        maxLength={64}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`${inputBase} pr-12 ${error ? inputErr : inputOk}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-500 hover:text-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
};

const PasswordChecklist = ({ password }) => {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const percent = (passed / PASSWORD_RULES.length) * 100;
  const barColor =
    percent < 50 ? "bg-red-400" : percent < 100 ? "bg-amber-400" : "bg-green-500";

  return (
    <div id="password-rules" className="mt-3">
      <div
        className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={PASSWORD_RULES.length}
        aria-valuenow={passed}
        aria-label="ความแข็งแรงของรหัสผ่าน"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-1.5 ${ok ? "text-green-600" : "text-gray-500"}`}
            >
              {ok ? <Check size={14} /> : <Circle size={10} className="mx-0.5" />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const StepDot = ({ n, current }) => {
  const done = current > n;
  const active = current >= n;
  return (
    <div
      aria-current={current === n ? "step" : undefined}
      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
        active ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
      }`}
    >
      {done ? <Check size={18} /> : n}
    </div>
  );
};

/* =============================================================
   MAP HELPERS
============================================================= */

// เลื่อน/ซูมแผนที่ไปที่ตำแหน่งเฉพาะตอนค้นหาด้วย GPS (ไม่กระชากตอนลากหมุด)
const MapFlyTo = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.setView([target.lat, target.lng], 17, { animate: true });
  }, [target, map]);

  return null;
};

// แตะบนแผนที่เพื่อปักหมุด
const MapClickPicker = ({ onPick }) => {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

/* =============================================================
   PAGE
============================================================= */

const StoreRegister = () => {
  const navigate = useNavigate();

  const storeCategory = usefoodDelivery((state) => state.storeCategory);
  const getStoreCategory = usefoodDelivery((state) => state.getStoreCategory);
  const actionRegisterStore = usefoodDelivery(
    (state) => state.actionRegisterStore,
  );

  const [page, setPage] = useState(1);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);

  // บอกว่าผู้ใช้เคยกด "ถัดไป"/"สมัคร" แล้วหรือยัง เพื่อเริ่มแสดง error
  const [attempted, setAttempted] = useState({ 1: false, 2: false });
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    storeName: "",
    storeCategoryIds: [],
    phone: "",
    address: "",
    dayOpen: "",
    timeOpen: "",
    timeClose: "",
    openAuto: false,
    Notice: "",
    lat: null,
    lng: null,
  });

  useEffect(() => {
    getStoreCategory();
  }, [getStoreCategory]);

  const accountErrors = useMemo(() => validateAccount(form), [form]);
  const storeErrors = useMemo(() => validateStore(form), [form]);

  const showError = (step, errors, name) =>
    (touched[name] || attempted[step]) && errors[name] ? errors[name] : undefined;

  const accountError = (name) => showError(1, accountErrors, name);
  const storeError = (name) => showError(2, storeErrors, name);

  const hasLocation = form.lat != null && form.lng != null;
  const markerPosition = hasLocation ? [form.lat, form.lng] : null;

  /* ---------- Input handlers ---------- */

  const handleOnChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "phone"
            ? value.replace(/\D/g, "").slice(0, 10)
            : value,
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  /* ---------- Category ---------- */

  const handleCategoryChange = (categoryId) => {
    const id = Number(categoryId);

    setTouched((prev) => ({ ...prev, storeCategoryIds: true }));

    setForm((prev) => {
      if (prev.storeCategoryIds.includes(id)) {
        return {
          ...prev,
          storeCategoryIds: prev.storeCategoryIds.filter((item) => item !== id),
        };
      }
      // checkbox เต็มแล้วจะ disabled อยู่แล้ว แต่กันไว้อีกชั้น
      if (prev.storeCategoryIds.length >= MAX_CATEGORY) return prev;
      return { ...prev, storeCategoryIds: [...prev.storeCategoryIds, id] };
    });
  };

  const categories = storeCategory || [];

  const visibleCategories = useMemo(
    () =>
      showAllCategories ? categories : categories.slice(0, INITIAL_CATEGORY_LIMIT),
    [categories, showAllCategories],
  );

  const hasMoreCategories = categories.length > INITIAL_CATEGORY_LIMIT;

  /* ---------- Navigation ---------- */

  const handleNext = (e) => {
    e.preventDefault();
    setAttempted((prev) => ({ ...prev, 1: true }));

    const firstError = Object.keys(accountErrors)[0];
    if (firstError) {
      focusField(firstError);
      return;
    }

    setPage(2);
    scrollTop();
  };

  const handleBack = () => {
    setPage(1);
    scrollTop();
  };

  /* ---------- Location ---------- */

  const setLocation = (lat, lng) => {
    setForm((prev) => ({ ...prev, lat, lng }));
  };

  const handleFindLocation = () => {
    if (!navigator.geolocation) {
      showAlert("error", "เบราว์เซอร์นี้ไม่รองรับการค้นหาตำแหน่ง");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation(coords.latitude, coords.longitude);
        setFlyTarget({ lat: coords.latitude, lng: coords.longitude });
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          showAlert(
            "warning",
            "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง",
            "อนุญาตตำแหน่งในเบราว์เซอร์ หรือแตะบนแผนที่เพื่อปักหมุดเองได้",
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          showAlert("error", "ไม่สามารถระบุตำแหน่งได้", "ลองแตะบนแผนที่เพื่อปักหมุดเอง");
        } else if (error.code === error.TIMEOUT) {
          showAlert("warning", "ค้นหาพิกัดหมดเวลา กรุณาลองใหม่");
        } else {
          showAlert("error", "ค้นหาพิกัดไม่สำเร็จ");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleMarkerDragEnd = (event) => {
    const { lat, lng } = event.target.getLatLng();
    setLocation(lat, lng);
  };

  /* ---------- Submit ---------- */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // ตรวจขั้นที่ 1 ซ้ำ เผื่อมีการแก้ state ระหว่างทาง
    if (Object.keys(accountErrors).length > 0) {
      setAttempted({ 1: true, 2: true });
      setPage(1);
      scrollTop();
      return;
    }

    setAttempted((prev) => ({ ...prev, 2: true }));

    const firstError = Object.keys(storeErrors)[0];
    if (firstError) {
      focusField(firstError);
      return;
    }

    const data = {
      username: form.username.trim(),
      password: form.password,
      phone: form.phone,
      storeName: form.storeName.trim(),
      address: form.address.trim(),
      storeCategoryIds: form.storeCategoryIds,
      dayOpen: form.dayOpen,
      timeOpen: form.timeOpen,
      timeClose: form.timeClose,
      openAuto: form.openAuto,
      Notice: form.Notice,
      lat: Number(form.lat),
      lng: Number(form.lng),
    };

    setLoading(true);
    try {
      const res = await actionRegisterStore(data);
      const role = res?.data?.payload?.role;

      await Swal.fire({
        icon: "success",
        title: "สมัครร้านอาหารสำเร็จ",
        text: "กำลังเข้าสู่หน้าร้าน",
        timer: 1800,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      navigate(role === "MERCHANT" ? "/store/store" : "/");
    } catch (error) {
      await showAlert(
        "error",
        "สมัครร้านไม่สำเร็จ",
        error.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const inputClass = (error) => `${inputBase} ${error ? inputErr : inputOk}`;

  /* ---------- Render ---------- */

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
      />
      <div
        className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-10 px-4"
        style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}
      >
      <div className="max-w-2xl mx-auto">
        {/* PROGRESS */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3">
            <StepDot n={1} current={page} />
            <div
              className={`w-16 h-1 rounded-full transition ${
                page >= 2 ? "bg-orange-500" : "bg-gray-200"
              }`}
            />
            <StepDot n={2} current={page} />
          </div>

          <div className="flex justify-center gap-16 mt-2">
            <span className="text-xs text-gray-500">บัญชีผู้ใช้</span>
            <span className="text-xs text-gray-500">ข้อมูลร้าน</span>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-[0_20px_50px_-20px_rgba(42,27,18,0.25)] p-6 md:p-8">
          {/* ===================== PAGE 1 ===================== */}
          {page === 1 && (
            <form onSubmit={handleNext} noValidate>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                    <Store className="text-orange-500" />
                  </div>

                  <div>
                    <h1
                      className="text-2xl sm:text-3xl font-bold text-gray-800"
                      style={{ fontFamily: "'Kanit', sans-serif" }}
                    >
                      สร้างบัญชีร้านอาหาร
                    </h1>
                    <p className="text-gray-500 mt-1">ขั้นตอนที่ 1 จาก 2</p>
                  </div>
                </div>

                <p className="text-gray-500 mt-4">
                  สร้างบัญชีสำหรับเข้าสู่ระบบจัดการร้าน
                </p>
              </div>

              <Field id="username" label="ชื่อผู้ใช้งาน" error={accountError("username")}>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleOnChange}
                  onBlur={handleBlur}
                  placeholder="username"
                  autoComplete="username"
                  aria-invalid={!!accountError("username")}
                  aria-describedby={accountError("username") ? "username-error" : undefined}
                  className={inputClass(accountError("username"))}
                />
              </Field>

              <Field id="password" label="รหัสผ่าน" error={accountError("password")}>
                <PasswordInput
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleOnChange}
                  onBlur={handleBlur}
                  autoComplete="new-password"
                  error={accountError("password")}
                  describedBy="password-rules"
                />
                <PasswordChecklist password={form.password} />
              </Field>

              <Field
                id="confirmPassword"
                label="ยืนยันรหัสผ่าน"
                error={accountError("confirmPassword")}
              >
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleOnChange}
                  onBlur={handleBlur}
                  autoComplete="new-password"
                  error={accountError("confirmPassword")}
                  describedBy={
                    accountError("confirmPassword") ? "confirmPassword-error" : undefined
                  }
                />
                {passwordsMatch && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-green-600">
                    <Check size={14} /> รหัสผ่านตรงกัน
                  </p>
                )}
              </Field>

              <button
                type="submit"
                className="mt-3 w-full rounded-xl bg-orange-500 py-3 text-white font-semibold transition hover:bg-orange-600 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
              >
                ถัดไป
                <ArrowRight size={18} />
              </button>

              <p className="text-center mt-6 text-sm text-gray-500">
                มีบัญชีร้านอยู่แล้ว?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/store/login")}
                  className="text-orange-500 font-semibold hover:text-orange-600 focus:outline-none focus-visible:underline"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            </form>
          )}

          {/* ===================== PAGE 2 ===================== */}
          {page === 2 && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-8">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    aria-label="กลับไปขั้นตอนที่ 1"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div>
                    <h1
                      className="text-2xl sm:text-3xl font-bold text-gray-800"
                      style={{ fontFamily: "'Kanit', sans-serif" }}
                    >
                      ข้อมูลร้านอาหาร
                    </h1>
                    <p className="text-gray-500 mt-1">ขั้นตอนที่ 2 จาก 2</p>
                  </div>
                </div>
              </div>

              {/* STORE NAME */}
              <Field id="storeName" label="ชื่อร้านอาหาร" error={storeError("storeName")}>
                <input
                  id="storeName"
                  type="text"
                  name="storeName"
                  value={form.storeName}
                  onChange={handleOnChange}
                  onBlur={handleBlur}
                  placeholder="เช่น ครัวอิ่มสุข"
                  aria-invalid={!!storeError("storeName")}
                  aria-describedby={storeError("storeName") ? "storeName-error" : undefined}
                  className={inputClass(storeError("storeName"))}
                />
              </Field>

              {/* CATEGORY */}
              <Field
                id="storeCategoryIds"
                label="ประเภทร้านอาหาร"
                error={storeError("storeCategoryIds")}
                aside={
                  <span className="text-xs text-gray-400">
                    เลือกแล้ว{" "}
                    <span className="font-semibold text-orange-500">
                      {form.storeCategoryIds.length}
                    </span>{" "}
                    / {MAX_CATEGORY}
                  </span>
                }
              >
                <div
                  id="storeCategoryIds"
                  tabIndex={-1}
                  role="group"
                  aria-label="ประเภทร้านอาหาร"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 focus:outline-none"
                >
                  {categories.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center gap-2 text-sm text-gray-400 py-5 border rounded-xl bg-gray-50">
                      <Loader2 size={16} className="animate-spin" />
                      กำลังโหลดประเภทอาหาร...
                    </div>
                  ) : (
                    visibleCategories.map((category) => {
                      const id = Number(category.id);
                      const checked = form.storeCategoryIds.includes(id);
                      const disabled =
                        form.storeCategoryIds.length >= MAX_CATEGORY && !checked;

                      return (
                        <label
                          key={category.id}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                            checked
                              ? "border-orange-400 bg-orange-50 cursor-pointer"
                              : disabled
                                ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                                : "border-gray-200 bg-gray-50 hover:border-orange-300 cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => handleCategoryChange(category.id)}
                            className="w-4 h-4 accent-orange-500"
                          />
                          <span
                            className={
                              checked ? "text-orange-600 font-semibold" : "text-gray-700"
                            }
                          >
                            {category.name}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                {hasMoreCategories && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((prev) => !prev)}
                    className="w-full mt-3 py-2.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 text-sm font-semibold transition hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  >
                    {showAllCategories
                      ? "แสดงน้อยลง"
                      : `แสดงเพิ่มเติม (${categories.length - INITIAL_CATEGORY_LIMIT} ประเภท)`}
                  </button>
                )}
              </Field>

              {/* PHONE */}
              <Field id="phone" label="เบอร์โทรศัพท์" error={storeError("phone")}>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleOnChange}
                  onBlur={handleBlur}
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  placeholder="0891234567"
                  aria-invalid={!!storeError("phone")}
                  aria-describedby={storeError("phone") ? "phone-error" : undefined}
                  className={inputClass(storeError("phone"))}
                />
              </Field>

              {/* LOCATION */}
              <Field
                id="location"
                label="ตำแหน่งร้าน"
                error={storeError("location")}
                aside={
                  hasLocation && (
                    <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                      <Check size={14} />
                      ปักหมุดแล้ว
                    </span>
                  )
                }
              >
                <div id="location" tabIndex={-1} className="focus:outline-none">
                  <button
                    type="button"
                    onClick={handleFindLocation}
                    disabled={locationLoading}
                    className="w-full mb-3 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:bg-gray-300 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
                  >
                    {locationLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        กำลังค้นหาพิกัด...
                      </>
                    ) : (
                      <>
                        <Navigation size={18} />
                        {hasLocation ? "ใช้ตำแหน่งปัจจุบันของฉันอีกครั้ง" : "ใช้ตำแหน่งปัจจุบันของฉัน"}
                      </>
                    )}
                  </button>

                  <div className="relative overflow-hidden rounded-2xl border border-orange-100 h-[350px]">
                    <MapContainer
                      center={[DEFAULT_LAT, DEFAULT_LNG]}
                      zoom={13}
                      scrollWheelZoom
                      className="w-full h-full"
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      <MapClickPicker onPick={setLocation} />
                      <MapFlyTo target={flyTarget} />

                      {markerPosition && (
                        <Marker
                          position={markerPosition}
                          draggable
                          eventHandlers={{ dragend: handleMarkerDragEnd }}
                        />
                      )}
                    </MapContainer>

                    {!hasLocation && (
                      <div className="absolute inset-x-0 bottom-4 z-[500] flex justify-center px-4 pointer-events-none">
                        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 px-4 py-3 text-center">
                          <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-800">
                            <MapPin size={16} className="text-orange-500" />
                            แตะบนแผนที่เพื่อปักหมุดร้าน
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            หรือกดปุ่มด้านบนเพื่อใช้ตำแหน่งปัจจุบัน
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {hasLocation && (
                    <div className="mt-3 rounded-xl bg-green-50 border border-green-200 p-3 flex items-start gap-2">
                      <MapPin size={18} className="text-green-600 mt-0.5 shrink-0" />
                      <div className="text-xs text-gray-600">
                        <p className="text-sm font-semibold text-green-700">
                          ตำแหน่งร้าน
                        </p>
                        <p className="mt-1">ละติจูด: {Number(form.lat).toFixed(6)}</p>
                        <p>ลองจิจูด: {Number(form.lng).toFixed(6)}</p>
                        <p className="text-green-600 mt-1">
                          ลากหมุดหรือแตะบนแผนที่เพื่อปรับตำแหน่งได้
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Field>

              {/* ADDRESS */}
              <Field
                id="address"
                label="รายละเอียดที่อยู่ร้าน"
                error={storeError("address")}
                hint="เช่น บ้านเลขที่ อาคาร ถนน หรือจุดสังเกตใกล้ร้าน"
              >
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleOnChange}
                  onBlur={handleBlur}
                  placeholder="เช่น ตรงข้ามประตูมหาวิทยาลัย ซอย 3"
                  rows={3}
                  aria-invalid={!!storeError("address")}
                  aria-describedby={storeError("address") ? "address-error" : undefined}
                  className={`${inputClass(storeError("address"))} resize-none`}
                />
              </Field>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3 text-white font-semibold transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                {loading ? "กำลังสมัคร..." : "สมัครร้านอาหาร"}
              </button>
            </form>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default StoreRegister;