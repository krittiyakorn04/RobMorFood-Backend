import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Pencil,
  Power,
  Phone,
  User,
  Lock,
  X,
  Loader2,
  Users,
  Trash2,
  ArrowLeft,
} from "lucide-react";

import {
  getStoreStaff,
  createStoreStaff,
  updateStoreStaff,
  changeStoreStaffStatus,
  deleteStoreStaff,
} from "../../api/createStore";
import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { useNavigate } from "react-router-dom";

const StoreStaff = () => {
  const token = usefoodDelivery((state) => state.token);
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
  });

  const getStaff = async () => {
    try {
      setLoading(true);

      const res = await getStoreStaff(token);

      setStaff(res.data.staff || []);
    } catch (error) {
      console.error("getStaff Error =", error);

      Swal.fire({
        icon: "error",
        title: "โหลดข้อมูลไม่สำเร็จ",
        text: error.response?.data?.message || "ไม่สามารถโหลดข้อมูลผู้ส่งได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    getStaff();
  }, [token]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const openCreateModal = () => {
    setEditingStaff(null);

    setForm({
      username: "",
      password: "",
      name: "",
      phone: "",
    });

    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingStaff(item);

    setForm({
      username: item.username || "",
      password: "",
      name: item.name || "",
      phone: item.phone || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingStaff(null);

    setForm({
      username: "",
      password: "",
      name: "",
      phone: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกชื่อผู้ส่ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });

      return;
    }

    if (!editingStaff) {
      if (!form.username.trim()) {
        Swal.fire({
          icon: "warning",
          title: "กรุณากรอก Username",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#FF6B35",
        });

        return;
      }

      if (form.username.trim().length < 4) {
        Swal.fire({
          icon: "warning",
          title: "Username ไม่ถูกต้อง",
          text: "Username ต้องมีอย่างน้อย 4 ตัวอักษร",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#FF6B35",
        });

        return;
      }

      if (form.phone && !/^0[689]\d{8}$/.test(form.phone)) {
        Swal.fire({
          icon: "warning",
          title: "เบอร์โทรศัพท์ไม่ถูกต้อง",
          text: "กรุณากรอกเบอร์โทรศัพท์มือถือ 10 หลัก โดยขึ้นต้นด้วย 06, 08 หรือ 09",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#FF6B35",
        });

        return;
      }

      if (!form.password) {
        Swal.fire({
          icon: "warning",
          title: "กรุณากรอก Password",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#FF6B35",
        });

        return;
      }

      if (form.password.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "Password ไม่ถูกต้อง",
          text: "Password ต้องมีอย่างน้อย 6 ตัวอักษร",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#FF6B35",
        });

        return;
      }
    }

    try {
      setSaving(true);

      if (editingStaff) {
        const body = {
          name: form.name.trim(),
          phone: form.phone.trim(),
        };

        if (form.password) {
          if (form.password.length < 6) {
            Swal.fire({
              icon: "warning",
              title: "Password ไม่ถูกต้อง",
              text: "Password ต้องมีอย่างน้อย 6 ตัวอักษร",
              confirmButtonText: "ตกลง",
              confirmButtonColor: "#FF6B35",
            });

            setSaving(false);
            return;
          }

          body.password = form.password;
        }

        await updateStoreStaff(token, editingStaff.id, body);

        await Swal.fire({
          icon: "success",
          title: "แก้ไขข้อมูลสำเร็จ",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#FF6B35",
        });
      } else {
        await createStoreStaff(token, {
          username: form.username.trim(),
          password: form.password,
          name: form.name.trim(),
          phone: form.phone.trim() || null,
        });

        await Swal.fire({
          icon: "success",
          title: "สร้างบัญชีผู้ส่งสำเร็จ",
          text: "สามารถใช้ Username และ Password นี้เข้าสู่ระบบได้",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#FF6B35",
        });
      }

      closeModal();
      await getStaff();
    } catch (error) {
      console.error("handleSubmit Error =", error);

      Swal.fire({
        icon: "error",
        title: "ไม่สำเร็จ",
        text: error.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = async (item) => {
    const willActive = !item.isActive;

    const result = await Swal.fire({
      icon: "question",
      title: willActive ? "เปิดใช้งานบัญชีนี้?" : "ปิดใช้งานบัญชีนี้?",
      text: willActive
        ? "ผู้ส่งจะสามารถเข้าสู่ระบบได้"
        : "ผู้ส่งจะไม่สามารถเข้าสู่ระบบได้",
      showCancelButton: true,
      confirmButtonText: willActive ? "เปิดใช้งาน" : "ปิดใช้งาน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: willActive ? "#16A34A" : "#DC2626",
      cancelButtonColor: "#9CA3AF",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await changeStoreStaffStatus(token, item.id);

      await Swal.fire({
        icon: "success",
        title: willActive ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });

      await getStaff();
    } catch (error) {
      console.error("handleChangeStatus Error =", error);

      Swal.fire({
        icon: "error",
        title: "เปลี่ยนสถานะไม่สำเร็จ",
        text:
          error.response?.data?.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    }
  };

  const handleDeleteStaff = async (item) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ลบบัญชีผู้ส่ง?",
      html: `คุณต้องการลบบัญชี <b>${item.name}</b> (@${item.username}) หรือไม่`,
      showCancelButton: true,
      confirmButtonText: "ลบบัญชี",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#9CA3AF",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteStoreStaff(token, item.id);

      setStaff((prev) => prev.filter((staffItem) => staffItem.id !== item.id));

      await Swal.fire({
        icon: "success",
        title: "ลบบัญชีสำเร็จ",
        text: "ลบบัญชีผู้ส่งเรียบร้อยแล้ว",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    } catch (error) {
      console.error("handleDeleteStaff Error =", error);
      

      Swal.fire({
        icon: "error",
        title: "ลบบัญชีไม่สำเร็จ",
        text:
          error.response?.data?.message ||
          "ไม่สามารถลบบัญชีผู้ส่งได้ กรุณาลองใหม่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#FF6B35",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-6 pb-20">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => {
            navigate(-1);
          }}
          className="inline-flex mb-6 cursor-pointer items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-medium text-[#8A6A54] shadow-sm transition hover:border-orange-300 hover:text-orange-500"
        >
          <ArrowLeft size={16} />
          กลับหน้าก่อนหน้า
        </button>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35]">
                <Users size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  จัดการผู้ส่ง
                </h1>

                <p className="text-sm text-gray-500">
                  เพิ่มและจัดการบัญชีผู้ส่งของร้าน
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#E8491D]"
          >
            <Plus size={20} />
            เพิ่มผู้ส่ง
          </button>
        </div>

        <div className="mb-5 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ผู้ส่งทั้งหมด</p>

              <p className="mt-1 text-2xl font-bold text-gray-800">
                {staff.length}
                <span className="ml-1 text-base font-normal text-gray-500">
                  คน
                </span>
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35]">
              <Users size={24} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl bg-white shadow-sm">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Loader2 size={32} className="animate-spin text-[#FF6B35]" />

              <p>กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : staff.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[#FF6B35]">
              <Users size={30} />
            </div>

            <h2 className="text-lg font-bold text-gray-800">
              ยังไม่มีบัญชีผู้ส่ง
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              เพิ่มบัญชีผู้ส่งเพื่อให้สามารถรับงานจัดส่งอาหารได้
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-5 py-3 font-semibold text-white transition hover:bg-[#E8491D]"
            >
              <Plus size={19} />
              เพิ่มผู้ส่ง
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {staff.map((item) => (
              <div key={item.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35]">
                      <User size={23} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-gray-800">
                        {item.name}
                      </h2>

                      <p className="mt-0.5 text-sm text-gray-500">
                        @{item.username}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      item.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                  </span>
                </div>

                <div className="mt-5 space-y-2">
                  {item.phone ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8F0] px-4 py-3">
                      <Phone size={18} className="text-[#FF6B35]" />

                      <span className="text-sm text-gray-700">
                        {item.phone}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                      <Phone size={18} className="text-gray-400" />

                      <span className="text-sm text-gray-400">
                        ไม่ได้ระบุเบอร์โทร
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8F0] px-4 py-3">
                    <Lock size={18} className="text-[#FF6B35]" />

                    <span className="text-sm text-gray-700">
                      บัญชีสำหรับงานจัดส่ง
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-3 text-sm font-semibold text-[#E8491D] transition hover:bg-orange-100"
                  >
                    <Pencil size={17} />
                    แก้ไข
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeStatus(item)}
                    className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                      item.isActive
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <Power size={17} />
                    {item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteStaff(item)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <Trash2 size={17} />
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {editingStaff ? "แก้ไขข้อมูลผู้ส่ง" : "เพิ่มบัญชีผู้ส่ง"}
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {editingStaff
                      ? "แก้ไขข้อมูลของบัญชีผู้ส่ง"
                      : "สร้างบัญชีสำหรับเข้าสู่ระบบงานจัดส่ง"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    ชื่อผู้ส่ง
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="เช่น สมชาย ใจดี"
                      className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    เบอร์โทร
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      inputMode="numeric"
                      maxLength={10}
                      onChange={(e) => {
                        const phone = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setForm((prev) => ({ ...prev, phone }));
                      }}
                      placeholder="เช่น 0812345678"
                      className={`w-full rounded-2xl border bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 ${
                        !form.phone
                          ? "border-gray-200 focus:border-[#FF6B35] focus:ring-orange-100"
                          : /^0[689]\d{8}$/.test(form.phone)
                            ? "border-green-400 focus:border-green-400 focus:ring-green-100"
                            : "border-red-300 focus:border-red-400 focus:ring-red-100"
                      }`}
                    />
                  </div>

                  {form.phone && (
                    <p
                      className={`mt-1.5 text-xs ${
                        /^0[689]\d{8}$/.test(form.phone)
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {/^0[689]\d{8}$/.test(form.phone)
                        ? "✓ รูปแบบเบอร์โทรศัพท์ถูกต้อง"
                        : form.phone.length < 10
                          ? `กรอกอีก ${10 - form.phone.length} หลัก`
                          : "เบอร์โทรต้องมี 10 หลัก และขึ้นต้นด้วย 06, 08 หรือ 09"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Username
                  </label>

                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    disabled={!!editingStaff}
                    placeholder="อย่างน้อย 4 ตัวอักษร"
                    className={`w-full rounded-2xl border border-gray-200 py-3 px-4 text-sm outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 ${
                      editingStaff
                        ? "cursor-not-allowed bg-gray-100 text-gray-500"
                        : "bg-white"
                    }`}
                  />

                  {editingStaff && (
                    <p className="mt-1.5 text-xs text-gray-400">
                      Username ไม่สามารถแก้ไขได้
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Password
                    {editingStaff && (
                      <span className="ml-1 font-normal text-gray-400">
                        (เว้นว่างหากไม่ต้องการเปลี่ยน)
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder={
                        editingStaff
                          ? "กรอกเฉพาะเมื่อต้องการเปลี่ยน"
                          : "อย่างน้อย 6 ตัวอักษร"
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="flex-1 rounded-2xl bg-gray-100 px-4 py-3 font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FF6B35] px-4 py-3 font-semibold text-white transition hover:bg-[#E8491D] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && <Loader2 size={18} className="animate-spin" />}

                    {editingStaff ? "บันทึกการแก้ไข" : "สร้างบัญชี"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreStaff;
