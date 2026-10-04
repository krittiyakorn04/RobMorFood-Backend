const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const { readdirSync } = require("fs");
const http = require("http");
const {
  updateOrderRoundStatus,
} = require("./services/orderRoundService");


//middlewere
app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '20mb' }))

const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected =", socket.id);

  socket.on("joinChatRoom", (roomId) => {
    if (!roomId) return;

    socket.join(`chat:${roomId}`);
  });

  socket.on("leaveChatRoom", (roomId) => {
    if (!roomId) return;

    socket.leave(`chat:${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected =", socket.id);
  });

  socket.on("joinDeliveryChat", (deliveryId) => {
    if (!deliveryId) return;

    socket.join(`delivery:${deliveryId}`);
  });

  socket.on("leaveDeliveryChat", (deliveryId) => {
    if (!deliveryId) return;

    socket.leave(`delivery:${deliveryId}`);
  });
});

app.set("io", io);

// @ENDPOINT
readdirSync('./routes')
  .map((item) => app.use('/api', require('./routes/' + item)
  ))

// ตรวจทันทีตอน Server เริ่ม
updateOrderRoundStatus();

// ตรวจทุก 10 วินาที
setInterval(() => {
  updateOrderRoundStatus();
}, 10000);




const PORT = 5000;
server.listen(5000, () => {
  console.log("server is running on port 5000");
});