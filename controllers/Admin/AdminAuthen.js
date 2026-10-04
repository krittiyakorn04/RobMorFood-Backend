const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/prisma");


const createAdmin = async () => {
    try {
        const email = "admin@robmorfood.com";
        const password = "admin123";
        const name = "Administrator";

        const existingAdmin = await prisma.admin.findUnique({
            where: {
                email,
            },
        });

        if (existingAdmin) {
            // console.log("มี Admin นี้อยู่แล้ว");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: "ADMIN",
            },
        });

        console.log("================================");
        console.log("สร้าง Admin สำเร็จ");
        console.log("Email:", admin.email);
        console.log("Password:", password);
        console.log("================================");
    } catch (error) {
        console.log("Create Admin Error =", error);
    } finally {
        await prisma.$disconnect();
    }
};

createAdmin();

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "กรุณากรอกอีเมลและรหัสผ่าน",
            });
        }

        const admin = await prisma.admin.findUnique({
            where: {
                email,
            },
        });

        if (!admin) {
            return res.status(401).json({
                message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            admin.password,
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
            });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
            process.env.SECRET,
            {
                expiresIn: "1d",
            },
        );

        return res.status(200).json({
            message: "เข้าสู่ระบบ Admin สำเร็จ",
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
        });


    } catch (error) {
        console.log("Admin Login Error =", error);


        return res.status(500).json({
            message: "Server Error",
        });


    }
};


exports.currentAdmin = (req, res) => {
    try {
        res.send('Hello current Admin')
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server Error" })
    }
}