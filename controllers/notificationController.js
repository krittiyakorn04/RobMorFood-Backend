const prisma = require("../config/prisma");
const webpush = require("../config/webpush");

// =====================================================
// สร้าง Notification + ส่ง Web Push
// =====================================================

exports.createNotification = async ({
  title,
  message,
  type,
  customerId = null,
  storeId = null,
  deliveryStaffId = null,
  deliveryId = null,
  orderId = null,
}) => {
  try {
    // =====================================================
    // 1. บันทึก Notification ลง Database
    // =====================================================

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        customerId,
        storeId,
        deliveryStaffId,
        deliveryId,
        orderId,
      },
    });

    // =====================================================
    // 2. หา Push Subscription ของผู้รับ
    // =====================================================

    let subscriptions = [];

    if (customerId) {
      subscriptions = await prisma.pushSubscription.findMany({
        where: {
          customerId: Number(customerId),
        },
      });
    } else if (storeId) {
      subscriptions = await prisma.pushSubscription.findMany({
        where: {
          storeId: Number(storeId),
        },
      });
    } else if (deliveryStaffId) {
      subscriptions = await prisma.pushSubscription.findMany({
        where: {
          deliveryStaffId: Number(deliveryStaffId),
        },
      });
    }

    // =====================================================
    // 3. ถ้ามีอุปกรณ์ ให้ส่ง Push Notification
    // =====================================================

    if (subscriptions.length > 0) {
      const payload = JSON.stringify({
        title,
        message,
        type,
        notificationId: notification.id,
        deliveryId,
        orderId,
      });

      await Promise.all(
        subscriptions.map(async (item) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: item.endpoint,
                keys: {
                  p256dh: item.p256dh,
                  auth: item.auth,
                },
              },
              payload,
            );
          } catch (error) {
            console.error(
              "sendPushNotification Error =",
              error.statusCode,
              error.message,
            );

            // Subscription หมดอายุหรือใช้งานไม่ได้
            if (
              error.statusCode === 404 ||
              error.statusCode === 410
            ) {
              await prisma.pushSubscription.delete({
                where: {
                  id: item.id,
                },
              });
            }
          }
        }),
      );
    }

    // =====================================================
    // 4. คืน Notification
    // =====================================================

    return notification;
  } catch (error) {
    console.error("createNotification Error =", error);
    return null;
  }
};
// =====================================================
// ดึงแจ้งเตือน
// =====================================================

exports.getNotifications = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const storeId = req.store?.id;
    const deliveryStaffId = req.deliveryStaff?.id;

    let where = null;

    if (customerId) {
      where = {
        customerId: Number(customerId),
      };
    } else if (storeId) {
      where = {
        storeId: Number(storeId),
      };
    } else if (deliveryStaffId) {
      where = {
        deliveryStaffId: Number(deliveryStaffId),
      };
    } else {
      return res.status(401).json({
        message: "ไม่พบเจ้าของแจ้งเตือน",
      });
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        isRead: false,
      },
    });

    return res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("getNotifications error:", error);

    return res.status(500).json({
      message: "โหลดแจ้งเตือนไม่สำเร็จ",
    });
  }
};

// =====================================================
// อ่านแจ้งเตือน 1 รายการ
// =====================================================

exports.readNotification = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);

    if (!notificationId) {
      return res.status(400).json({
        message: "ไม่พบรหัสแจ้งเตือน",
      });
    }

    const customerId = req.user?.id;
    const storeId = req.store?.id;
    const deliveryStaffId = req.deliveryStaff?.id;

    let ownerWhere = null;

    if (customerId) {
      ownerWhere = {
        customerId: Number(customerId),
      };
    } else if (storeId) {
      ownerWhere = {
        storeId: Number(storeId),
      };
    } else if (deliveryStaffId) {
      ownerWhere = {
        deliveryStaffId: Number(deliveryStaffId),
      };
    } else {
      return res.status(401).json({
        message: "ไม่พบเจ้าของแจ้งเตือน",
      });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        ...ownerWhere,
      },
    });

    if (!notification) {
      return res.status(404).json({
        message: "ไม่พบการแจ้งเตือน",
      });
    }

    // ถ้าอ่านแล้ว ไม่ต้อง update ซ้ำ
    if (notification.isRead) {
      return res.json({
        message: "แจ้งเตือนนี้ถูกอ่านแล้ว",
        notification,
      });
    }

    const updated = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    return res.json({
      message: "อ่านแจ้งเตือนแล้ว",
      notification: updated,
    });
  } catch (error) {
    console.error("readNotification Error =", error);

    return res.status(500).json({
      message: "ไม่สามารถอ่านแจ้งเตือนได้",
    });
  }
};

// =====================================================
// อ่านแจ้งเตือนทั้งหมด
// =====================================================

exports.readAllNotifications = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const storeId = req.store?.id;
    const deliveryStaffId = req.deliveryStaff?.id;

    let where = null;

    if (customerId) {
      where = {
        customerId: Number(customerId),
        isRead: false,
      };
    } else if (storeId) {
      where = {
        storeId: Number(storeId),
        isRead: false,
      };
    } else if (deliveryStaffId) {
      where = {
        deliveryStaffId: Number(deliveryStaffId),
        isRead: false,
      };
    } else {
      return res.status(401).json({
        message: "ไม่พบเจ้าของแจ้งเตือน",
      });
    }

    const result = await prisma.notification.updateMany({
      where,
      data: {
        isRead: true,
      },
    });

    return res.json({
      message: "อ่านแจ้งเตือนทั้งหมดแล้ว",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("readAllNotifications Error =", error);

    return res.status(500).json({
      message: "ไม่สามารถอ่านแจ้งเตือนทั้งหมดได้",
    });
  }
};