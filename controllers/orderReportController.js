const prisma = require("../config/prisma");
const { createNotification } = require("./notificationController");

// ลูกค้าส่งเรื่องร้องเรียน
const createOrderReport = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { orderId, type, detail } = req.body;

        if (!orderId || !type) {
            return res.status(400).json({
                message: "กรุณาระบุออเดอร์และประเภทปัญหา",
            });
        }

        const order = await prisma.order.findUnique({
            where: {
                id: Number(orderId),
            },
        });

        if (!order) {
            return res.status(404).json({
                message: "ไม่พบออเดอร์",
            });
        }

        if (order.customerId !== customerId) {
            return res.status(403).json({
                message: "คุณไม่มีสิทธิ์แจ้งปัญหาออเดอร์นี้",
            });
        }

        const allowedTypes = [
            "ORDER_NOT_DELIVERED",
            "WRONG_ORDER",
            "MISSING_ITEM",
            "OTHER",
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                message: "ประเภทปัญหาไม่ถูกต้อง",
            });
        }

        const existingReport = await prisma.orderReport.findFirst({
            where: {
                orderId: Number(orderId),
                customerId,
                status: {
                    in: ["PENDING", "REVIEWING"],
                },
            },
        });

        if (existingReport) {
            return res.status(400).json({
                message: "ออเดอร์นี้มีเรื่องร้องเรียนที่กำลังตรวจสอบอยู่แล้ว",
            });
        }

        const report = await prisma.orderReport.create({
            data: {
                orderId: Number(orderId),
                customerId,
                storeId: order.storeId,
                type,
                detail: detail?.trim() || null,
            },
            include: {
                order: true,
                store: {
                    select: {
                        id: true,
                        storeName: true,
                    },
                },
            },
        });

        console.log("ORDER REPORT NOTIFICATION =", {
            orderId: order.id,
            orderStoreId: order.storeId,
        });

        await createNotification({
            title: "มีการแจ้งปัญหาออเดอร์",
            message: `ลูกค้าแจ้งปัญหาเกี่ยวกับออเดอร์ #ORD${String(order.id).padStart(4, "0")}`,
            type: "ORDER_REPORT",
            storeId: order.storeId,
            orderId: order.id,
        });

        return res.status(201).json({
            message: "ส่งเรื่องร้องเรียนเรียบร้อยแล้ว",
            report,
        });
    } catch (error) {
        console.error("CREATE ORDER REPORT ERROR =", error);

        return res.status(500).json({
            message: "ไม่สามารถส่งเรื่องร้องเรียนได้",
        });
    }
};

