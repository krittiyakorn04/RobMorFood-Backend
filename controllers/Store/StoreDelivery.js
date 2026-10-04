const cloudinary = require('cloudinary').v2;
const prisma = require("../../config/prisma");
const { createNotification } = require("../notificationController");



exports.listDelivery = async (req, res) => {
  try {
    const storeId = Number(req.store.id);

    // ==========================================
    // ตรวจสอบ store
    // ==========================================
    if (!storeId || Number.isNaN(storeId)) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลร้านค้า",
      });
    }

    // ==========================================
    // ดึงไรเดอร์ทั้งหมดของร้าน
    // ==========================================
    const deliveryStaffs = await prisma.storeStaff.findMany({
      where: {
        storeId,
        role: "DELIVERY",
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
        name: "asc",
      },
    });

    // ==========================================
    // ดึงรายการจัดส่ง
    // ==========================================
    const deliveries = await prisma.delivery.findMany({
      where: {
        storeId,

        orders: {
          some: {
            storeId,
            status: {
              in: ["READY", "COMPLETED"],
            },
          },
        },
      },

      include: {
        // ==========================================
        // DELIVERY STAFF ที่ถูกมอบหมายอยู่
        // ==========================================
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

        // ==========================================
        // ORDER ROUND
        // ==========================================
        orderRound: {
          select: {
            roundNumber: true,
            startTime: true,
            endTime: true,
          },
        },

        // ==========================================
        // ORDERS
        // ==========================================
        orders: {
          where: {
            storeId,
            status: {
              in: ["READY", "COMPLETED"],
            },
          },

          include: {
            // ========================================
            // CUSTOMER
            // ========================================
            customer: {
              select: {
                id: true,
                username: true,
                phone: true,

                addresses: {
                  where: {
                    isDefault: true,
                  },

                  take: 1,
                },
              },
            },

            // ========================================
            // MENU
            // ========================================
            menu: {
              include: {
                menu: true,
              },
            },

            // ========================================
            // PAYMENT
            // ========================================
            payment: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    // ==========================================
    // แนบ deliveryStaffs ให้ทุก delivery
    // ==========================================
    const result = deliveries.map((delivery) => ({
      ...delivery,
      deliveryStaffs,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.log("listDelivery error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.readDelivery = async (req, res) => {
  try {
    const deliveryId = Number(req.params.id);
    const storeId = Number(req.store?.id);

    if (!deliveryId || Number.isNaN(deliveryId)) {
      return res.status(400).json({
        message: "รหัสการจัดส่งไม่ถูกต้อง",
      });
    }

    if (!storeId) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลร้านค้า",
      });
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        storeId,
      },
      include: {
        store: {
          select: {
            id: true,
            storeName: true,
            deliveryFee: true,
          },
        },
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
        orderRound: {
          select: {
            roundNumber: true,
            startTime: true,
            endTime: true,
          },
        },
        images: true,
        orders: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            deliveryType: true,
            status: true,
            totalPrice: true,
            note: true,
            outOfStock: true,
            customerReceived: true,
            receivedAt: true,
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
            payment: {
              select: {
                id: true,
                status: true,
                slipImageUrl: true,
                amount: true,
                method: true,
                confirmedAt: true,
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
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลการจัดส่ง",
      });
    }

    const deliveryStaffs = await prisma.storeStaff.findMany({
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
        name: "asc",
      },
    });

    const foodTotal = delivery.orders.reduce((deliveryTotal, order) => {
      return (
        deliveryTotal +
        order.menu.reduce((total, item) => {
          const price = Number(item.price || 0);
          const count = Number(item.count || 0);

          return total + price * count;
        }, 0)
      );
    }, 0);

    const deliveryFee = Number(delivery.store?.deliveryFee || 0);

    const totalPrice = delivery.orders.reduce(
      (total, order) => total + Number(order.totalPrice || 0),
      0,
    );

    return res.status(200).json({
      ...delivery,
      foodTotal,
      deliveryFee,
      totalPrice,
      deliveryStaffs,
    });
  } catch (error) {
    console.error("readDelivery Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.changeStatusDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const deliveryId = Number(id);
    const storeId = Number(req.store?.id);

    // ==========================================
    // CHECK DELIVERY ID
    // ==========================================

    if (!deliveryId || Number.isNaN(deliveryId)) {
      return res.status(400).json({
        message: "รหัสการจัดส่งไม่ถูกต้อง",
      });
    }

    // ==========================================
    // CHECK STORE
    // ==========================================

    if (!storeId) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลร้านค้า",
      });
    }

    // ==========================================
    // ALLOWED STATUS
    // ==========================================

    const allowedStatus = [
      "PENDING",
      "DELIVERING",
      "COMPLETED",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "สถานะการจัดส่งไม่ถูกต้อง",
      });
    }

    // ==========================================
    // FIND DELIVERY
    // ==========================================

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        storeId,
      },

      include: {
        images: true,

        orders: {
          select: {
            id: true,
            status: true,
            customerId: true,
            storeId: true,
          },
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลการจัดส่ง",
      });
    }

    // ==========================================
    // COMPLETED แล้ว
    // ==========================================

    if (delivery.status === "COMPLETED") {
      return res.status(400).json({
        message: "การจัดส่งนี้เสร็จสิ้นแล้ว",
      });
    }

    // ==========================================
    // PENDING → DELIVERING
    // ==========================================

    if (
      delivery.status === "PENDING" &&
      status !== "DELIVERING"
    ) {
      return res.status(400).json({
        message:
          "การจัดส่งที่พร้อมส่ง สามารถเปลี่ยนเป็นกำลังจัดส่งเท่านั้น",
      });
    }

    // ==========================================
    // DELIVERING → COMPLETED
    // ==========================================

    if (
      delivery.status === "DELIVERING" &&
      status !== "COMPLETED"
    ) {
      return res.status(400).json({
        message:
          "การจัดส่งที่กำลังจัดส่ง สามารถเปลี่ยนเป็นเสร็จสิ้นเท่านั้น",
      });
    }

    // ==========================================
    // CHECK PRIMARY PROOF
    // ก่อน COMPLETED ต้องมีรูปหลักฐาน
    // ==========================================

    if (status === "COMPLETED") {
      const primaryProof = delivery.images?.find(
        (image) =>
          image.proofType === "PRIMARY"
      );

      if (!primaryProof) {
        return res.status(400).json({
          message:
            "กรุณาอัปโหลดรูปหลักฐานการส่งก่อนจัดส่งสำเร็จ",
        });
      }
    }

    // ==========================================
    // TRANSACTION
    // ==========================================

    const result = await prisma.$transaction(
      async (tx) => {
        // --------------------------------------
        // UPDATE DELIVERY
        // --------------------------------------

        const updatedDelivery =
          await tx.delivery.update({
            where: {
              id: deliveryId,
            },

            data: {
              status,
            },

            include: {
              images: true,

              deliveryStaff: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          });

        // --------------------------------------
        // COMPLETED
        // --------------------------------------

        if (status === "COMPLETED") {
          await tx.order.updateMany({
            where: {
              deliveryId: deliveryId,
              storeId: storeId,

              status: {
                notIn: [
                  "CANCELLED",
                  "COMPLETED",
                ],
              },
            },

            data: {
              status: "COMPLETED",
              customerReceived: true,
            },
          });
        }

        return updatedDelivery;
      }
    );

    // ==========================================
    // NOTIFICATION
    // เริ่มจัดส่ง
    // ==========================================

    if (status === "DELIVERING") {
      for (const order of delivery.orders) {
        try {
          await createNotification({
            title: "กำลังจัดส่งอาหาร",

            message:
              `ออเดอร์ #ORD00${order.id} กำลังจัดส่งไปหาคุณ`,

            type: "DELIVERY_STARTED",

            customerId: order.customerId,

            orderId: order.id,
          });
        } catch (notificationError) {
          console.error(
            "สร้าง Notification DELIVERY_STARTED ไม่สำเร็จ =",
            notificationError
          );
        }
      }
    }

    // ==========================================
    // NOTIFICATION
    // จัดส่งสำเร็จ
    // ==========================================

    if (status === "COMPLETED") {
      for (const order of delivery.orders) {
        try {
          await createNotification({
            title: "จัดส่งอาหารสำเร็จ",

            message:
              `ออเดอร์ #ORD00${order.id} จัดส่งถึงแล้ว`,

            type: "DELIVERY_COMPLETED",

            customerId: order.customerId,

            orderId: order.id,
          });
        } catch (notificationError) {
          console.error(
            "สร้าง Notification DELIVERY_COMPLETED ไม่สำเร็จ =",
            notificationError
          );
        }
      }
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message:
        status === "COMPLETED"
          ? "จัดส่งอาหารสำเร็จและปิดออเดอร์แล้ว"
          : "เปลี่ยนสถานะการจัดส่งสำเร็จ",

      delivery: result,
    });

  } catch (error) {
    console.error(
      "changeStatusDelivery Error =",
      error
    );

    return res.status(500).json({
      message: "Server Error",
    });

  }
};



