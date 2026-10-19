import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  Bike,
  Clock,
  Package,
  RefreshCw,
  Phone,
  User,
  UtensilsCrossed,
  ChevronRight,
} from "lucide-react";

import { getDeliveryJobs } from "../../api/createStore";

import usefoodDelivery from "../../globalState/fooddeliveryStore";

// ======================================================
// STATUS
// ======================================================

const STATUS_META = {
  PENDING: {
    label: "พร้อมจัดส่ง",
    className: "bg-orange-100 text-orange-600",
  },

  DELIVERING: {
    label: "กำลังจัดส่ง",
    className: "bg-blue-100 text-blue-600",
  },

  COMPLETED: {
    label: "เสร็จสิ้น",
    className: "bg-gray-100 text-gray-600",
  },
};

// ======================================================
// STATUS ORDER
// ======================================================

const STATUS_ORDER = {
  PENDING: 1,
  DELIVERING: 2,
  COMPLETED: 3,
};

// ======================================================
// STATUS TABS
// ======================================================

const STATUS_TABS = [
  {
    key: "PENDING",
    label: "พร้อมจัดส่ง",
    icon: Package,
    activeClass: "bg-orange-500 text-white",
  },

  {
    key: "DELIVERING",
    label: "กำลังจัดส่ง",
    icon: Bike,
    activeClass: "bg-blue-500 text-white",
  },

  {
    key: "COMPLETED",
    label: "เสร็จสิ้น",
    icon: Clock,
    activeClass: "bg-gray-600 text-white",
  },
];

// ======================================================
// PARSE OPTIONS
// ======================================================

const parseOptions = (options) => {
  if (!options) return [];

  if (Array.isArray(options)) {
    return options;
  }

  if (typeof options === "object") {
    return [options];
  }

  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      if (parsed && typeof parsed === "object") {
        return [parsed];
      }

      return [];
    } catch {
      return [];
    }
  }

  return [];
};

// ======================================================
// ADD MINUTES
// ======================================================

const addMinutesToTime = (time, minutes) => {
  if (!time) return "-";

  const [hour, minute] = String(time).slice(0, 5).split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "-";
  }

  const totalMinutes = hour * 60 + minute + minutes;

  const finalHour = Math.floor(totalMinutes / 60) % 24;
  const finalMinute = totalMinutes % 60;

  return `${String(finalHour).padStart(2, "0")}:${String(finalMinute).padStart(
    2,
    "0",
  )}`;
};

// ======================================================
// EMPTY MESSAGE
// ======================================================

const getEmptyTitle = (status) => {
  switch (status) {
    case "PENDING":
      return "ไม่มีงานที่พร้อมจัดส่ง";

    case "DELIVERING":
      return "ไม่มีงานที่กำลังจัดส่ง";

    case "COMPLETED":
      return "ยังไม่มีงานที่เสร็จสิ้น";

    default:
      return "ไม่มีงานส่ง";
  }
};

const getEmptyMessage = (status) => {
  switch (status) {
    case "PENDING":
      return "เมื่อร้านมอบหมายงานส่งให้คุณ งานจะแสดงที่นี่";

    case "DELIVERING":
      return "งานที่คุณกำลังจัดส่งจะแสดงที่นี่";

    case "COMPLETED":
      return "งานที่จัดส่งสำเร็จแล้วจะแสดงที่นี่";

    default:
      return "ยังไม่มีงานส่ง";
  }
};

// ======================================================
// COMPONENT
// ======================================================

