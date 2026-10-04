const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

exports.authStore = async (req, res, next) => {
  try {

    const headerToken = req.headers.authorization
    if (!headerToken) {
      return res.status(401).json({ message: "No Token" })
    }

    const token = headerToken.split(" ")[1]
    const decode = jwt.verify(token, process.env.SECRET)
    req.store = decode

    const store = await prisma.store.findFirst({
      where: { id: decode.id }
    })

    if (!store) {
      return res.status(404).json({ message: "Store not found" })
    }

    if (store.accountStatus === "SUSPENDED" || store.accountStatus === "BANNED") {
      return res.status(403).json({ message: "This account cannot access" })
    }

    next()

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Token Invalid" })
  }
}

exports.authUser = async (req, res, next) => {
  try {

    const headerToken = req.headers.authorization
    if (!headerToken) {
      return res.status(401).json({ message: "No Token" })
    }

    const token = headerToken.split(" ")[1]
    const decode = jwt.verify(token, process.env.SECRET)
    req.user = decode

    const user = await prisma.customer.findFirst({
      where: { id: decode.id }
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.customerStatus === "BANNED") {
      return res.status(403).json({ message: "This account cannot access" })
    }

    next()
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Token Invalid" })
  }
}

exports.storeCheck = async (req, res, next) => {
  try {
    const { username } = req.store;

    const storeUser = await prisma.store.findFirst({
      where: {
        username,
      },
    });
    if (!storeUser || storeUser.role !== "MERCHANT") {
      return res.status(403).json({ message: "Acess Denied : MERCHANT Only" });
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "MERCHANT access denied" });
  }
};

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

exports.authStaff = async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization;

    if (!headerToken) {
      return res.status(401).json({
        message: "No Token",
      });
    }

    const token = headerToken.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No Token",
      });
    }

    const decode = jwt.verify(
      token,
      process.env.SECRET
    );

    if (decode.role !== "DELIVERY") {

      return res.status(403).json({
        message: "ไม่มีสิทธิ์เข้าใช้งาน",
        role: decode.role,
      });
    }

    const staff = await prisma.storeStaff.findUnique({
      where: {
        id: decode.id,
      },
    });



    if (!staff) {
      return res.status(404).json({
        message: "ไม่พบบัญชีคนส่ง",
      });
    }

    if (!staff.isActive) {
      console.log("❌ STAFF ถูกปิดใช้งาน");

      return res.status(403).json({
        message: "บัญชีคนส่งถูกปิดใช้งาน",
      });
    }

    req.deliveryStaff = staff;


    next();

  } catch (error) {
    console.error("authStaff Error =", error);

    return res.status(401).json({
      message: "Token Invalid",
    });
  }
};

exports.authAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "กรุณาเข้าสู่ระบบ Admin",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.SECRET
    );

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({
        message: "ไม่มีสิทธิ์เข้าถึง",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    console.log("Auth Admin Error =", error);

    return res.status(401).json({
      message: "Token ไม่ถูกต้องหรือหมดอายุ",
    });
  }
};

exports.authPush = async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization;

    if (!headerToken || !headerToken.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No Token",
      });
    }

    const token = headerToken.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No Token",
      });
    }

    const decode = jwt.verify(
      token,
      process.env.SECRET
    );

    // =====================================================
    // CUSTOMER
    // =====================================================

    if (decode.role === "CUSTOMER") {
      const user = await prisma.customer.findUnique({
        where: {
          id: decode.id,
        },
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (user.status === "BANNED") {
        return res.status(403).json({
          message: "This account cannot access",
        });
      }

      req.user = decode;

      return next();
    }

    // =====================================================
    // STORE
    // =====================================================

    if (decode.role === "MERCHANT") {
      const store = await prisma.store.findUnique({
        where: {
          id: decode.id,
        },
      });

      if (!store) {
        return res.status(404).json({
          message: "Store not found",
        });
      }

      if (
        store.accountStatus === "SUSPENDED" ||
        store.accountStatus === "BANNED"
      ) {
        return res.status(403).json({
          message: "This account cannot access",
        });
      }

      req.store = decode;

      return next();
    }

    // =====================================================
    // DELIVERY STAFF
    // =====================================================

    if (decode.role === "DELIVERY") {
      const staff = await prisma.storeStaff.findUnique({
        where: {
          id: decode.id,
        },
      });

      if (!staff) {
        return res.status(404).json({
          message: "ไม่พบบัญชีคนส่ง",
        });
      }

      if (!staff.isActive) {
        return res.status(403).json({
          message: "บัญชีคนส่งถูกปิดใช้งาน",
        });
      }

      req.deliveryStaff = staff;

      return next();
    }

    return res.status(403).json({
      message: "ไม่มีสิทธิ์ใช้งาน Push Notification",
    });
  } catch (error) {
    console.error("authPush Error =", error);

    return res.status(401).json({
      message: "Token Invalid",
    });
  }
};