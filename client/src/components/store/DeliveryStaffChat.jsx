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
  getStaffDeliveryChat,
  sendStaffDeliveryMessage,
} from "../../api/DeliveryChat";

const DeliveryStaffChat = () => {
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

  const [deliveryStatus, setDeliveryStatus] = useState(
    location.state?.deliveryStatus || null,
  );

  const messagesEndRef = useRef(null);

  /*
  =====================================================
  READ ONLY
  =====================================================
  */

  const readOnly =
    location.state?.readOnly === true || deliveryStatus === "COMPLETED";

  /*
  =====================================================
  LOAD CHAT
  =====================================================
  */

  useEffect(() => {
    const loadChat = async () => {
      if (!deliveryId || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const res = await getStaffDeliveryChat(token, deliveryId);

        const chatRoom = res.data?.room;

        /*
        ดึง status จาก API ด้วย
        เพื่อป้องกันกรณีเปิด URL ตรง ๆ
        */

        const apiDeliveryStatus = res.data?.delivery?.status;

        if (apiDeliveryStatus) {
          setDeliveryStatus(apiDeliveryStatus);
        }

        if (!chatRoom?.id) {
          setRoom(null);
          setMessages([]);

          await Swal.fire({
            icon: "error",
            title: "ไม่พบห้องแชท",
            text: "ไม่พบข้อมูลห้องแชทการจัดส่ง",
            confirmButtonText: "ตกลง",
          });

          return;
        }

        setRoom(chatRoom);

        setMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
      } catch (error) {
        console.error("LOAD STAFF CHAT ERROR =", error);

        setRoom(null);
        setMessages([]);

        await Swal.fire({
          icon: "error",
          title: "โหลดแชทไม่สำเร็จ",
          text:
            error.response?.data?.message || error.message || "เกิดข้อผิดพลาด",
          confirmButtonText: "ตกลง",
        });
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [token, deliveryId]);

  /*
  =====================================================
  SOCKET.IO
  =====================================================
  */

  useEffect(() => {
    if (!room?.id || !deliveryId) {
      return;
    }

    const currentRoomId = Number(room.id);

    const currentDeliveryId = Number(deliveryId);

    const handleNewMessage = (newMessage) => {
      console.log("📩 Staff ได้ข้อความใหม่ =", newMessage);

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

  /*
  =====================================================
  AUTO SCROLL
  =====================================================
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
  =====================================================
  SEND MESSAGE
  =====================================================
  */

  const handleSend = async () => {
    /*
    งานเสร็จแล้ว = ห้ามส่ง
    */

    if (readOnly) {
      return;
    }

    const text = message.trim();

    if (!text || !room?.id || sending) {
      return;
    }

    try {
      setSending(true);

      const res = await sendStaffDeliveryMessage(token, room.id, text);

      console.log("📤 Staff ส่งสำเร็จ =", res.data);

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
      console.error("SEND STAFF CHAT ERROR =", error);

      await Swal.fire({
        icon: "error",
        title: "ส่งข้อความไม่สำเร็จ",
        text:
          error.response?.data?.message || error.message || "เกิดข้อผิดพลาด",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setSending(false);
    }
  };

  /*
  =====================================================
  ENTER
  =====================================================
  */

  const handleKeyDown = (e) => {
    if (readOnly) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      handleSend();
    }
  };

  /*
  =====================================================
  LOADING
  =====================================================
  */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={36} className="animate-spin" />

          <p>กำลังโหลดแชท...</p>
        </div>
      </div>
    );
  }

  /*
  =====================================================
  UI
  =====================================================
  */

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F0]">
      {/* HEADER */}
      <div className="sticky top-0 z-20 border-b border-orange-100 bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-orange-50"
          >
            <ArrowLeft size={22} />
          </button>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              readOnly
                ? "bg-gray-100 text-gray-500"
                : "bg-orange-100 text-[#E8491D]"
            }`}
          >
            {readOnly ? <LockKeyhole size={22} /> : <MessageCircle size={23} />}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-gray-800">
              {readOnly ? "ประวัติการแชท" : "แชทการจัดส่ง"}
            </h1>

            <p className="truncate text-xs text-gray-500">
              งานจัดส่ง #ORD{String(deliveryId).padStart(4, "0")}
            </p>
          </div>
        </div>
      </div>

      {/* READ ONLY NOTICE */}
      {readOnly && (
        <div className="mx-auto w-full max-w-4xl px-4 pt-4">
          <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <LockKeyhole size={19} className="mt-0.5 shrink-0 text-gray-500" />

            <div>
              <p className="text-sm font-semibold text-gray-600">
                งานจัดส่งนี้สิ้นสุดแล้ว
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-400">
                สามารถดูประวัติการสนทนาได้ แต่ไม่สามารถส่งข้อความใหม่ได้
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div
        className={`mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-5 ${
          readOnly ? "pb-24" : "pb-40"
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center text-gray-400">
            <MessageCircle size={48} />

            <p className="mt-3">ยังไม่มีข้อความ</p>

            <p className="mt-1 text-sm">สามารถพูดคุยเกี่ยวกับงานจัดส่งนี้ได้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((item) => {
              const isMine =
                item.senderType === "DELIVERY" &&
                Number(item.senderId) === Number(user?.id);

              return (
                <div
                  key={item.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[80%]">
                    {!isMine && (
                      <p className="mb-1 ml-1 text-xs text-gray-500">
                        {item.senderType === "CUSTOMER"
                          ? "ลูกค้า"
                          : item.senderType === "STORE"
                            ? "ร้านค้า"
                            : item.senderType === "DELIVERY"
                              ? "พนักงานส่งอาหาร"
                              : "ผู้ใช้"}
                      </p>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isMine
                          ? "rounded-br-md bg-[#FF6B35] text-white"
                          : "rounded-bl-md border border-orange-100 bg-white text-gray-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {item.message}
                      </p>
                    </div>

                    <p
                      className={`mt-1 text-[10px] text-gray-400 ${
                        isMine ? "text-right" : "text-left"
                      }`}
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

      {/* INPUT / READ ONLY */}
      {readOnly ? (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <LockKeyhole size={17} />
              <span>ไม่สามารถส่งข้อความใหม่ได้</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-orange-100 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="พิมพ์ข้อความ..."
                disabled={sending}
                className="min-h-[48px] flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-white transition hover:bg-[#E8491D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>

            <p className="ml-2 mt-1 text-[10px] text-gray-400">
              กด Enter เพื่อส่งข้อความ
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryStaffChat;
