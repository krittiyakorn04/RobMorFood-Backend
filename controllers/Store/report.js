const prisma = require("../../config/prisma");

const getBangkokDateKey = (value) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const result = {};

  parts.forEach((part) => {
    result[part.type] = part.value;
  });

  return `${result.year}-${result.month}-${result.day}`;
};

const getBangkokRange = (year, month, day = 1) => {
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      -7,
      0,
      0,
      0
    )
  );
};

exports.getStoreReport = async (req, res) => {
  try {
    const storeId = req.store.id;

    const {
      type = "day",
      date,
      month,
      year,
    } = req.query;

    let startDate;
    let endDate;

    const now = new Date();

    // =====================================================
    // รายวัน
    // =====================================================

    if (type === "day") {
      let targetYear;
      let targetMonth;
      let targetDay;

      if (date) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

        if (!match) {
          return res.status(400).json({
            message: "รูปแบบวันที่ไม่ถูกต้อง",
          });
        }

        targetYear = Number(match[1]);
        targetMonth = Number(match[2]);
        targetDay = Number(match[3]);
      } else {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }).formatToParts(now);

        const values = {};

        parts.forEach((part) => {
          values[part.type] = part.value;
        });

        targetYear = Number(values.year);
        targetMonth = Number(values.month);
        targetDay = Number(values.day);
      }

      startDate = getBangkokRange(
        targetYear,
        targetMonth,
        targetDay
      );

      endDate = getBangkokRange(
        targetYear,
        targetMonth,
        targetDay + 1
      );
    }

    // =====================================================
    // รายเดือน
    // =====================================================

    else if (type === "month") {
      const selectedYear = Number(year);
      const selectedMonth = Number(month);

      if (
        !Number.isInteger(selectedYear) ||
        !Number.isInteger(selectedMonth) ||
        selectedMonth < 1 ||
        selectedMonth > 12
      ) {
        return res.status(400).json({
          message: "กรุณาระบุเดือนและปีให้ถูกต้อง",
        });
      }

      startDate = getBangkokRange(
        selectedYear,
        selectedMonth,
        1
      );

      endDate = getBangkokRange(
        selectedYear,
        selectedMonth + 1,
        1
      );
    }

    // =====================================================
    // รายปี
    // =====================================================

    else if (type === "year") {
      const selectedYear = Number(year);

      if (!Number.isInteger(selectedYear)) {
        return res.status(400).json({
          message: "กรุณาระบุปีให้ถูกต้อง",
        });
      }

      startDate = getBangkokRange(
        selectedYear,
        1,
        1
      );

      endDate = getBangkokRange(
        selectedYear + 1,
        1,
        1
      );
    }

    else {
      return res.status(400).json({
        message: "ประเภทช่วงเวลาไม่ถูกต้อง",
      });
    }

    // =====================================================
    // ดึง Order
    // =====================================================

    const orders = await prisma.order.findMany({
      where: {
        storeId,
        status: "COMPLETED",

        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },

      select: {
        id: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        note: true,

        menu: {
          select: {
            id: true,
            menuId: true,
            count: true,
            price: true,

            // สำคัญมาก
            // ตัวเลือกที่ลูกค้าเลือกจริง
            options: true,

            // ข้อมูลชื่อเมนู
            menu: {
              select: {
                id: true,
                menuItem: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    // =====================================================
    // สรุปยอด
    // =====================================================

    let sales = 0;
    let foodQuantity = 0;

    const formattedOrders = orders.map((order) => {
      const totalPrice = Number(
        order.totalPrice || 0
      );

      let orderFoodQuantity = 0;

      order.menu.forEach((item) => {
        orderFoodQuantity += Number(
          item.count || 0
        );

        foodQuantity += Number(
          item.count || 0
        );
      });

      sales += totalPrice;

      return {
        ...order,

        totalPrice,

        foodQuantity: orderFoodQuantity,

        menu: order.menu.map((item) => ({
          ...item,

          count: Number(item.count || 0),

          price: Number(item.price || 0),

          // ตัวเลือกที่ลูกค้าเลือก
          options: item.options || [],
        })),
      };
    });

    const orderCount = formattedOrders.length;

    const averageOrder =
      orderCount > 0
        ? sales / orderCount
        : 0;

    // =====================================================
    // สรุปแต่ละวัน
    // =====================================================

    const dailyMap = {};

    formattedOrders.forEach((order) => {
      const dateKey = getBangkokDateKey(
        order.createdAt
      );

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          sales: 0,
          orders: 0,
          foodQuantity: 0,
        };
      }

      dailyMap[dateKey].sales += Number(
        order.totalPrice || 0
      );

      dailyMap[dateKey].orders += 1;

      dailyMap[dateKey].foodQuantity += Number(
        order.foodQuantity || 0
      );
    });

    const daily = Object.values(dailyMap).sort(
      (a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.json({
      success: true,

      filter: {
        type,
        date: date || null,
        month: month
          ? Number(month)
          : null,
        year: year
          ? Number(year)
          : null,
      },

      summary: {
        sales,
        orderCount,
        foodQuantity,
        averageOrder,
      },

      daily,

      orders: formattedOrders,
    });
  } catch (error) {
    console.error(
      "GET STORE REPORT ERROR:",
      error
    );

    return res.status(500).json({
      message: "ไม่สามารถโหลดรายงานยอดขายได้",
      error: error.message,
    });
  }
};