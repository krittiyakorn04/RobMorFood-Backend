import { useNavigate } from "react-router-dom";
import {
  Clock3,
  Store,
  CreditCard,
  ChevronRight,
  Package,
  AlertCircle,
  ShieldCheck,
  Bike,
  LockKeyhole,
  Mail,
} from "lucide-react";

const StoreSetting = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "จัดการข้อมูลร้านอาหาร",
      description: "แก้ไขชื่อร้าน รายละเอียด รูปภาพ และข้อมูลพื้นฐาน",
      icon: Store,
      path: "/store/editProfile",
    },
    {
      title: "เปลี่ยนรหัสผ่าน",
      description: "เปลี่ยนรหัสผ่านร้านอาหาร",
      icon: LockKeyhole,
      path: "/store/edit-password",
    },
    {
      title: "จัดการเวลาร้านอาหาร",
      description: "ตั้งค่าวันและเวลาเปิด–ปิดร้าน",
      icon: Clock3,
      path: "/store/FormOpen",
    },
    {
      title: "จัดการการรับออเดอร์",
      description: "ตั้งค่ารูปแบบและรอบการรับออเดอร์",
      icon: Package,
      path: "/store/order-mode",
    },
    {
      title: "จัดการการชำระเงิน",
      description: "จัดการช่องทางการชำระเงินและ QR Code",
      icon: CreditCard,
      path: "/store/UploadQr",
    },
    {
      title: "แจ้งปัญหาออเดอร์",
      description: "ตรวจสอบและจัดการปัญหาที่ลูกค้าแจ้งเกี่ยวกับออเดอร์",
      icon: AlertCircle,
      path: "/store/StoreOrderReports",
    },
    {
      title: "การยืนยันตัวตน",
      description: "ยืนยันตัวตนเพื่อเปิดใช้งานร้านอาหาร",
      icon: ShieldCheck,
      path: "/store/Verify",
    },
    {
      title: "จัดการผู้ส่ง",
      description: "เพิ่ม แก้ไข และจัดการผู้ส่งอาหารของร้าน",
      icon: Bike,
      path: "/store/StoreStaff",
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
      <div className="max-w-6xl mx-auto px-5 py-8 pb-28">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2A1B12]">
            ตั้งค่าร้านอาหาร
          </h1>

          <p className="text-sm text-[#8A6A54] mt-1">
            จัดการข้อมูลและการตั้งค่าต่าง ๆ ของร้านอาหาร
          </p>
        </div>

        {/* Setting Menu */}
        <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.path}
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
                <div className="w-11 h-11 rounded-xl bg-[#FFF3E4] flex items-center justify-center shrink-0">
                  <Icon size={21} strokeWidth={2} className="text-[#FF6B35]" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2A1B12] text-sm">
                    {item.title}
                  </p>

                  <p className="text-xs text-[#A58D7B] mt-1">
                    {item.description}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight size={19} className="text-[#B7A390] shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StoreSetting;