exports.assignDeliveryStaff = async (req, res) => {
  try {
    const deliveryId = Number(req.params.id);
    const storeId = Number(req.store?.id);

    let staffId = req.body.staffId;

    if (!deliveryId || Number.isNaN(deliveryId)) {
      return res.status(400).json({
        message: "รหัสการจัดส่งไม่ถูกต้อง",
      });
    }

    if (!storeId) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลร้านค้า",
      });
    }

    // ==========================================
    // แปลง "" / undefined / null เป็น null
    // ==========================================

    if (
      staffId === "" ||
      staffId === undefined ||
      staffId === null
    ) {
      staffId = null;
    } else {
      staffId = Number(staffId);

      if (Number.isNaN(staffId)) {
        return res.status(400).json({
          message: "รหัสพนักงานไม่ถูกต้อง",
        });
      }
    }

    // ==========================================
    // ตรวจสอบ Delivery
    // ==========================================

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        storeId,
      },

      include: {
        deliveryStaff: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลการจัดส่ง",
      });
    }

    // ==========================================
    // เปลี่ยนคนส่งได้เฉพาะตอน PENDING
    // ==========================================

    if (delivery.status !== "PENDING") {
      return res.status(400).json({
        message: "ไม่สามารถเปลี่ยนคนส่งได้ เพราะงานนี้เริ่มจัดส่งแล้ว",
      });
    }

    // ==========================================
    // ถ้าไม่ได้เลือกพนักงาน
    // และร้านมีพนักงานส่งอาหาร Active แค่ 1 คน
    // ให้เลือกคนนั้นอัตโนมัติ
    // ==========================================

    if (staffId === null) {
      const activeStaffs = await prisma.storeStaff.findMany({
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

      // มีพนักงานส่งอาหารแค่ 1 คน
      if (activeStaffs.length === 1) {
        staffId = activeStaffs[0].id;
      }
    }

    // ==========================================
    // ตรวจสอบพนักงานที่เลือก
    // ==========================================

    let staff = null;

    if (staffId !== null) {
      staff = await prisma.storeStaff.findFirst({
        where: {
          id: staffId,
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
      });

      if (!staff) {
        return res.status(404).json({
          message: "ไม่พบพนักงานส่งอาหาร หรือพนักงานถูกปิดใช้งาน",
        });
      }
    }

    // ==========================================
    // บันทึกคนส่ง
    // ==========================================

    const updatedDelivery = await prisma.delivery.update({
      where: {
        id: deliveryId,
      },

      data: {
        deliveryStaffId: staffId,
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

    // ==========================================
    // แจ้งเตือนพนักงาน
    // ==========================================

    if (staff) {
      try {
        await createNotification({
          title: "ได้รับมอบหมายงานส่งอาหาร",
          message: `คุณได้รับมอบหมายงานส่งอาหาร #ORD00${deliveryId}`,
          type: "DELIVERY_ASSIGNED",
          deliveryStaffId: staff.id,
          deliveryId: deliveryId,
        });
      } catch (notificationError) {
        console.error(
          "สร้าง Notification DELIVERY_ASSIGNED ไม่สำเร็จ =",
          notificationError,
        );
      }
    }

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      message: staff
        ? `มอบหมายงานให้ ${staff.name} สำเร็จ`
        : "ยกเลิกการมอบหมาย คนส่งเป็นร้าน",

      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error("assignDeliveryStaff Error =", error);

    return res.status(500).json({
      message: "ไม่สามารถกำหนดคนส่งได้",
    });
  }
};

exports.getDeliveryNotifications = async (req, res) => {
  try {
    const staff = req.deliveryStaff;

    const notifications = await prisma.notification.findMany({
      where: {
        deliveryStaffId: staff.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error("getDeliveryNotifications Error =", error);

    return res.status(500).json({
      message: "ไม่สามารถโหลดการแจ้งเตือนได้",
    });
  }
};


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadDeliveryProof = async (req, res) => {
  let uploadedPublicId = null;

  try {
    const storeId = Number(req.store?.id);
    const deliveryId = Number(req.params.id);

    const { image, proofType } = req.body;

    // =========================
    // CHECK STORE
    // =========================

    if (!storeId) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลร้านค้า",
      });
    }

    // =========================
    // CHECK DELIVERY ID
    // =========================

    if (!deliveryId || Number.isNaN(deliveryId)) {
      return res.status(400).json({
        message: "รหัสการจัดส่งไม่ถูกต้อง",
      });
    }

    // =========================
    // CHECK IMAGE
    // =========================

    if (!image) {
      return res.status(400).json({
        message: "กรุณาเลือกรูปหลักฐานการจัดส่ง",
      });
    }

    // =========================
    // CHECK PROOF TYPE
    // =========================

    if (!["PRIMARY", "ADDITIONAL"].includes(proofType)) {
      return res.status(400).json({
        message: "ประเภทหลักฐานไม่ถูกต้อง",
      });
    }

    // =========================
    // FIND DELIVERY
    // =========================

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        storeId,
      },
      include: {
        images: true,
      },
    });

    if (!delivery) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลการจัดส่ง",
      });
    }

    // =========================
    // COMPLETED แล้วแก้ไม่ได้
    // =========================

    if (delivery.status === "COMPLETED") {
      return res.status(400).json({
        message: "จัดส่งสำเร็จแล้ว ไม่สามารถแก้ไขหลักฐานได้",
      });
    }

    // =========================
    // ต้องเริ่มส่งก่อน
    // =========================

    if (!["DELIVERING", "DELIVERED"].includes(delivery.status)) {
      return res.status(400).json({
        message: "สามารถเพิ่มหลักฐานได้เมื่อเริ่มจัดส่งแล้ว",
      });
    }

    // =========================
    // หาไฟล์เดิมประเภทเดียวกัน
    // =========================

    const oldImage = delivery.images.find(
      (item) => item.proofType === proofType
    );

    // =========================
    // UPLOAD CLOUDINARY
    // =========================

    const result = await cloudinary.uploader.upload(
      image,
      {
        public_id: `Delivery-${deliveryId}-${proofType}-${Date.now()}`,
        resource_type: "image",
        folder: "deliveryProof2026",
      }
    );

    uploadedPublicId = result.public_id;

    // =========================
    // DATABASE
    // =========================

    const newImage = await prisma.$transaction(
      async (tx) => {
        if (oldImage) {
          await tx.image.delete({
            where: {
              id: oldImage.id,
            },
          });
        }

        return await tx.image.create({
          data: {
            asset_id: result.asset_id,
            public_id: result.public_id,
            url: result.url,
            secure_url: result.secure_url,
            storeId,
            deliveryId,
            proofType,
          },
        });
      }
    );

    // =========================
    // ลบรูปเก่าจาก Cloudinary
    // หลัง DB สำเร็จ
    // =========================

    if (oldImage) {
      try {
        await cloudinary.uploader.destroy(
          oldImage.public_id
        );
      } catch (error) {
        console.error(
          "ลบหลักฐานเก่าจาก Cloudinary ไม่สำเร็จ =",
          error
        );
      }
    }

    return res.status(200).json({
      message:
        proofType === "PRIMARY"
          ? "อัปโหลดรูปหลักฐานการส่งสำเร็จ"
          : "อัปโหลดรูปหลักฐานเพิ่มเติมสำเร็จ",
      image: newImage,
    });
  } catch (error) {
    console.error(
      "uploadDeliveryProof Error =",
      error
    );

    // ถ้า DB ไม่สำเร็จ
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(
          uploadedPublicId
        );
      } catch (cleanupError) {
        console.error(
          "Cleanup Delivery Proof ไม่สำเร็จ =",
          cleanupError
        );
      }
    }

    return res.status(500).json({
      message: "ไม่สามารถอัปโหลดหลักฐานการจัดส่งได้",
    });
  }
};




