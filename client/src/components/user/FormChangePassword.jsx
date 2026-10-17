import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LockKeyhole,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Circle,
} from "lucide-react";
import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { updateUserPassword } from "../../api/UserProfile";

const FormChangePassword = () => {
  const navigate = useNavigate();
  const token = usefoodDelivery((state) => state.token);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const passwordChecks = [
    {
      label: "ความยาว 8–64 ตัวอักษร",
      passed:
        passwordForm.newPassword.length >= 8 &&
        passwordForm.newPassword.length <= 64,
    },
    {
      label: "มีตัวพิมพ์เล็กภาษาอังกฤษ (a-z)",
      passed: /[a-z]/.test(passwordForm.newPassword),
    },
    {
      label: "มีตัวพิมพ์ใหญ่ภาษาอังกฤษ (A-Z)",
      passed: /[A-Z]/.test(passwordForm.newPassword),
    },
    {
      label: "มีตัวเลขอย่างน้อย 1 ตัว (0-9)",
      passed: /[0-9]/.test(passwordForm.newPassword),
    },
    {
      label: "มีอักขระพิเศษอย่างน้อย 1 ตัว",
      passed: /[^A-Za-z0-9\s]/.test(passwordForm.newPassword),
    },
    {
      label: "ไม่มีช่องว่าง",
      passed: !/\s/.test(passwordForm.newPassword),
    },
  ];

  const isPasswordValid = passwordChecks.every((check) => check.passed);

  const isConfirmMatched =
    passwordForm.confirmPassword.length > 0 &&
    passwordForm.newPassword === passwordForm.confirmPassword;

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const { oldPassword, newPassword, confirmPassword } = passwordForm;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบ",
        confirmButtonColor: "#FF6B35",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])\S{8,64}$/;

    if (!passwordRegex.test(newPassword)) {
      return Swal.fire({
        icon: "warning",
        title: "รหัสผ่านใหม่ไม่ถูกต้อง",
        text: "รหัสผ่านต้องมี 8-64 ตัวอักษร มีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ โดยไม่มีช่องว่าง",
        confirmButtonColor: "#FF6B35",
      });
    }

    if (newPassword !== confirmPassword) {
      return Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "กรุณายืนยันรหัสผ่านใหม่ให้ตรงกัน",
        confirmButtonColor: "#FF6B35",
      });
    }

    if (oldPassword === newPassword) {
      return Swal.fire({
        icon: "warning",
        title: "รหัสผ่านใหม่ต้องแตกต่าง",
        text: "กรุณากำหนดรหัสผ่านใหม่ที่ไม่ซ้ำกับรหัสผ่านปัจจุบัน",
        confirmButtonColor: "#FF6B35",
      });
    }

    const result = await Swal.fire({
      icon: "question",
      title: "ยืนยันการเปลี่ยนรหัสผ่าน",
      text: "คุณต้องการเปลี่ยนรหัสผ่านใช่หรือไม่",
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#FF6B35",
    });

    if (!result.isConfirmed) return;

    try {
      setPasswordLoading(true);

      const res = await updateUserPassword(token, {
        oldPassword,
        newPassword,
      });

      await Swal.fire({
        icon: "success",
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        text: res?.data?.message || "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
        confirmButtonColor: "#FF6B35",
      });

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      navigate("/user/userProfile");
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#FF6B35",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const passwordFields = [
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
    <div className="min-h-screen bg-[#FFF8F0] px-3 sm:px-6 py-5 sm:py-8 ">
      <div className="max-w-2xl mx-auto pb-20">
        {/* TOP BAR */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate("/user/UserSetting")}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-orange-100 shadow-sm flex items-center justify-center text-[#6F5140] hover:bg-orange-50 hover:text-orange-500 transition flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2A1B12]">
              เปลี่ยนรหัสผ่าน
            </h1>
            <p className="text-xs sm:text-sm text-[#9A8170] mt-0.5">
              ตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชี
            </p>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleChangePassword}
          className="bg-white rounded-3xl border border-orange-100 shadow-sm p-5 sm:p-7 md:p-8"
        >
          <div className="flex items-center gap-3 mb-7">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF6B35]">
              <KeyRound size={24} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#2A1B12]">
                ข้อมูลรหัสผ่าน
              </h2>
              <p className="text-sm text-[#9A8170] mt-1">
                กรอกรหัสผ่านปัจจุบันและกำหนดรหัสผ่านใหม่
              </p>
            </div>
          </div>

          {passwordFields.map((item) => (
            <div key={item.name} className="mb-5">
              <label className="block text-sm font-semibold text-[#5F4638] mb-2">
                {item.label}
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B99B87] pointer-events-none"
                />

                <input
                  type={showPassword[item.name] ? "text" : "password"}
                  name={item.name}
                  value={passwordForm[item.name]}
                  onChange={handlePasswordChange}
                  placeholder={item.placeholder}
                  autoComplete={item.autoComplete}
                  maxLength={64}
                  required
                  className="w-full rounded-2xl border border-orange-100 bg-[#FFF8F0] pl-11 pr-12 py-3.5 text-sm sm:text-base text-[#2A1B12] placeholder:text-[#BBA89A] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:bg-white"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      [item.name]: !prev[item.name],
                    }))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A8170] hover:text-[#FF6B35]"
                  aria-label={
                    showPassword[item.name] ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"
                  }
                >
                  {showPassword[item.name] ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
              {item.name === "newPassword" &&
                passwordForm.newPassword.length > 0 && (
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
                          : `${passwordChecks.filter((check) => check.passed).length}/6 ข้อ`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {passwordChecks.map((check) => (
                        <div
                          key={check.label}
                          className={`flex items-center gap-2 text-sm ${
                            check.passed ? "text-green-700" : "text-gray-500"
                          }`}
                        >
                          {check.passed ? (
                            <CheckCircle2 size={17} className="shrink-0" />
                          ) : (
                            <Circle size={17} className="shrink-0" />
                          )}

                          <span>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {item.name === "confirmPassword" &&
                passwordForm.confirmPassword.length > 0 && (
                  <p
                    className={`mt-2 flex items-center gap-1.5 text-sm ${
                      isConfirmMatched ? "text-green-600" : "text-red-500"
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

          {/* PASSWORD RULES */}
          <div className="rounded-2xl bg-[#FFF8F0] border border-orange-100 p-4 mb-6">
            <p className="text-sm font-semibold text-[#5F4638] mb-2">
              เงื่อนไขรหัสผ่านใหม่
            </p>
            <ul className="text-sm text-[#9A8170] space-y-1 list-disc pl-5">
              <li>ความยาว 8-64 ตัวอักษร</li>
              <li>มีตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ภาษาอังกฤษ</li>
              <li>มีตัวเลขอย่างน้อย 1 ตัว</li>
              <li>มีอักขระพิเศษอย่างน้อย 1 ตัว</li>
              <li>ไม่มีช่องว่าง</li>
            </ul>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate("/user/userProfile")}
              disabled={passwordLoading}
              className="w-full sm:flex-1 rounded-2xl border border-orange-200 bg-white py-3.5 text-sm sm:text-base font-semibold text-[#765847] hover:bg-orange-50 disabled:opacity-60 transition"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full sm:flex-1 rounded-2xl bg-[#FF6B35] py-3.5 text-sm sm:text-base font-semibold text-white shadow-md shadow-orange-200 hover:bg-[#E8491D] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <LockKeyhole size={18} />
              {passwordLoading ? "กำลังเปลี่ยนรหัสผ่าน..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormChangePassword;
