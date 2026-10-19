import { useEffect, useState } from "react";
import usefoodDelivery from "../../globalState/fooddeliveryStore";
import {
  User,
  Phone,
  MapPin,
  Mail,
  Settings,
  ShoppingBag,
  Navigation,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAddress } from "../../api/UserProfile";

const FormProfileUser = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);
  const getUser = usefoodDelivery((state) => state.getUser);
  const users = usefoodDelivery((state) => state.users);

  const [addresses, setAddresses] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(true);

  useEffect(() => {
    if (token) {
      getUser(token);
      loadAddresses();
    }
  }, [token]);

  const loadAddresses = async () => {
    try {
      setLoadingAddress(true);

      const res = await getAddress(token);


      setAddresses(res.data);
    } catch (error) {
      console.log("โหลดที่อยู่ไม่สำเร็จ =", error);
    } finally {
      setLoadingAddress(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-6 pb-24 md:px-8">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ================= HEADER PROFILE ================= */}
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-orange-100">

          {/* Cover */}
          <div className="relative h-32 bg-gradient-to-r from-orange-400 via-orange-500 to-[#E8491D]">
            <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 left-10 w-40 h-40 rounded-full bg-white/10" />

            {/* Edit */}
            <button
              type="button"
              onClick={() => navigate("/user/UserSetting")}
              className="
                absolute top-4 right-4
                w-10 h-10
                rounded-full
                bg-white/90
                text-orange-500
                flex items-center justify-center
                shadow-md
                hover:bg-white
                hover:scale-105
                transition
              "
              title="แก้ไขโปรไฟล์"
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Profile */}
          <div className="relative px-5 sm:px-8 pb-7">

            {/* Avatar */}
            <div className="-mt-12 mb-4">
              <div
                className="
                  w-24 h-24
                  rounded-full
                  bg-white
                  p-1
                  shadow-lg
                "
              >
                <div
                  className="
                    w-full h-full
                    rounded-full
                    bg-gradient-to-br
                    from-orange-100
                    to-orange-50
                    flex items-center justify-center
                    border border-orange-100
                  "
                >
                  <User size={42} className="text-orange-500" />
                </div>
              </div>
            </div>

            {/* Name + username */}
            <div>
              <h1 className="text-2xl font-bold text-[#2A1B12]">
                {users?.username || "ผู้ใช้งาน"}
              </h1>

              <p className="text-sm text-[#9A806D] mt-1">
                ข้อมูลบัญชีผู้ใช้งาน
              </p>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">


            </div>
          </div>
        </div>

        {/* ================= ACCOUNT INFO ================= */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">

          <div className="px-5 sm:px-7 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#2A1B12]">
              ข้อมูลบัญชี
            </h2>

            <p className="text-sm text-[#9A806D] mt-1">
              ข้อมูลสำหรับติดต่อและใช้งานบัญชี
            </p>
          </div>

          <div className="divide-y divide-gray-100">

            {/* Username */}
            <div className="flex items-center gap-4 px-5 sm:px-7 py-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <User size={20} className="text-blue-500" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1">
                  ชื่อผู้ใช้
                </p>

                <p className="font-semibold text-[#2A1B12] truncate">
                  {users?.username || "-"}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 px-5 sm:px-7 py-5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                <Mail size={20} className="text-purple-500" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1">
                  อีเมล
                </p>

                <p className="font-semibold text-[#2A1B12] truncate">
                  {users?.email || "-"}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-4 px-5 sm:px-7 py-5">
              <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                <Phone size={20} className="text-green-500" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1">
                  เบอร์โทรศัพท์
                </p>

                <p className="font-semibold text-[#2A1B12] truncate">
                  {users?.phone || "-"}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ================= ADDRESS ================= */}
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">

          <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-5 border-b border-gray-100">

            <div>
              <h2 className="text-lg font-bold text-[#2A1B12]">
                ที่อยู่จัดส่ง
              </h2>

              <p className="text-sm text-[#9A806D] mt-1">
                ที่อยู่สำหรับจัดส่งอาหาร
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/user/AddressSetting")}
              className="
                flex items-center gap-1.5
                px-3.5 py-2
                rounded-xl
                bg-orange-500
                text-white
                text-sm
                font-semibold
                hover:bg-orange-600
                transition
                shrink-0
              "
            >
              <Plus size={16} />
              <span className="hidden sm:inline">
                เพิ่มที่อยู่
              </span>
            </button>

          </div>

          <div className="p-5 sm:p-7">

            {loadingAddress ? (

              <div className="space-y-3 animate-pulse">
                <div className="h-24 rounded-2xl bg-gray-100" />
                <div className="h-24 rounded-2xl bg-gray-100" />
              </div>

            ) : addresses.length === 0 ? (

              <div className="py-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 flex items-center justify-center">
                  <MapPin size={25} className="text-orange-400" />
                </div>

                <p className="font-semibold text-[#2A1B12] mt-4">
                  ยังไม่มีที่อยู่จัดส่ง
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  เพิ่มที่อยู่เพื่อสั่งอาหารได้สะดวกยิ่งขึ้น
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/user/AddressSetting")}
                  className="
                    mt-4
                    inline-flex items-center gap-2
                    px-4 py-2.5
                    rounded-xl
                    bg-orange-500
                    text-white
                    text-sm
                    font-semibold
                    hover:bg-orange-600
                    transition
                  "
                >
                  <Plus size={17} />
                  เพิ่มที่อยู่
                </button>
              </div>

            ) : (

              <div className="space-y-3">
                {addresses.map((item) => (
                  <div
                    key={item.id}
                    className={`
                      rounded-2xl
                      border
                      p-4
                      transition
                      ${
                        item.isDefault
                          ? "border-orange-200 bg-orange-50/70"
                          : "border-gray-100 bg-gray-50"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">

                      <div
                        className={`
                          w-10 h-10
                          rounded-xl
                          flex items-center justify-center
                          shrink-0
                          ${
                            item.isDefault
                              ? "bg-orange-100"
                              : "bg-white"
                          }
                        `}
                      >
                        <MapPin
                          size={19}
                          className={
                            item.isDefault
                              ? "text-orange-500"
                              : "text-gray-400"
                          }
                        />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-[#2A1B12]">
                            {item.label || "ที่อยู่จัดส่ง"}
                          </p>

                          {item.isDefault && (
                            <span className="text-[11px] font-semibold bg-orange-500 text-white px-2.5 py-1 rounded-full">
                              ที่อยู่เริ่มต้น
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {item.address || "-"}
                        </p>

                        {(item.lat !== null || item.lng !== null) && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <Navigation size={12} />
                            <span>
                              {item.lat}, {item.lng}
                            </span>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                ))}
              </div>

            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default FormProfileUser;
