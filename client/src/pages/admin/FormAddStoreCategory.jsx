import { useEffect, useState } from "react";
import axios from "axios";
import {
  Trash2,
  Plus,
  Tags,
  Loader2,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import AdminNavbar from "../../components/nav/AdminNavbar";

const API_URL =
  "https://robmorfood-backend-new.onrender.com/api/admin/store-category";

const FormAddStoreCategory = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  const adminToken = localStorage.getItem("adminToken");

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  // =========================
  // โหลดหมวดหมู่
  // =========================
  const getCategories = async () => {
    try {
      setLoadingCategories(true);

      const res = await axios.get(API_URL, getAuthConfig());

      setCategories(res.data.categories || []);
    } catch (error) {
      console.error("Get Store Category Error =", error);

      Swal.fire({
        icon: "error",
        title: "โหลดข้อมูลไม่สำเร็จ",
        text:
          error.response?.data?.message ||
          "ไม่สามารถโหลดหมวดหมู่ได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  // =========================
  // เพิ่มหมวดหมู่
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูล",
        text: "กรุณากรอกชื่อหมวดหมู่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    try {
      setLoading(true);

      await axios.post(
        API_URL,
        {
          name: name.trim(),
        },
        getAuthConfig(),
      );

      await Swal.fire({
        icon: "success",
        title: "เพิ่มหมวดหมู่สำเร็จ",
        text: `เพิ่ม "${name.trim()}" เรียบร้อยแล้ว`,
        timer: 1200,
        showConfirmButton: false,
      });

      setName("");

      await getCategories();
    } catch (error) {
      console.error("Add Store Category Error =", error);

      Swal.fire({
        icon: "error",
        title: "เพิ่มหมวดหมู่ไม่สำเร็จ",
        text:
          error.response?.data?.message ||
          error.response?.data?.messege ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // เริ่มแก้ไข
  // =========================
  const handleEdit = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  // =========================
  // ยกเลิกแก้ไข
  // =========================
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  // =========================
  // บันทึกการแก้ไข
  // =========================
  const handleUpdate = async (id) => {
    if (!editingName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูล",
        text: "กรุณากรอกชื่อหมวดหมู่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });

      return;
    }

    try {
      setLoading(true);

      await axios.put(
        `${API_URL}/${id}`,
        {
          name: editingName.trim(),
        },
        getAuthConfig(),
      );

      await Swal.fire({
        icon: "success",
        title: "แก้ไขสำเร็จ",
        text: "แก้ไขหมวดหมู่เรียบร้อยแล้ว",
        timer: 1200,
        showConfirmButton: false,
      });

      setEditingId(null);
      setEditingName("");

      await getCategories();
    } catch (error) {
      console.error("Update Store Category Error =", error);

      Swal.fire({
        icon: "error",
        title: "แก้ไขไม่สำเร็จ",
        text:
          error.response?.data?.message ||
          "ไม่สามารถแก้ไขหมวดหมู่ได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ลบ
  // =========================
  const handleDelete = async (id, categoryName) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ลบหมวดหมู่นี้?",
      text: `คุณต้องการลบ "${categoryName}" ใช่หรือไม่`,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(id);

      await axios.delete(
        `${API_URL}/${id}`,
        getAuthConfig(),
      );

      await Swal.fire({
        icon: "success",
        title: "ลบสำเร็จ",
        text: `ลบ "${categoryName}" เรียบร้อยแล้ว`,
        timer: 1200,
        showConfirmButton: false,
      });

      await getCategories();
    } catch (error) {
      console.error("Delete Store Category Error =", error);

      Swal.fire({
        icon: "error",
        title: "ลบไม่สำเร็จ",
        text:
          error.response?.data?.message ||
          "ไม่สามารถลบหมวดหมู่ได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#f97316",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <AdminNavbar />

      <main className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Tags size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                จัดการหมวดหมู่ร้านอาหาร
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                เพิ่ม แก้ไข และลบหมวดหมู่ร้านอาหาร
              </p>
            </div>
          </div>
        </div>

        {/* Add */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-orange-50/70 px-6 py-5">
            <div className="flex items-center gap-2">
              <Plus size={20} className="text-orange-500" />

              <h2 className="font-semibold text-gray-800">
                เพิ่มหมวดหมู่
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              เพิ่มหมวดหมู่ใหม่สำหรับร้านอาหาร
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น อาหารตามสั่ง"
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3.5 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:bg-gray-100"
              />

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    เพิ่มหมวดหมู่
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="font-semibold text-gray-800">
                หมวดหมู่ที่มีอยู่
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                รายการหมวดหมู่ร้านอาหารทั้งหมด
              </p>
            </div>

            <div className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-600">
              {categories.length} รายการ
            </div>
          </div>

          {loadingCategories ? (
            <div className="flex items-center justify-center py-16">
              <Loader2
                size={28}
                className="animate-spin text-orange-500"
              />
            </div>
          ) : categories.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Tags
                size={42}
                className="mx-auto mb-3 text-gray-300"
              />

              <p className="font-medium text-gray-500">
                ยังไม่มีหมวดหมู่
              </p>

              <p className="mt-1 text-sm text-gray-400">
                เพิ่มหมวดหมู่แรกได้จากด้านบน
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {categories.map((category, index) => {
                const isEditing = editingId === category.id;

                return (
                  <div
                    key={category.id}
                    className="px-6 py-4 transition hover:bg-orange-50/40"
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 font-semibold text-orange-600">
                          {index + 1}
                        </div>

                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) =>
                            setEditingName(e.target.value)
                          }
                          autoFocus
                          disabled={loading}
                          className="flex-1 rounded-xl border border-orange-300 px-4 py-2.5 text-gray-800 outline-none focus:ring-4 focus:ring-orange-100"
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdate(category.id)
                            }
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
                          >
                            <Save size={17} />
                            บันทึก
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                          >
                            <X size={17} />
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 font-semibold text-orange-600">
                            {index + 1}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-800">
                              {category.name}
                            </p>

                            <p className="text-xs text-gray-400">
                              ID: {category.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(category)
                            }
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-orange-500 transition hover:bg-orange-50 hover:text-orange-600"
                          >
                            <Pencil size={17} />

                            <span className="hidden sm:inline">
                              แก้ไข
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                category.id,
                                category.name,
                              )
                            }
                            disabled={
                              deletingId === category.id
                            }
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === category.id ? (
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={17} />
                            )}

                            <span className="hidden sm:inline">
                              ลบ
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() =>
              navigate("/admin/AdminStoreStatus")
            }
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            กลับไปจัดการร้านอาหาร
          </button>
        </div>
      </main>
    </div>
  );
};

export default FormAddStoreCategory;