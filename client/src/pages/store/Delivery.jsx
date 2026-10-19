import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Inbox,
  User,
  UtensilsCrossed,
  MapPin,
  ChevronRight,
  PackageCheck,
  Truck,
  CheckCircle2,
  Home,
  MapPinned,
  Check,
  Users,
  Send,
  Loader2,
  Store,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";

import { getStoreDelivery, changeStatusDelivery } from "../../api/StoreOrder";
import { assignDeliveryStaff, getStoreStaff } from "../../api/createStore";

const DeliverySkeleton = () => {
  return (
    <div className="dv-root dv-skeleton-page">
      <style>{`
        .dv-skeleton-page {
          --cream: #FFF8F0;
          --peach: #FFE4C4;
          --orange: #FF6B35;
          --coral: #E8491D;
          --charcoal: #2A1B12;
          --cocoa: #8A6A54;

          min-height: 100vh;
          background: linear-gradient(
            180deg,
            #FFFCF7 0%,
            #FFF3E4 25%,
            #FFF8F0 100%
          );
          font-family: 'Noto Sans Thai', sans-serif;
          color: var(--charcoal);
          padding: 24px 16px 60px;
        }

        .dv-skeleton-page *,
        .dv-skeleton-page *::before,
        .dv-skeleton-page *::after {
          box-sizing: border-box;
        }

        .dv-skeleton-page .dv-wrap {
          max-width: 1152px;
          margin: 0 auto;
        }

        .dv-skeleton-page .dv-header {
          margin-bottom: 22px;
        }

        .dv-skeleton {
          background: #F3E7D9;
          border-radius: 10px;
          animation: dv-skeleton-pulse 1.4s ease-in-out infinite;
        }

        @keyframes dv-skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .45; }
        }

        .dv-skeleton-page .dv-tabs {
          display: flex;
          gap: 10px;
          overflow: hidden;
          padding: 2px 2px 8px;
          margin-bottom: 22px;
        }

        .dv-skeleton-page .dv-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dv-skeleton-page .dv-card {
          background: rgba(255,255,255,.96);
          border: 1px solid rgba(251,227,198,.8);
          border-radius: 24px;
          padding: 18px;
          box-shadow: 0 12px 30px -22px rgba(42,27,18,.3);
        }

        .dv-skeleton-page .dv-divider {
          border: none;
          border-top: 1px dashed #F0DDC2;
          margin: 17px 0;
        }

        .dv-skeleton-page .dv-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .dv-skeleton-page .dv-customer-row {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .dv-skeleton-page .dv-address-box {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 14px;
          border-radius: 17px;
          background: #FFF8F0;
          border: 1px solid #FBE9D4;
        }

        .dv-skeleton-page .dv-menu-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 0;
        }

        .dv-skeleton-page .dv-menu-item + .dv-menu-item {
          border-top: 1px dashed #F5EAD9;
        }

        .dv-skeleton-page .dv-skeleton-divider {
          border: none;
          border-top: 1px dashed #F0DDC2;
          margin: 17px 0;
        }

        .dv-skeleton-page .dv-skeleton-line {
          height: 12px;
          margin-bottom: 9px;
        }

        .dv-skeleton-page .dv-skeleton-rider {
          height: 48px;
          border-radius: 12px;
          margin-bottom: 15px;
        }

        .dv-skeleton-page .dv-skeleton-button {
          height: 49px;
          border-radius: 15px;
        }

        @media (max-width: 480px) {
          .dv-skeleton-page {
            padding: 18px 12px 50px;
          }

          .dv-skeleton-page .dv-card {
            padding: 16px;
          }

          .dv-skeleton-page .dv-card-top {
            gap: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dv-skeleton-page .dv-skeleton {
            animation: none;
          }
        }
      `}</style>

      <div className="dv-wrap">
        {/* HEADER: ตำแหน่งเดียวกับหัวข้อจริง */}
        <div className="dv-header">
          <div className="dv-skeleton h-9 w-44 mb-3" />
          <div className="dv-skeleton h-4 w-72 max-w-full" />
        </div>

        {/* TABS: ความสูงและระยะห่างตาม .dv-tabs จริง */}
        <div className="dv-tabs">
          {[112, 118, 118, 80].map((width, index) => (
            <div
              key={index}
              className="dv-skeleton h-[39px] shrink-0 rounded-full"
              style={{ width }}
            />
          ))}
        </div>

        {/* ORDER LIST */}
        <div className="dv-list">
          {[1, 2, 3].map((card) => (
            <div key={card} className="dv-card">
              {/* สถานะเลือกไรเดอร์: พื้นที่เดียวกับ .dv-card-select */}
              <div className="dv-skeleton dv-skeleton-rider" />

              {/* CUSTOMER + STATUS */}
              <div className="dv-card-top">
                <div className="dv-customer-row">
                  <div className="dv-skeleton h-[46px] w-[46px] shrink-0 rounded-[15px]" />

                  <div className="min-w-0 flex-1">
                    <div className="dv-skeleton h-5 w-32 max-w-full mb-2" />
                    <div className="dv-skeleton h-3 w-48 max-w-full" />
                  </div>
                </div>

                <div className="dv-skeleton h-[30px] w-[104px] shrink-0 rounded-full" />
              </div>

              <hr className="dv-skeleton-divider" />

              {/* ADDRESS TITLE */}
              <div className="flex items-center gap-[7px] mb-[10px]">
                <div className="dv-skeleton h-[17px] w-[17px] rounded-md" />
                <div className="dv-skeleton h-4 w-24" />
              </div>

              {/* ADDRESS BOX: ขนาดตรงกับ .dv-address-box */}
              <div className="dv-address-box">
                <div className="dv-skeleton h-[38px] w-[38px] shrink-0 rounded-xl" />

                <div className="min-w-0 flex-1 pt-1">
                  <div className="dv-skeleton h-3 w-20 mb-2" />
                  <div className="dv-skeleton dv-skeleton-line w-full" />
                  <div className="dv-skeleton dv-skeleton-line w-4/5 mb-0" />
                </div>
              </div>

              <hr className="dv-skeleton-divider" />

              {/* MENU TITLE */}
              <div className="flex items-center gap-[7px] mb-2">
                <div className="dv-skeleton h-[17px] w-[17px] rounded-md" />
                <div className="dv-skeleton h-4 w-24" />
              </div>

              {/* MENU ITEMS: ตรงกับ .dv-menu-item */}
              {[1, 2].map((item) => (
                <div key={item} className="dv-menu-item">
                  <div className="min-w-0 flex-1">
                    <div className="dv-skeleton h-4 w-36 max-w-full mb-2" />
                    <div className="dv-skeleton h-3 w-24" />
                  </div>

                  <div className="dv-skeleton h-4 w-16 shrink-0" />
                </div>
              ))}

              {/* ACTION BUTTONS: ปุ่มจัดส่ง + ดูรายละเอียด */}
              <div className="flex gap-2 mt-4">
                <div className="dv-skeleton dv-skeleton-button min-w-0 flex-1" />
                <div className="dv-skeleton dv-skeleton-button min-w-0 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DeliveryPage = () => {
  const token = usefoodDelivery((state) => state.token);

  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  const [staffList, setStaffList] = useState([]);
  const loadStaff = async () => {
    if (!token) return;

    try {
      const res = await getStoreStaff(token);
      setStaffList(res.data.staff || []);
    } catch (error) {
      console.error("โหลดบัญชีคนส่งไม่สำเร็จ:", error);
    }
  };

  // ==========================================
  // BULK ASSIGN
  // ==========================================

  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // ==========================================
  // LOAD DELIVERY
  // ==========================================

  const loadDelivery = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await getStoreDelivery(token);

      const data = Array.isArray(res.data) ? res.data : [];

      setDeliveries(data);
    } catch (error) {
      console.error("โหลด Delivery ไม่สำเร็จ:", error);

      if (error?.response?.status === 401) {
        console.error("Token หมดอายุ กรุณา Login ใหม่");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadDelivery();
    loadStaff();
  }, [token]);

  // ==========================================
  // PENDING
  // ==========================================

  const pendingDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => delivery.status === "PENDING");
  }, [deliveries]);

  // ==========================================
  // GET ACTIVE RIDERS
  // ==========================================

  const deliveryStaffs = useMemo(() => {
    return staffList.filter(
      (staff) =>
        staff.isActive !== false && (!staff.role || staff.role === "DELIVERY"),
    );
  }, [staffList]);

  // ==========================================
  // RIDER COUNT
  // ==========================================

  const riderCount = deliveryStaffs.length;

  // ==========================================
  // REMOVE INVALID SELECTED ORDERS
  //
  // เลือกได้เฉพาะ:
  // - PENDING
  // - ยังไม่มีไรเดอร์
  // - ร้านมีไรเดอร์มากกว่า 1 คน
  // ==========================================

  useEffect(() => {
    setSelectedDeliveryIds((current) => {
      if (riderCount <= 1) {
        return [];
      }

      return current.filter((id) =>
        pendingDeliveries.some(
          (delivery) => delivery.id === id && !delivery.deliveryStaffId,
        ),
      );
    });
  }, [pendingDeliveries, riderCount]);

  // ==========================================
  // PARSE OPTIONS
  // ==========================================

  const parseOptions = (options) => {
    if (!options) {
      return [];
    }

    try {
      const parsed =
        typeof options === "string" ? JSON.parse(options) : options;

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.log("parse options error =", error);

      return [];
    }
  };

  // ==========================================
  // GET ORDER
  // ==========================================

  const getDeliveryOrder = (delivery) => {
    if (Array.isArray(delivery?.orders) && delivery.orders.length > 0) {
      return delivery.orders[0];
    }

    return null;
  };

  // ==========================================
  // GET ADDRESS
  // ==========================================

  const getCustomerAddress = (customer) => {
    if (!customer) {
      return null;
    }

    if (Array.isArray(customer.addresses) && customer.addresses.length > 0) {
      return (
        customer.addresses.find((address) => address.isDefault) ||
        customer.addresses[0]
      );
    }

    return null;
  };

  // ==========================================
  // ORDER NUMBER
  // ==========================================

  const formatOrderNumber = (orderId) => {
    return `#ORD${String(orderId).padStart(4, "0")}`;
  };

  // ==========================================
  // DELIVERY STATUS
  // ==========================================

  const DELIVERY_STATUS_META = {
    PENDING: {
      label: "พร้อมจัดส่ง",
      icon: PackageCheck,
      className: "pending",
    },

    DELIVERING: {
      label: "กำลังจัดส่ง",
      icon: Truck,
      className: "delivering",
    },

    COMPLETED: {
      label: "จัดส่งสำเร็จ",
      icon: CheckCircle2,
      className: "completed",
    },
  };

  // ==========================================
  // TABS
  // ==========================================

  const tabs = [
    {
      label: "พร้อมจัดส่ง",
      value: "PENDING",
    },
    {
      label: "กำลังจัดส่ง",
      value: "DELIVERING",
    },
    {
      label: "จัดส่งสำเร็จ",
      value: "COMPLETED",
    },
    {
      label: "ทั้งหมด",
      value: "ALL",
    },
  ];

  // ==========================================
  // COUNT
  // ==========================================

  const countFor = (value) => {
    if (value === "ALL") {
      return deliveries.length;
    }

    return deliveries.filter((delivery) => delivery.status === value).length;
  };

  // ==========================================
  // FILTER
  // ==========================================

  const filtered =
    filter === "ALL"
      ? deliveries
      : deliveries.filter((delivery) => delivery.status === filter);

  // ==========================================
  // SELECT ONE
  // ==========================================

  const toggleDelivery = (delivery) => {
    if (!delivery) {
      return;
    }

    if (delivery.status !== "PENDING") {
      return;
    }

    if (delivery.deliveryStaffId) {
      return;
    }

    // มีไรเดอร์ 0 หรือ 1 คน
    // ไม่ต้องเลือก เพราะ:
    // 0 = ร้านส่งเอง
    // 1 = ระบบ assign แล้ว
    if (riderCount <= 1) {
      return;
    }

    setSelectedDeliveryIds((current) => {
      if (current.includes(delivery.id)) {
        return current.filter((id) => id !== delivery.id);
      }

      return [...current, delivery.id];
    });
  };

  // ==========================================
  // SELECTABLE PENDING
  //
  // เฉพาะตอนมีไรเดอร์ 2 คนขึ้นไป
  // ==========================================

  const selectablePendingDeliveries = useMemo(() => {
    if (riderCount <= 1) {
      return [];
    }

    return pendingDeliveries.filter((delivery) => !delivery.deliveryStaffId);
  }, [pendingDeliveries, riderCount]);

  // ==========================================
  // SELECT ALL
  // ==========================================

  const allPendingSelected =
    selectablePendingDeliveries.length > 0 &&
    selectablePendingDeliveries.every((delivery) =>
      selectedDeliveryIds.includes(delivery.id),
    );

  const toggleSelectAll = () => {
    if (selectablePendingDeliveries.length === 0) {
      return;
    }

    if (allPendingSelected) {
      setSelectedDeliveryIds([]);
      return;
    }

    setSelectedDeliveryIds(
      selectablePendingDeliveries.map((delivery) => delivery.id),
    );
  };

  // ==========================================
  // ADD MINUTES
  // ==========================================

  const addMinutesToTime = (time, minutes) => {
    if (!time) {
      return "-";
    }

    const [hour, minute] = String(time).slice(0, 5).split(":").map(Number);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return "-";
    }

    const totalMinutes = hour * 60 + minute + minutes;

    const finalHour = Math.floor(totalMinutes / 60) % 24;

    const finalMinute = totalMinutes % 60;

    return `${String(finalHour).padStart(2, "0")}:${String(
      finalMinute,
    ).padStart(2, "0")}`;
  };

  // ==========================================
  // BULK ASSIGN
  //
  // ใช้เฉพาะกรณีมีไรเดอร์ 2+ คน
  // ==========================================

  const handleBulkAssign = async () => {
    if (assigning) {
      return;
    }

    if (selectedDeliveryIds.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้เลือกออเดอร์",
        text: "กรุณาเลือกออเดอร์ที่ต้องการมอบหมาย",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (riderCount === 0) {
      await Swal.fire({
        icon: "info",
        title: "ไม่มีผู้ส่ง",
        text: "ร้านสามารถจัดส่งเองได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (riderCount === 1) {
      await Swal.fire({
        icon: "info",
        title: "ระบบมอบหมายให้แล้ว",
        text: `ระบบมอบหมายงานให้ ${deliveryStaffs[0].name} อัตโนมัติแล้ว`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (!selectedStaffId) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกผู้ส่ง",
        text: "กรุณาเลือกผู้ส่งก่อนมอบหมายงาน",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    const staff = deliveryStaffs.find(
      (item) => String(item.id) === String(selectedStaffId),
    );

    if (!staff) {
      await Swal.fire({
        icon: "error",
        title: "ไม่พบผู้ส่ง",
        text: "ไม่พบข้อมูลผู้ส่งที่เลือก",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "มอบหมายผู้ส่ง?",
      html: `
          <div style="font-size:15px;line-height:1.8">
            มอบหมาย
            <b>${selectedDeliveryIds.length}</b>
            ออเดอร์ให้
            <br/>
            <b>${staff.name}</b>
            ${
              staff.phone
                ? `<br/><span style="color:#888">${staff.phone}</span>`
                : ""
            }
          </div>
        `,
      showCancelButton: true,
      confirmButtonText: "ยืนยันมอบหมาย",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f97316",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      setAssigning(true);

      const results = await Promise.allSettled(
        selectedDeliveryIds.map((deliveryId) =>
          assignDeliveryStaff(token, deliveryId, selectedStaffId),
        ),
      );

      const successCount = results.filter(
        (result) => result.status === "fulfilled",
      ).length;

      const failCount = results.length - successCount;

      setSelectedDeliveryIds([]);
      setSelectedStaffId("");

      await loadDelivery();

      if (failCount === 0) {
        await Swal.fire({
          icon: "success",
          title: "มอบหมายสำเร็จ",
          text: `มอบหมาย ${successCount} ออเดอร์ให้ ${staff.name} แล้ว`,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#f97316",
        });
      } else {
        await Swal.fire({
          icon: "warning",
          title: "มอบหมายเสร็จบางส่วน",
          text: `สำเร็จ ${successCount} ออเดอร์ และไม่สำเร็จ ${failCount} ออเดอร์`,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#f97316",
        });
      }
    } catch (error) {
      console.error("มอบหมายผู้ส่งไม่สำเร็จ:", error);

      await Swal.fire({
        icon: "error",
        title: "มอบหมายผู้ส่งไม่สำเร็จ",
        text: error?.response?.data?.message || "ไม่สามารถมอบหมายผู้ส่งได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setAssigning(false);
    }
  };

  // ==========================================
  // CHANGE RIDER
  // ==========================================

  const handleChangeRider = async (delivery) => {
    if (!delivery?.id) {
      return;
    }

    if (delivery.status !== "PENDING") {
      await Swal.fire({
        icon: "warning",
        title: "ไม่สามารถเปลี่ยนผู้ส่งได้",
        text: "งานนี้เริ่มจัดส่งแล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    if (riderCount === 0) {
      await Swal.fire({
        icon: "info",
        title: "ไม่มีผู้ส่ง",
        text: "ขณะนี้ไม่มีพนักงานส่งอาหารที่พร้อมใช้งาน ร้านสามารถส่งเองได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    let staffId = "";

    // มีคนเดียว
    if (riderCount === 1) {
      const onlyStaff = deliveryStaffs[0];

      // ถ้าเป็นคนเดิมอยู่แล้ว
      if (String(delivery.deliveryStaffId) === String(onlyStaff.id)) {
        await Swal.fire({
          icon: "info",
          title: "มีผู้ส่งคนเดียว",
          text: `${onlyStaff.name} เป็นผู้ส่ง Active เพียงคนเดียวในขณะนี้`,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#f97316",
        });

        return;
      }

      staffId = String(onlyStaff.id);
    }

    // มีหลายคน
    if (riderCount > 1) {
      const options = {};

      deliveryStaffs.forEach((staff) => {
        options[String(staff.id)] = `${staff.name}${
          staff.phone ? ` • ${staff.phone}` : ""
        }`;
      });

      const result = await Swal.fire({
        title: "เปลี่ยนผู้ส่ง",
        text: "เลือกผู้ส่งที่จะรับออเดอร์นี้",
        input: "select",
        inputOptions: options,
        inputValue: delivery.deliveryStaffId
          ? String(delivery.deliveryStaffId)
          : "",
        inputPlaceholder: "เลือกผู้ส่ง",
        showCancelButton: true,
        confirmButtonText: "เปลี่ยนผู้ส่ง",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#f97316",
        inputValidator: (value) => {
          if (!value) {
            return "กรุณาเลือกผู้ส่ง";
          }

          return undefined;
        },
      });

      if (!result.isConfirmed) {
        return;
      }

      staffId = result.value;
    }

    const staff = deliveryStaffs.find(
      (item) => String(item.id) === String(staffId),
    );

    if (!staff) {
      return;
    }

    if (String(delivery.deliveryStaffId) === String(staff.id)) {
      await Swal.fire({
        icon: "info",
        title: "ผู้ส่งคนเดิม",
        text: `ออเดอร์นี้มอบหมายให้ ${staff.name} อยู่แล้ว`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "เปลี่ยนผู้ส่ง?",
      html: `
            <div style="font-size:15px;line-height:1.8">
              เปลี่ยนผู้ส่งเป็น
              <br/>
              <b>${staff.name}</b>
              ${
                staff.phone
                  ? `<br/><span style="color:#888">${staff.phone}</span>`
                  : ""
              }
            </div>
          `,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#f97316",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      setAssigning(true);

      await assignDeliveryStaff(token, delivery.id, staffId);

      await loadDelivery();

      await Swal.fire({
        icon: "success",
        title: "เปลี่ยนผู้ส่งสำเร็จ",
        text: `มอบหมายงานให้ ${staff.name} แล้ว`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } catch (error) {
      console.error("เปลี่ยนผู้ส่งไม่สำเร็จ:", error);

      await Swal.fire({
        icon: "error",
        title: "เปลี่ยนผู้ส่งไม่สำเร็จ",
        text: error?.response?.data?.message || "ไม่สามารถเปลี่ยนผู้ส่งได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setAssigning(false);
    }
  };

  // ==========================================
  // START DELIVERY
  // ==========================================

  const handleStartDelivery = async (delivery) => {
    if (!delivery?.id) {
      return;
    }

    if (delivery.status !== "PENDING") {
      return;
    }

    const order = getDeliveryOrder(delivery);

    const orderId = order?.id || delivery.id;

    const confirm = await Swal.fire({
      icon: "question",
      title: "เริ่มจัดส่ง?",
      html: `
      <div style="font-size:15px;line-height:1.8">
        ต้องการเริ่มจัดส่งออเดอร์
        <br/>
        <b>#ORD${String(orderId).padStart(4, "0")}</b>
        หรือไม่?
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: "เริ่มจัดส่ง",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#9CA3AF",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    try {
      setAssigning(true);

      await changeStatusDelivery(token, delivery.id, "DELIVERING");

      await loadDelivery();

      await Swal.fire({
        icon: "success",
        title: "เริ่มจัดส่งแล้ว",
        text: `ออเดอร์ #ORD${String(orderId).padStart(4, "0")} อยู่ระหว่างจัดส่ง`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("เริ่มจัดส่งไม่สำเร็จ:", error);

      await Swal.fire({
        icon: "error",
        title: "เริ่มจัดส่งไม่สำเร็จ",
        text: error?.response?.data?.message || "ไม่สามารถเริ่มจัดส่งได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setAssigning(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <DeliverySkeleton />;
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="dv-root">
      <style>{`

.dv-root {
  --cream: #FFF8F0;
  --peach: #FFE4C4;
  --orange: #FF6B35;
  --coral: #E8491D;
  --charcoal: #2A1B12;
  --cocoa: #8A6A54;

  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;

  background: linear-gradient(
    180deg,
    #FFFCF7 0%,
    #FFF3E4 25%,
    #FFF8F0 100%
  );

  font-family: 'Noto Sans Thai', sans-serif;
  color: var(--charcoal);

  /* เผื่อพื้นที่ด้านล่างให้แถบนำทาง */
  padding: 24px 16px calc(120px + env(safe-area-inset-bottom));

  box-sizing: border-box;
  overflow: visible;
}

.dv-root *,
.dv-root *::before,
.dv-root *::after {
  box-sizing: border-box;
}

.dv-wrap {
  width: 100%;
  max-width: 1152px;
  margin: 0 auto;
  min-width: 0;
}

        .dv-header {
          margin-bottom: 22px;
        }

        .dv-title {
          font-family: 'Kanit', sans-serif;
          font-weight: 800;
          font-size: 1.85rem;
          margin: 0;
          color: var(--charcoal);
        }

        .dv-subtitle {
          color: var(--cocoa);
          font-size: .9rem;
          margin: 5px 0 0;
        }

        .dv-bulk-panel {
          background: rgba(255,255,255,.96);
          border: 1px solid #FBE3C6;
          border-radius: 20px;
          padding: 14px;
          margin-bottom: 18px;
          box-shadow: 0 10px 25px -20px rgba(42,27,18,.35);
        }

        .dv-bulk-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .dv-select-all {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: 800;
          font-size: 14px;
          border: none;
          background: transparent;
          color: var(--charcoal);
          padding: 0;
        }

        .dv-select-all:hover {
          color: var(--orange);
        }

        .dv-check {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          border: 2px solid #E9C9A7;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
        }

        .dv-check.checked {
          background: linear-gradient(
            135deg,
            var(--orange),
            var(--coral)
          );
          border-color: transparent;
        }

        .dv-selected-count {
          color: var(--orange);
          font-size: 13px;
          font-weight: 800;
        }

        .dv-assign-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 13px;
        }

        .dv-rider-select {
          flex: 1;
          min-width: 0;
          padding: 11px 13px;
          border: 1px solid #F3D4B1;
          border-radius: 13px;
          background: #FFF8F0;
          color: var(--charcoal);
          font-family: 'Noto Sans Thai', sans-serif;
          font-weight: 700;
          outline: none;
        }

        .dv-rider-select:focus {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(255,107,53,.1);
        }

        .dv-assign-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 17px;
          border: none;
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            var(--orange),
            var(--coral)
          );
          color: white;
          font-family: 'Kanit', sans-serif;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 8px 18px rgba(232,73,29,.18);
        }

        .dv-assign-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .dv-tabs {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 2px 2px 8px;
          margin-bottom: 22px;
          scrollbar-width: none;
        }

        .dv-tabs::-webkit-scrollbar {
          display: none;
        }

        .dv-tab {
          display: flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          padding: 10px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid #FBE3C6;
          background: rgba(255,255,255,.9);
          color: var(--cocoa);
          flex-shrink: 0;
        }

        .dv-tab.is-active {
          background: linear-gradient(
            135deg,
            var(--orange),
            var(--coral)
          );
          color: white;
          border-color: transparent;
          box-shadow: 0 8px 18px rgba(232,73,29,.18);
        }

        .dv-tab-count {
          min-width: 22px;
          text-align: center;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(0,0,0,.07);
        }

        .dv-tab.is-active .dv-tab-count {
          background: rgba(255,255,255,.25);
        }

        .dv-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dv-card {
          background: rgba(255,255,255,.96);
          border: 1px solid rgba(251,227,198,.8);
          border-radius: 24px;
          padding: 18px;
          box-shadow: 0 12px 30px -22px rgba(42,27,18,.3);
        }

        .dv-card.is-selected {
          border: 2px solid var(--orange);
          box-shadow: 0 14px 35px -22px rgba(232,73,29,.35);
        }

        .dv-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .dv-customer-row {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .dv-customer-icon {
          width: 46px;
          height: 46px;
          border-radius: 15px;
          background: linear-gradient(
            135deg,
            #FFE9CF,
            #FFD7AD
          );
          color: var(--coral);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dv-customer-content {
          min-width: 0;
        }

        .dv-customer-name {
          font-family: 'Kanit', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dv-order-number {
          color: var(--cocoa);
          font-size: 12px;
          margin-top: 2px;
        }

        .dv-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .dv-status.pending {
          background: #FFF3D6;
          color: #B7791F;
        }

        .dv-status.delivering {
          background: #DBEAFE;
          color: #2563EB;
        }

        .dv-status.completed {
          background: #DCFCE7;
          color: #16A34A;
        }

        .dv-divider {
          border: none;
          border-top: 1px dashed #F0DDC2;
          margin: 17px 0;
        }

        .dv-card-select {
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dv-order-select {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 13px;
          font-weight: 800;
          color: var(--cocoa);
          user-select: none;
        }

        .dv-order-select.can-select {
          cursor: pointer;
        }

        .dv-order-checkbox {
          width: 22px;
          height: 22px;
          margin: 0;
          cursor: pointer;
          accent-color: var(--orange);
          flex-shrink: 0;
        }

        .dv-order-selected {
          color: var(--orange);
        }

        .dv-assigned {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border-radius: 12px;
          background: #EEFDF4;
          border: 1px solid #BBF7D0;
          color: #15803D;
          font-size: 13px;
          font-weight: 800;
          width: 100%;
        }

        .dv-assigned-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: #DCFCE7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dv-assigned-info {
          flex: 1;
          min-width: 0;
        }

        .dv-change-rider-btn {
          border: 1px solid #F7C99A;
          background: white;
          color: #E8491D;
          border-radius: 9px;
          padding: 7px 10px;
          font-family: 'Noto Sans Thai', sans-serif;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .dv-change-rider-btn:hover:not(:disabled) {
          background: #FFF3E4;
        }

        .dv-change-rider-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .dv-self-delivery {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 12px;
          background: #FFF7ED;
          border: 1px solid #FED7AA;
          color: #C2410C;
          font-size: 13px;
          font-weight: 800;
        }

        .dv-address-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .dv-address-box {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 14px;
          border-radius: 17px;
          background: #FFF8F0;
          border: 1px solid #FBE9D4;
        }

        .dv-address-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #FFE4C4;
          color: var(--coral);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dv-address-content {
          flex: 1;
          min-width: 0;
        }

        .dv-address-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 800;
          color: var(--orange);
          margin-bottom: 3px;
        }

        .dv-address-text {
          color: var(--charcoal);
          font-size: 13px;
          font-weight: 600;
          line-height: 1.55;
          word-break: break-word;
        }

        .dv-menu-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .dv-menu-item {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 0;
        }

        .dv-menu-item + .dv-menu-item {
          border-top: 1px dashed #F5EAD9;
        }

        .dv-menu-name {
          font-weight: 700;
          font-size: 14px;
        }

        .dv-menu-name .qty {
          color: var(--orange);
          font-weight: 800;
        }

        .dv-menu-options {
          margin: 5px 0 0 4px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .dv-menu-option {
          font-size: 12px;
          color: var(--cocoa);
        }

        .dv-menu-price {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
        }

        .dv-detail-btn {
          width: 100%;
          margin-top: 17px;
          padding: 13px 16px;
          border-radius: 15px;
          border: 1px solid #F7C99A;
          background: #FFF8F0;
          color: var(--coral);
          font-family: 'Kanit', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .dv-detail-btn:hover {
          background: linear-gradient(
            135deg,
            var(--orange),
            var(--coral)
          );
          color: white;
          border-color: transparent;
        }

        .dv-empty {
          background: white;
          border-radius: 24px;
          padding: 54px 20px;
          text-align: center;
          border: 1px solid #FBE9D4;
        }

        .dv-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--peach);
          color: var(--orange);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
        }

        .dv-empty-title {
          font-family: 'Kanit', sans-serif;
          font-weight: 700;
          font-size: 1.15rem;
        }

        .dv-empty-sub {
          color: var(--cocoa);
          font-size: 13px;
          margin-top: 4px;
        }

        @media (max-width: 600px) {
          .dv-assign-row {
            flex-direction: column;
            align-items: stretch;
          }

          .dv-assign-btn {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .dv-root {
  padding: 18px 12px calc(120px + env(safe-area-inset-bottom));
}

          .dv-card {
            padding: 16px;
          }

          .dv-card-top {
            gap: 10px;
          }

          .dv-status {
            font-size: 11px;
            padding: 6px 9px;
          }

          .dv-assigned {
            align-items: flex-start;
          }

          .dv-change-rider-btn {
            padding: 6px 8px;
          }
        }

      `}</style>

      <div className="dv-wrap">
        {/* HEADER */}

        <div className="dv-header">
          <h1 className="dv-title">รายการจัดส่ง</h1>

          <p className="dv-subtitle">ติดตามรายการอาหารที่ต้องจัดส่งให้ลูกค้า</p>
        </div>

        {/* เชิญชวนเพิ่มไรเดอร์ เฉพาะร้านที่ยังไม่มีไรเดอร์ */}
        {riderCount === 0 && (
          <div className="mb-5 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Truck size={24} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900">
                  เพิ่มผู้ส่งให้ร้านของคุณ
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  ร้านของคุณยังไม่มีผู้ส่ง
                  เพิ่มพนักงานส่งอาหารเพื่อช่วยจัดส่งออเดอร์
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/store/StoreStaff")}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-95"
                >
                  <Users size={17} />
                  เพิ่มผู้ส่งของร้านคุณเลย
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            BULK ASSIGN
            แสดงเฉพาะกรณีมีไรเดอร์ 2 คนขึ้นไป
            ========================================== */}

        {riderCount > 1 && selectablePendingDeliveries.length > 0 && (
          <div className="dv-bulk-panel">
            <div className="dv-bulk-top">
              <button
                type="button"
                className="dv-select-all"
                onClick={toggleSelectAll}
                disabled={assigning}
              >
                <span
                  className={`dv-check ${allPendingSelected ? "checked" : ""}`}
                >
                  {allPendingSelected && <Check size={15} strokeWidth={3} />}
                </span>

                {allPendingSelected
                  ? "ยกเลิกการเลือกทั้งหมด"
                  : "เลือกออเดอร์ทั้งหมด"}
              </button>

              <span className="dv-selected-count">
                เลือกแล้ว {selectedDeliveryIds.length} /{" "}
                {selectablePendingDeliveries.length} ออเดอร์
              </span>
            </div>

            <div className="dv-assign-row">
              <select
                className="dv-rider-select"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                disabled={assigning}
              >
                <option value="">เลือกผู้ส่ง</option>

                {deliveryStaffs.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                    {staff.phone ? ` • ${staff.phone}` : ""}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="dv-assign-btn"
                onClick={handleBulkAssign}
                disabled={
                  assigning ||
                  selectedDeliveryIds.length === 0 ||
                  !selectedStaffId
                }
              >
                {assigning ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    กำลังมอบหมาย...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    มอบหมาย {selectedDeliveryIds.length} ออเดอร์
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            TABS
            ========================================== */}

        <div className="dv-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`dv-tab ${filter === tab.value ? "is-active" : ""}`}
            >
              {tab.label}

              <span className="dv-tab-count">{countFor(tab.value)}</span>
            </button>
          ))}
        </div>

        {/* ==========================================
            EMPTY
            ========================================== */}

        {filtered.length === 0 ? (
          <div className="dv-empty">
            <div className="dv-empty-icon">
              <Inbox size={28} />
            </div>

            <div className="dv-empty-title">ไม่มีรายการในหมวดนี้</div>

            <div className="dv-empty-sub">งานจัดส่งใหม่จะปรากฏที่นี่</div>
          </div>
        ) : (
          <div className="dv-list">
            {filtered.map((delivery) => {
              const order = getDeliveryOrder(delivery);

              const customer = order?.customer;

              const address = getCustomerAddress(customer);

              const items = Array.isArray(order?.menu) ? order.menu : [];

              const customerName = customer?.username || "ไม่พบชื่อลูกค้า";

              const customerAddress =
                address?.address || customer?.address || "ไม่พบที่อยู่จัดส่ง";

              const addressLabel = address?.label || "";

              const statusMeta =
                DELIVERY_STATUS_META[delivery.status] ||
                DELIVERY_STATUS_META.PENDING;

              const StatusIcon = statusMeta.icon;

              const orderId = order?.id || delivery.id;

              const isPending = delivery.status === "PENDING";

              const hasRider = Boolean(delivery.deliveryStaffId);

              const rider = delivery.deliveryStaff || null;

              const isSelected = selectedDeliveryIds.includes(delivery.id);

              return (
                <div
                  key={delivery.id}
                  className={`dv-card ${isSelected ? "is-selected" : ""}`}
                >
                  {isPending && (
                    <div className="dv-card-select">
                      {hasRider ? (
                        rider?.isActive === false ? (
                          // =====================================================
                          // ไรเดอร์ปิดใช้งาน
                          // =====================================================
                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <X size={16} strokeWidth={3} />
                              </span>

                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-red-700">
                                  ผู้ส่งถูกปิดใช้งาน
                                </div>

                                <div className="mt-0.5 truncate text-xs text-red-600">
                                  {rider?.name || "ไม่ทราบชื่อ"}
                                  {rider?.phone ? ` • ${rider.phone}` : ""}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100"
                              onClick={() => handleChangeRider(delivery)}
                              disabled={assigning}
                            >
                              เปลี่ยนผู้ส่ง
                            </button>
                          </div>
                        ) : (
                          // =====================================================
                          // ไรเดอร์ปกติ
                          // =====================================================
                          <div className="dv-assigned">
                            <span className="dv-assigned-icon">
                              <Check size={15} strokeWidth={3} />
                            </span>

                            <span className="dv-assigned-info">
                              มีผู้ส่งแล้ว:
                              <strong>{rider?.name || "ไม่ทราบชื่อ"}</strong>
                              {rider?.phone ? ` • ${rider.phone}` : ""}
                            </span>

                            <button
                              type="button"
                              className="dv-change-rider-btn"
                              onClick={() => handleChangeRider(delivery)}
                              disabled={assigning}
                            >
                              แก้ไขผู้ส่ง
                            </button>
                          </div>
                        )
                      ) : riderCount === 0 ? (
                        <div className="dv-self-delivery">
                          <Store size={17} />
                          <span>ร้านส่งเอง</span>
                        </div>
                      ) : riderCount === 1 ? (
                        <div className="dv-self-delivery">
                          <Users size={17} />
                          <span>เลือกผู้ส่งหรือจัดส่งเอง</span>
                        </div>
                      ) : (
                        <label
                          className={`dv-order-select ${
                            isSelected ? "dv-order-selected" : "can-select"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="dv-order-checkbox"
                            checked={isSelected}
                            onChange={() => toggleDelivery(delivery)}
                            disabled={assigning}
                          />

                          {isSelected
                            ? "เลือกออเดอร์นี้แล้ว"
                            : "เลือกออเดอร์นี้"}
                        </label>
                      )}
                    </div>
                  )}

                  {/* ==================================
                        CUSTOMER
                        ================================== */}

                  <div className="dv-card-top">
                    <div className="dv-customer-row">
                      <div className="dv-customer-icon">
                        <User size={20} />
                      </div>

                      <div className="dv-customer-content">
                        <p className="dv-customer-name">{customerName}</p>

                        <div className="dv-order-number">
                          ออเดอร์ {formatOrderNumber(orderId)}
                          {delivery.orderRound && (
                            <span className="ml-2 text-xs font-medium text-orange-500">
                              รอบ {delivery.orderRound.roundNumber}
                              {" · "}
                              {delivery.orderRound.startTime}
                              {" - "}
                              {delivery.orderRound.endTime}
                              {" น. · ส่งภายใน "}
                              {addMinutesToTime(
                                delivery.orderRound.endTime,
                                20,
                              )}
                              {" น."}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`dv-status ${statusMeta.className}`}>
                      <StatusIcon size={15} />

                      {statusMeta.label}
                    </div>
                  </div>

                  <hr className="dv-divider" />

                  {/* ==================================
                        ADDRESS
                        ================================== */}

                  <div className="dv-address-title">
                    <MapPinned size={17} />
                    ที่อยู่จัดส่ง
                  </div>

                  <div className="dv-address-box">
                    <div className="dv-address-icon-box">
                      <MapPin size={19} />
                    </div>

                    <div className="dv-address-content">
                      {addressLabel && (
                        <div className="dv-address-label">
                          <Home size={12} />

                          {addressLabel}
                        </div>
                      )}

                      <div className="dv-address-text">{customerAddress}</div>
                    </div>
                  </div>

                  <hr className="dv-divider" />

                  {/* ==================================
                        MENU
                        ================================== */}

                  <div className="dv-menu-title">
                    <UtensilsCrossed size={17} />
                    รายการอาหาร
                  </div>

                  {items.length === 0 ? (
                    <p className="text-sm text-gray-400">ไม่พบรายการอาหาร</p>
                  ) : (
                    items.map((item, index) => {
                      const menu = item.menu;

                      const options = parseOptions(item.options);

                      const quantity = Number(item.quantity ?? item.count ?? 1);

                      const price = Number(item.price || 0);

                      const itemTotal = price * quantity;

                      return (
                        <div key={item.id || index} className="dv-menu-item">
                          <div>
                            <div className="dv-menu-name">
                              {menu?.menuItem || "ไม่พบชื่อเมนู"}

                              <span className="qty"> x{quantity}</span>
                            </div>

                            {options.length > 0 && (
                              <div className="dv-menu-options">
                                {options.map((option, optionIndex) => (
                                  <div
                                    key={option.id || optionIndex}
                                    className="dv-menu-option"
                                  >
                                    +{" "}
                                    {option.choiceName ||
                                      option.name ||
                                      "ตัวเลือก"}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="dv-menu-price">
                            ฿{itemTotal.toFixed(2)}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* ==================================
                        DETAIL
                        ================================== */}

                  <div className="flex gap-2 mt-4">
                    {delivery.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => handleStartDelivery(delivery)}
                        disabled={assigning}
                        className="
        flex-1
        py-3
        rounded-xl
        border
        border-blue-200
        bg-blue-50
        text-blue-600
        font-bold
        hover:bg-blue-600
        hover:text-white
        transition
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
                      >
                        {assigning ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={17} className="animate-spin" />
                            กำลังเริ่มจัดส่ง...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Truck size={17} />
                            จัดส่ง
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      className="dv-detail-btn !mt-0 flex-1"
                      onClick={() =>
                        navigate(`/store/Delivery-detail/${orderId}`)
                      }
                    >
                      ดูรายละเอียด
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPage;
