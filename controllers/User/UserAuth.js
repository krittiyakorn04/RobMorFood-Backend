const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


exports.register = async (req, res) => {
  try {
    const { password, username, phone, email } = req.body;

    // =========================
    // ตรวจข้อมูลพื้นฐาน
    // =========================

    const cleanUsername =
      typeof username === "string" ? username.trim() : "";

    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanUsername) {
      return res.status(400).json({
        message: "กรุณากรอกชื่อผู้ใช้",
      });
    }

    if (typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "กรุณากรอกรหัสผ่าน",
      });
    }

    // =========================
    // ตรวจรหัสผ่าน
    // =========================

    if (password.length < 8 || password.length > 64) {
      return res.status(400).json({
        message: "รหัสผ่านต้องมีความยาว 8-64 ตัวอักษร",
      });
    }

    if (/\s/.test(password)) {
      return res.status(400).json({
        message: "รหัสผ่านต้องไม่มีช่องว่าง",
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        message:
          "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษตัวพิมพ์เล็กอย่างน้อย 1 ตัว",
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        message:
          "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว",
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        message: "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว",
      });
    }

    if (!/[^A-Za-z0-9\s]/.test(password)) {
      return res.status(400).json({
        message:
          "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว เช่น @ หรือ !",
      });
    }

    // =========================
    // ตรวจเบอร์โทรศัพท์
    // =========================

    if (typeof phone !== "string" || !/^0\d{9}$/.test(phone)) {
      return res.status(400).json({
        message:
          "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก และต้องขึ้นต้นด้วย 0",
      });
    }

    // =========================
    // ตรวจสอบอีเมล
    // =========================

    if (
      !cleanEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "กรุณากรอกอีเมลให้ถูกต้อง",
      });
    }

    // =========================
    // ตรวจสอบข้อมูลซ้ำในร้านค้า
    // =========================

    const store = await prisma.store.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { phone },
          { email: cleanEmail },
        ],
      },
    });

    if (store) {
      return res.status(400).json({
        message:
          "ชื่อผู้ใช้ เบอร์โทรศัพท์ หรืออีเมลนี้ถูกใช้งานแล้ว",
      });
    }

    // =========================
    // ตรวจสอบข้อมูลซ้ำในลูกค้า
    // =========================

    const user = await prisma.customer.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { phone },
          { email: cleanEmail },
        ],
      },
    });

    if (user) {
      return res.status(400).json({
        message:
          "ชื่อผู้ใช้ เบอร์โทรศัพท์ หรืออีเมลนี้ถูกใช้งานแล้ว",
      });
    }

    // =========================
    // Hash Password
    // =========================

    const hashPassword = await bcrypt.hash(password, 10);

    // =========================
    // สร้าง Customer
    // =========================

    const newuser = await prisma.customer.create({
      data: {
        username: cleanUsername,
        password: hashPassword,
        phone,
        email: cleanEmail,
      },
    });

    // =========================
    // JWT Payload
    // =========================

    const payload = {
      id: newuser.id,
      username: newuser.username,
      role: newuser.role,
    };

    // =========================
    // Generate Token
    // =========================

    jwt.sign(
      payload,
      process.env.SECRET,
      {
        expiresIn: "1d",
      },
      (err, token) => {
        if (err) {
          return res.status(500).json({
            message: "เกิดข้อผิดพลาดในการสร้าง Token",
          });
        }

        return res.status(201).json({
          payload,
          token,
        });
      }
    );
  } catch (error) {
    console.error("REGISTER CUSTOMER ERROR =================");
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    //เช็คว่ามีมั้ย
    const user = await prisma.customer.findFirst({
      where: {
        username,
      },
    });
    if (!user) {
      return res.status(400).json({ message: "User NOT found or NOT Enabled" });
    }
    if (user.status === "BANNED") {
      return res.status(400).json({ message: "Account not approved yet" });
    }

    //เช็คว่าตรงมั้ย
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(500).json({ message: "Password Invalid!!!" });
    }

    //สร้าง Payload
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    //generate token
    jwt.sign(
      payload,
      process.env.SECRET,
      {
        expiresIn: "1d",
      },
      (err, token) => {
        if (err) {
          return res.status(500).json({ message: "Server Error" });
        }
        res.json({ payload, token });
      },
    );

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.currentUser = async (req, res) => {
  try {
    const currentUser = await prisma.customer.findFirst({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        role: true,
        status: true
      }
    })
    res.json({ currentUser })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error" })
  }
}

exports.userCheck = async (req, res, next) => {
  try {
    const { username } = req.user;

    const User = await prisma.customer.findFirst({
      where: {
        username,
      },
    });
    if (!User || User.role !== "CUSTOMER") {
      res.status(403).json({ message: "Acess Denied : CUSTOMER Only" });
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "CUSTOMER access denied" });
  }
};