import { useNavigate } from "react-router-dom";
import {
  Utensils,
  Clock3,
  Store,
  CreditCard,
  ChevronRight,
  Package,
  Mail,
} from "lucide-react";

const UserSetting = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "จัดการข้อมูลผู้ใช้",
      description: "ข้อมูลพื้นฐานผู้ใช้",
      icon: Store,
      path: "/user/editUser",
    },
    {
      title: "เปลี่ยนรหัสผ่าน",
      description: "เปลี่ยนรหัสผ่านผู้ใช้",
      icon: Store,
      path: "/user/passwordForm",
    },
    {
      title: "จัดการที่อยู่",
      description: "วันเวลาเปิดร้าน",
      icon: Clock3,
      path: "/user/AddressSetting",
    },
    {
      title: "แจ้งปัญหาออเดอร์",
      description: "วันเวลาเปิดร้าน",
      icon: Clock3,
      path: "/user/orderReports",
    },
    {
      title: "ติดต่อแอดมิน",
      description: "สอบถาม แจ้งปัญหา หรือขอความช่วยเหลือเกี่ยวกับร้านอาหาร",
      icon: Mail,
      path: "mailto:robmorfooddelivery@gmail.com?subject=ติดต่อแอดมิน%20RobMorFood",
      external: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2A1B12]">ตั้งค่า</h1>

          <p className="text-sm text-[#8A6A54] mt-1">จัดการการตั้งค่าผู้ใช้</p>
        </div>

        {/* Section */}
        <div>
          <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
            {menuItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  onClick={() => {
                    if (item.external) {
                      const isMobile = /Android|iPhone|iPad|iPod/i.test(
                        navigator.userAgent,
                      );

                      if (isMobile) {
                        window.location.href = item.path;
                      } else {
                        window.open(
                          "https://mail.google.com/mail/?view=cm&fs=1&to=robmorfood%40gmail.com&su=ติดต่อแอดมิน%20RobMorFood",
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className={`
                    w-full
                    flex
                    items-center
                    gap-4
                    px-5
                    py-4
                    text-left
                    hover:bg-[#FFF8F0]
                    active:bg-orange-50
                    transition
                    ${
                      index !== menuItems.length - 1
                        ? "border-b border-orange-50"
                        : ""
                    }
                  `}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3E4] flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-[#FF6B35]" />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <p className="font-semibold text-[#2A1B12] text-sm">
                      {item.title}
                    </p>

                    <p className="text-xs text-[#A58D7B] mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={19} className="text-[#B7A390]" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSetting;