// ลูกค้าดูเรื่องร้องเรียนของตัวเอง
const getMyOrderReports = async (req, res) => {
    try {
        const customerId = req.user.id;

        const reports = await prisma.orderReport.findMany({
            where: {
                customerId,
            },
            include: {
                order: {
                    select: {
                        id: true,
                        status: true,
                        totalPrice: true,
                        createdAt: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        storeName: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            reports,
        });
    } catch (error) {
        console.error("GET MY ORDER REPORTS ERROR =", error);

        return res.status(500).json({
            message: "ไม่สามารถโหลดเรื่องร้องเรียนได้",
        });
    }
};

// Admin ดูเรื่องร้องเรียนทั้งหมด
const getAllOrderReports = async (req, res) => {
    try {
        const reports = await prisma.orderReport.findMany({
            include: {
                order: {
                    include: {
                        menu: {
                            include: {
                                menu: {
                                    select: {
                                        id: true,
                                        menuItem: true,
                                        price: true,

                                        options: {
                                            include: {
                                                choices: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                        extraPrice: true,
                                                    },
                                                },
                                            },
                                        },

                                        menuOptionFormats: {
                                            include: {
                                                format: {
                                                    include: {
                                                        choices: {
                                                            select: {
                                                                id: true,
                                                                name: true,
                                                                extraPrice: true,
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },

                        payment: {
                            select: {
                                id: true,
                                status: true,
                                amount: true,
                                confirmedAt: true,
                            },
                        },
                    },
                },

                customer: {
                    select: {
                        id: true,
                        username: true,
                        phone: true,
                    },
                },

                store: {
                    select: {
                        id: true,
                        storeName: true,
                        phone: true,
                        accountStatus: true,
                    },
                },
            },

            orderBy: {
                createdAt: "desc",
            },
        });

        // แปลง options จาก JSON ID ให้เป็นชื่อที่อ่านง่าย
        const formattedReports = reports.map((report) => {
            const formattedMenu = report.order?.menu?.map((item) => {
                let parsedOptions = [];

                try {
                    if (item.options) {
                        parsedOptions =
                            typeof item.options === "string"
                                ? JSON.parse(item.options)
                                : item.options;
                    }
                } catch (error) {
                    console.error(
                        "PARSE MENU OPTIONS ERROR =",
                        error,
                    );

                    parsedOptions = [];
                }

                const optionDetails = parsedOptions.map((selected) => {
                    // =========================
                    // ระบบ MenuOption เดิม
                    // =========================
                    if (selected.optionId && selected.choiceId) {
                        const option = item.menu?.options?.find(
                            (option) =>
                                option.id === Number(selected.optionId),
                        );

                        const choice = option?.choices?.find(
                            (choice) =>
                                choice.id === Number(selected.choiceId),
                        );

                        if (option && choice) {
                            return {
                                label: option.label,
                                name: choice.name,
                                extraPrice: choice.extraPrice || 0,
                            };
                        }

                        // =========================
                        // ระบบ OptionFormat ใหม่
                        // =========================
                        const format = item.menu?.menuOptionFormats?.find(
                            (itemFormat) =>
                                itemFormat.format?.id ===
                                Number(selected.optionId),
                        )?.format;

                        const formatChoice = format?.choices?.find(
                            (choice) =>
                                choice.id === Number(selected.choiceId),
                        );

                        if (format && formatChoice) {
                            return {
                                label: format.name,
                                name: formatChoice.name,
                                extraPrice: formatChoice.extraPrice || 0,
                            };
                        }
                    }

                    // รองรับข้อมูลแบบ formatId
                    if (selected.formatId && selected.choiceId) {
                        const format = item.menu?.menuOptionFormats?.find(
                            (itemFormat) =>
                                itemFormat.format?.id ===
                                Number(selected.formatId),
                        )?.format;

                        const choice = format?.choices?.find(
                            (choice) =>
                                choice.id === Number(selected.choiceId),
                        );

                        if (format && choice) {
                            return {
                                label: format.name,
                                name: choice.name,
                                extraPrice: choice.extraPrice || 0,
                            };
                        }
                    }

                    return null;
                }).filter(Boolean);

                return {
                    ...item,
                    optionDetails,
                };
            });

            return {
                ...report,
                order: report.order
                    ? {
                        ...report.order,
                        menu: formattedMenu,
                    }
                    : report.order,
            };
        });

        return res.status(200).json({
            reports: formattedReports,
        });
    } catch (error) {
        console.error("GET ALL ORDER REPORTS ERROR =", error);

        return res.status(500).json({
            message: "ไม่สามารถโหลดเรื่องร้องเรียนได้",
        });
    }
};

const updateOrderReport = async (req, res) => {
    try {
        const reportId = Number(req.params.id);
        const storeId = req.store.id;

        const { status } = req.body;

        const allowedStatus = [
            "PENDING",
            "REVIEWING",
            "RESOLVED",
            "REJECTED",
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "สถานะไม่ถูกต้อง",
            });
        }

        // =====================================================
        // ร้านดูได้เฉพาะเรื่องร้องเรียนของร้านตัวเอง
        // =====================================================

        const report = await prisma.orderReport.findFirst({
            where: {
                id: reportId,
                storeId,
            },
        });

        if (!report) {
            return res.status(404).json({
                message: "ไม่พบเรื่องร้องเรียนของร้านนี้",
            });
        }

        const oldStatus = report.status;

        // =====================================================
        // ร้านอัปเดตสถานะ
        // =====================================================

        const updatedReport = await prisma.orderReport.update({
            where: {
                id: reportId,
            },

            data: {
                status,
            },

            include: {
                order: true,

                customer: {
                    select: {
                        id: true,
                        username: true,
                    },
                },

                store: {
                    select: {
                        id: true,
                        storeName: true,
                        accountStatus: true,
                    },
                },
            },
        });

        // =====================================================
        // แจ้งเตือนลูกค้าเมื่อสถานะเปลี่ยน
        // =====================================================

        if (oldStatus !== status) {
            let title = "";
            let message = "";

            if (status === "REVIEWING") {
                title = "ร้านกำลังตรวจสอบปัญหา";

                message = `ร้านกำลังตรวจสอบปัญหาออเดอร์ #ORD${String(
                    report.orderId,
                ).padStart(4, "0")}`;
            }

            if (status === "RESOLVED") {
                title = "ร้านดำเนินการแก้ไขปัญหาแล้ว";

                message = `ร้านได้ดำเนินการแก้ไขปัญหาออเดอร์ #ORD${String(
                    report.orderId,
                ).padStart(4, "0")} แล้ว`;
            }

            if (status === "REJECTED") {
                title = "ร้านไม่รับเรื่องแจ้งปัญหา";

                message = `ร้านไม่รับเรื่องแจ้งปัญหาออเดอร์ #ORD${String(
                    report.orderId,
                ).padStart(4, "0")}`;
            }

            if (status === "PENDING") {
                title = "เรื่องแจ้งปัญหาถูกส่งกลับมารอตรวจสอบ";

                message = `เรื่องแจ้งปัญหาออเดอร์ #ORD${String(
                    report.orderId,
                ).padStart(4, "0")} อยู่ในสถานะรอตรวจสอบ`;
            }

            if (title && message) {
                await createNotification({
                    title,
                    message,
                    type: "ORDER_REPORT",
                    customerId: report.customerId,
                    orderId: report.orderId,
                });
            }
        }

        return res.status(200).json({
            message: "อัปเดตเรื่องร้องเรียนเรียบร้อยแล้ว",
            report: updatedReport,
        });
    } catch (error) {
        console.error("UPDATE ORDER REPORT ERROR =", error);

        return res.status(500).json({
            message: "ไม่สามารถอัปเดตเรื่องร้องเรียนได้",
        });
    }
};
// ร้านค้าดูเรื่องร้องเรียนของร้านตัวเอง
const getStoreOrderReports = async (req, res) => {
    try {
        const storeId = req.store.id;

        const reports = await prisma.orderReport.findMany({
            where: {
                storeId,
            },

            include: {
                order: {
                    include: {
                        menu: {
                            include: {
                                menu: {
                                    select: {
                                        id: true,
                                        menuItem: true,
                                        price: true,

                                        options: {
                                            include: {
                                                choices: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                        extraPrice: true,
                                                    },
                                                },
                                            },
                                        },

                                        menuOptionFormats: {
                                            include: {
                                                format: {
                                                    include: {
                                                        choices: {
                                                            select: {
                                                                id: true,
                                                                name: true,
                                                                extraPrice: true,
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },

                        payment: {
                            select: {
                                id: true,
                                status: true,
                                amount: true,
                                confirmedAt: true,
                            },
                        },
                    },
                },

                customer: {
                    select: {
                        id: true,
                        username: true,
                        phone: true,
                    },
                },

                store: {
                    select: {
                        id: true,
                        storeName: true,
                        phone: true,
                        accountStatus: true,
                    },
                },
            },

            orderBy: {
                createdAt: "desc",
            },
        });

        // แปลง options ให้เป็นข้อมูลที่อ่านง่าย
        const formattedReports = reports.map((report) => {
            const formattedMenu = report.order?.menu?.map((item) => {
                let parsedOptions = [];

                try {
                    if (item.options) {
                        parsedOptions =
                            typeof item.options === "string"
                                ? JSON.parse(item.options)
                                : item.options;
                    }
                } catch (error) {
                    console.error(
                        "PARSE STORE REPORT MENU OPTIONS ERROR =",
                        error,
                    );

                    parsedOptions = [];
                }

                const optionDetails = parsedOptions
                    .map((selected) => {
                        // =========================
                        // MenuOption เดิม
                        // =========================
                        if (
                            selected.optionId &&
                            selected.choiceId
                        ) {
                            const option =
                                item.menu?.options?.find(
                                    (option) =>
                                        option.id ===
                                        Number(selected.optionId),
                                );

                            const choice =
                                option?.choices?.find(
                                    (choice) =>
                                        choice.id ===
                                        Number(selected.choiceId),
                                );

                            if (option && choice) {
                                return {
                                    label: option.label,
                                    name: choice.name,
                                    extraPrice:
                                        choice.extraPrice || 0,
                                };
                            }

                            // =========================
                            // OptionFormat ใหม่
                            // =========================
                            const format =
                                item.menu?.menuOptionFormats?.find(
                                    (itemFormat) =>
                                        itemFormat.format?.id ===
                                        Number(selected.optionId),
                                )?.format;

                            const formatChoice =
                                format?.choices?.find(
                                    (choice) =>
                                        choice.id ===
                                        Number(selected.choiceId),
                                );

                            if (format && formatChoice) {
                                return {
                                    label: format.name,
                                    name: formatChoice.name,
                                    extraPrice:
                                        formatChoice.extraPrice || 0,
                                };
                            }
                        }

                        // =========================
                        // formatId
                        // =========================
                        if (
                            selected.formatId &&
                            selected.choiceId
                        ) {
                            const format =
                                item.menu?.menuOptionFormats?.find(
                                    (itemFormat) =>
                                        itemFormat.format?.id ===
                                        Number(selected.formatId),
                                )?.format;

                            const choice =
                                format?.choices?.find(
                                    (choice) =>
                                        choice.id ===
                                        Number(selected.choiceId),
                                );

                            if (format && choice) {
                                return {
                                    label: format.name,
                                    name: choice.name,
                                    extraPrice:
                                        choice.extraPrice || 0,
                                };
                            }
                        }

                        return null;
                    })
                    .filter(Boolean);

                return {
                    ...item,
                    optionDetails,
                };
            });

            return {
                ...report,

                order: report.order
                    ? {
                        ...report.order,
                        menu: formattedMenu,
                    }
                    : report.order,
            };
        });

        return res.status(200).json({
            reports: formattedReports,
        });
    } catch (error) {
        console.error(
            "GET STORE ORDER REPORTS ERROR =",
            error,
        );

        return res.status(500).json({
            message: "ไม่สามารถโหลดเรื่องร้องเรียนของร้านได้",
        });
    }
};


module.exports = {
    createOrderReport,
    getMyOrderReports,
    getStoreOrderReports,
    getAllOrderReports,
    updateOrderReport,
};