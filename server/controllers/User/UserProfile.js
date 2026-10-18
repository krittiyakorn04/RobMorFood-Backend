const prisma = require("../../config/prisma");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.profileUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.customer.findFirst({
      where: {
        id: userId,
      },
      include: {
        addresses: true,
      },
    });
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.updateProfileUser = async (req, res) => {
  try {
    const { username, email, phone } = req.body;
    const userId = req.user.id;

    // ตรวจสอบและจัดรูปแบบข้อมูล
    const newUsername =
      typeof username === "string" ? username.trim() : "";

    const newEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    const newPhone =
      typeof phone === "string" ? phone.trim() : "";

    if (!newUsername) {
      return res.status(400).json({
        message: "กรุณากรอก Username",
      });
    }

    if (!/^0\d{9}$/.test(newPhone)) {
      return res.status(400).json({
        message: "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก และขึ้นต้นด้วย 0",
      });
    }

    // ตรวจสอบรูปแบบ Email เฉพาะเมื่อกรอกมา
    if (
      newEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)
    ) {
      return res.status(400).json({
        message: "รูปแบบ Email ไม่ถูกต้อง",
        field: "email",
      });
    }

    // ตรวจสอบผู้ใช้ปัจจุบัน
    const currentUser = await prisma.customer.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลผู้ใช้งาน",
      });
    }

    // ตรวจสอบ Username ซ้ำ
    if (newUsername !== currentUser.username) {
      const checkUsername = await prisma.customer.findFirst({
        where: {
          username: newUsername,
          NOT: { id: userId },
        },
      });

      if (checkUsername) {
        return res.status(400).json({
          message: "Username นี้ถูกใช้งานแล้ว",
        });
      }
    }

    // ==========================================
    // ตรวจสอบ Email ซ้ำทั้ง Customer และ Store
    // ตรวจเฉพาะเมื่อกรอก Email
    // ==========================================

    if (newEmail && newEmail !== currentUser.email) {
      const [checkCustomerEmail, checkStoreEmail] =
        await Promise.all([
          prisma.customer.findFirst({
            where: {
              email: newEmail,
              NOT: {
                id: userId,
              },
            },
            select: { id: true },
          }),

          prisma.store.findFirst({
            where: {
              email: newEmail,
            },
            select: { id: true },
          }),
        ]);

      if (checkCustomerEmail || checkStoreEmail) {
        return res.status(400).json({
          message: "Email นี้ถูกใช้งานแล้ว",
          field: "email",
        });
      }
    }

    // อัปเดตข้อมูล
    const user = await prisma.customer.update({
      where: { id: userId },
      data: {
        username: newUsername,
        phone: newPhone,
        email: newEmail || null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
      },
    });

    return res.status(200).json({
      message: "แก้ไขข้อมูลสำเร็จ",
      user,
    });
  } catch (error) {
    console.error("updateProfileUser error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.readMenu = async (req, res) => {
  try {
    const menuId = Number(req.params.id);


    if (!menuId || Number.isNaN(menuId)) {
      return res.status(400).json({
        message: "รหัสเมนูไม่ถูกต้อง",
      });
    }

    const menu = await prisma.menu.findUnique({
      where: {
        id: menuId,
      },
      include: {
        images: true,

        options: {
          include: {
            choices: true,
          },
        },

        store: {
          select: {
            id: true,
            storeName: true,
            status: true,
            accountStatus: true,
          },
        },
      },
    });

    if (!menu) {
      return res.status(404).json({
        message: "ไม่พบเมนู",
      });
    }

    res.json(menu);
  } catch (error) {
    console.log("READ USER MENU ERROR =", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.userImages = (req, res) => {
  try {

  } catch (error) {

  }
}

exports.userRemoveImages = (req, res) => {
  try {

  } catch (error) {

  }
}


exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "กรุณากรอกรหัสผ่านให้ครบ",
      });
    }

    // ตรวจสอบกฎรหัสผ่านให้เหมือนตอนสมัครร้านค้า
    if (
      typeof newPassword !== "string" ||
      newPassword.length < 8 ||
      newPassword.length > 64 ||
      /\s/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^A-Za-z0-9\s]/.test(newPassword)
    ) {
      return res.status(400).json({
        message:
          "รหัสผ่านต้องมี 8-64 ตัวอักษร มีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ โดยไม่มีช่องว่าง",
      });
    }

    const user = await prisma.customer.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลผู้ใช้งาน",
      });
    }

    const valid = await bcrypt.compare(
      oldPassword,
      user.password
    );

    if (!valid) {
      return res.status(400).json({
        message: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        message: "รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม",
      });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);

    await prisma.customer.update({
      where: { id: userId },
      data: { password: hashPassword },
    });

    return res.status(200).json({
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (error) {
    console.error("UPDATE USER PASSWORD ERROR =", error);

    return res.status(500).json({
      message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
    });
  }
};