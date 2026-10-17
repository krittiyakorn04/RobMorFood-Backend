import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createCatagory,
  removeCatagory,
  updateCatagory,
} from "../../api/StoreMenuCategory";
import usefoodDelivery from "../../globalState/fooddeliveryStore";
import Swal from "sweetalert2";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  ArrowLeft,
  Tags,
  UtensilsCrossed,
} from "lucide-react";

const FormMenuCategory = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);
  const categories = usefoodDelivery((state) => state.catagories);
  const getCategory = usefoodDelivery((state) => state.getCategory);

  const [nameCate, setname] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const swalButtonColor = "#FF6B35";

  useEffect(() => {
    if (token) getCategory(token);
  }, [token, getCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = nameCate.trim();

    if (!trimmedName) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกชื่อหมวดหมู่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: swalButtonColor,
      });
      return;
    }

    try {
      setLoading(true);

      const res = await createCatagory(token, {
        nameCate: trimmedName,
      });

      setname("");
      await getCategory(token);

      await Swal.fire({
        icon: "success",
        title: "เพิ่มหมวดหมู่สำเร็จ",
        text: `เพิ่ม ${res.data?.nameCate || trimmedName} สำเร็จ`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "เพิ่มหมวดหมู่ไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          "ไม่สามารถเพิ่มหมวดหมู่ได้ กรุณาลองใหม่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: swalButtonColor,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    const item = categories.find(
      (category) => Number(category.id) === Number(id),
    );

    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบหมวดหมู่",
      text: `ต้องการลบหมวดหมู่ "${item?.nameCate || ""}" หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: "ลบหมวดหมู่",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#E8491D",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await removeCatagory(token, id);
      await getCategory(token);

      await Swal.fire({
        icon: "success",
        title: "ลบหมวดหมู่สำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "ลบหมวดหมู่ไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          "ไม่สามารถลบหมวดหมู่ได้ กรุณาลองใหม่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: swalButtonColor,
      });
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setEditName(item.nameCate);
  };

  const handleUpdate = async (id) => {
    const trimmedName = editName.trim();

    if (!trimmedName) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกชื่อหมวดหมู่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: swalButtonColor,
      });
      return;
    }

    try {
      setLoading(true);

      await updateCatagory(token, id, {
        nameCate: trimmedName,
      });

      await getCategory(token);
      setEditId(null);
      setEditName("");

      await Swal.fire({
        icon: "success",
        title: "แก้ไขหมวดหมู่สำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "แก้ไขหมวดหมู่ไม่สำเร็จ",
        text:
          error?.response?.data?.message ||
          "ไม่สามารถแก้ไขหมวดหมู่ได้ กรุณาลองใหม่",
        confirmButtonText: "ตกลง",
        confirmButtonColor: swalButtonColor,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  const filteredCategories = categories.filter((item) =>
    (item.nameCate || "").toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#FFFCF8] px-4 py-5 pb-24 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-5xl pb-24">
        {/* ปุ่มกลับและหัวข้อ */}
        <div className="mb-6">
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

          <div className="rounded-2xl border border-[#F1E5D9] bg-white px-5 py-5 shadow-sm sm:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0E7] text-[#FF6B35]">
                <Tags size={25} />
              </div>

              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-[#2A1B12] sm:text-2xl">
                  จัดการหมวดหมู่เมนู
                </h1>
                <p className="mt-1 text-sm text-[#8B8179]">
                  เพิ่ม แก้ไข และลบหมวดหมู่เมนูอาหารของร้าน
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* เพิ่มหมวดหมู่ */}
        <section className="mb-6 rounded-2xl border border-[#F1E5D9] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0E7] text-[#FF6B35]">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="font-bold text-[#2A1B12]">เพิ่มหมวดหมู่ใหม่</h2>
              <p className="mt-0.5 text-xs text-[#8B8179]">
                ตั้งชื่อเพื่อจัดกลุ่มเมนูอาหารให้ค้นหาได้ง่าย
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={nameCate}
              onChange={(e) => setname(e.target.value)}
              maxLength={100}
              className="min-w-0 flex-1 rounded-xl border border-[#E9DED4] bg-[#FFFCF8] px-4 py-3 text-sm text-[#2A1B12] outline-none transition placeholder:text-[#B0A49A] focus:border-[#FF6B35] focus:bg-white focus:ring-2 focus:ring-orange-100"
              placeholder="เช่น อาหารตามสั่ง, เครื่องดื่ม"
            />

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E8491D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} />
              เพิ่มหมวดหมู่
            </button>
          </form>
        </section>

        {/* รายการหมวดหมู่ */}
        <section className="overflow-hidden rounded-2xl border border-[#F1E5D9] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#F1E5D9] bg-[#FFF9F3] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#FF6B35] shadow-sm">
                <UtensilsCrossed size={20} />
              </div>

              <div>
                <h2 className="font-bold text-[#2A1B12]">รายการหมวดหมู่</h2>
                <p className="mt-1 text-xs text-[#8B8179]">
                  ทั้งหมด {categories.length} หมวดหมู่
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A69A90]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#E9DED4] bg-white py-2.5 pl-9 pr-3 text-sm text-[#2A1B12] outline-none transition placeholder:text-[#B0A49A] focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
                placeholder="ค้นหาหมวดหมู่..."
              />
            </div>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF3EA] text-[#FF6B35]">
                <Tags size={26} />
              </div>

              <p className="font-medium text-[#6B5A4E]">
                {categories.length === 0
                  ? "ยังไม่มีหมวดหมู่เมนูอาหาร"
                  : "ไม่พบหมวดหมู่ที่ค้นหา"}
              </p>

              <p className="mt-1 text-sm text-[#A69A90]">
                {categories.length === 0
                  ? "เพิ่มหมวดหมู่แรกของร้านได้จากด้านบน"
                  : "ลองตรวจสอบคำค้นหาอีกครั้ง"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F5EEE8]">
              {filteredCategories.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 px-5 py-4 transition hover:bg-[#FFFCF8] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  {editId === item.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={100}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleUpdate(item.id);
                        }
                        if (e.key === "Escape") {
                          handleCancelEdit();
                        }
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-[#FF6B35] bg-white px-3 py-2.5 text-sm text-[#2A1B12] outline-none ring-2 ring-orange-100"
                    />
                  ) : (
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EA] text-[#FF6B35]">
                        <Tags size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="break-words font-semibold text-[#2A1B12]">
                          {item.nameCate}
                        </p>
                        <p className="mt-1 text-xs text-[#A69A90]">
                          หมวดหมู่เมนูอาหาร
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 sm:shrink-0">
                    {editId === item.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdate(item.id)}
                          disabled={loading}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <Check size={16} />
                          บันทึก
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E9DED4] bg-white px-3.5 py-2.5 text-sm text-[#6B5A4E] transition hover:bg-gray-50"
                        >
                          <X size={16} />
                          ยกเลิก
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E9DED4] bg-white px-3.5 py-2.5 text-sm font-medium text-[#6B5A4E] transition hover:border-orange-300 hover:bg-orange-50 hover:text-[#E8491D]"
                        >
                          <Pencil size={15} />
                          แก้ไข
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E9DED4] bg-white px-3.5 py-2.5 text-sm font-medium text-[#6B5A4E] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                          ลบ
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default FormMenuCategory;
