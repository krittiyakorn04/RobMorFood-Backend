import { useState } from "react";
import Swal from "sweetalert2";
import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { useNavigate } from "react-router-dom";
import { enablePushNotification } from "../../utils/pushNotification";
import { Eye, EyeOff } from "lucide-react";

const StoreLogin = () => {
  const navigate = useNavigate();

  const actionLoginStore = usefoodDelivery((state) => state.actionLoginStore);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    password: "",
    username: "",
  });

  const handleOnChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await actionLoginStore(form);

      const role = res.data.payload.role;
      const token = res.data.token;

      // เปิด Push Notification สำหรับร้านและพนักงานส่ง
      if (token && (role === "MERCHANT" || role === "DELIVERY")) {
        await enablePushNotification(token);
      }

      roleRedirect(role);
    } catch (error) {
      console.log(error);

      const errMsg =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";

      Swal.fire({
        icon: "warning",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: "ชื่อผู้ใช้ หรือ รหัสผ่านไม่ถูกต้อง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  const roleRedirect = (role) => {
    if (role === "MERCHANT") {
      navigate("/store/Store");
      return;
    }

    if (role === "DELIVERY") {
      navigate("/store/DeliveryJobs");
      return;
    }

    navigate("/");
  };

  return (
    <div className="fd-register">
      <style>{`
      .fd-register {
        --cream: #FFF8F0;
        --orange: #FF6B35;
        --coral: #E8491D;
        --charcoal: #2A1B12;

        position: relative;
        min-height: 100vh;
        overflow-x: hidden;
        overflow-y: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 24px;
        font-family: 'Noto Sans Thai', sans-serif;
        color: var(--charcoal);
        background:
          radial-gradient(circle at 82% 8%, #FFEFDD 0%, transparent 55%),
          linear-gradient(180deg, #FFFCF7 0%, #FFF3E4 55%, #FFF8F0 100%);
      }

      .fd-register * {
        box-sizing: border-box;
      }
    `}</style>

      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
      />

      <div className="w-full max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="w-full bg-white rounded-3xl border border-orange-100 shadow-[0_20px_50px_-20px_rgba(42,27,18,0.25)] p-8 sm:p-10 md:p-12">
            <h1 className="text-3xl font-bold text-gray-800">เข้าสู่ระบบ</h1>

            <p className="text-gray-500 mt-2 mb-6">
              เข้าสู่ระบบร้านค้าของคุณเพื่อจัดการร้านอาหาร
            </p>

            {/* Username */}
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-2 block">
                ชื่อผู้ใช้
              </label>

              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleOnChange}
                placeholder="username"
                required
                autoComplete="username"
                className="w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-2 block">
                รหัสผ่าน
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleOnChange}
                  placeholder="********"
                  required
                  autoComplete="current-password"
                  className="w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-gray-400 transition hover:text-orange-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-orange-500 py-3 text-white font-semibold hover:bg-orange-600 transition touch-manipulation"
            >
              เข้าสู่ระบบ
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-gray-400 text-sm">or</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            {/* Register */}
            <p className="text-center mt-6 text-gray-500">
              คุณยังไม่มีบัญชีใช่ไหม?{" "}
              <button
                type="button"
                onClick={() => navigate("/StoreRegister")}
                className="text-orange-500 font-semibold"
              >
                สมัครสมาชิก
              </button>
            </p>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          © 2026 RobMorFood
        </p>
      </div>
    </div>
  );
};

export default StoreLogin;
