import { useEffect, useState } from "react";

import {
  BarChart3,
  ShoppingBag,
  Wallet,
  TrendingUp,
  CalendarDays,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";

import { getStoreReport } from "../../api/StoreReport";


const StoreReport = () => {
  const token = usefoodDelivery((state) => state.token);

  // =========================
  // STATE
  // =========================

  const getToday = () => {
    const now = new Date();

    const year = now.toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
    });

    const month = now.toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
      month: "2-digit",
    });

    const day = now.toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
      day: "2-digit",
    });

    return `${year}-${month}-${day}`;
  };

  const [type, setType] = useState("day");

  const [date, setDate] = useState(getToday());

  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const [year, setYear] = useState(new Date().getFullYear());

  const [loading, setLoading] = useState(true);

  const [report, setReport] = useState(null);

  const [expandedOrder, setExpandedOrder] = useState(null);

  // =========================
  // LOAD REPORT
  // =========================

  const loadReport = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);

      let params = {
        type,
      };

      if (type === "day") {
        params.date = date;
      }

      if (type === "month") {
        params.month = month;
        params.year = year;
      }

      if (type === "year") {
        params.year = year;
      }

      const res = await getStoreReport(token, params);


      setReport(res.data);

      setExpandedOrder(null);
    } catch (error) {
      console.log("โหลดรายงานไม่สำเร็จ =", error);

      console.log("SERVER ERROR =", error.response?.data);

      Swal.fire({
        icon: "error",
        title: "โหลดรายงานไม่สำเร็จ",
        text: error.response?.data?.message || "ไม่สามารถโหลดข้อมูลยอดขายได้",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD
  // =========================

  useEffect(() => {
    loadReport();
  }, [token, type, date, month, year]);

  // =========================
  // DATA
  // =========================

  const summary = report?.summary || {
    sales: 0,
    deliveryTotal: 0,
    orderCount: 0,
    foodQuantity: 0,
    averageOrder: 0,
  };

  const daily = report?.daily || [];

  const orders = report?.orders || [];

  // =========================
  // FORMAT MONEY
  // =========================

  const money = (value) => {
    return Number(value || 0).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // =========================
  // FORMAT DATE
  // =========================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(`${value}T00:00:00`);

    return date.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // =========================
  // FORMAT DATETIME
  // =========================

  const formatDateTime = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    });
  };

  // =========================
  // TITLE
  // =========================

  const getTitle = () => {
    if (type === "day") {
      return "รายงานยอดขายประจำวัน";
    }

    if (type === "month") {
      return "รายงานยอดขายประจำเดือน";
    }

    return "รายงานยอดขายประจำปี";
  };

  // =========================
  // PARSE OPTIONS
  // =========================

  const parseOptions = (options) => {
    if (!options) {
      return [];
    }

    try {
      let result = options;

      if (typeof result === "string") {
        result = JSON.parse(result);
      }

      if (!Array.isArray(result)) {
        return [];
      }

      const parsed = [];

      result.forEach((option) => {
        if (!option || typeof option !== "object") {
          return;
        }

        // ==========================================
        // รูปแบบที่บันทึกเป็น
        // {
        //   label: "ระดับความเผ็ด",
        //   choices: [...]
        // }
        // ==========================================

        if (Array.isArray(option.choices)) {
          option.choices.forEach((choice) => {
            if (!choice) return;

            parsed.push({
              label: option.label || option.name || "ตัวเลือก",

              value: choice.name || choice.label || choice.value || "-",

              price: Number(choice.extraPrice ?? choice.price ?? 0),
            });
          });

          return;
        }

        // ==========================================
        // รูปแบบที่บันทึกมาเป็นตัวเลือกที่เลือกแล้ว
        // ==========================================

        parsed.push({
          label: option.label || option.name || option.optionName || "ตัวเลือก",

          value:
            option.choiceName ||
            option.value ||
            option.choice ||
            option.selected ||
            "-",

          price: Number(option.extraPrice ?? option.price ?? 0),
        });
      });

      return parsed;
    } catch (error) {
      console.log("PARSE OPTIONS ERROR =", error);

      return [];
    }
  };

  // =========================
  // ITEM PRICE
  // =========================

  const getItemTotal = (item) => {
    const price = Number(item?.price || 0);
    const count = Number(item?.count || 0);

    return price * count;
  };

  // =========================
  // ORDER FOOD PRICE
  // =========================

  const getOrderFoodPrice = (order) => {
    if (order?.foodPrice !== undefined && order?.foodPrice !== null) {
      return Number(order.foodPrice || 0);
    }

    const total = Number(order?.totalPrice || 0);

    const deliveryFee = Number(order?.deliveryFee || 0);

    return Math.max(total - deliveryFee, 0);
  };

  // =========================
  // ORDER DELIVERY
  // =========================

  const getOrderDeliveryFee = (order) => {
    if (order?.deliveryFee !== undefined && order?.deliveryFee !== null) {
      return Number(order.deliveryFee || 0);
    }

    return 0;
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto w-full">
        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div
              className="
                w-12
                h-12
                rounded-2xl
                bg-orange-500
                text-white
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <BarChart3 size={24} />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2A1B12]">
                รายงานยอดขาย
              </h1>

              <p className="text-sm text-[#8A6A54] mt-1">
                ตรวจสอบยอดขายและจำนวนออเดอร์ของร้าน
              </p>
            </div>
          </div>
        </div>

        {/* ========================= */}
        {/* FILTER */}
        {/* ========================= */}

        <div
          className="
            bg-white
            border
            border-orange-100
            rounded-3xl
            p-5
            shadow-sm
            mb-6
          "
        >
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={20} className="text-orange-500" />

            <h2 className="font-bold text-[#2A1B12]">เลือกช่วงเวลา</h2>
          </div>

          {/* TYPE */}

          <div className="grid grid-cols-3 gap-2 mb-5">
            <button
              type="button"
              onClick={() => setType("day")}
              className={`
                py-3
                rounded-xl
                font-semibold
                transition
                ${
                  type === "day"
                    ? "bg-orange-500 text-white"
                    : "bg-orange-50 text-gray-600 hover:bg-orange-100"
                }
              `}
            >
              รายวัน
            </button>

            <button
              type="button"
              onClick={() => setType("month")}
              className={`
                py-3
                rounded-xl
                font-semibold
                transition
                ${
                  type === "month"
                    ? "bg-orange-500 text-white"
                    : "bg-orange-50 text-gray-600 hover:bg-orange-100"
                }
              `}
            >
              รายเดือน
            </button>

            <button
              type="button"
              onClick={() => setType("year")}
              className={`
                py-3
                rounded-xl
                font-semibold
                transition
                ${
                  type === "year"
                    ? "bg-orange-500 text-white"
                    : "bg-orange-50 text-gray-600 hover:bg-orange-100"
                }
              `}
            >
              รายปี
            </button>
          </div>

          {/* DAY */}

          {/* DAY */}

          {type === "day" && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                เลือกวันที่
              </label>

              <div className="flex flex-col md:flex-row gap-3">
                {/* วันก่อนหน้า */}

                <button
                  type="button"
                  onClick={() => {
                    const current = new Date(`${date}T00:00:00`);
                    current.setDate(current.getDate() - 1);

                    const newDate = [
                      current.getFullYear(),
                      String(current.getMonth() + 1).padStart(2, "0"),
                      String(current.getDate()).padStart(2, "0"),
                    ].join("-");

                    setDate(newDate);
                  }}
                  className="
          rounded-xl
          border
          border-orange-200
          bg-white
          px-4
          py-3
          font-semibold
          text-gray-600
          transition
          hover:bg-orange-50
        "
                >
                  วันก่อนหน้า
                </button>

                {/* เลือกวันที่ */}

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="
          w-full
          md:w-auto
          border
          border-orange-200
          rounded-xl
          px-4
          py-3
          outline-none
          focus:ring-2
          focus:ring-orange-300
          bg-white
        "
                />

                {/* วันนี้ */}

                <button
                  type="button"
                  onClick={() => setDate(getToday())}
                  className="
          rounded-xl
          border
          border-orange-200
          bg-orange-50
          px-4
          py-3
          font-semibold
          text-orange-600
          transition
          hover:bg-orange-100
        "
                >
                  วันนี้
                </button>

                {/* วันถัดไป */}

                <button
                  type="button"
                  onClick={() => {
                    const current = new Date(`${date}T00:00:00`);
                    current.setDate(current.getDate() + 1);

                    const newDate = [
                      current.getFullYear(),
                      String(current.getMonth() + 1).padStart(2, "0"),
                      String(current.getDate()).padStart(2, "0"),
                    ].join("-");

                    setDate(newDate);
                  }}
                  className="
          rounded-xl
          border
          border-orange-200
          bg-white
          px-4
          py-3
          font-semibold
          text-gray-600
          transition
          hover:bg-orange-50
        "
                >
                  วันถัดไป
                </button>
              </div>

              {/* แสดงวันที่ที่กำลังดู */}

              <p className="mt-3 text-sm text-gray-500">
                กำลังดูรายงานวันที่{" "}
                <span className="font-semibold text-orange-600">
                  {formatDate(date)}
                </span>
              </p>
            </div>
          )}

          {/* MONTH */}

          {type === "month" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  เดือน
                </label>

                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="
                    w-full
                    border
                    border-orange-200
                    rounded-xl
                    px-4
                    py-3
                    outline-none
                    focus:ring-2
                    focus:ring-orange-300
                    bg-white
                  "
                >
                  <option value={1}>มกราคม</option>
                  <option value={2}>กุมภาพันธ์</option>
                  <option value={3}>มีนาคม</option>
                  <option value={4}>เมษายน</option>
                  <option value={5}>พฤษภาคม</option>
                  <option value={6}>มิถุนายน</option>
                  <option value={7}>กรกฎาคม</option>
                  <option value={8}>สิงหาคม</option>
                  <option value={9}>กันยายน</option>
                  <option value={10}>ตุลาคม</option>
                  <option value={11}>พฤศจิกายน</option>
                  <option value={12}>ธันวาคม</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  ปี
                </label>

                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="
                    w-full
                    border
                    border-orange-200
                    rounded-xl
                    px-4
                    py-3
                    outline-none
                    focus:ring-2
                    focus:ring-orange-300
                  "
                />
              </div>
            </div>
          )}

          {/* YEAR */}

          {type === "year" && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                เลือกปี
              </label>

              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="
                  w-full
                  md:w-60
                  border
                  border-orange-200
                  rounded-xl
                  px-4
                  py-3
                  outline-none
                  focus:ring-2
                  focus:ring-orange-300
                "
              />
            </div>
          )}
        </div>

        {/* ========================= */}
        {/* TITLE */}
        {/* ========================= */}

        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-[#2A1B12]">{getTitle()}</h2>

          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-xl
              bg-white
              border
              border-orange-200
              text-orange-600
              hover:bg-orange-50
              transition
              shrink-0
            "
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            รีเฟรช
          </button>
        </div>

        {/* ========================= */}
        {/* SUMMARY */}
        {/* ========================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* SALES */}

          <div
            className="
              bg-white
              border
              border-orange-100
              rounded-3xl
              p-5
              shadow-sm
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ยอดขายอาหาร</p>

                <p className="text-2xl font-bold text-[#2A1B12] mt-2">
                  ฿{money(summary.sales)}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <Wallet size={21} />
              </div>
            </div>
          </div>

          {/* ORDERS */}

          <div
            className="
              bg-white
              border
              border-orange-100
              rounded-3xl
              p-5
              shadow-sm
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ออเดอร์สำเร็จ</p>

                <p className="text-2xl font-bold text-[#2A1B12] mt-2">
                  {summary.orderCount}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <ShoppingBag size={21} />
              </div>
            </div>
          </div>

   

          {/* AVERAGE */}

       
        </div>

        {/* ========================= */}
        {/* DAILY SUMMARY */}
        {/* ========================= */}

        {type !== "day" && (
          <div
            className="
              bg-white
              border
              border-orange-100
              rounded-3xl
              shadow-sm
              overflow-hidden
              mb-6
            "
          >
            <div className="p-5 border-b border-orange-100">
              <h2 className="font-bold text-lg text-[#2A1B12]">
                สรุปยอดขายรายวัน
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                ยอดขายอาหารของแต่ละวันในช่วงเวลาที่เลือก
              </p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-gray-500">
                กำลังโหลดข้อมูล...
              </div>
            ) : daily.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                ไม่มีข้อมูลการขายในช่วงเวลานี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr className="bg-orange-50 text-left">
                      <th className="px-5 py-4 text-sm font-semibold">
                        วันที่
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-center">
                        ออเดอร์
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-center">
                        จำนวนอาหาร
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-right">
                        ยอดขายอาหาร
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {daily.map((item) => (
                      <tr key={item.date} className="border-t border-orange-50">
                        <td className="px-5 py-4">{formatDate(item.date)}</td>

                        <td className="px-5 py-4 text-center">{item.orders}</td>

                        <td className="px-5 py-4 text-center">
                          {item.foodQuantity || 0}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-orange-600">
                          ฿{money(item.sales)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================= */}
        {/* ORDER DETAILS */}
        {/* ========================= */}

        <div
          className="
            bg-white
            border
            border-orange-100
            rounded-3xl
            shadow-sm
            overflow-hidden
            mb-10
          "
        >
          <div className="p-5 border-b border-orange-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg text-[#2A1B12]">
                  รายละเอียดออเดอร์
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  รายการออเดอร์ที่สำเร็จในช่วงเวลาที่เลือก
                </p>
              </div>

              <div className="text-sm text-gray-500 shrink-0">
                {orders.length} ออเดอร์
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              กำลังโหลดข้อมูล...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              ไม่มีรายละเอียดออเดอร์ในช่วงเวลานี้
            </div>
          ) : (
            <div>
              {orders.map((order) => {
                const isExpanded = expandedOrder === order.id;

                const foodPrice = getOrderFoodPrice(order);

                const deliveryFee = getOrderDeliveryFee(order);

                const totalPrice = Number(order.totalPrice || 0);

                return (
                  <div
                    key={order.id}
                    className="
                      border-b
                      border-orange-50
                      last:border-b-0
                    "
                  >
                    {/* ORDER HEADER */}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOrder(isExpanded ? null : order.id)
                      }
                      className="
                        w-full
                        px-5
                        py-4
                        flex
                        items-center
                        justify-between
                        gap-4
                        text-left
                        hover:bg-orange-50/50
                        transition
                      "
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="
                            w-11
                            h-11
                            rounded-xl
                            bg-orange-100
                            text-orange-600
                            flex
                            items-center
                            justify-center
                            shrink-0
                          "
                        >
                          <ShoppingBag size={20} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[#2A1B12]">
                              ออเดอร์ #{order.id}
                            </p>

                            <span
                              className="
                                px-2.5
                                py-1
                                rounded-full
                                text-xs
                                font-semibold
                                bg-green-100
                                text-green-700
                              "
                            >
                              สำเร็จ
                            </span>
                          </div>

                          <p className="text-sm text-gray-500 mt-1">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">ยอดรวม</p>

                          <p className="font-bold text-orange-600">
                            ฿{money(totalPrice)}
                          </p>
                        </div>

                        {isExpanded ? (
                          <ChevronUp size={20} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-500" />
                        )}
                      </div>
                    </button>

                    {/* ORDER DETAIL */}

                    {isExpanded && (
                      <div className="px-5 pb-5">
                        <div
                          className="
                            bg-orange-50/60
                            rounded-2xl
                            p-4
                          "
                        >
                          <div className="flex items-center justify-between mb-4 gap-3">
                            <h3 className="font-bold text-[#2A1B12]">
                              รายการอาหาร
                            </h3>

                            <span className="text-sm text-gray-500">
                              {order.menu?.length || 0} รายการ
                            </span>
                          </div>

                          {!order.menu || order.menu.length === 0 ? (
                            <div className="text-center py-5 text-gray-500">
                              ไม่พบรายการอาหาร
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {order.menu.map((item, index) => {
                                const options = parseOptions(item.options);

                                const itemTotal = getItemTotal(item);

                                return (
                                  <div
                                    key={item.id || index}
                                    className="
                                        bg-white
                                        rounded-2xl
                                        p-4
                                        border
                                        border-orange-100
                                      "
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="min-w-0">
                                        <p className="font-semibold text-[#2A1B12]">
                                          {item.menu?.menuItem ||
                                            "ไม่พบชื่อเมนู"}
                                        </p>

                                        <p className="text-sm text-gray-500 mt-1">
                                          ฿{money(item.price)}
                                          {" × "}
                                          {item.count || 0}
                                        </p>
                                      </div>

                                      <p className="font-bold text-orange-600 whitespace-nowrap">
                                        ฿{money(itemTotal)}
                                      </p>
                                    </div>

                                    {/* OPTIONS */}

                                    {options.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-orange-50">
                                        <p className="text-xs font-semibold text-gray-500 mb-2">
                                          ตัวเลือก
                                        </p>

                                        <div className="space-y-1">
                                          {options.map(
                                            (option, optionIndex) => (
                                              <p
                                                key={optionIndex}
                                                className="text-sm text-gray-600"
                                              >
                                                • {option.label}: {option.value}
                                                {Number(option.price || 0) >
                                                  0 && (
                                                  <span>
                                                    {" "}
                                                    (+฿{money(option.price)})
                                                  </span>
                                                )}
                                              </p>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* TOTAL */}

                          <div
                            className="
                              mt-4
                              pt-4
                              border-t
                              border-orange-200
                              space-y-2
                            "
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                ค่าอาหาร
                              </span>

                              <span className="font-semibold text-gray-700">
                                ฿{money(foodPrice)}
                              </span>
                            </div>

                            {deliveryFee > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  ค่าจัดส่ง
                                </span>

                                <span className="font-semibold text-gray-700">
                                  ฿{money(deliveryFee)}
                                </span>
                              </div>
                            )}

                            <div
                              className="
                                pt-3
                                border-t
                                border-orange-200
                                flex
                                items-center
                                justify-between
                              "
                            >
                              <span className="font-semibold text-gray-600">
                                ยอดรวมออเดอร์
                              </span>

                              <span className="text-xl font-bold text-orange-600">
                                ฿{money(totalPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================= */}
        {/* DAY LOADING */}
        {/* ========================= */}

        {type === "day" && loading && (
          <div
            className="
              bg-white
              rounded-3xl
              border
              border-orange-100
              p-10
              text-center
              text-gray-500
              mt-6
              mb-10
            "
          >
            กำลังโหลดรายงาน...
          </div>
        )}

        {/* ========================= */}
        {/* DAY EMPTY */}
        {/* ========================= */}

        {type === "day" && !loading && summary.orderCount === 0 && (
          <div
            className="
                bg-white
                rounded-3xl
                border
                border-orange-100
                p-10
                text-center
                text-gray-500
                mt-6
                mb-10
              "
          >
            วันนี้ยังไม่มีออเดอร์ที่สำเร็จ
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreReport;
