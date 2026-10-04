const prisma = require("../config/prisma");

// แปลง HH:mm เป็นจำนวนนาที
const timeToMinutes = (time) => {
  if (!time) return null;

  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
};

// ตรวจสอบและอัปเดตสถานะรอบ
const updateOrderRoundStatus = async () => {
  try {
    const now = new Date();

    // ใช้เวลาท้องถิ่นของเครื่อง Server
    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

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
        continue;
      }

      // ==========================================
      // ถึงเวลารอบแล้ว
      // ==========================================

      if (
        currentMinutes >= start &&
        currentMinutes < end
      ) {
        if (round.status !== "OPEN") {
          await prisma.orderRound.update({
            where: {
              id: round.id,
            },
            data: {
              status: "OPEN",
            },
          });

          console.log(
            `OrderRound #${round.id} รอบ ${round.roundNumber} → OPEN`
          );
        }

        continue;
      }

      // ==========================================
      // รอบจบแล้ว
      // ==========================================

      if (
        currentMinutes >= end &&
        round.status === "OPEN"
      ) {
        await prisma.orderRound.update({
          where: {
            id: round.id,
          },
          data: {
            status: "CLOSED",
          },
        });

        console.log(
          `OrderRound #${round.id} รอบ ${round.roundNumber} → CLOSED`
        );
      }
    }
  } catch (error) {
    console.error(
      "UPDATE ORDER ROUND STATUS ERROR =",
      error
    );
  }
};

module.exports = {
  updateOrderRoundStatus,
};