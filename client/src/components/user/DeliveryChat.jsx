import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

import usefoodDelivery from "../../globalState/fooddeliveryStore";
import socket from "../../socket";

import {
  getCustomerDeliveryChat,
  getCustomerDeliveryMessages,
  sendCustomerDeliveryMessage,
} from "../../api/DeliveryChat";

const DeliveryChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { deliveryId } = useParams();

  const token = usefoodDelivery((state) => state.token);

  const user = usefoodDelivery((state) => state.user);

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // ==========================================
  // READ ONLY
  // ==========================================

  const readOnly = location.state?.readOnly === true;

  // ==========================================
  // โหลดห้องแชท
  // ==========================================

  const loadChat = async () => {
    if (!token || !deliveryId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await getCustomerDeliveryChat(token, deliveryId);

      const chatRoom = res.data?.room;

      setRoom(chatRoom || null);

      if (chatRoom?.id) {
        const messageRes = await getCustomerDeliveryMessages(
          token,
          chatRoom.id,
        );

        setMessages(
          Array.isArray(messageRes.data?.messages)
            ? messageRes.data.messages
            : [],
        );
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("loadCustomerDeliveryChat Error =", error);

      setRoom(null);
      setMessages([]);

      Swal.fire({
        icon: "error",
        title: "ไม่สามารถเปิดแชทได้",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
  }, [token, deliveryId]);

  // ==========================================
  // Socket.IO
  // ==========================================

  useEffect(() => {
    if (!room?.id || !deliveryId) {
      return;
    }

    const currentRoomId = Number(room.id);
    const currentDeliveryId = Number(deliveryId);

    const handleNewMessage = (newMessage) => {

      if (Number(newMessage?.roomId) !== currentRoomId) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some(
          (item) => Number(item.id) === Number(newMessage.id),
        );

        if (exists) {
          return prev;
        }

        return [...prev, newMessage];
      });
    };

    socket.connect();

    socket.on("newDeliveryChatMessage", handleNewMessage);

    socket.emit("joinDeliveryChat", currentDeliveryId);

    return () => {
      socket.emit("leaveDeliveryChat", currentDeliveryId);

      socket.off("newDeliveryChatMessage", handleNewMessage);

      socket.disconnect();
    };
  }, [room?.id, deliveryId]);

  // ==========================================
  // เลื่อนไปล่างสุด
  // ==========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================
  // ส่งข้อความ
  // ==========================================

  const handleSend = async () => {
    // ถ้าเป็นโหมดดูประวัติ ห้ามส่ง
    if (readOnly) {
      return;
    }

    const text = message.trim();

    if (!text || !room?.id || sending) {
      return;
    }

    try {
      setSending(true);

      const res = await sendCustomerDeliveryMessage(token, room.id, text);


      const newMessage = res.data?.data;

      if (newMessage?.id) {
        setMessages((prev) => {
          const exists = prev.some(
            (item) => Number(item.id) === Number(newMessage.id),
          );

          if (exists) {
            return prev;
          }

          return [...prev, newMessage];
        });
      }

      setMessage("");
    } catch (error) {
      console.error("sendCustomerDeliveryMessage Error =", error);

      Swal.fire({
        icon: "error",
        title: "ส่งข้อความไม่สำเร็จ",
        text: error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // Enter ส่งข้อความ
  // ==========================================

  const handleKeyDown = (e) => {
    if (readOnly) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ==========================================
  // Loading
  // ==========================================



  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
      {/* ==========================================
      HEADER
      ========================================== */}

      <div className="sticky top-0 z-20 bg-white border-b border-orange-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              w-10
              h-10
              rounded-full
              flex
              items-center
              justify-center
              hover:bg-orange-50
              transition
            "
          >
            <ArrowLeft size={22} />
          </button>

          <div
            className={`
              w-11
              h-11
              rounded-full
              flex
              items-center
              justify-center
              ${
                readOnly
                  ? "bg-gray-100 text-gray-500"
                  : "bg-orange-100 text-[#E8491D]"
              }
            `}
          >
            {readOnly ? <LockKeyhole size={22} /> : <MessageCircle size={23} />}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-800">
              {readOnly ? "ประวัติการแชท" : "แชทการจัดส่ง"}
            </h1>

            <p className="text-xs text-gray-500 truncate">
              งานส่ง #ORD
              {String(deliveryId).padStart(4, "0")}
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================
      READ ONLY NOTICE
      ========================================== */}

      {readOnly && (
        <div
          className="
            max-w-4xl
            w-full
            mx-auto
            px-4
            pt-4
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-gray-200
              bg-gray-50
              px-4
              py-3
            "
          >
            <LockKeyhole size={19} className="text-gray-500 mt-0.5 shrink-0" />

            <div>
              <p className="text-sm font-semibold text-gray-600">
                งานจัดส่งนี้สิ้นสุดแล้ว
              </p>

              <p className="text-xs text-gray-400 mt-1 leading-5">
                สามารถดูประวัติการสนทนาได้ แต่ไม่สามารถส่งข้อความใหม่ได้
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
      MESSAGES
      ========================================== */}

      <div
        className={`
          flex-1
          max-w-4xl
          w-full
          mx-auto
          px-4
          py-5
          ${readOnly ? "pb-8" : "pb-24"}
        `}
      >
        {messages.length === 0 ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={48} />

            <p className="mt-3">ยังไม่มีข้อความ</p>

            <p className="text-sm">สามารถสอบถามร้านหรือพนักงานส่งอาหารได้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((item) => {
              const isMine =
                item.senderType === "CUSTOMER" &&
                Number(item.senderId) === Number(user?.id);

              return (
                <div
                  key={item.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[80%]">
                    {!isMine && (
                      <p className="text-xs text-gray-500 mb-1 ml-1">
                        {item.senderType === "STORE"
                          ? "ร้านค้า"
                          : item.senderType === "DELIVERY"
                            ? "พนักงานส่งอาหาร"
                            : "ผู้ใช้"}
                      </p>
                    )}

                    <div
                      className={`
                        px-4
                        py-3
                        rounded-2xl
                        ${
                          isMine
                            ? "bg-[#FF6B35] text-white rounded-br-md"
                            : "bg-white text-gray-800 border border-orange-100 rounded-bl-md"
                        }
                      `}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {item.message}
                      </p>
                    </div>

                    <p
                      className={`
                        text-[10px]
                        text-gray-400
                        mt-1
                        ${isMine ? "text-right" : "text-left"}
                      `}
                    >
                      {new Date(item.createdAt).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ==========================================
      INPUT / READ ONLY
      ========================================== */}

      {readOnly ? (
        <div
          className="
            fixed
            bottom-0
            left-0
            right-0
            z-20
            bg-white
            border-t
            border-gray-200
          "
        >
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div
              className="
                flex
                items-center
                justify-center
                gap-2
                text-sm
                text-gray-400
              "
            >
              <LockKeyhole size={17} />

              <span>ไม่สามารถส่งข้อความใหม่ได้</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="
  fixed
  bottom-16
  left-0
  right-0
  z-20
  bg-white
  border-t
  border-orange-100
"
        >
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="พิมพ์ข้อความ..."
                disabled={sending}
                className="
                  flex-1
                  resize-none
                  rounded-2xl
                  border
                  border-gray-200
                  px-4
                  py-3
                  outline-none
                  focus:border-[#FF6B35]
                  focus:ring-2
                  focus:ring-orange-100
                  disabled:bg-gray-100
                "
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="
                  w-12
                  h-12
                  shrink-0
                  rounded-full
                  bg-[#FF6B35]
                  text-white
                  flex
                  items-center
                  justify-center
                  hover:bg-[#E8491D]
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {sending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 mt-1 ml-2">
              กด Enter เพื่อส่งข้อความ
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryChat;
