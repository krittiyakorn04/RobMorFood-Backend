import { io } from "socket.io-client";

const socket = io("https://robmorfood-backend-new.onrender.com", {
    autoConnect: false,
    transports: ["websocket"],
});

export default socket;
