import usefoodDelivery from "../../globalState/fooddeliveryStore";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  getOptionFormats,
  createOptionFormat,
  updateOptionFormat,
  deleteOptionFormat,
} from "../../api/StoreMenu";

import {
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  FolderOpen,
  Utensils,
  SlidersHorizontal,
  ChevronRight,
  Check,
  CircleAlert,
} from "lucide-react";

import Swal from "sweetalert2";

const FormEditStore = () => {
  const navigate = useNavigate();

  const token = usefoodDelivery((state) => state.token);

  const getCategory = usefoodDelivery((state) => state.getCategory);
  const categories = usefoodDelivery((state) => state.catagories);

  const getMenus = usefoodDelivery((state) => state.getMenus);
  const menus = usefoodDelivery((state) => state.menus);

  const getStore = usefoodDelivery((state) => state.getStore);
  const stores = usefoodDelivery((state) => state.stores);



  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");

  // =========================
  // OPTION FORMAT
  // =========================

  const [optionFormats, setOptionFormats] = useState([]);
  const [showFormatForm, setShowFormatForm] = useState(false);
  const [editingFormatId, setEditingFormatId] = useState(null);

  const [newFormat, setNewFormat] = useState({
    name: "",
    required: false,
    maxRequire: 1,
    choices: [
      {
        name: "",
        extraPrice: 0,
      },
    ],
  });

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    if (!token) return;

    getCategory(token);
    getMenus(token);
    getStore(token);
    loadOptionFormats();
  }, [token]);

  // =========================
  // LOAD OPTION FORMAT
  // =========================

  const loadOptionFormats = async () => {
    try {
      const res = await getOptionFormats(token);

      setOptionFormats(res.data || []);
    } catch (error) {
      console.error("โหลดรูปแบบตัวเลือกไม่สำเร็จ =", error);
    }
  };

  // =========================
  // NOTICE
  // =========================

  const [isEditNotice, setIsEditNotice] = useState(false);

  const [notice, setNotice] = useState(
    "วันนี้เปิดปกติ | ช่วง 11:30 - 13:00 อาจใช้เวลาจัดส่งเพิ่มประมาณ 10 นาที",
  );

  const handleSaveNotice = () => {
    setIsEditNotice(false);
  };

  // =========================
  // OPTION FORMAT FUNCTIONS
  // =========================

  const addFormatChoice = () => {
    setNewFormat((prev) => ({
      ...prev,

      choices: [
        ...prev.choices,
        {
          name: "",
          extraPrice: 0,
        },
      ],
    }));
  };

  const removeFormatChoice = (index) => {
    setNewFormat((prev) => ({
      ...prev,

      choices: prev.choices.filter((_, i) => i !== index),
    }));
  };

  const updateFormatChoice = (index, field, value) => {
    setNewFormat((prev) => {
      const choices = [...prev.choices];

      choices[index] = {
        ...choices[index],
        [field]: value,
      };

      return {
        ...prev,
        choices,
      };
    });
  };

  const handleCreateFormat = async () => {
    if (!newFormat.name.trim()) {
      alert("กรุณาระบุชื่อรูปแบบตัวเลือก");
      return;
    }

    const validChoices = newFormat.choices.filter((choice) =>
      choice.name.trim(),
    );

    if (validChoices.length === 0) {
      alert("กรุณาเพิ่มตัวเลือกอย่างน้อย 1 รายการ");
      return;
    }

    const data = {
      name: newFormat.name.trim(),
      required: newFormat.required,
      maxRequire: Number(newFormat.maxRequire),
      choices: validChoices.map((choice, index) => ({
        name: choice.name.trim(),
        extraPrice: Number(choice.extraPrice) || 0,
        sortOrder: index,
      })),
    };

    try {
      if (editingFormatId) {
        const res = await updateOptionFormat(token, editingFormatId, data);

        const updatedFormat = res.data?.format;

        if (updatedFormat) {
          setOptionFormats((prev) =>
            prev.map((item) =>
              item.id === editingFormatId ? updatedFormat : item,
            ),
          );
        }
      } else {
        const res = await createOptionFormat(token, data);

        if (res.data?.format) {
          setOptionFormats((prev) => [res.data.format, ...prev]);
        }
      }

      setNewFormat({
        name: "",
        required: false,
        maxRequire: 1,
        choices: [
          {
            name: "",
            extraPrice: 0,
          },
        ],
      });

      setEditingFormatId(null);
      setShowFormatForm(false);
    } catch (error) {
      console.error("บันทึกรูปแบบตัวเลือกไม่สำเร็จ =", error);

      alert(
        error.response?.data?.message || "ไม่สามารถบันทึกรูปแบบตัวเลือกได้",
      );
    }
  };

  const startEditFormat = (format) => {
    setEditingFormatId(format.id);

    setNewFormat({
      name: format.name || "",
      required: Boolean(format.required),
      maxRequire: Number(format.maxRequire || 1),
      choices:
        format.choices?.length > 0
          ? format.choices.map((choice) => ({
              name: choice.name || "",
              extraPrice: Number(choice.extraPrice || 0),
            }))
          : [
              {
                name: "",
                extraPrice: 0,
              },
            ],
    });

    setShowFormatForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteFormat = async (format) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบรูปแบบ",
      text: `คุณต้องการลบรูปแบบ "${format.name}" ใช่หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: "ลบรูปแบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#E8491D",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteOptionFormat(token, format.id);

      setOptionFormats((prev) => prev.filter((item) => item.id !== format.id));

      if (editingFormatId === format.id) {
        setEditingFormatId(null);
      }
    } catch (error) {
      console.error("ลบรูปแบบตัวเลือกไม่สำเร็จ =", error);

      alert(error.response?.data?.message || "ไม่สามารถลบรูปแบบตัวเลือกได้");
    }
  };

  // =========================
  // FILTER MENU
  // =========================

  const filteredMenus = menus.filter((menu) => {
    const matchSearch = menu.menuItem
      .toLowerCase()
      .includes(search.toLowerCase());

    if (activeCategory === "ทั้งหมด") {
      return matchSearch;
    }

    const category = categories.find((cat) => cat.nameCate === activeCategory);

    return matchSearch && menu.categoryId === category?.id;
  });

  // =========================
  // RETURN
  // =========================

return (
  <div className="min-h-screen bg-[#FFF8F0] pb-12">
    <div className="mx-auto max-w-6xl px-4 py-6 pb-12 md:px-6 lg:py-8">
        {/* =========================
            PAGE HEADER
        ========================= */}

        <div className="mb-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Utensils size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
                จัดการเมนูอาหาร
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                จัดการรูปแบบตัวเลือก เมนู และหมวดหมู่อาหาร
              </p>
            </div>
          </div>
        </div>
        {/* =========================
            SEARCH
        ========================= */}

        <section className="mb-5">
          <div className="relative">
            <Search
              size={20}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 outline-none shadow-sm transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              placeholder="ค้นหาเมนูอาหาร..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </section>

        {/* =========================
            MENU MANAGEMENT
        ========================= */}

        <section className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/store/MenuCategory")}
            className="group flex h-28 items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-100">
              <FolderOpen size={27} />
            </div>

            <div className="flex-1">
              <p className="font-bold text-gray-800">จัดการหมวดหมู่อาหาร</p>

              <p className="mt-1 text-sm text-gray-500">
                เพิ่ม แก้ไข และจัดหมวดหมู่เมนู
              </p>
            </div>

            <ChevronRight
              size={20}
              className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
            />
          </button>

          <button
            type="button"
            onClick={() => navigate("/store/menu")}
            className="group flex h-28 items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition group-hover:bg-orange-100">
              <Utensils size={27} />
            </div>

            <div className="flex-1">
              <p className="font-bold text-gray-800">จัดการเมนูอาหาร</p>

              <p className="mt-1 text-sm text-gray-500">
                เพิ่ม แก้ไข ราคา รูปภาพ และรายละเอียดเมนู
              </p>
            </div>

            <ChevronRight
              size={20}
              className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
            />
          </button>
        </section>

        {/* =========================
            OPTION FORMAT
        ========================= */}

        <section className="mb-8 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <SlidersHorizontal size={21} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  รูปแบบตัวเลือกเมนู
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  สร้างตัวเลือกที่สามารถนำไปใช้กับหลายเมนูได้
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowFormatForm((prev) => !prev);

                if (showFormatForm) {
                  setEditingFormatId(null);

                  setNewFormat({
                    name: "",
                    required: false,
                    maxRequire: 1,
                    choices: [
                      {
                        name: "",
                        extraPrice: 0,
                      },
                    ],
                  });
                }
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                showFormatForm
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-[#FF6B35] text-white shadow-sm hover:bg-[#E8491D]"
              }`}
            >
              {showFormatForm ? (
                <>
                  <X size={17} />
                  ยกเลิก
                </>
              ) : (
                <>
                  <Plus size={18} />
                  เพิ่มรูปแบบ
                </>
              )}
            </button>
          </div>

          {/* =========================
              CREATE FORMAT
          ========================= */}

          {showFormatForm && (
            <div className="mb-6 rounded-2xl border border-orange-200 bg-[#FFF8F0] p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white">
                  {editingFormatId ? <Pencil size={17} /> : <Plus size={18} />}
                </div>

                <div>
                  <h3 className="font-bold text-gray-800">
                    {editingFormatId
                      ? "แก้ไขรูปแบบตัวเลือก"
                      : "เพิ่มรูปแบบตัวเลือกใหม่"}
                  </h3>

                  <p className="text-xs text-gray-500">
                    กำหนดตัวเลือกที่ลูกค้าสามารถเลือกได้
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ชื่อรูปแบบ
                  </label>

                  <input
                    type="text"
                    value={newFormat.name}
                    onChange={(e) =>
                      setNewFormat((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="เช่น ระดับความเผ็ด"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {/* REQUIRED + MAX */}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={newFormat.required}
                        onChange={(e) =>
                          setNewFormat((prev) => ({
                            ...prev,
                            required: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-orange-500"
                      />

                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          บังคับให้ลูกค้าเลือก
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                          ลูกค้าต้องเลือกตัวเลือกนี้ก่อนสั่งอาหาร
                        </p>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      เลือกได้สูงสุด
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={newFormat.maxRequire}
                      onChange={(e) =>
                        setNewFormat((prev) => ({
                          ...prev,
                          maxRequire: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </div>

                {/* CHOICES */}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        ตัวเลือก
                      </label>

                      <p className="mt-0.5 text-xs text-gray-400">
                        เพิ่มตัวเลือกและราคาที่เพิ่มจากเมนู
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addFormatChoice}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
                    >
                      <Plus size={16} />
                      เพิ่มตัวเลือก
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newFormat.choices.map((choice, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-200 bg-white p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="flex flex-1 items-center gap-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-bold text-orange-500">
                              {index + 1}
                            </div>

                            <input
                              type="text"
                              value={choice.name ?? ""}
                              onChange={(e) =>
                                updateFormatChoice(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder={`ตัวเลือกที่ ${index + 1}`}
                              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:w-32">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                ฿
                              </span>

                              <input
                                type="number"
                                min="0"
                                value={choice.extraPrice ?? ""}
                                onChange={(e) =>
                                  updateFormatChoice(
                                    index,
                                    "extraPrice",
                                    e.target.value,
                                  )
                                }
                                placeholder="ราคาเพิ่ม"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-8 pr-3 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                              />
                            </div>

                            {newFormat.choices.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeFormatChoice(index)}
                                aria-label="ลบตัวเลือก"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SAVE */}

                <button
                  type="button"
                  onClick={handleCreateFormat}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] py-3.5 font-bold text-white shadow-sm transition hover:bg-[#E8491D]"
                >
                  <Check size={18} />

                  {editingFormatId ? "บันทึกการแก้ไข" : "บันทึกรูปแบบตัวเลือก"}
                </button>
              </div>
            </div>
          )}

          {/* =========================
              FORMAT LIST
          ========================= */}

          {optionFormats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <SlidersHorizontal size={22} />
              </div>

              <p className="font-medium text-gray-600">
                ยังไม่มีรูปแบบตัวเลือก
              </p>

              <p className="mt-1 text-sm text-gray-400">
                เพิ่มรูปแบบตัวเลือกเพื่อใช้งานกับเมนูอาหาร
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {optionFormats.map((format) => (
                <div
                  key={format.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 transition hover:border-orange-200 hover:bg-orange-50/30"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">
                          {format.name}
                        </h3>

                        {format.required && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-600">
                            จำเป็น
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {format.required
                          ? "ลูกค้าต้องเลือกตัวเลือกนี้"
                          : "ลูกค้าไม่จำเป็นต้องเลือก"}{" "}
                        <span className="mx-1">•</span>
                        เลือกได้สูงสุด {format.maxRequire}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEditFormat(format)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-200"
                      >
                        <Pencil size={15} />
                        แก้ไข
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFormat(format)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-100"
                      >
                        <Trash2 size={15} />
                        ลบ
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {format.choices?.map((choice) => (
                      <span
                        key={choice.id}
                        className="inline-flex items-center rounded-full border border-orange-100 bg-white px-3 py-1.5 text-sm text-orange-700 shadow-sm"
                      >
                        {choice.name}

                        {Number(choice.extraPrice) > 0 && (
                          <span className="ml-1 font-semibold">
                            + ฿{choice.extraPrice}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================
            CATEGORY
        ========================= */}

        <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveCategory("ทั้งหมด")}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeCategory === "ทั้งหมด"
                  ? "bg-[#FF6B35] text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              }`}
            >
              ทั้งหมด
            </button>

            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setActiveCategory(cat.nameCate)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeCategory === cat.nameCate
                    ? "bg-[#FF6B35] text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {cat.nameCate}
              </button>
            ))}
          </div>
        </section>

        {/* =========================
            EMPTY STATE
        ========================= */}

        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <CircleAlert size={26} />
            </div>

            <p className="font-semibold text-gray-600">
              ยังไม่มีการเพิ่มหมวดหมู่
            </p>

            <p className="mt-1 text-sm text-gray-400">
              กรุณาเพิ่มหมวดหมู่อาหารก่อนจัดการเมนู
            </p>
          </div>
        ) : activeCategory === "ทั้งหมด" && filteredMenus.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Search size={26} />
            </div>

            <p className="font-semibold text-gray-600">ไม่พบเมนูอาหาร</p>

            <p className="mt-1 text-sm text-gray-400">
              ลองเปลี่ยนคำค้นหาแล้วค้นหาใหม่อีกครั้ง
            </p>
          </div>
        ) : (
          categories
            .filter(
              (cat) =>
                activeCategory === "ทั้งหมด" || activeCategory === cat.nameCate,
            )
            .map((cat) => {
              const list = filteredMenus.filter(
                (menu) => menu.categoryId === cat.id,
              );

              return (
                <section key={cat.id} className="mb-8">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-7 w-1.5 rounded-full bg-[#FF6B35]" />

                    <h2 className="text-xl font-bold text-gray-800">
                      {cat.nameCate}
                    </h2>

                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                      {list.length} เมนู
                    </span>
                  </div>

                  {list.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                      <p className="text-sm text-gray-400">
                        ยังไม่มีเมนูในหมวดหมู่นี้
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((menu) => (
                        <div
                          key={menu.id}
                          className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="relative overflow-hidden">
                            <img
                              src={menu.images?.[0]?.url}
                              alt={menu.menuItem}
                              className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                            />

                            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
                          </div>

                          <div className="p-4">
                            <h3 className="line-clamp-1 font-bold text-gray-800">
                              {menu.menuItem}
                            </h3>

                            <p className="mt-1.5 line-clamp-2 min-h-[40px] text-sm text-gray-500">
                              {menu.description || "ไม่มีรายละเอียดเมนู"}
                            </p>

                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                              <span className="text-lg font-bold text-[#FF6B35]">
                                ฿{menu.price}
                              </span>

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })
        )}
      </div>
    </div>
  );
};

export default FormEditStore;
