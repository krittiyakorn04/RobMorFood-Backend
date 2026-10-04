const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { token } = require("morgan");


exports.register = async (req, res) => {
  try {
    const { email, password, username, phone } = req.body;

    // เช็คว่ากรอกหรือยัง
    if (!username) {
      return res.status(400).json({ message: "Email is require!!!" });
    }
    if (!password) {
      return res.status(400).json({ message: "password is require!!!" });
    }

    const store = await prisma.store.findFirst({
      where: { 
        OR: [
            { email }, 
            { username }, 
            { phone }
        ] 
    },
    });
    if (store) {
      return res.status(400).json({ message: "This store already exits!!" });
    }

    // เช็คใน DB ว่ามีมั้ย ซ้ำหรือเปล่า (เดี๋ยวเพิ่ม error เช็คซ้ำ)
    const user = await prisma.customer.findFirst({
      where: { 
        OR: [
            { email }, 
            { username }, 
            { phone }]

    },
    });
    if (user) {
      return res.status(400).json({ message: "This user already exits!!" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    //ไม่ซ้ำก็ลงเลย
    const newuser = await prisma.customer.create({
      data: {
        email,
        password: hashPassword,
        username,
        phone,
      },
    });
    //สร้าง Payload
    const payload = {
      id: newuser.id,
      username: newuser.username,
      role: newuser.role,
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
        email: true,
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