export default function DeliveryJobs() {
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeStatus, setActiveStatus] = useState("PENDING");

  const token = usefoodDelivery((state) => state.token);
  const user = usefoodDelivery((state) => state.user);

  // ======================================================
  // LOAD
  // ======================================================

  const loadDeliveries = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const res = await getDeliveryJobs(token);


      const jobs = Array.isArray(res.data?.deliveries)
        ? res.data.deliveries
        : [];

      setDeliveries(jobs);
    } catch (error) {
      console.error("loadDeliveries Error =", error);

      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "ไม่สามารถโหลดงานส่งได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    if (!token) return;

    loadDeliveries();
  }, [token]);

  // ======================================================
  // SORT DELIVERIES
  // ======================================================

  const sortedDeliveries = [...deliveries].sort((a, b) => {
    const statusA = STATUS_ORDER[a?.status] || 99;

    const statusB = STATUS_ORDER[b?.status] || 99;

    if (statusA !== statusB) {
      return statusA - statusB;
    }

    const dateA = new Date(a?.createdAt || 0).getTime();

    const dateB = new Date(b?.createdAt || 0).getTime();

    return dateB - dateA;
  });

  // ======================================================
  // FILTER BY STATUS
  // ======================================================

  const filteredDeliveries = sortedDeliveries.filter(
    (delivery) => delivery.status === activeStatus,
  );

  // ======================================================
  // CUSTOMER NAME
  // ======================================================

  const getCustomerNames = (orders = []) => {
    const names = orders
      .map((order) => order?.customer?.username)
      .filter(Boolean);

    return [...new Set(names)];
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0]">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-orange-500" />

          <p className="text-gray-600">กำลังโหลดงานส่ง...</p>
        </div>
      </div>
    );
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-100 p-3">
              <Bike className="h-7 w-7 text-orange-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">งานส่งอาหาร</h1>

              <p className="text-sm text-gray-500">งานที่ร้านมอบหมายให้คุณ</p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadDeliveries}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
        </div>

        {/* ==================================================
            STATUS TABS
        ================================================== */}

        <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 shadow-sm">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;

            const count = deliveries.filter(
              (delivery) => delivery.status === tab.key,
            ).length;

            const active = activeStatus === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveStatus(tab.key)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  active ? tab.activeClass : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />

                <span className="hidden sm:inline">{tab.label}</span>

                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ==================================================
            CURRENT STATUS SUMMARY
        ================================================== */}

        <div className="mb-5 rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">งานสถานะปัจจุบัน</p>

              <p className="mt-0.5 text-base font-bold text-gray-800">
                {STATUS_META[activeStatus]?.label}
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 px-4 py-2">
              <span className="text-lg font-bold text-orange-500">
                {filteredDeliveries.length}
              </span>

              <span className="ml-1 text-xs text-gray-500">งาน</span>
            </div>
          </div>
        </div>

        {/* ==================================================
            EMPTY
        ================================================== */}

        {filteredDeliveries.length === 0 ? (
          <div className="rounded-3xl border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
            <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />

            <h2 className="text-lg font-semibold text-gray-700">
              {getEmptyTitle(activeStatus)}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {getEmptyMessage(activeStatus)}
            </p>
          </div>
        ) : (
          /* ==================================================
             DELIVERY LIST
          ================================================== */

          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => {
              const status =
                STATUS_META[delivery.status] || STATUS_META.PENDING;

              const isMyJob =
                Number(delivery.deliveryStaffId) === Number(user?.id);

              const customerNames = getCustomerNames(delivery.orders);

              const isCompleted = delivery.status === "COMPLETED";

              return (
                <div
                  key={delivery.id}
                  className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
                    isCompleted ? "border-gray-200" : "border-orange-100"
                  }`}
                >
                  <div className="p-5">
                    {/* ==================================================
                          HEADER
                      ================================================== */}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-gray-800">
                            งานส่ง #ORD
                            {String(delivery.id).padStart(4, "0")}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />

                          {delivery.orderRound ? (
                            <>
                              <span>
                                รอบที่ {delivery.orderRound.roundNumber}
                              </span>

                              <span>•</span>

                              <span>
                                ส่งภายใน{" "}
                                {addMinutesToTime(
                                  delivery.orderRound.endTime,
                                  20,
                                )}{" "}
                                น.
                              </span>
                            </>
                          ) : (
                            <span>ส่งแบบทันที</span>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-500">
                        {delivery.orders?.length || 0} ออเดอร์
                      </div>
                    </div>

                    {/* ==================================================
                          COMPLETED MESSAGE
                      ================================================== */}

                    {isCompleted && (
                      <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-gray-500" />

                          <div>
                            <p className="text-sm font-semibold text-gray-700">
                              งานนี้จัดส่งเสร็จสิ้นแล้ว
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              รายละเอียดงานยังสามารถเปิดดูได้
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ==================================================
                          STAFF
                      ================================================== */}

                    <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                          <Bike className="h-5 w-5" />
                        </div>

                        <div>
                          <p className="text-xs text-blue-500">ผู้รับผิดชอบ</p>

                          <p className="mt-1 text-sm font-semibold text-blue-700">
                            {delivery.deliveryStaff?.name ||
                              (isMyJob ? "คุณ" : "ไม่ระบุ")}
                          </p>

                          {delivery.deliveryStaff?.phone && (
                            <p className="mt-0.5 text-xs text-blue-500">
                              {delivery.deliveryStaff.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ==================================================
                          CUSTOMER
                      ================================================== */}

                    {customerNames.length > 0 && (
                      <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <User className="h-4 w-4 text-orange-500" />
                          ลูกค้า
                        </div>

                        <div className="space-y-2">
                          {customerNames.map((name) => (
                            <div key={name} className="text-sm text-gray-600">
                              {name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ==================================================
                          MENU SUMMARY
                      ================================================== */}

                    {delivery.orders?.length > 0 && (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center gap-2">
                          <UtensilsCrossed className="h-4 w-4 text-orange-500" />

                          <p className="text-sm font-semibold text-gray-700">
                            รายการอาหาร
                          </p>
                        </div>

                        <div className="space-y-2">
                          {delivery.orders.map((order) => (
                            <div
                              key={order.id}
                              className="rounded-2xl border border-gray-100 bg-gray-50 p-3"
                            >
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  ออเดอร์ #{order.id}
                                </span>

                                {order.customer?.phone && (
                                  <a
                                    href={`tel:${order.customer.phone}`}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500"
                                  >
                                    <Phone className="h-3.5 w-3.5" />

                                    {order.customer.phone}
                                  </a>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                {(order.menu || []).map((item, index) => {
                                  const menu = item?.menu || {};

                                  const options = parseOptions(item?.options);

                                  const quantity = Number(
                                    item?.count ?? item?.quantity ?? 1,
                                  );

                                  return (
                                    <div
                                      key={item?.id || index}
                                      className="rounded-xl bg-white px-3 py-2"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-gray-700">
                                          {menu?.menuItem || "ไม่พบชื่อเมนู"}

                                          <span className="ml-1 font-semibold text-orange-500">
                                            x{quantity}
                                          </span>
                                        </span>
                                      </div>

                                      {options.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                          {options.map(
                                            (option, optionIndex) => (
                                              <p
                                                key={option?.id || optionIndex}
                                                className="text-xs text-gray-400"
                                              >
                                                +
                                                {option?.choiceName ||
                                                  option?.name ||
                                                  option?.optionName ||
                                                  "ตัวเลือก"}
                                              </p>
                                            ),
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ==================================================
                          DETAIL BUTTON
                      ================================================== */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/store/DeliveryRiderDetail/${delivery.id}`)
                      }
                      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-bold text-white transition ${
                        isCompleted
                          ? "bg-gray-600 hover:bg-gray-700"
                          : "bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      ดูรายละเอียดงาน
                      <ChevronRight className="h-5 w-5" />
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
}
