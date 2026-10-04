const prisma = require("../../config/prisma");
const { createNotification } = require("../notificationController");

// ===============================
// สร้างหรือค้นหาห้องแชทลูกค้า ↔ ร้าน
// ===============================
exports.getOrCreateStoreChat = async (req, res) => {
    try {
        const customerId = req.user.id;
        const storeId = Number(req.params.storeId);

        if (!customerId) {
            return res.status(401).json({
                message: "ไม่พบข้อมูลลูกค้า",
            });
        }

        if (!storeId || Number.isNaN(storeId)) {
            return res.status(400).json({
                message: "รหัสร้านไม่ถูกต้อง",
            });
        }

        // ตรวจสอบร้าน
        const store = await prisma.store.findUnique({
            where: {
                id: storeId,
            },
            select: {
                id: true,
                storeName: true,
            },
        });

        if (!store) {
            return res.status(404).json({
                message: "ไม่พบร้านค้า",
            });
        }

        // ค้นหาห้องแชทเดิม
        let room = await prisma.chatRoom.findFirst({
            where: {
                type: "STORE_CUSTOMER",
                customerId: customerId,
                storeId: storeId,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        // ถ้ายังไม่มีห้อง ให้สร้างใหม่
        if (!room) {
            room = await prisma.chatRoom.create({
                data: {
                    type: "STORE_CUSTOMER",
                    customerId: customerId,
                    storeId: storeId,
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: "asc",
                        },
                    },
                },
            });
        }

        return res.status(200).json({
            room: {
                ...room,
                store: {
                    id: store.id,
                    storeName: store.storeName,
                },
            },
        });
    } catch (error) {
        console.error("getOrCreateStoreChat Error =", error);

        return res.status(500).json({
            message: "ไม่สามารถเปิดห้องแชทได้",
            error: error.message,
        });
    }
};
// ===============================
// อ่านข้อความในห้อง
// ===============================
exports.getChatMessages = async (req, res) => {
    try {
        const customerId = req.user.id;
        const roomId = Number(req.params.roomId);

        if (!roomId || Number.isNaN(roomId)) {
            return res.status(400).json({
                message: "รหัสห้องแชทไม่ถูกต้อง",
            });
        }

        const room = await prisma.chatRoom.findFirst({
            where: {
                id: roomId,
                customerId,
            },
        });

        if (!room) {
            return res.status(403).json({
                message: "ไม่มีสิทธิ์เข้าถึงห้องแชทนี้",
            });
        }

        const messages = await prisma.chatMessage.findMany({
            where: {
                roomId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return res.status(200).json({
            messages,
        });
    } catch (error) {
        console.error("getChatMessages Error =", error);

        return res.status(500).json({
            message: "ไม่สามารถโหลดข้อความได้",
        });
    }
};

// ===============================
// ส่งข้อความ
// ===============================
exports.sendCustomerMessage = async (req, res) => {
    try {
        const customerId = req.user.id;
        const roomId = Number(req.params.roomId);
        const { message } = req.body;

        if (!roomId || Number.isNaN(roomId)) {
            return res.status(400).json({
                message: "รหัสห้องแชทไม่ถูกต้อง",
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "กรุณาระบุข้อความ",
            });
        }

        const room = await prisma.chatRoom.findFirst({
            where: {
                id: roomId,
                customerId,
                type: "STORE_CUSTOMER",
            },
            include: {
                customer: {
                    select: {
                        username: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        storeName: true,
                    },
                },
            },
        });

        if (!room) {
            return res.status(403).json({
                message: "ไม่มีสิทธิ์ส่งข้อความในห้องนี้",
            });
        }

        // ===============================
        // สร้างข้อความ
        // ===============================

        const newMessage = await prisma.chatMessage.create({
            data: {
                roomId,
                senderType: "CUSTOMER",
                senderId: customerId,
                message: message.trim(),
            },
        });

        // ===============================
        // อัปเดตห้อง
        // ===============================

        await prisma.chatRoom.update({
            where: {
                id: roomId,
            },
            data: {
                updatedAt: new Date(),
            },
        });

        // ===============================
        // แจ้งเตือนร้าน
        // ===============================

        if (room.storeId) {
            await createNotification({
                title: "ข้อความใหม่จากลูกค้า",
                message: `${room.customer?.username || "ลูกค้า"} ส่งข้อความใหม่ถึงร้าน`,
                type: "CHAT_MESSAGE",
                storeId: room.storeId,
            });
        }

        // ===============================
        // SOCKET
        // ===============================

        const io = req.app.get("io");

        if (io) {
            io.to(`chat:${roomId}`).emit(
                "newChatMessage",
                newMessage
            );
        }

        return res.status(201).json({
            message: newMessage,
        });

    } catch (error) {
        console.error("sendCustomerMessage Error =", error);

        return res.status(500).json({
            message: "ไม่สามารถส่งข้อความได้",
        });
    }
};



// ==========================================
// ร้าน: ดูรายการห้องแชทของร้าน
// ==========================================
exports.getStoreChatRooms = async (req, res) => {
    try {
        const storeId = req.store.id;

        const rooms = await prisma.chatRoom.findMany({
            where: {
                type: "STORE_CUSTOMER",
                storeId: storeId,
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        username: true,
                        phone: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 1,
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return res.status(200).json({
            rooms,
        });
    } catch (error) {
        console.error("getStoreChatRooms Error =", error);

        return res.status(500).json({
            message: "ไม่สามารถโหลดรายการแชทได้",
        });
    }
};


// ==========================================
// ร้าน: ดูข้อความในห้อง
// ==========================================
exports.getStoreChatMessages = async (req, res) => {
    try {
        const storeId = req.store.id;
        const roomId = Number(req.params.roomId);

        if (!roomId || Number.isNaN(roomId)) {
            return res.status(400).json({
                message: "รหัสห้องแชทไม่ถูกต้อง",
            });
        }

        const room = await prisma.chatRoom.findFirst({
            where: {
                id: roomId,
                storeId: storeId,
                type: "STORE_CUSTOMER",
            },
        });

        if (!room) {
            return res.status(404).json({
                message: "ไม่พบห้องแชท",
            });
        }

        const messages = await prisma.chatMessage.findMany({
            where: {
                roomId: roomId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return res.status(200).json({
            room,
            messages,
        });
    } catch (error) {
        console.error("getStoreChatMessages Error =", error);

        return res.status(500).json({
            message: "ไม่สามารถโหลดข้อความได้",
        });
    }
};


// ==========================================
// ร้าน: ส่งข้อความหาลูกค้า
// ==========================================
exports.sendStoreMessage = async (req, res) => {
    try {
        const storeId = req.store.id;
        const roomId = Number(req.params.roomId);
        const { message } = req.body;

        if (!roomId || Number.isNaN(roomId)) {
            return res.status(400).json({
                message: "รหัสห้องแชทไม่ถูกต้อง",
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "กรุณาระบุข้อความ",
            });
        }

        const room = await prisma.chatRoom.findFirst({
            where: {
                id: roomId,
                storeId: storeId,
                type: "STORE_CUSTOMER",
            },
        });

        if (!room) {
            return res.status(404).json({
                message: "ไม่พบห้องแชท",
            });
        }

        const newMessage = await prisma.chatMessage.create({
            data: {
                roomId: roomId,
                senderType: "STORE",
                senderId: storeId,
                message: message.trim(),
            },
        });

        await prisma.chatRoom.update({
            where: {
                id: roomId,
            },
            data: {
                updatedAt: new Date(),
            },
        });

        // ===============================
        // แจ้งเตือนลูกค้า
        // ===============================

        if (room.customerId) {
            await createNotification({
                title: "ข้อความใหม่จากร้าน",
                message: "ร้านส่งข้อความใหม่ถึงคุณ",
                type: "CHAT_MESSAGE",
                customerId: room.customerId,
            });
        }

        // ส่งข้อความแบบ Real-time
        const io = req.app.get("io");

        if (io) {
            io.to(`chat:${roomId}`).emit(
                "newChatMessage",
                newMessage
            );
        }

        return res.status(201).json({
            message: newMessage,
        });
    } catch (error) {
        console.error("sendStoreMessage Error =", error);

        return res.status(500).json({
            message: "ไม่สามารถส่งข้อความได้",
        });
    }
};


// =====================================================
// DELIVERY CHAT
// ลูกค้า + ร้าน + พนักงานส่งอาหาร
// =====================================================

// ==============================
// ลูกค้าเปิดห้องแชทจัดส่ง
// ==============================
exports.getOrCreateCustomerDeliveryChat = async (req, res) => {
    try {
        const customerId = req.user.id;
        const deliveryId = Number(req.params.deliveryId);

        if (!customerId) {
            return res.status(401).json({
                message: "ไม่พบข้อมูลลูกค้า",
            });
        }

        if (!deliveryId || Number.isNaN(deliveryId)) {
            return res.status(400).json({
                message: "รหัสการจัดส่งไม่ถูกต้อง",
            });
        }

        const delivery = await prisma.delivery.findFirst({
            where: {
                id: deliveryId,
                orders: {
                    some: {
                        customerId: customerId,
                    },
                },
            },
            include: {
                store: {
                    select: {
                        id: true,
                        storeName: true,
                    },
                },
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
                message: "ไม่พบงานจัดส่งหรือคุณไม่มีสิทธิ์เข้าถึง",
            });
        }

        let room = await prisma.chatRoom.findFirst({
            where: {
                type: "DELIVERY",
                deliveryId: deliveryId,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!room) {
            room = await prisma.chatRoom.create({
                data: {
                    type: "DELIVERY",
                    customerId: customerId,
                    storeId: delivery.storeId,
                    deliveryId: deliveryId,
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: "asc",
                        },
                    },
                },
            });
        }

        return res.status(200).json({
            room,
            delivery: {
                id: delivery.id,
                status: delivery.status,
                store: delivery.store,
                deliveryStaff: delivery.deliveryStaff,
            },
        });
    } catch (error) {
        console.error(
            "getOrCreateCustomerDeliveryChat Error =",
            error
        );

        return res.status(500).json({
            message: "ไม่สามารถเปิดแชทจัดส่งได้",
        });
    }
};


// ==============================
// ร้านเปิดห้องแชทจัดส่ง
// ==============================
exports.getOrCreateStoreDeliveryChat = async (req, res) => {
    try {
        const storeId = req.store.id;
        const deliveryId = Number(req.params.deliveryId);

        if (!deliveryId || Number.isNaN(deliveryId)) {
            return res.status(400).json({
                message: "รหัสการจัดส่งไม่ถูกต้อง",
            });
        }

        const delivery = await prisma.delivery.findFirst({
            where: {
                id: deliveryId,
                storeId: storeId,
            },
            include: {
                store: {
                    select: {
                        id: true,
                        storeName: true,
                    },
                },
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
                message: "ไม่พบงานจัดส่ง",
            });
        }

        let room = await prisma.chatRoom.findFirst({
            where: {
                type: "DELIVERY",
                deliveryId: deliveryId,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!room) {
            room = await prisma.chatRoom.create({
                data: {
                    type: "DELIVERY",
                    storeId: storeId,
                    deliveryId: deliveryId,
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: "asc",
                        },
                    },
                },
            });
        }

        return res.status(200).json({
            room,
            delivery: {
                id: delivery.id,
                status: delivery.status,
                store: delivery.store,
                deliveryStaff: delivery.deliveryStaff,
            },
        });
    } catch (error) {
        console.error(
            "getOrCreateStoreDeliveryChat Error =",
            error
        );

        return res.status(500).json({
            message: "ไม่สามารถเปิดแชทจัดส่งได้",
        });
    }
};


// ==============================
// พนักงานส่งเปิดห้องแชทจัดส่ง
// ==============================
exports.getOrCreateStaffDeliveryChat = async (req, res) => {
    try {
        const staffId = req.deliveryStaff?.id;
        const deliveryId = Number(req.params.deliveryId);

        if (!staffId) {
            return res.status(401).json({
                message: "ไม่พบข้อมูลพนักงานส่งอาหาร",
            });
        }

        if (!deliveryId || Number.isNaN(deliveryId)) {
            return res.status(400).json({
                message: "รหัสการจัดส่งไม่ถูกต้อง",
            });
        }

        // ตรวจสอบว่างานนี้เป็นงานของพนักงานคนนี้จริง
        const delivery = await prisma.delivery.findFirst({
            where: {
                id: deliveryId,
                deliveryStaffId: staffId,
            },
            include: {
                store: {
                    select: {
                        id: true,
                        storeName: true,
                    },
                },
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
                message: "ไม่พบงานจัดส่งหรือคุณไม่ได้รับงานนี้",
            });
        }

        // ค้นหาห้องเดิม
        let room = await prisma.chatRoom.findFirst({
            where: {
                type: "DELIVERY",
                deliveryId: deliveryId,
            },
        });

        // ถ้ายังไม่มีห้อง ให้สร้าง
        if (!room) {
            room = await prisma.chatRoom.create({
                data: {
                    type: "DELIVERY",
                    deliveryId: deliveryId,
                    storeId: delivery.storeId,
                },
            });
        } else if (!room.storeId) {
            // กันกรณีห้องเก่าที่ไม่มี storeId
            room = await prisma.chatRoom.update({
                where: {
                    id: room.id,
                },
                data: {
                    storeId: delivery.storeId,
                },
            });
        }

        // โหลดข้อความ
        const messages = await prisma.chatMessage.findMany({
            where: {
                roomId: room.id,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return res.status(200).json({
            room: {
                id: room.id,
                type: room.type,
                customerId: room.customerId,
                storeId: room.storeId,
                deliveryId: room.deliveryId,
            },
            messages,
            delivery: {
                id: delivery.id,
                status: delivery.status,
                store: delivery.store,
                deliveryStaff: delivery.deliveryStaff,
            },
        });
    } catch (error) {
        console.error(
            "getOrCreateStaffDeliveryChat Error =",
            error
        );

        return res.status(500).json({
            message: "ไม่สามารถเปิดแชทจัดส่งได้",
            error: error.message,
        });
    }
};






// =====================================================
// โหลดข้อความแชทจัดส่ง
// =====================================================


exports.getDeliveryChatMessages = async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);

        if (!roomId || Number.isNaN(roomId)) {
            return res.status(400).json({
                message: "รหัสห้องแชทไม่ถูกต้อง",
            });
        }

        const room = await prisma.chatRoom.findFirst({
            where: {
                id: roomId,
                type: "DELIVERY",
            },
            include: {
                delivery: {
                    select: {
                        id: true,
                        storeId: true,
                        deliveryStaffId: true,
                        orders: {
                            select: {
                                customerId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!room || !room.delivery) {
            return res.status(404).json({
                message: "ไม่พบห้องแชทจัดส่ง",
            });
        }

        const delivery = room.delivery;

        // ==========================================
        // ตรวจสิทธิ์
        // ==========================================

        let hasPermission = false;

        // ลูกค้า
        if (req.user?.id) {
            hasPermission = delivery.orders.some(
                (order) => order.customerId === req.user.id
            );
        }

        // ร้าน
        if (req.store?.id) {
            hasPermission =
                delivery.storeId === req.store.id;
        }

        // พนักงานส่ง
        if (req.deliveryStaff?.id) {
            hasPermission =
                delivery.deliveryStaffId === req.deliveryStaff.id;
        }

        if (!hasPermission) {
            return res.status(403).json({
                message: "คุณไม่มีสิทธิ์เข้าถึงห้องแชทนี้",
            });
        }

        const messages = await prisma.chatMessage.findMany({
            where: {
                roomId: roomId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return res.status(200).json({
            room: {
                id: room.id,
                type: room.type,
                customerId: room.customerId,
                storeId: room.storeId,
                deliveryId: room.deliveryId,
            },
            messages,
        });
    } catch (error) {
        console.error(
            "getDeliveryChatMessages Error =",
            error
        );

        return res.status(500).json({
            message: "ไม่สามารถโหลดข้อความได้",
        });
    }
};




// =====================================================
// ส่งข้อความ - ลูกค้า
// =====================================================

exports.sendCustomerDeliveryMessage = async (req, res) => {
    try {
        const customerId = req.user?.id;
        const roomId = Number(req.params.roomId);
        const { message } = req.body;

        if (!customerId) {
            return res.status(401).json({
                message: "ไม่พบข้อมูลลูกค้า",
            });
        }

        if (!roomId || Number.isNaN(roomId)) {
            return res.status(400).json({
                message: "รหัสห้องแชทไม่ถูกต้อง",
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "กรุณาระบุข้อความ",
            });
        }

        const room = await prisma.chatRoom.findFirst({
            where: {
                id: roomId,
                type: "DELIVERY",

                delivery: {
                    orders: {
                        some: {
                            customerId: customerId,
                        },
                    },
                },
            },
        });

        if (!room) {
            return res.status(403).json({
                message: "คุณไม่มีสิทธิ์ส่งข้อความในห้องนี้",
            });
        }

        // =====================================================
        // ตรวจสอบสถานะการจัดส่ง
        // ถ้าจัดส่งเสร็จแล้ว ห้ามส่งข้อความใหม่
        // =====================================================

        if (room.deliveryId) {
            const delivery = await prisma.delivery.findUnique({
                where: {
                    id: room.deliveryId,
                },
                select: {
                    status: true,
                },
            });

            if (delivery?.status === "COMPLETED") {
                return res.status(403).json({
                    message:
                        "งานจัดส่งนี้เสร็จสิ้นแล้ว ไม่สามารถส่งข้อความใหม่ได้",
                });
            }
        }

        // =====================================================
        // สร้างข้อความ
        // =====================================================

        const newMessage =
            await prisma.chatMessage.create({
                data: {
                    roomId: roomId,
                    senderType: "CUSTOMER",
                    senderId: customerId,
                    message: message.trim(),
                },
            });

        // =====================================================
        // อัปเดตเวลาห้อง
        // =====================================================

        await prisma.chatRoom.update({
            where: {
                id: roomId,
            },
            data: {
                updatedAt: new Date(),
            },
        });

        // =====================================================
        // แจ้งเตือนร้าน + พนักงานส่ง
        // =====================================================

        if (room.deliveryId) {
            const deliveryInfo = await prisma.delivery.findUnique({
                where: {
                    id: room.deliveryId,
                },
                select: {
                    storeId: true,
                    deliveryStaffId: true,
                },
            });

            if (deliveryInfo) {

                // แจ้งร้าน
                if (deliveryInfo.storeId) {
                    await createNotification({
                        title: "ข้อความใหม่จากลูกค้า",
                        message: "ลูกค้าส่งข้อความใหม่ในแชทจัดส่ง",
                        type: "CHAT_MESSAGE",
                        storeId: deliveryInfo.storeId,
                        deliveryId: room.deliveryId,
                    });
                }

                // แจ้งพนักงานส่ง
                if (deliveryInfo.deliveryStaffId) {
                    await createNotification({
                        title: "ข้อความใหม่จากลูกค้า",
                        message: "ลูกค้าส่งข้อความใหม่ในแชทจัดส่ง",
                        type: "CHAT_MESSAGE",
                        deliveryStaffId: deliveryInfo.deliveryStaffId,
                        deliveryId: room.deliveryId,
                    });
                }
            }
        }

        // =====================================================
        // SOCKET
        // =====================================================

        const io = req.app.get("io");

        if (io && room.deliveryId) {
            io.to(`delivery:${room.deliveryId}`).emit(
                "newDeliveryChatMessage",
                newMessage
            );
        }

        return res.status(201).json({
            message: "ส่งข้อความสำเร็จ",
            data: newMessage,
        });
    } catch (error) {
        console.error(
            "sendCustomerDeliveryMessage Error =",
            error
        );

        return res.status(500).json({
            message: "ไม่สามารถส่งข้อความได้",
            error: error.message,
        });
    }
};



// =====================================================
// ส่งข้อความ - ร้าน
// =====================================================

exports.sendStoreDeliveryMessage = async (req, res) => {
    try {
        const storeId = req.store?.id;
        const roomId = Number(req.params.roomId);
        const { message } = req.body;

        if (!storeId) {
            return res.status(401).json({
                message: "ไม่พบข้อมูลร้านค้า",
            });
        }

        if (!roomId || Number.isNaN(roomId)) {
            return res.status(400).json({
                message: "รหัสห้องแชทไม่ถูกต้อง",
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "กรุณาระบุข้อความ",
            });
        }

        const room = await prisma.chatRoom.findFirst({
            where: {
                id: roomId,
                type: "DELIVERY",

                delivery: {
                    storeId: storeId,
                },
            },
        });

        if (!room) {
            return res.status(403).json({
                message: "คุณไม่มีสิทธิ์ส่งข้อความในห้องนี้",
            });
        }

        // =====================================================
        // ตรวจสอบสถานะการจัดส่ง
        // =====================================================

        if (room.deliveryId) {
            const delivery = await prisma.delivery.findUnique({
                where: {
                    id: room.deliveryId,
                },
                select: {
                    status: true,
                },
            });

            if (delivery?.status === "COMPLETED") {
                return res.status(403).json({
                    message:
                        "งานจัดส่งนี้เสร็จสิ้นแล้ว ไม่สามารถส่งข้อความใหม่ได้",
                });
            }
        }

        // =====================================================
        // สร้างข้อความ
        // =====================================================

        const newMessage =
            await prisma.chatMessage.create({
                data: {
                    roomId: roomId,
                    senderType: "STORE",
                    senderId: storeId,
                    message: message.trim(),
                },
            });

        // =====================================================
        // อัปเดตเวลาห้อง
        // =====================================================

        await prisma.chatRoom.update({
            where: {
                id: roomId,
            },
            data: {
                updatedAt: new Date(),
            },
        });

        // =====================================================
        // แจ้งเตือนลูกค้า + พนักงานส่ง
        // =====================================================

        if (room.deliveryId) {
            const deliveryInfo = await prisma.delivery.findUnique({
                where: {
                    id: room.deliveryId,
                },
                select: {
                    storeId: true,
                    deliveryStaffId: true,
                    orders: {
                        select: {
                            customerId: true,
                        },
                    },
                },
            });

            if (deliveryInfo) {

                // แจ้งลูกค้า
                const customerIds = [
                    ...new Set(
                        deliveryInfo.orders.map(
                            (order) => order.customerId
                        )
                    ),
                ];

                for (const customerId of customerIds) {
                    await createNotification({
                        title: "💬 ข้อความใหม่จากร้าน",
                        message: "ร้านส่งข้อความใหม่ในแชทจัดส่ง",
                        type: "CHAT_MESSAGE",
                        customerId: customerId,
                        deliveryId: room.deliveryId,
                    });
                }

                // แจ้งพนักงานส่ง
                if (deliveryInfo.deliveryStaffId) {
                    await createNotification({
                        title: "💬 ข้อความใหม่จากร้าน",
                        message: "ร้านส่งข้อความใหม่ในแชทจัดส่ง",
                        type: "CHAT_MESSAGE",
                        deliveryStaffId: deliveryInfo.deliveryStaffId,
                        deliveryId: room.deliveryId,
                    });
                }
            }
        }

        // =====================================================
        // SOCKET
        // =====================================================

        const io = req.app.get("io");

        if (io && room.deliveryId) {
            io.to(`delivery:${room.deliveryId}`).emit(
                "newDeliveryChatMessage",
                newMessage
            );
        }

        return res.status(201).json({
            message: "ส่งข้อความสำเร็จ",
            data: newMessage,
        });
    } catch (error) {
        console.error(
            "sendStoreDeliveryMessage Error =",
            error
        );

        return res.status(500).json({
            message: "ไม่สามารถส่งข้อความได้",
            error: error.message,
        });
    }
};



// =====================================================
// ส่งข้อความ - พนักงานส่ง
// =====================================================

exports.sendStaffDeliveryMessage = async (req, res) => {
    try {
        const staffId = req.deliveryStaff?.id;
        const roomId = Number(req.params.roomId);
        const { message } = req.body;

        console.log(
            "========== STAFF SEND DELIVERY CHAT =========="
        );
        console.log("staffId =", staffId);
        console.log("roomId =", roomId);
        console.log("message =", message);

        if (!staffId) {
            return res.status(401).json({
                message: "ไม่พบข้อมูลพนักงานส่งอาหาร",
            });
        }

        if (!roomId || Number.isNaN(roomId)) {
            return res.status(400).json({
                message: "รหัสห้องแชทไม่ถูกต้อง",
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "กรุณาระบุข้อความ",
            });
        }

        // =====================================================
        // ตรวจสอบสิทธิ์ห้อง
        // =====================================================

        const room = await prisma.chatRoom.findFirst({
            where: {
                id: roomId,
                type: "DELIVERY",

                delivery: {
                    deliveryStaffId: staffId,
                },
            },
        });

        console.log("room =", room);

        if (!room) {
            return res.status(403).json({
                message: "คุณไม่มีสิทธิ์ส่งข้อความในห้องนี้",
            });
        }

        // =====================================================
        // ตรวจสอบสถานะการจัดส่ง
        // =====================================================

        if (room.deliveryId) {
            const delivery = await prisma.delivery.findUnique({
                where: {
                    id: room.deliveryId,
                },
                select: {
                    status: true,
                },
            });

            if (delivery?.status === "COMPLETED") {
                return res.status(403).json({
                    message:
                        "งานจัดส่งนี้เสร็จสิ้นแล้ว ไม่สามารถส่งข้อความใหม่ได้",
                });
            }
        }

        // =====================================================
        // สร้างข้อความ
        // =====================================================

        const newMessage =
            await prisma.chatMessage.create({
                data: {
                    roomId: roomId,
                    senderType: "DELIVERY",
                    senderId: staffId,
                    message: message.trim(),
                },
            });

        console.log(
            "newMessage =",
            newMessage
        );

        // =====================================================
        // อัปเดตเวลาห้อง
        // =====================================================

        await prisma.chatRoom.update({
            where: {
                id: roomId,
            },
            data: {
                updatedAt: new Date(),
            },
        });

        // =====================================================
        // แจ้งเตือนลูกค้า + ร้าน
        // =====================================================

        if (room.deliveryId) {
            const deliveryInfo = await prisma.delivery.findUnique({
                where: {
                    id: room.deliveryId,
                },
                select: {
                    storeId: true,
                    deliveryStaffId: true,
                    orders: {
                        select: {
                            customerId: true,
                        },
                    },
                },
            });

            if (deliveryInfo) {

                // แจ้งลูกค้า
                const customerIds = [
                    ...new Set(
                        deliveryInfo.orders.map(
                            (order) => order.customerId
                        )
                    ),
                ];

                for (const customerId of customerIds) {
                    await createNotification({
                        title: "ข้อความใหม่จากพนักงานส่งอาหาร",
                        message: "พนักงานส่งอาหารส่งข้อความใหม่ในแชทจัดส่ง",
                        type: "CHAT_MESSAGE",
                        customerId: customerId,
                        deliveryId: room.deliveryId,
                    });
                }

            
            }
        }

        // =====================================================
        // SOCKET
        // =====================================================

        const io = req.app.get("io");

        if (io && room.deliveryId) {
            io.to(`delivery:${room.deliveryId}`).emit(
                "newDeliveryChatMessage",
                newMessage
            );
        }

        return res.status(201).json({
            message: "ส่งข้อความสำเร็จ",
            data: newMessage,
        });

    } catch (error) {
        console.error(
            "sendStaffDeliveryMessage Error =",
            error
        );

        return res.status(500).json({
            message: "ไม่สามารถส่งข้อความได้",
            error: error.message,
        });
    }
};