exports.removeDeliveryProof = async (req, res) => {
  try {
    const storeId = Number(req.store?.id);
    const deliveryId = Number(req.params.id);
    const { proofType } = req.body;

    if (!storeId) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลร้านค้า",
      });
    }

    if (!deliveryId || Number.isNaN(deliveryId)) {
      return res.status(400).json({
        message: "รหัสการจัดส่งไม่ถูกต้อง",
      });
    }

    if (!["PRIMARY", "ADDITIONAL"].includes(proofType)) {
      return res.status(400).json({
        message: "ประเภทหลักฐานไม่ถูกต้อง",
      });
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        storeId,
      },
      include: {
        images: true,
      },
    });

    if (!delivery) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลการจัดส่ง",
      });
    }

    if (delivery.status === "COMPLETED") {
      return res.status(400).json({
        message: "จัดส่งสำเร็จแล้ว ไม่สามารถลบหลักฐานได้",
      });
    }

    const image = delivery.images.find(
      (item) => item.proofType === proofType
    );

    if (!image) {
      return res.status(404).json({
        message: "ไม่พบรูปหลักฐาน",
      });
    }

    try {
      await cloudinary.uploader.destroy(
        image.public_id
      );
    } catch (error) {
      console.error(
        "ลบ Cloudinary ไม่สำเร็จ =",
        error
      );
    }

    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    return res.status(200).json({
      message: "ลบหลักฐานการจัดส่งสำเร็จ",
    });
  } catch (error) {
    console.error(
      "removeDeliveryProof Error =",
      error
    );

    return res.status(500).json({
      message: "ไม่สามารถลบหลักฐานการจัดส่งได้",
    });
  }
};

