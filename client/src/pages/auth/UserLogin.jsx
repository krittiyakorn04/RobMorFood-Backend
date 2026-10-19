import { useState } from "react";
import Swal from "sweetalert2";
import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { useLocation, useNavigate } from "react-router-dom";
import { enablePushNotification } from "../../utils/pushNotification";
import { Eye, EyeOff } from "lucide-react";

const UserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const actionLoginUser = usefoodDelivery((state) => state.actionLoginUser);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setform] = useState({
    password: "",
    username: "",
  });

  const handleOnChacng = (e) => {
    setform({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await actionLoginUser(form);

      const role = res.data.payload.role;
      const token = res.data.token;

      // Login ต้องไปต่อก่อน
      roldRediract(role);

      // Push ทำงานเบื้องหลัง ไม่ขวาง Login

      if (token && role === "CUSTOMER") {
        enablePushNotification(token)
          .then((success) => {
            console.log("Customer Push Notification =", success);
          })
          .catch((pushError) => {
            console.error("Customer Push Error =", pushError);
          });
      }
    } catch (error) {
      console.log(error);

      const errMsg = error.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ";

      Swal.fire({
        icon: "warning",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: errMsg,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    }
  };

  const roldRediract = (role) => {
    if (role === "CUSTOMER") {
      /*
       * ถ้ามาจากหน้า Store แล้วกด +
       *
       * location.state จะเป็น
       * {
       *   from: "/user/storeRead/ร้านId",
       *   menuId: เมนูId
       * }
       *
       * ให้กลับไปหน้าร้านเดิม
       * และส่ง menuId กลับไปให้ ClientPublic
       * ทำ + ต่อ
       */

      const from = location.state?.from;
      const menuId = location.state?.menuId;

      if (from && menuId) {
        navigate(from, {
          replace: true,
          state: {
            autoAddMenuId: menuId,
          },
        });

        return;
      }

      /*
       * Login ปกติ
       * ถ้าไม่ได้มาจากการกด +
       */
      navigate("/user/homeUser");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="fd-register">
      <style>{`
        .fd-register {
          --cream: #FFF8F0;
          --orange: #FF6B35;
          --coral: #E8491D;
          --charcoal: #2A1B12;
          --gold: #FFC145;
          --herb: #5B8C5A;
          --herb-deep: #3F6B3F;

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
        .fd-register * { box-sizing: border-box; }

        .fd-reg-blob { position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none; }
        .fd-reg-blob-1 { top: -160px; right: -140px; width: 460px; height: 460px; background: #FFD9A8; opacity: .5; }
        .fd-reg-blob-2 { bottom: -180px; left: -160px; width: 420px; height: 420px; background: #FFE9D0; opacity: .55; }

        .fd-reg-back {
          position: absolute; top: 28px; left: 28px; z-index: 5;
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 500; color: var(--charcoal);
          background: rgba(255,255,255,.8); backdrop-filter: blur(6px);
          border: 1px solid #FFE1BE; border-radius: 999px;
          padding: 8px 16px 8px 12px; text-decoration: none; cursor: pointer;
          transition: transform .2s ease, opacity .2s ease;
        }
        .fd-reg-back:hover { transform: translateX(-2px); opacity: .85; }
        .fd-reg-back svg { width: 15px; height: 15px; }

        .fd-reg-wrap { position: relative; z-index: 3; max-width: 780px; width: 100%; text-align: center; }

        .fd-reg-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,.8); backdrop-filter: blur(6px);
          border: 1px solid #FFD9A8; border-radius: 999px;
          padding: 7px 16px; font-size: 13px; font-weight: 600; color: var(--coral);
        }

        .fd-register h1 {
          font-family: 'Kanit', sans-serif; font-weight: 800;
          font-size: clamp(2rem, 4.4vw, 2.9rem);
          line-height: 1.15; margin-top: 18px; color: var(--charcoal);
        }
        .fd-reg-sub { margin-top: 12px; font-size: 1.02rem; color: #6B5647; line-height: 1.7; }

        .fd-reg-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 22px;
          margin-top: 40px; text-align: left;
        }
        @media (max-width: 720px) { .fd-reg-grid { grid-template-columns: 1fr; } }

        .fd-reg-card {
          position: relative;
          background: white; border: 1px solid #FFE9D0; border-radius: 28px;
          padding: 34px 30px; cursor: pointer; text-align: center;
          box-shadow: 0 14px 30px -18px rgba(42,27,18,.3);
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .fd-reg-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 26px 42px -18px rgba(42,27,18,.32);
          border-color: var(--card-accent, var(--orange));
        }
        .fd-reg-card:active { transform: translateY(-2px); }

        .fd-reg-icon {
          width: 76px; height: 76px; margin: 0 auto 20px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--card-icon-bg);
          color: var(--card-accent);
        }

        .fd-reg-card h2 {
          font-family: 'Kanit', sans-serif; font-weight: 700; font-size: 1.3rem; color: var(--charcoal);
        }
        .fd-reg-card p { margin-top: 8px; font-size: .92rem; color: #6B5647; line-height: 1.6; }

        .fd-reg-cta {
          margin-top: 20px; display: inline-flex; align-items: center; gap: 6px;
          font-size: .88rem; font-weight: 700; color: var(--card-accent);
        }
        .fd-reg-cta svg { width: 15px; height: 15px; transition: transform .2s ease; }
        .fd-reg-card:hover .fd-reg-cta svg { transform: translateX(4px); }

        @media (prefers-reduced-motion: reduce) {
          .fd-register *, .fd-register *::before, .fd-register *::after { transition: none !important; }
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
              เข้าสู่ระบบผู้ใช้ของคุณเพื่อสร้างคำสั่งซื้อ
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
                onChange={handleOnChacng}
                placeholder="username"
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
                  onChange={handleOnChacng}
                  placeholder="********"
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
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-gray-400 text-sm">or</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            {/* Login */}
            <p className="text-center mt-6 text-gray-500">
              คุณยังไม่มีบัญชีใช่ไหม?{" "}
              <button
                type="button"
                onClick={() => navigate("/UserRegister")}
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

export default UserLogin;
