import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
} from "lucide-react";
import Swal from "sweetalert2";
import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { updateStorePassword } from "../../api/createStore";

const FormEditPassword = () => {
  const navigate = useNavigate();
  const token = usefoodDelivery((state) => state.token);

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ตรวจสอบเงื่อนไขรหัสผ่านใหม่แบบเรียลไทม์
  const passwordChecks = [
    {
      label: "ความยาว 8–64 ตัวอักษร",
      passed:
        form.newPassword.length >= 8 &&
        form.newPassword.length <= 64,
    },
    {
      label: "มีตัวพิมพ์เล็กภาษาอังกฤษ (a-z)",
      passed: /[a-z]/.test(form.newPassword),
    },
    {
      label: "มีตัวพิมพ์ใหญ่ภาษาอังกฤษ (A-Z)",
      passed: /[A-Z]/.test(form.newPassword),
    },
    {
      label: "มีตัวเลขอย่างน้อย 1 ตัว (0-9)",
      passed: /[0-9]/.test(form.newPassword),
    },
    {
      label: "มีอักขระพิเศษอย่างน้อย 1 ตัว",
      passed: /[^A-Za-z0-9\s]/.test(form.newPassword),
    },
    {
      label: "ไม่มีช่องว่าง",
      passed: !/\s/.test(form.newPassword),
    },
  ];

  const isPasswordValid = passwordChecks.every(
    (check) => check.passed
  );

  const isConfirmMatched =
    form.confirmPassword.length > 0 &&
    form.newPassword === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { oldPassword, newPassword, confirmPassword } = form;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบ",
        confirmButtonColor: "#f97316",
      });
    }

    if (!isPasswordValid) {
      return Swal.fire({
        icon: "warning",
        title: "รหัสผ่านใหม่ไม่ผ่านเงื่อนไข",
        text: "กรุณาตรวจสอบเงื่อนไขรหัสผ่านให้ครบทุกข้อ",
        confirmButtonColor: "#f97316",
      });
    }

    if (newPassword !== confirmPassword) {
      return Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "กรุณายืนยันรหัสผ่านใหม่ให้ตรงกัน",
        confirmButtonColor: "#f97316",
      });
    }

    if (oldPassword === newPassword) {
      return Swal.fire({
        icon: "warning",
        title: "รหัสผ่านใหม่ซ้ำกับรหัสผ่านเดิม",
        confirmButtonColor: "#f97316",
      });
    }

    const result = await Swal.fire({
      icon: "question",
      title: "ยืนยันเปลี่ยนรหัสผ่าน?",
      showCancelButton: true,
      confirmButtonText: "เปลี่ยนรหัสผ่าน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);

      const response = await updateStorePassword(token, {
        oldPassword,
        newPassword,
      });

      await Swal.fire({
        icon: "success",
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        text: response?.data?.message || "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
        confirmButtonColor: "#f97316",
      });

      navigate("/store/Profile");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "oldPassword",
      label: "รหัสผ่านปัจจุบัน",
      placeholder: "กรอกรหัสผ่านปัจจุบัน",
      autoComplete: "current-password",
    },
    {
      name: "newPassword",
      label: "รหัสผ่านใหม่",
      placeholder: "กรอกรหัสผ่านใหม่",
      autoComplete: "new-password",
    },
    {
      name: "confirmPassword",
      label: "ยืนยันรหัสผ่านใหม่",
      placeholder: "กรอกรหัสผ่านใหม่อีกครั้ง",
      autoComplete: "new-password",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-8 pb-28">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-medium text-[#8A6A54] shadow-sm transition hover:border-orange-300 hover:text-orange-500"
        >
          <ArrowLeft size={16} />
          กลับหน้าก่อนหน้า
        </button>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-orange-100 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <LockKeyhole size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                เปลี่ยนรหัสผ่าน
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบร้านค้า
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="mb-2 block text-sm font-medium text-gray-600">
                  {field.label}
                </label>

                <div className="relative">
                  <input
                    type={
                      showPasswords[field.name] ? "text" : "password"
                    }
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    disabled={loading}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        [field.name]: !prev[field.name],
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500"
                    aria-label={
                      showPasswords[field.name]
                        ? "ซ่อนรหัสผ่าน"
                        : "แสดงรหัสผ่าน"
                    }
                  >
                    {showPasswords[field.name] ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {/* แสดงผลตรวจสอบรหัสผ่านใหม่ทันทีขณะพิมพ์ */}
                {field.name === "newPassword" &&
                  form.newPassword.length > 0 && (
                    <div className="mt-3 rounded-2xl border border-orange-100 bg-[#FFF8F0] p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#5F4638]">
                          ตรวจสอบเงื่อนไขรหัสผ่าน
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isPasswordValid
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {isPasswordValid
                            ? "ผ่านทุกข้อ"
                            : `${
                                passwordChecks.filter(
                                  (check) => check.passed
                                ).length
                              }/${passwordChecks.length} ข้อ`}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {passwordChecks.map((check) => (
                          <div
                            key={check.label}
                            className={`flex items-center gap-2 text-sm ${
                              check.passed
                                ? "text-green-700"
                                : "text-gray-500"
                            }`}
                          >
                            {check.passed ? (
                              <CheckCircle2
                                size={17}
                                className="shrink-0"
                              />
                            ) : (
                              <Circle
                                size={17}
                                className="shrink-0"
                              />
                            )}
                            <span>{check.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* ตรวจสอบว่ารหัสผ่านที่ยืนยันตรงกันหรือไม่ */}
                {field.name === "confirmPassword" &&
                  form.confirmPassword.length > 0 && (
                    <p
                      className={`mt-2 flex items-center gap-1.5 text-sm ${
                        isConfirmMatched
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {isConfirmMatched ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                      {isConfirmMatched
                        ? "รหัสผ่านตรงกัน"
                        : "รหัสผ่านยังไม่ตรงกัน"}
                    </p>
                  )}
              </div>
            ))}

            {/* แสดงเงื่อนไขไว้ก่อนกรอกด้วย */}
            {form.newPassword.length === 0 && (
              <div className="rounded-2xl border border-orange-100 bg-[#FFF8F0] p-4">
                <p className="mb-2 text-sm font-semibold text-[#5F4638]">
                  เงื่อนไขรหัสผ่าน
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-[#9A8170]">
                  <li>ความยาว 8–64 ตัวอักษร</li>
                  <li>มีตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ภาษาอังกฤษ</li>
                  <li>มีตัวเลขอย่างน้อย 1 ตัว</li>
                  <li>มีอักขระพิเศษอย่างน้อย 1 ตัว</li>
                  <li>ไม่มีช่องว่าง</li>
                </ul>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/store/Profile")}
                disabled={loading}
                className="flex-1 rounded-2xl border border-gray-200 py-3 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {loading
                  ? "กำลังเปลี่ยนรหัสผ่าน..."
                  : "บันทึกรหัสผ่านใหม่"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormEditPassword;