// Staff
exports.uploadDeliveryProofStaff = async (req, res) => {
  let uploadedPublicId = null;

  try {
    const staffId = Number(req.deliveryStaff?.id);
    const storeId = Number(req.deliveryStaff?.storeId);
    const deliveryId = Number(req.params.id);

    const { image, proofType } = req.body;

    if (!staffId || !storeId) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลพนักงานส่งอาหาร",
      });
    }

    if (!deliveryId || Number.isNaN(deliveryId)) {
      return res.status(400).json({
        message: "รหัสการจัดส่งไม่ถูกต้อง",
      });
    }

    if (!image) {
      return res.status(400).json({
        message: "กรุณาเลือกรูปหลักฐานการจัดส่ง",
      });
    }

    if (!["PRIMARY", "ADDITIONAL"].includes(proofType)) {
      return res.status(400).json({
        message: "ประเภทหลักฐานไม่ถูกต้อง",
      });
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        storeId,
        deliveryStaffId: staffId,
      },
      include: {
        images: true,
      },
    });

    if (!delivery) {
      return res.status(404).json({
        message: "ไม่พบงานจัดส่งที่มอบหมายให้คุณ",
      });
    }

    if (delivery.status === "COMPLETED") {
      return res.status(400).json({
        message: "จัดส่งสำเร็จแล้ว ไม่สามารถแก้ไขหลักฐานได้",
      });
    }

    if (delivery.status !== "DELIVERING") {
      return res.status(400).json({
        message: "สามารถเพิ่มหลักฐานได้เมื่อกำลังจัดส่ง",
      });
    }

    const oldImage = delivery.images.find(
      (item) => item.proofType === proofType
    );

    const result = await cloudinary.uploader.upload(image, {
      public_id: `Delivery-${deliveryId}-${proofType}-${Date.now()}`,
      resource_type: "image",
      folder: "deliveryProof2026",
    });

    uploadedPublicId = result.public_id;

    const newImage = await prisma.$transaction(async (tx) => {
      if (oldImage) {
        await tx.image.delete({
          where: {
            id: oldImage.id,
          },
        });
      }

      return tx.image.create({
        data: {
          asset_id: result.asset_id,
          public_id: result.public_id,
          url: result.url,
          secure_url: result.secure_url,
          storeId,
          deliveryId,
          proofType,
        },
      });
    });

    if (oldImage) {
      try {
        await cloudinary.uploader.destroy(
          oldImage.public_id
        );
      } catch (error) {
        console.error(
          "ลบรูปหลักฐานเดิมไม่สำเร็จ =",
          error
        );
      }
    }

    return res.status(200).json({
      message:
        proofType === "PRIMARY"
          ? "อัปโหลดรูปหลักฐานการส่งสำเร็จ"
          : "อัปโหลดรูปหลักฐานเพิ่มเติมสำเร็จ",
      image: newImage,
    });
  } catch (error) {
    console.error(
      "uploadDeliveryProofStaff Error =",
      error
    );

    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(
          uploadedPublicId
        );
      } catch (cleanupError) {
        console.error(
          "Cleanup Delivery Proof ไม่สำเร็จ =",
          cleanupError
        );
      }
    }

    return res.status(500).json({
      message: "ไม่สามารถอัปโหลดหลักฐานการจัดส่งได้",
    });
  }
};

