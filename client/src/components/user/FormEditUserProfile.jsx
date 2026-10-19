import { useEffect, useState } from "react";
import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { User, Phone, Mail, ArrowLeft, Save, Circle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { updateUserProfile } from "../../api/UserProfile";

const FormEditUserProfile = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);
  const getUser = usefoodDelivery((state) => state.getUser);
  const users = usefoodDelivery((state) => state.users);

  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (users) {
      setEditForm({
        username: users.username || "",
        email: users.email || "",
        phone: users.phone || "",
      });
    }
  }, [users]);

  useEffect(() => {
    getUser(token);
  }, []);

  const handleOnChacng = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateUserProfile(token, editForm);

      await getUser(token);

      await Swal.fire({
        icon: "success",
        title: "แก้ไขข้อมูลสำเร็จ",
        text: "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });

      navigate("/user/userProfile");
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "แก้ไขข้อมูลไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          "เกิดข้อผิดพลาดในการแก้ไขข้อมูล กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-3 sm:px-6 py-5 sm:py-8 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* TOP BAR */}
        <div className="flex items-center gap-3 mb-5 sm:mb-7">
          <button
            type="button"
            onClick={() => navigate("/user/UserSetting")}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-orange-100 shadow-sm flex items-center justify-center text-[#6F5140] hover:bg-orange-50 hover:text-orange-500 transition flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#2A1B12]">
              แก้ไขโปรไฟล์
            </h1>

            <p className="text-xs sm:text-sm text-[#9A8170] mt-0.5">
              จัดการข้อมูลส่วนตัวของคุณ
            </p>
          </div>
        </div>

        {/* PROFILE HEADER */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden mb-5">
          <div className="h-24 sm:h-32 bg-gradient-to-r from-[#FF8A4C] to-[#FF6B35] relative">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute w-32 h-32 rounded-full bg-white -top-16 -right-8" />
              <div className="absolute w-24 h-24 rounded-full bg-white -bottom-12 left-8" />
            </div>
          </div>

          <div className="px-5 sm:px-8 pb-6 sm:pb-7">
            <div className="relative">
              {/* AVATAR */}
              <div className="absolute -top-10 sm:-top-12 left-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-orange-50 flex items-center justify-center">
                  <User size={34} className="sm:w-10 sm:h-10 text-orange-500" />
                </div>
              </div>

              {/* USER INFO */}
              <div className="pt-14 sm:pt-14 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-[#2A1B12] truncate">
                  {users?.username || "ผู้ใช้งาน"}
                </h2>

                <p className="text-sm text-[#9A8170] mt-1 truncate">
                  {users?.email || "ไม่มีอีเมล"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FORM CARD */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-orange-100 shadow-sm p-5 sm:p-7 md:p-8"
        >
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#2A1B12]">
              ข้อมูลส่วนตัว
            </h2>

            <p className="text-sm text-[#9A8170] mt-1">
              แก้ไขข้อมูลของคุณให้เป็นปัจจุบัน
            </p>
          </div>

          {/* USERNAME */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#5F4638] mb-2">
              Username
            </label>

            <div className="relative">
              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B99B87] pointer-events-none"
              />

              <input
                type="text"
                name="username"
                value={editForm.username}
                onChange={handleOnChacng}
                placeholder="กรอกชื่อผู้ใช้"
                className="w-full rounded-2xl border border-orange-100 bg-[#FFF8F0] pl-11 pr-4 py-3.5 text-sm sm:text-base text-[#2A1B12] placeholder:text-[#BBA89A] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:bg-white"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#5F4638] mb-2">
              Email
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B99B87] pointer-events-none"
              />

              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleOnChacng}
                placeholder="example@gmail.com"
                className="w-full rounded-2xl border border-orange-100 bg-[#FFF8F0] pl-11 pr-4 py-3.5 text-sm sm:text-base text-[#2A1B12] placeholder:text-[#BBA89A] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:bg-white"
              />
            </div>
          </div>

          {/* PHONE */}
          <div className="mb-7">
            <label className="mb-2 block text-sm font-semibold text-[#5F4638]">
              เบอร์โทรศัพท์
            </label>

            <div className="relative">
              <Phone
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B99B87]"
              />

              <input
                type="tel"
                name="phone"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={editForm.phone || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);

                  handleOnChacng({
                    target: {
                      name: "phone",
                      value,
                    },
                  });
                }}
                placeholder="089xxxxxxx"
                className="w-full rounded-2xl border border-orange-100 bg-[#FFF8F0] py-3.5 pl-11 pr-4 text-sm text-[#2A1B12] outline-none transition placeholder:text-[#BBA89A] focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            {/* ตรวจสอบเบอร์โทรศัพท์ */}
            {editForm.phone &&
              (() => {
                const phone = editForm.phone;
                const validPrefix = /^0[689]/.test(phone);
                const completePhone = /^0[689]\d{8}$/.test(phone);

                return (
                  <div className="mt-2 flex items-start gap-2 text-sm">
                    {completePhone ? (
                      <CheckCircle
                        size={17}
                        className="mt-0.5 shrink-0 text-green-600"
                      />
                    ) : (
                      <Circle
                        size={17}
                        className="mt-0.5 shrink-0 text-orange-500"
                      />
                    )}

                    <p
                      className={
                        completePhone ? "text-green-600" : "text-orange-600"
                      }
                    >
                      {!validPrefix
                        ? "เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 06, 08 หรือ 09"
                        : phone.length < 10
                          ? `กรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (ตอนนี้ ${phone.length}/10 หลัก)`
                          : "เบอร์โทรศัพท์ถูกต้อง"}
                    </p>
                  </div>
                );
              })()}
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate("/user/userProfile")}
              className="w-full sm:flex-1 rounded-2xl border border-orange-200 bg-white py-3.5 text-sm sm:text-base font-semibold text-[#765847] hover:bg-orange-50 transition"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="w-full sm:flex-1 rounded-2xl bg-[#FF6B35] py-3.5 text-sm sm:text-base font-semibold text-white shadow-md shadow-orange-200 hover:bg-[#E8491D] active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <Save size={18} />
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormEditUserProfile;
