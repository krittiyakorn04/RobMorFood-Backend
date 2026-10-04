const prisma = require("../../config/prisma");

//ติดไว้ก่อน

exports.listOrderRound = async (req, res) => {
  try {
    const storeId = req.store.id;
    const orderRound = await prisma.orderRound.findMany({
      where: {
        storeId,
      },
      orderBy: {
        id: "asc",
      },
    });
    console.log(orderRound);
    console.log(Array.isArray(orderRound));
    res.send(orderRound);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};


//เปลี่ยน เวลาเป็นนาที
const timeToMinutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const DELIVERY_BUFFER_MINUTES = 20;
//
const minuteToTime = (minutes) => {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
};

exports.addOrderRound = async (req, res) => {
  try {
    const {
      isManual,
      roundNumber,
      startTime,
      endTime,
      durationMinutes,
      hasOrderLimit,
      maxOrders,
      cutoffMinutes,
    } = req.body;

    const storeId = req.store.id;

    // =====================================================
    // Validation
    // =====================================================

    // Manual
    if (isManual && (!startTime || !endTime)) {
      return res.status(400).json({
        message: "กรุณาระบุเวลาเริ่มและเวลาสิ้นสุด",
      });
    }

    // Auto
    if (
      !isManual &&
      (!durationMinutes || Number(durationMinutes) <= 0)
    ) {
      return res.status(400).json({
        message: "กรุณาระบุระยะเวลาของแต่ละรอบ",
      });
    }

    // จำกัดจำนวนออเดอร์
    if (
      hasOrderLimit &&
      (!maxOrders || Number(maxOrders) <= 0)
    ) {
      return res.status(400).json({
        message: "กรุณาระบุจำนวนออเดอร์สูงสุด",
      });
    }

    // Cutoff
    if (
      cutoffMinutes !== undefined &&
      Number(cutoffMinutes) < 0
    ) {
      return res.status(400).json({
        message: "cutoffMinutes ไม่ถูกต้อง",
      });
    }

    // =====================================================
    // MANUAL
    // =====================================================

    if (isManual) {
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);

      // เวลาเริ่มต้องน้อยกว่าสิ้นสุด
      if (start >= end) {
        return res.status(400).json({
          message: "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด",
        });
      }

      const duration = end - start;

      // cutoff ต้องน้อยกว่าระยะเวลารอบ
      if (
        cutoffMinutes !== undefined &&
        Number(cutoffMinutes) >= duration
      ) {
        return res.status(400).json({
          message:
            "เวลาปิดรับออเดอร์ต้องน้อยกว่าระยะเวลาของรอบ",
        });
      }

      // =====================================================
      // เช็กรอบเดิม
      // รวมเวลาส่ง 20 นาที
      // =====================================================

      const existingRounds = await prisma.orderRound.findMany({
        where: {
          storeId,
        },
      });

      for (const existing of existingRounds) {
        const existingStart = timeToMinutes(
          existing.startTime,
        );

        const existingEnd =
          timeToMinutes(existing.endTime) +
          DELIVERY_BUFFER_MINUTES;

        // รอบใหม่ต้องไม่ทับกับ
        // เวลารับออเดอร์ + เวลาส่ง 20 นาที
        if (
          start < existingEnd &&
          end > existingStart
        ) {
          return res.status(400).json({
            message: `เวลารอบใหม่ทับกับรอบที่ ${existing.roundNumber} หรือช่วงเวลาส่งอาหาร 20 นาที`,
          });
        }
      }

      // =====================================================
      // สร้างรอบ Manual
      // =====================================================

      const orderRound = await prisma.orderRound.create({
        data: {
          storeId,

          roundNumber,

          startTime,

          endTime,

          durationMinutes: duration,

          isManual: true,

          hasOrderLimit: hasOrderLimit ?? false,

          maxOrders: hasOrderLimit
            ? Number(maxOrders)
            : null,

          cutoffMinutes:
            cutoffMinutes !== undefined
              ? Number(cutoffMinutes)
              : 0,
        },
      });

      return res.send(orderRound);
    }

    // =====================================================
    // AUTO
    // =====================================================

    // มีรอบ Auto อยู่แล้วหรือไม่
    const exists = await prisma.orderRound.findFirst({
      where: {
        storeId,
        isManual: false,
      },
    });

    if (exists) {
      return res.status(400).json({
        message: "มีรอบอัตโนมัติอยู่แล้ว",
      });
    }

    // =====================================================
    // ดึงเวลาเปิด-ปิดร้าน
    // =====================================================

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
      },
    });

    if (!store) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลร้าน",
      });
    }

    if (!store.timeOpen || !store.timeClose) {
      return res.status(400).json({
        message: "กรุณาตั้งค่าเวลาเปิด-ปิดร้านก่อน",
      });
    }

    // =====================================================
    // สร้างรอบ Auto
    // =====================================================

    const rounds = [];

    let open = timeToMinutes(store.timeOpen);

    const end = timeToMinutes(store.timeClose);

    let roundNum = 1;

    const duration = Number(durationMinutes);

    const limitEnabled = hasOrderLimit ?? false;

    const limit =
      limitEnabled && maxOrders
        ? Number(maxOrders)
        : null;

    const cutoff =
      cutoffMinutes !== undefined
        ? Number(cutoffMinutes)
        : 0;

    while (open < end) {
      // เวลาจบรอบ
      const roundEnd = Math.min(
        open + duration,
        end,
      );

      const actualDuration = roundEnd - open;

      if (actualDuration <= 0) {
        break;
      }

      // cutoff ต้องไม่เกินระยะเวลารอบ
      const actualCutoff = Math.min(
        cutoff,
        Math.max(actualDuration - 1, 0),
      );

      rounds.push({
        storeId,

        roundNumber: roundNum,

        startTime: minuteToTime(open),

        endTime: minuteToTime(roundEnd),

        durationMinutes: actualDuration,

        isManual: false,

        hasOrderLimit: limitEnabled,

        maxOrders: limit,

        cutoffMinutes: actualCutoff,
      });

      // ===================================================
      // สำคัญ
      //
      // รอบต่อไปเริ่มหลังจาก
      // จบรอบ + เวลาส่ง 20 นาที
      // ===================================================

      open =
        roundEnd +
        DELIVERY_BUFFER_MINUTES;

      roundNum++;
    }

    if (rounds.length === 0) {
      return res.status(400).json({
        message: "ไม่สามารถสร้างรอบรับออเดอร์ได้",
      });
    }

    // =====================================================
    // บันทึกทั้งหมด
    // =====================================================

    await prisma.orderRound.createMany({
      data: rounds,
    });

    return res.send(rounds);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.updateOrderRound = async (req, res) => {
  try {
    const { roundId } = req.params;

    const storeId = req.store.id;

    const {
      startTime,
      endTime,
      hasOrderLimit,
      maxOrders,
      cutoffMinutes,
    } = req.body;

    // =====================================================
    // ค้นหารอบ
    // =====================================================

    const round = await prisma.orderRound.findFirst({
      where: {
        id: Number(roundId),
        storeId,
      },
    });

    if (!round) {
      return res.status(404).json({
        message: "ไม่พบรอบ",
      });
    }

    // =====================================================
    // นับจำนวนออเดอร์ในรอบ
    // =====================================================

    const orderCount = await prisma.order.count({
      where: {
        orderRoundId: round.id,
      },
    });

    // =====================================================
    // ตรวจสอบจำนวนออเดอร์
    // =====================================================

    if (
      hasOrderLimit === true &&
      (!maxOrders || Number(maxOrders) <= 0)
    ) {
      return res.status(400).json({
        message: "กรุณาระบุจำนวนออเดอร์สูงสุด",
      });
    }

    // =====================================================
    // ตรวจสอบ cutoff
    // =====================================================

    if (
      cutoffMinutes !== undefined &&
      Number(cutoffMinutes) < 0
    ) {
      return res.status(400).json({
        message: "cutoffMinutes ไม่ถูกต้อง",
      });
    }

    // =====================================================
    // เช็กว่ามีการแก้เวลาไหม
    // =====================================================

    const changingTime =
      startTime !== undefined ||
      endTime !== undefined;

    // =====================================================
    // มีออเดอร์แล้ว
    // ห้ามแก้เวลา
    // =====================================================

    if (changingTime && orderCount > 0) {
      return res.status(400).json({
        message:
          "ไม่สามารถแก้ไขเวลาได้ เนื่องจากรอบนี้มีออเดอร์แล้ว แต่สามารถแก้ไขจำนวนออเดอร์ได้",
      });
    }

    // =====================================================
    // รอบกำลังเปิด
    // ห้ามแก้เวลา
    // =====================================================

    if (
      changingTime &&
      round.status === "OPEN"
    ) {
      return res.status(400).json({
        message:
          "ไม่สามารถแก้ไขเวลาของรอบที่กำลังเปิดอยู่ได้",
      });
    }

    // =====================================================
    // ค่าเดิม
    // =====================================================

    let newStartTime = round.startTime;

    let newEndTime = round.endTime;

    let newDuration = round.durationMinutes;

    // =====================================================
    // ถ้ามีการแก้เวลา
    // =====================================================

    if (changingTime) {
      if (!startTime || !endTime) {
        return res.status(400).json({
          message: "กรุณาระบุเวลาเริ่มและเวลาสิ้นสุด",
        });
      }

      const start = timeToMinutes(startTime);

      const end = timeToMinutes(endTime);

      if (start >= end) {
        return res.status(400).json({
          message: "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด",
        });
      }

      newStartTime = startTime;

      newEndTime = endTime;

      newDuration = end - start;

      // ===================================================
      // ตรวจสอบรอบอื่น
      // รวมเวลาส่ง 20 นาที
      // ===================================================

      const otherRounds =
        await prisma.orderRound.findMany({
          where: {
            storeId,

            NOT: {
              id: round.id,
            },
          },
        });

      for (const other of otherRounds) {
        const otherStart = timeToMinutes(
          other.startTime,
        );

        const otherEnd =
          timeToMinutes(other.endTime) +
          DELIVERY_BUFFER_MINUTES;

        if (
          start < otherEnd &&
          end > otherStart
        ) {
          return res.status(400).json({
            message: `เวลาที่แก้ไขทับกับรอบที่ ${other.roundNumber} หรือช่วงเวลาส่งอาหาร 20 นาที`,
          });
        }
      }
    }

    // =====================================================
    // ตรวจสอบ cutoff
    // =====================================================

    const newCutoff =
      cutoffMinutes !== undefined
        ? Number(cutoffMinutes)
        : round.cutoffMinutes;

    if (newCutoff >= newDuration) {
      return res.status(400).json({
        message:
          "เวลาปิดรับออเดอร์ต้องน้อยกว่าระยะเวลาของรอบ",
      });
    }

    // =====================================================
    // อัปเดต
    // =====================================================

    const result = await prisma.orderRound.update({
      where: {
        id: round.id,
      },

      data: {
        startTime: newStartTime,

        endTime: newEndTime,

        durationMinutes: newDuration,

        // แก้ได้ทุกเมื่อ
        hasOrderLimit:
          hasOrderLimit !== undefined
            ? hasOrderLimit
            : round.hasOrderLimit,

        // แก้ได้ทุกเมื่อ แม้มีออเดอร์แล้ว
        maxOrders:
          hasOrderLimit === false
            ? null
            : maxOrders !== undefined
              ? Number(maxOrders)
              : round.maxOrders,

        cutoffMinutes: newCutoff,
      },
    });

    return res.json({
      message: "แก้ไขรอบรับออเดอร์สำเร็จ",

      data: result,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
exports.removeOrderRound = async (req, res) => {
  try {
    const { roundId } = req.params;
    const storeId = req.store.id;

    // ค้นหารอบ
    const round = await prisma.orderRound.findFirst({
      where: {
        id: Number(roundId),
        storeId,
      },
    });

    if (!round) {
      return res.status(404).json({
        message: "ไม่พบรอบรับออเดอร์",
      });
    }

    // ห้ามลบถ้ารอบกำลังเปิด
    // if (round.status === "OPEN") {
    //   return res.status(400).json({
    //     message: "ไม่สามารถลบรอบที่กำลังเปิดอยู่ได้",
    //   });
    // }

    // เช็กว่ามีออเดอร์ในรอบหรือไม่
    const orderCount = await prisma.order.count({
      where: {
        orderRoundId: round.id,
      },
    });

    if (orderCount > 0) {
      return res.status(400).json({
        message: "ไม่สามารถลบรอบที่มีออเดอร์แล้วได้",
      });
    }

    // ลบรอบ
    await prisma.orderRound.delete({
      where: {
        id: round.id,
      },
    });

    res.json({
      message: "ลบรอบรับออเดอร์สำเร็จ",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};


exports.changePattern = async (req, res) => {
  try {
    const { patternManual } = req.body;
    const storeId = req.store.id;

    // เช็กว่ามีรอบที่กำลังเปิดอยู่หรือไม่
    const activeRound = await prisma.orderRound.findFirst({
      where: {
        storeId,
        status: "OPEN",
      },
    });

    if (activeRound) {
      return res.status(400).json({
        message:
          "ยังมีรอบรับออเดอร์ที่เปิดอยู่ กรุณาปิดรอบหรือรอให้รอบสิ้นสุดก่อนเปลี่ยนรูปแบบ",
      });
    }

    // เปลี่ยนรูปแบบการสร้างรอบ
    const result = await prisma.store.update({
      where: {
        id: storeId,
      },
      data: {
        patternManual,
      },
    });

    res.json({
      message: "เปลี่ยนรูปแบบการสร้างรอบสำเร็จ",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.changeRoundStatus = (req, res) => {
  try {
    res.send("Hello change Round Status");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.removeAllOrderRound = async (req, res) => {
  try {
    const storeId = req.store.id;

    // =====================================================
    // ตรวจสอบว่ามีออเดอร์ที่ผูกกับรอบหรือไม่
    // =====================================================

    const orderCount = await prisma.order.count({
      where: {
        orderRound: {
          storeId,
        },
      },
    });

    if (orderCount > 0) {
      return res.status(400).json({
        message:
          "ไม่สามารถลบรอบทั้งหมดได้ เนื่องจากมีออเดอร์ที่ผูกกับรอบอยู่",
      });
    }

    // =====================================================
    // ลบรอบทั้งหมด
    // =====================================================

    await prisma.orderRound.deleteMany({
      where: {
        storeId,
      },
    });

    return res.json({
      message: "ลบรอบทั้งหมดเรียบร้อย",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};