exports.getDeliveryJobs = async (req, res) => {
  try {
    const staff = req.deliveryStaff;

    const deliveries = await prisma.delivery.findMany({
      where: {
        storeId: staff.storeId,

        // ==========================================
        // เห็นเฉพาะงานที่ร้านมอบหมายให้ตัวเอง
        // ==========================================
        deliveryStaffId: staff.id,

        // ==========================================
        // แสดงงานทั้งหมดของคนส่ง
        // PENDING = พร้อมจัดส่ง
        // DELIVERING = กำลังจัดส่ง
        // COMPLETED = เสร็จสิ้น
        // ==========================================
        status: {
          in: ["PENDING", "DELIVERING", "COMPLETED"],
        },
      },

      include: {
        orderRound: true,

        deliveryStaff: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },

        orders: {
          include: {
            customer: {
              select: {
                id: true,
                username: true,
                phone: true,
              },
            },

            menu: {
              include: {
                menu: {
                  select: {
                    id: true,
                    menuItem: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      deliveries,
    });
  } catch (error) {
    console.error("getDeliveryJobs Error =", error);

    return res.status(500).json({
      message: "ไม่สามารถโหลดงานส่งได้",
    });
  }
};


exports.startDelivery = async (req, res) => {
  try {
    const staff = req.deliveryStaff;
    const deliveryId = Number(req.body.deliveryId);

    if (!deliveryId || Number.isNaN(deliveryId)) {
      return res.status(400).json({
        message: "รหัสงานส่งไม่ถูกต้อง",
      });
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        storeId: staff.storeId,
        deliveryStaffId: staff.id,
      },

      include: {
        orders: {
          select: {
            id: true,
            customerId: true,
          },
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({
        message: "ไม่พบงานส่งนี้ หรือร้านยังไม่ได้มอบหมายงานให้คุณ",
      });
    }

    if (delivery.status !== "PENDING") {
      return res.status(400).json({
        message: "งานนี้ไม่สามารถเริ่มจัดส่งได้",
      });
    }

    const updatedDelivery = await prisma.delivery.update({
      where: {
        id: deliveryId,
      },

      data: {
        status: "DELIVERING",
      },

      include: {
        deliveryStaff: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // ==========================================
    // แจ้งเตือนลูกค้า
    // ==========================================

    for (const order of delivery.orders) {
      await prisma.notification.create({
        data: {
          title: "กำลังจัดส่งอาหาร",
          message: `ออเดอร์ #${order.id} กำลังเดินทางไปหาคุณ กรุณารอรับอาหาร`,
          type: "DELIVERY_STARTED",

          customerId: order.customerId,
          orderId: order.id,
        },
      });
    }

    return res.status(200).json({
      message: "เริ่มจัดส่งแล้ว",
      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error("startDelivery Error =", error);

    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการเริ่มจัดส่ง",
    });
  }
};

exports.markDelivered = async (req, res) => {
  try {
    const staff = req.deliveryStaff;
    const deliveryId = Number(req.body.deliveryId);

    if (!deliveryId || Number.isNaN(deliveryId)) {
      return res.status(400).json({
        message: "รหัสงานส่งไม่ถูกต้อง",
      });
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        storeId: staff.storeId,
        deliveryStaffId: staff.id,
      },

      include: {
        orders: {
          select: {
            id: true,
            customerId: true,
          },
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({
        message: "ไม่พบงานส่งนี้ หรือไม่มีสิทธิ์จัดการงานนี้",
      });
    }

    if (delivery.status !== "DELIVERING") {
      return res.status(400).json({
        message: "งานนี้ยังไม่อยู่ในสถานะกำลังจัดส่ง",
      });
    }

    const updatedDelivery = await prisma.delivery.update({
      where: {
        id: deliveryId,
      },

      data: {
        status: "COMPLETED",
      },

      include: {
        deliveryStaff: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // ==========================================
    // แจ้งเตือนลูกค้า
    // ==========================================

    for (const order of delivery.orders) {
      await prisma.notification.create({
        data: {
          title: "จัดส่งอาหารสำเร็จ",
          message: `ออเดอร์ #${order.id} จัดส่งถึงคุณแล้ว ขอบคุณที่ใช้บริการ RobMorFood`,
          type: "DELIVERY_COMPLETED",

          customerId: order.customerId,
          orderId: order.id,
        },
      });
    }

    return res.status(200).json({
      message: "ส่งอาหารถึงลูกค้าแล้ว",
      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error("markDelivered Error =", error);

    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
    });
  }
};


exports.readDeliveryStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryId = Number(id);

    if (!deliveryId || Number.isNaN(deliveryId)) {
      return res.status(400).json({
        message: "รหัสการจัดส่งไม่ถูกต้อง",
      });
    }

    const staff = req.deliveryStaff;

    if (!staff) {
      return res.status(403).json({
        message: "ไม่มีสิทธิ์เข้าถึงข้อมูลการจัดส่ง",
      });
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,

        // ร้านเดียวกัน
        storeId: staff.storeId,

        // สำคัญ:
        // ต้องเป็นงานที่ร้านมอบหมายให้พนักงานคนนี้เท่านั้น
        deliveryStaffId: staff.id,
      },

      include: {
        images: true,
        orderRound: {
          select: {
            roundNumber: true,
            startTime: true,
            endTime: true,
          },
        },

        deliveryStaff: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },

        orders: {
          orderBy: {
            createdAt: "asc",
          },

          select: {
            id: true,
            deliveryType: true,
            status: true,
            totalPrice: true,
            note: true,
            outOfStock: true,

            customerReceived: true,
            receivedAt: true,

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
        },
      },
    });

    if (!delivery) {
      return res.status(404).json({
        message:
          "ไม่พบข้อมูลการจัดส่ง หรือคุณไม่ได้รับมอบหมายงานนี้",
      });
    }

    return res.status(200).json(delivery);
  } catch (error) {
    console.error("readDeliveryStaff Error =", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.deleteDeliveryProofStaff = async (req, res) => {
  try {
    const deliveryId = Number(req.params.id);
    const imageId = Number(req.params.imageId);

    if (!deliveryId || Number.isNaN(deliveryId)) {
      return res.status(400).json({
        message: "รหัสการจัดส่งไม่ถูกต้อง",
      });
    }

    if (!imageId || Number.isNaN(imageId)) {
      return res.status(400).json({
        message: "รหัสรูปภาพไม่ถูกต้อง",
      });
    }

    const staff = req.deliveryStaff;

    if (!staff) {
      return res.status(403).json({
        message: "ไม่มีสิทธิ์เข้าถึงข้อมูลการจัดส่ง",
      });
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        storeId: staff.storeId,
        deliveryStaffId: staff.id,
      },
      select: {
        id: true,
      },
    });

    if (!delivery) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลการจัดส่ง หรือคุณไม่ได้รับมอบหมายงานนี้",
      });
    }

    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        deliveryId: deliveryId,
      },
    });

    if (!image) {
      return res.status(404).json({
        message: "ไม่พบรูปหลักฐานการจัดส่ง",
      });
    }

    // ลบจาก Cloudinary ถ้ามี public_id
    if (image.public_id) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (cloudinaryError) {
        console.error(
          "ลบรูปจาก Cloudinary ไม่สำเร็จ =",
          cloudinaryError
        );
      }
    }

    // ลบจาก Database
    await prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    return res.status(200).json({
      message: "ลบรูปหลักฐานสำเร็จ",
    });
  } catch (error) {
    console.error("deleteDeliveryProofStaff Error =", error);

    return res.status(500).json({
      message: "ไม่สามารถลบรูปหลักฐานได้",
    });
  }
};