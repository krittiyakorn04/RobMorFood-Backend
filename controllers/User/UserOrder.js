const prisma = require("../../config/prisma");
const { createNotification } = require("../notificationController");
const cloudinary = require('cloudinary').v2;




exports.getOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: {
        customerId: userId,
      },

      include: {
        store: true,

        orderRound: true,

        delivery: true,

        payment: {
          include: {
            images: true,
          },
        },

        menu: {
          include: {
            menu: {
              include: {
                images: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.send(orders);

  } catch (error) {
    console.log("getOrder Error =", error);


    res.status(500).json({
      message: "Server Error",
    });

  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const userId = req.user.id;

    const orderId = Number(req.params.id);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: userId,
      },

      include: {
        store: true,


        // =========================
        // ORDER ROUND
        // =========================
        orderRound: true,

        delivery: {
          include: {
            images: true,
            deliveryStaff: true,
          },
        },

        customer: {
          include: {
            addresses: {
              where: {
                isDefault: true,
              },
            },

            images: true,
          },
        },

        menu: {
          include: {
            menu: {
              include: {
                images: true,
              },
            },
          },
        },

        payment: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "ไม่พบออเดอร์",
      });
    }

    res.send(order);
  } catch (error) {
    console.log("getOrderDetail Error =", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { cartId, addressId, note } = req.body;

    const userId = req.user.id;

    if (!cartId) {
      return res.status(400).json({
        message: "ไม่พบรหัสตะกร้า",
      });
    }

    if (!addressId) {
      return res.status(400).json({
        message: "กรุณาเลือกที่อยู่จัดส่ง",
      });
    }

    const cart = await prisma.cart.findFirst({
      where: {
        id: Number(cartId),
        orderById: userId,
      },
      include: {
        menu: true,
        store: true,
      },
    });

    if (!cart) {
      return res.status(404).json({
        message: "ไม่พบตะกร้า",
      });
    }

    if (cart.menu.length === 0) {
      return res.status(400).json({
        message: "ตะกร้าว่าง",
      });
    }

    const address = await prisma.address.findFirst({
      where: {
        id: Number(addressId),
        customerId: userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        message: "ไม่พบที่อยู่",
      });
    }

    let orderRoundId = null;
    let currentRound = null;

    if (cart.store.orderMode === "ROUND") {
      const now = new Date();

      const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

      const timeToMinutes = (time) => {
        if (!time) return null;

        const [hour, minute] = String(time)
          .slice(0, 5)
          .split(":")
          .map(Number);

        if (
          Number.isNaN(hour) ||
          Number.isNaN(minute)
        ) {
          return null;
        }

        return hour * 60 + minute;
      };

      const rounds = await prisma.orderRound.findMany({
        where: {
          storeId: cart.store.id,
        },
        orderBy: {
          roundNumber: "asc",
        },
      });

      currentRound = rounds.find((round) => {
        const start = timeToMinutes(round.startTime);
        const end = timeToMinutes(round.endTime);

        if (start === null || end === null) {
          return false;
        }

        return (
          currentMinutes >= start &&
          currentMinutes < end
        );
      });

      if (!currentRound) {
        return res.status(400).json({
          message:
            "ขณะนี้ไม่อยู่ในช่วงเวลารับออเดอร์ของร้าน",
        });
      }

      if (currentRound.status !== "OPEN") {
        return res.status(400).json({
          message: "รอบนี้ปิดรับออเดอร์แล้ว",
        });
      }

      if (
        currentRound.hasOrderLimit &&
        currentRound.maxOrders !== null &&
        currentRound.currentOrders >=
        currentRound.maxOrders
      ) {
        return res.status(400).json({
          message: "รอบนี้มีออเดอร์เต็มแล้ว",
        });
      }

      orderRoundId = currentRound.id;
    }

    const foodTotal = cart.menu.reduce(
      (total, item) => {
        return (
          total +
          Number(item.price) *
          Number(item.count)
        );
      },
      0,
    );

    const deliveryFee = Number(
      cart.store.deliveryFee || 0,
    );

    const totalPrice = foodTotal + deliveryFee;

    const result = await prisma.$transaction(
      async (tx) => {
        const delivery =
          await tx.delivery.create({
            data: {
              storeId: cart.store.id,
              orderRoundId,
              deliveryStaffId: null,
              status: "PENDING",
            },
          });

        const newOrder =
          await tx.order.create({
            data: {
              customerId: userId,
              storeId: cart.store.id,
              deliveryId: delivery.id,
              orderRoundId,
              status: "PENDING",
              totalPrice,
              note: note || "",
            },
          });

        const payment =
          await tx.payment.create({
            data: {
              orderId: newOrder.id,
              method: "PROMPTPAY",
              status: "PENDING",
              amount: totalPrice,
              slipImageUrl: null,
              confirmedAt: null,
            },
          });

        await tx.menuOnCart.updateMany({
          where: {
            cartId: cart.id,
          },
          data: {
            orderId: newOrder.id,
            cartId: null,
          },
        });

        if (orderRoundId) {
          await tx.orderRound.update({
            where: {
              id: orderRoundId,
            },
            data: {
              currentOrders: {
                increment: 1,
              },
            },
          });
        }

        await tx.cart.delete({
          where: {
            id: cart.id,
          },
        });

        return {
          order: newOrder,
          payment,
          delivery,
        };
      },
      {
        timeout: 10000,
      },
    );

    await createNotification({
      title: "มีออเดอร์ใหม่",
      message: `มีออเดอร์ #ORD00${result.order.id} เข้ามาใหม่`,
      type: "NEW_ORDER",
      storeId: result.order.storeId,
      orderId: result.order.id,
    });

    return res.status(201).json({
      message: "สร้างออเดอร์สำเร็จ",
      order: result.order,
      payment: result.payment,
      delivery: result.delivery,
    });
  } catch (error) {
    console.error("createOrder Error =", error);

    return res.status(500).json({
      message: "Server Error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};




exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.id);

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({
        message: "รหัสออเดอร์ไม่ถูกต้อง",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: userId,
      },
      include: {
        orderRound: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "ไม่พบออเดอร์นี้",
      });
    }

    // ลูกค้ายกเลิกได้เฉพาะตอนร้านยังไม่ยืนยัน
    if (order.status !== "PENDING") {
      return res.status(400).json({
        message: "ร้านยืนยันออเดอร์แล้ว ไม่สามารถยกเลิกได้",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "CANCELLED",
        },
      });

      // คืนจำนวนที่นั่งของรอบ
      if (
        order.orderRoundId &&
        order.orderRound?.hasOrderLimit
      ) {
        await tx.orderRound.updateMany({
          where: {
            id: order.orderRoundId,
            currentOrders: {
              gt: 0,
            },
          },
          data: {
            currentOrders: {
              decrement: 1,
            },
          },
        });
      }
    });

    // แจ้งร้าน
    try {
      await createNotification({
        title: "ลูกค้ายกเลิกออเดอร์",
        message: `ออเดอร์ #ORD00${order.id} ถูกยกเลิกโดยลูกค้า`,
        type: "ORDER_CANCELLED",
        storeId: order.storeId,
        orderId: order.id,
      });
    } catch (notificationError) {
      console.error(
        "สร้าง Notification ORDER_CANCELLED ไม่สำเร็จ =",
        notificationError
      );
    }

    return res.status(200).json({
      message: "ยกเลิกออเดอร์สำเร็จ",
    });
  } catch (error) {
    console.error("cancelOrder error =", error);

    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการยกเลิกออเดอร์",
    });
  }
};






cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadSlip = async (req, res) => {
  let uploadedPublicId = null;

  try {
    const userId = req.user.id;
    const orderId = Number(req.params.orderId);
    const { image } = req.body;

    // =========================
    // CHECK
    // =========================
    if (!image) {
      return res.status(400).json({
        message: "ไม่พบรูปสลิป",
      });
    }

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({
        message: "Order ID ไม่ถูกต้อง",
      });
    }

    // =========================
    // ORDER
    // =========================
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: userId,
      },
      include: {
        payment: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "ไม่พบออเดอร์",
      });
    }

    if (!order.payment) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลการชำระเงินของออเดอร์",
      });
    }

    // =========================
    // CONFIRMED = ห้ามแก้
    // =========================
    if (order.payment.status === "CONFIRMED") {
      return res.status(400).json({
        message: "ร้านยืนยันการชำระเงินแล้ว ไม่สามารถเปลี่ยนสลิปได้",
      });
    }

    // =========================
    // ALLOWED
    // =========================
    if (
      !["PENDING", "SLIP_UPLOADED", "REJECTED"].includes(
        order.payment.status
      )
    ) {
      return res.status(400).json({
        message: "ไม่สามารถอัปโหลดสลิปได้ในสถานะปัจจุบัน",
      });
    }

    // =========================
    // UPLOAD NEW
    // =========================
    const result = await cloudinary.uploader.upload(image, {
      public_id: `Payment-${orderId}-${Date.now()}`,
      resource_type: "image",
      folder: "userPayment2026",
    });

    uploadedPublicId = result.public_id;

    // =========================
    // DELETE OLD CLOUDINARY
    // =========================
    const oldImages = order.payment.images || [];

    for (const oldImage of oldImages) {
      try {
        await cloudinary.uploader.destroy(
          oldImage.public_id
        );
      } catch (error) {
        console.error(
          "ลบสลิปเก่า Cloudinary ไม่สำเร็จ =",
          error
        );
      }
    }

    // =========================
    // DATABASE
    // =========================
    const payment = await prisma.$transaction(
      async (tx) => {
        await tx.image.deleteMany({
          where: {
            paymentId: order.payment.id,
          },
        });

        await tx.image.create({
          data: {
            asset_id: result.asset_id,
            public_id: result.public_id,
            url: result.url,
            secure_url: result.secure_url,
            customerId: userId,
            paymentId: order.payment.id,
          },
        });

        return await tx.payment.update({
          where: {
            id: order.payment.id,
          },
          data: {
            slipImageUrl: result.secure_url,
            status: "SLIP_UPLOADED",
            rejectedReason: null,
            confirmedAt: null,
          },
          include: {
            images: true,
            order: true,
          },
        });
      }
    );

    // =========================
    // NOTIFICATION
    // =========================
    try {
      await createNotification({
        title: "มีการส่งสลิปใหม่",
        message: `ลูกค้าเปลี่ยนสลิปสำหรับออเดอร์ #ORD00${orderId} แล้ว กรุณาตรวจสอบ`,
        type: "PAYMENT_SLIP_UPLOADED",
        storeId: order.storeId,
        orderId,
      });
    } catch (notificationError) {
      console.error(
        "สร้าง Notification ไม่สำเร็จ =",
        notificationError
      );
    }

    return res.status(200).json({
      message: "เปลี่ยนสลิปสำเร็จ รอร้านตรวจสอบ",
      payment,
    });
  } catch (error) {
    console.error(
      "uploadSlip Error =",
      error
    );

    // ถ้า DB พัง ลบรูปใหม่ที่เพิ่งอัปโหลด
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(
          uploadedPublicId
        );
      } catch (cleanupError) {
        console.error(
          "ลบรูปใหม่ Cleanup ไม่สำเร็จ =",
          cleanupError
        );
      }
    }

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.removeSlip = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.orderId);

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({
        message: "Order ID ไม่ถูกต้อง",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: userId,
      },
      include: {
        payment: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "ไม่พบออเดอร์",
      });
    }

    if (!order.payment) {
      return res.status(404).json({
        message: "ไม่พบ Payment",
      });
    }

    if (order.payment.status === "CONFIRMED") {
      return res.status(400).json({
        message: "ไม่สามารถลบสลิปที่ยืนยันแล้วได้",
      });
    }

    const images = order.payment.images || [];

    // =========================
    // DELETE CLOUDINARY
    // =========================
    for (const image of images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (error) {
        console.error(
          "Cloudinary delete error =",
          error
        );
      }
    }

    // =========================
    // DELETE DATABASE
    // =========================
    await prisma.$transaction(async (tx) => {
      await tx.image.deleteMany({
        where: {
          paymentId: order.payment.id,
        },
      });

      await tx.payment.update({
        where: {
          id: order.payment.id,
        },
        data: {
          slipImageUrl: null,
          status: "PENDING",
          rejectedReason: null,
          confirmedAt: null,
        },
      });
    });

    return res.status(200).json({
      message: "ลบสลิปเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("removeSlip Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

