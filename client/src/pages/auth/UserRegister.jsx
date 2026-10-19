import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, Circle, Loader2 } from "lucide-react";

/* ---------- Constants ---------- */

const BRAND = "#f97316";

const inputBase =
  "w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm transition focus:outline-none focus:ring-2";
const inputOk =
  "border-gray-200 focus:ring-orange-400 focus:border-orange-400";
const inputErr =
  "border-red-300 bg-red-50/40 focus:ring-red-300 focus:border-red-400";

// กฎรหัสผ่าน: เก็บไว้ที่เดียว ใช้ทั้งแสดงผลและ validate
const PASSWORD_RULES = [
  { id: "len", label: "ความยาวไม่น้อยกว่า 8 ตัวอักษร", test: (p) => p.length >= 8 && p.length <= 64 },
  { id: "lower", label: "มีตัวพิมพ์เล็ก (a-z)", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "มีตัวพิมพ์ใหญ่ (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "digit", label: "มีตัวเลขอย่างน้อย 1 ตัว", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "มีอักขระพิเศษ เช่น @ หรือ !", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { id: "space", label: "ไม่มีช่องว่าง", test: (p) => p.length > 0 && !/\s/.test(p) },
];

const PHONE_REGEX = /^0\d{9}$/;

const validate = (form) => {
  const errors = {};

  if (!form.username.trim()) errors.username = "กรุณากรอกชื่อผู้ใช้";


  if (!PHONE_REGEX.test(form.phone))
    errors.phone = "กรอกเบอร์โทร 10 หลัก และขึ้นต้นด้วย 0";

  if (!PASSWORD_RULES.every((r) => r.test(form.password)))
    errors.password = "รหัสผ่านยังไม่ตรงตามเงื่อนไขด้านล่าง";

  if (!form.confirmPassword) errors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
  else if (form.password !== form.confirmPassword)
    errors.confirmPassword = "รหัสผ่านไม่ตรงกัน";

  return errors;
};

/* ---------- Small components ---------- */

const Field = ({ id, label, error, children }) => (
  <div className="mb-4">
    <label htmlFor={id} className="text-sm font-medium text-gray-600 mb-2 block">
      {label}
    </label>
    {children}
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-500">
        {error}
      </p>
    )}
  </div>
);

const PasswordInput = ({ id, name, value, onChange, onBlur, error, autoComplete, describedBy }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="********"
        maxLength={64}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`${inputBase} pr-12 ${error ? inputErr : inputOk}`}
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

/* ---------- Page ---------- */

const UserRegister = () => {
  const navigate = useNavigate();
  const actionRegisterUser = usefoodDelivery((state) => state.actionRegisterUser);

  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => validate(form), [form]);

  // แสดง error เมื่อผู้ใช้แตะช่องนั้นแล้ว หรือกดสมัครแล้ว
  const showError = (name) => (touched[name] || submitted ? errors[name] : undefined);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;

    // ใช้ functional update เพื่อไม่ให้ state เก่าทับกัน
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const roleRedirect = (role) => {
    if (role === "CUSTOMER") navigate("/user/homeUser");
    else navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setSubmitted(true);

    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      // พาผู้ใช้ไปที่ช่องแรกที่ผิด
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setLoading(true);
    try {
      // ไม่ส่ง confirmPassword ไป Backend
      const { username, phone, password } = form;

      const res = await actionRegisterUser({
        username: username.trim(),
        phone,
        password,
      });

      await Swal.fire({
        icon: "success",
        title: "สมัครใช้งานสำเร็จ",
        text: "กำลังเข้าสู่หน้าหลัก",
        timer: 1800,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      roleRedirect(res?.data?.payload?.role);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "สมัครสมาชิกไม่สำเร็จ",
        text: error.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: BRAND,
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  return (
    
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
      />
      <div
        className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4 py-10"
        style={{ fontFamily: "'Noto Sans Thai', sans-serif" }}
      >
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl border border-orange-100 shadow-[0_20px_50px_-20px_rgba(42,27,18,0.25)] overflow-hidden">
          <form onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-8 sm:px-10 sm:py-10 md:px-12 md:py-12">
              {/* Header */}
              <div className="text-center mb-8">
                <h1
                  className="text-2xl sm:text-3xl font-bold text-gray-800"
                  style={{ fontFamily: "'Kanit', sans-serif" }}
                >
                  สร้างบัญชีสมาชิก
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                  สมัครสมาชิกเพื่อเริ่มสั่งอาหาร
                </p>
              </div>

              {/* Username + Phone: 2 คอลัมน์บนจอใหญ่ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-4">
                <Field id="username" label="ชื่อผู้ใช้" error={showError("username")}>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleOnChange}
                    onBlur={handleBlur}
                    placeholder="username"
                    autoComplete="username"
                    aria-invalid={!!showError("username")}
                    aria-describedby={showError("username") ? "username-error" : undefined}
                    className={`${inputBase} ${showError("username") ? inputErr : inputOk}`}
                  />
                </Field>

                <Field id="phone" label="โทรศัพท์" error={showError("phone")}>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleOnChange}
                    onBlur={handleBlur}
                    placeholder="089xxxxxxx"
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="tel"
                    aria-invalid={!!showError("phone")}
                    aria-describedby={showError("phone") ? "phone-error" : undefined}
                    className={`${inputBase} ${showError("phone") ? inputErr : inputOk}`}
                  />
                </Field>
              </div>


              {/* Password */}
              <Field id="password" label="รหัสผ่าน" error={showError("password")}>
                <PasswordInput
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleOnChange}
                  onBlur={handleBlur}
                  error={showError("password")}
                  autoComplete="new-password"
                  describedBy="password-rules"
                />
                <PasswordChecklist password={form.password} />
              </Field>

              {/* Confirm Password */}
              <div className="mb-6">
                <Field
                  id="confirmPassword"
                  label="ยืนยันรหัสผ่าน"
                  error={showError("confirmPassword")}
                >
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleOnChange}
                    onBlur={handleBlur}
                    error={showError("confirmPassword")}
                    autoComplete="new-password"
                    describedBy={
                      showError("confirmPassword") ? "confirmPassword-error" : undefined
                    }
                  />
                </Field>
                {passwordsMatch && (
                  <p className="-mt-2 flex items-center gap-1.5 text-xs text-green-600">
                    <Check size={14} /> รหัสผ่านตรงกัน
                  </p>
                )}
              </div>

              {/* Register */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3 text-white font-semibold transition hover:bg-orange-600 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
              </button>

              {/* Login */}
              <p className="text-center mt-6 text-sm text-gray-500">
                มีบัญชีอยู่แล้ว?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/UserLogin")}
                  className="text-orange-500 font-semibold hover:text-orange-600 focus:outline-none focus-visible:underline"
                >
                  เข้าสู่ระบบ
                </button>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">© 2026 RobMorFood</p>
      </div>
      </div>
    </>
  );
};

export default UserRegister;