const prisma = require("../../config/prisma");
<<<<<<< HEAD
=======
const { createNotification } = require("../notificationController");
>>>>>>> origin/main

exports.rejectedPayment = (req, res) => {
  try {
    res.send("Hello rejected Payment");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.changeStatusPayment = async (req, res) => {
  try {
<<<<<<< HEAD
    const { id, status } = req.body;
    const storeId = req.store.id;

    const payment = await prisma.payment.findFirst({
      where: {
        id: Number(id),
        storeId: req.store.id,
=======
    const paymentId = Number(req.params.id);
    const { status } = req.body;
    const storeId = req.store.id;

    if (!paymentId || Number.isNaN(paymentId)) {
      return res.status(400).json({
        message: "ไม่พบรหัส Payment",
      });
    }

    if (status !== "CONFIRMED") {
      return res.status(400).json({
        message: "สถานะการชำระเงินไม่ถูกต้อง",
      });
    }

    // ==================================================
    // ตรวจสอบว่า Payment เป็นของร้านนี้จริง
    // ==================================================

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        order: {
          storeId,
        },
      },

      include: {
        order: {
          include: {
            store: {
              select: {
                storeName: true,
              },
            },
          },
        },
>>>>>>> origin/main
      },
    });

    if (!payment) {
      return res.status(404).json({
<<<<<<< HEAD
        message: "ไม่พบรายการชำระเงิน",
      });
    }

    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status,
      },
    });
    res.send("Hello change Status Payment");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};
=======
        message: "ไม่พบข้อมูลการชำระเงิน",
      });
    }

    // ==================================================
    // ต้องเป็น SLIP_UPLOADED เท่านั้น
    // ==================================================

    if (payment.status !== "SLIP_UPLOADED") {
      return res.status(400).json({
        message: "ยังไม่สามารถยืนยันการชำระเงินได้",
        currentStatus: payment.status,
      });
    }

    // ==================================================
    // Order ต้องอยู่ WAITING_PAYMENT
    // ==================================================

    if (payment.order.status !== "WAITING_PAYMENT") {
      return res.status(400).json({
        message: "ออเดอร์นี้ไม่อยู่ในสถานะรอชำระเงิน",
        currentStatus: payment.order.status,
      });
    }

    // ==================================================
    // ยืนยันเงิน + เริ่มทำอาหารพร้อมกัน
    // ==================================================

    const result = await prisma.$transaction(async (tx) => {
      // Payment
      const updatedPayment = await tx.payment.update({
        where: {
          id: paymentId,
        },

        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          rejectedReason: null,
        },
      });

      // Order
      const updatedOrder = await tx.order.update({
        where: {
          id: payment.orderId,
        },

        data: {
          status: "PREPARING",
        },

        include: {
          payment: true,
          delivery: true,
        },
      });

      return {
        payment: updatedPayment,
        order: updatedOrder,
      };
    });

    // ==================================================
    // แจ้งลูกค้า
    // ==================================================

    try {
      await createNotification({
        title: "ร้านกำลังทำอาหาร",
        message: `ร้าน ${payment.order.store.storeName} กำลังทำอาหารสำหรับออเดอร์ #ORD00${payment.order.id}`,
        type: "ORDER_PREPARING",
        customerId: payment.order.customerId,
        orderId: payment.order.id,
      });
    } catch (notificationError) {
      console.error(
        "สร้าง Notification ไม่สำเร็จ =",
        notificationError,
      );
    }

    return res.status(200).json({
      message: "ยืนยันการชำระเงินและเริ่มทำอาหารสำเร็จ",
      payment: result.payment,
      order: result.order,
    });

  } catch (error) {
    console.error("changeStatusPayment error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
>>>>>>> origin/main
