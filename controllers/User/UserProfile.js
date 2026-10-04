const prisma = require("../../config/prisma");

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

    // ==========================================
    // ตรวจสอบข้อมูล
    // ==========================================

    const newUsername = username?.trim();
    const newEmail = email?.trim();
    const newPhone = phone?.trim();

    if (!newUsername) {
      return res.status(400).json({
        message: "กรุณากรอก Username",
      });
    }

    if (!newEmail) {
      return res.status(400).json({
        message: "กรุณากรอก Email",
      });
    }

    if (!newPhone) {
      return res.status(400).json({
        message: "กรุณากรอกเบอร์โทรศัพท์",
      });
    }

    // ==========================================
    // ตรวจสอบ User ปัจจุบัน
    // ==========================================

    const currentUser = await prisma.customer.findUnique({
      where: {
        id: userId,
      },
    });

    if (!currentUser) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลผู้ใช้งาน",
      });
    }

    // ==========================================
    // ตรวจสอบ Username ซ้ำ
    // ==========================================

    if (newUsername !== currentUser.username) {
      const checkUsername = await prisma.customer.findFirst({
        where: {
          username: newUsername,
          NOT: {
            id: userId,
          },
        },
      });

      if (checkUsername) {
        return res.status(400).json({
          message: "Username นี้ถูกใช้งานแล้ว",
        });
      }
    }

    // ==========================================
    // ตรวจสอบ Email ซ้ำ
    // ==========================================

    if (newEmail !== currentUser.email) {
      const checkEmail = await prisma.customer.findFirst({
        where: {
          email: newEmail,
          NOT: {
            id: userId,
          },
        },
      });

      if (checkEmail) {
        return res.status(400).json({
          message: "Email นี้ถูกใช้งานแล้ว",
        });
      }
    }

    // ==========================================
    // อัปเดตข้อมูล
    // ==========================================

    const user = await prisma.customer.update({
      where: {
        id: userId,
      },
      data: {
        username: newUsername,
        email: newEmail,
        phone: newPhone,
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
    console.log("updateProfileUser error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.readMenu = async (req, res) => {
  try {
    const menuId = Number(req.params.id);

    console.log("USER MENU ID =", menuId);

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
