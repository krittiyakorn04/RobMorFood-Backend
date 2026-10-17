
const prisma = require("../config/prisma");

const BANGKOK_TIME_ZONE = "Asia/Bangkok";
const MINUTE = 60 * 1000;

const timeToMinutes = (time) => {
  if (typeof time !== "string") return null;

  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
};

// อ่านเวลาปัจจุบันตามประเทศไทย
const getBangkokTime = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BANGKOK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    date: `${get("year")}-${String(get("month")).padStart(2, "0")}-${String(get("day")).padStart(2, "0")}`,
    time: `${String(get("hour")).padStart(2, "0")}:${String(get("minute")).padStart(2, "0")}:${String(get("second")).padStart(2, "0")}`,
    minutes: get("hour") * 60 + get("minute"),
  };
};

let isUpdating = false;

const updateOrderRoundStatus = async () => {
  if (isUpdating) return;

  isUpdating = true;

  try {
    const now = getBangkokTime();

    console.log(
      `[OrderRound] เวลาไทย ${now.date} ${now.time} (Asia/Bangkok)`
    );

    const rounds = await prisma.orderRound.findMany({
      where: {
        status: {
          in: ["PENDING", "OPEN"],
        },
      },
    });

    for (const round of rounds) {
      const start = timeToMinutes(round.startTime);
      const end = timeToMinutes(round.endTime);

      if (start === null || end === null) {
        console.log(
          `[OrderRound #${round.id}] เวลาไม่ถูกต้อง`,
          {
            startTime: round.startTime,
            endTime: round.endTime,
          }
        );
        continue;
      }

      const current = now.minutes;

      // รอบปกติ เช่น 09:00–12:00
      // หรือรอบข้ามเที่ยงคืน เช่น 22:00–02:00
      const isOvernight = end <= start;

      const isInRound = isOvernight
        ? current >= start || current < end
        : current >= start && current < end;

      console.log(
        `[OrderRound #${round.id}] รอบ ${round.roundNumber}`,
        {
          startTime: round.startTime,
          endTime: round.endTime,
          status: round.status,
          currentTimeThailand: now.time,
          isInRound,
        }
      );

      if (isInRound && round.status === "PENDING") {
        await prisma.orderRound.update({
          where: { id: round.id },
          data: { status: "OPEN" },
        });

        console.log(
          `OrderRound #${round.id} รอบ ${round.roundNumber} → OPEN`
        );

        continue;
      }

      // ปิดเฉพาะรอบ OPEN เมื่อถึงเวลาสิ้นสุด
      const hasEnded = isOvernight
        ? current >= end && current < start
        : current >= end;

      if (hasEnded && round.status === "OPEN") {
        await prisma.orderRound.update({
          where: { id: round.id },
          data: { status: "CLOSED" },
        });

        console.log(
          `OrderRound #${round.id} รอบ ${round.roundNumber} → CLOSED`
        );
      }
    }
  } catch (error) {
    console.error("UPDATE ORDER ROUND STATUS ERROR =", error);
  } finally {
    isUpdating = false;
  }
};

module.exports = {
  updateOrderRoundStatus,
};
