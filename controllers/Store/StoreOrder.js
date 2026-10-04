const prisma = require("../../config/prisma");
const { createNotification } = require("../notificationController");


exports.listOrder = async (req, res) => {
  try {
    const storeId = req.store.id;

    const orders = await prisma.order.findMany({
      where: {
        storeId: storeId,

        status: {
          in: [
            "PENDING",
            "WAITING_PAYMENT",
            "CONFIRMED",
            "PREPARING",
            "READY",
            "COMPLETED",
            "CANCELLED",
          ],
        },
      },

      include: {
        payment: {
          include: {
            images: true,
          },
        },

        customer: true,

        // รอบออเดอร์
        orderRound: {
          select: {
            roundNumber: true,
            startTime: true,
            endTime: true,
          },
        },

        menu: {
          include: {
            menu: true,
          },
        },

        delivery: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("listOrder error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};



exports.readOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: {
        id: Number(id),
      },

      include: {
        customer: {
          select: {
            id: true,
            username: true,
            phone: true,

            addresses: {
              select: {
                id: true,
                label: true,
                address: true,
                lat: true,
                lng: true,
                isDefault: true,
              },
            },
          },
        },

        store: true,

        orderRound: {
          select: {
            roundNumber: true,
            startTime: true,
            endTime: true,
          },
        },

        delivery: true,

        payment: {
          select: {
            id: true,
            status: true,
            slipImageUrl: true,
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
    });

    if (!order) {
      return res.status(404).json({
        message: "ไม่พบออเดอร์",
      });
    }

    console.log(
      "READ ORDER =",
      JSON.stringify(order, null, 2)
    );

    res.send(order);

  } catch (error) {
    console.log(
      "readOrder Error =",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};


//ดูprocess การรับออเดอร์ แบบอัตโนมัติ จัดส่งล่าช้า ติดไว้
exports.changeStatusOrder = async (req, res) => {
  try {
    const storeId = req.store.id;
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({
        message: "ไม่พบรหัสออเดอร์",
      });
    }

    const allowedStatus = [
      "WAITING_PAYMENT",
      "READY",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "สถานะที่ร้านสามารถเปลี่ยนได้ไม่ถูกต้อง",
        requestedStatus: status,
        allowedStatus,
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        storeId,
      },

      include: {
        payment: true,

        store: {
          select: {
            storeName: true,
          },
        },

        delivery: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "ไม่พบออเดอร์",
      });
    }

    const validTransitions = {
      PENDING: ["WAITING_PAYMENT"],
      WAITING_PAYMENT: [],
      PREPARING: ["READY"],
      READY: [],
    };

    const nextStatuses =
      validTransitions[order.status] || [];

    if (!nextStatuses.includes(status)) {
      return res.status(400).json({
        message: `ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น ${status} ได้`,
        currentStatus: order.status,
        requestedStatus: status,
        allowedNextStatus: nextStatuses,
      });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        status,
      },

      include: {
        payment: true,
        delivery: true,
      },
    });

    if (status === "WAITING_PAYMENT") {
      await createNotification({
        title: "ร้านยืนยันออเดอร์แล้ว",
        message: `ร้าน ${order.store.storeName} ยืนยันออเดอร์ #ORD00${order.id} แล้ว กรุณาชำระเงิน`,
        type: "ORDER_WAITING_PAYMENT",
        customerId: order.customerId,
        orderId: order.id,
      });
    }

    if (status === "READY") {
      await createNotification({
        title: "อาหารพร้อมแล้ว",
        message: `ออเดอร์ #ORD00${order.id} ทำอาหารเสร็จแล้ว และกำลังเตรียมจัดส่ง`,
        type: "ORDER_READY",
        customerId: order.customerId,
        orderId: order.id,
      });

      if (
        order.delivery &&
        !order.delivery.deliveryStaffId
      ) {
        const activeStaffs =
          await prisma.storeStaff.findMany({
            where: {
              storeId,
              role: "DELIVERY",
              isActive: true,
            },

            select: {
              id: true,
              username: true,
              name: true,
              phone: true,
              role: true,
              isActive: true,
            },

            orderBy: {
              id: "asc",
            },
          });

        if (activeStaffs.length === 1) {
          const staff = activeStaffs[0];

          const updatedDelivery =
            await prisma.delivery.update({
              where: {
                id: order.delivery.id,
              },

              data: {
                deliveryStaffId: staff.id,
              },

              include: {
                deliveryStaff: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
                    phone: true,
                    role: true,
                    isActive: true,
                  },
                },
              },
            });

          try {
            await createNotification({
              title: "ได้รับมอบหมายงานส่งอาหาร",
              message: `คุณได้รับมอบหมายงานส่งอาหาร #ORD00${order.id}`,
              type: "DELIVERY_ASSIGNED",
              deliveryStaffId: staff.id,
              deliveryId: order.delivery.id,
              orderId: order.id,
            });
          } catch (notificationError) {
            console.error(
              "สร้าง Notification DELIVERY_ASSIGNED ไม่สำเร็จ =",
              notificationError,
            );
          }

          updatedOrder.delivery = updatedDelivery;
        }
      }
    }

    return res.status(200).json({
      message: "เปลี่ยนสถานะออเดอร์สำเร็จ",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("changeStatusOrder error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.cancelStoreOrder = async (req, res) => {
  try {
    const storeId = req.store.id;
    const orderId = Number(req.params.id);

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({
        message: "รหัสออเดอร์ไม่ถูกต้อง",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        storeId: storeId,
      },
      include: {
        orderRound: true,
        store: {
          select: {
            storeName: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "ไม่พบออเดอร์นี้",
      });
    }

    // ร้านยกเลิกได้เฉพาะตอนยังไม่ยืนยัน
    if (order.status !== "PENDING") {
      return res.status(400).json({
        message: "ออเดอร์นี้ได้รับการยืนยันแล้ว ไม่สามารถยกเลิกได้",
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

    // แจ้งลูกค้า
    try {
      await createNotification({
        title: "ร้านยกเลิกออเดอร์",
        message: `ร้าน ${order.store.storeName} ยกเลิกออเดอร์ #ORD00${order.id}`,
        type: "ORDER_CANCELLED",
        customerId: order.customerId,
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
    console.error("cancelStoreOrder error =", error);

    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการยกเลิกออเดอร์",
    });
  }
};


exports.getMyStoreReviews = async (req, res) => {
  try {
    const storeId = Number(req.store.id);

    if (!storeId || Number.isNaN(storeId)) {
      return res.status(400).json({
        message: "ไม่พบข้อมูลร้าน",
      });
    }

    const reviews = await prisma.review.findMany({
      where: {
        storeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderId: true,
        rating: true,
        comment: true,
        createdAt: true,

        customer: {
          select: {
            id: true,
            username: true,

            images: {
              select: {
                url: true,
                public_id: true,
              },
            },
          },
        },
      },
    });

    const totalReviews = reviews.length;

    const ratingTotal = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );

    const averageRating =
      totalReviews > 0
        ? Number((ratingTotal / totalReviews).toFixed(1))
        : 0;

    const ratingCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      const rating = Number(review.rating);

      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating]++;
      }
    });

    return res.status(200).json({
      totalReviews,
      averageRating,
      ratingCounts,
      reviews,
    });
  } catch (error) {
    console.log("GET MY STORE REVIEWS ERROR =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};



