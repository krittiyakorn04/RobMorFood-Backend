import { useState, useEffect, useMemo } from "react";
import { Store, SearchX, Search, Clock, Tags } from "lucide-react";
import { useNavigate } from "react-router-dom";

import usefoodDelivery from "../globalState/fooddeliveryStore";
import { getCategoryStore } from "../api/createStore";

export default function HomeStore() {
  const navigate = useNavigate();

  // =========================================================
  // ZUSTAND
  // =========================================================

  const stores = usefoodDelivery((state) => state.stores);
  const getAllStore = usefoodDelivery((state) => state.getAllStore);

  // =========================================================
  // STATE
  // =========================================================

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [categories, setCategories] = useState([]);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // โหลดร้านทั้งหมด
      await getAllStore();

      // โหลดหมวดหมู่ร้านทั้งหมด
      const res = await getCategoryStore();


      // รองรับ API หลายรูปแบบ
      const categoryData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.categories)
          ? res.data.categories
          : [];

      setCategories(categoryData);
    } catch (error) {
      console.log("โหลดข้อมูลไม่สำเร็จ", error);
    }
  };

  // =========================================================
  // STORE LIST
  // =========================================================

  const storeList = Array.isArray(stores) ? stores : [];

  // =========================================================
  // CATEGORY LIST
  // =========================================================

  const categoryList = useMemo(() => {
    return [
      {
        id: "all",
        name: "ทั้งหมด",
      },
      ...categories,
    ];
  }, [categories]);

  // =========================================================
  // SEARCH + CATEGORY FILTER
  // =========================================================

  const result = useMemo(() => {
    const q = search.trim().toLowerCase();

    return storeList
      .map((store) => {
        // =====================================================
        // CATEGORY ของร้าน
        // =====================================================

        const storeCategoryNames = [
          ...(Array.isArray(store.storeCategories)
            ? store.storeCategories
                .map((item) => item?.storeCategory?.name)
                .filter(Boolean)
            : []),
          store.storeCategory?.name,
        ]
          .filter(Boolean)
          .map((name) => name.toLowerCase());

        // =====================================================
        // FILTER ตามหมวดที่เลือก
        // =====================================================

        const matchesSelectedCategory =
          selectedCategory === "ทั้งหมด" ||
          storeCategoryNames.includes(selectedCategory.toLowerCase());

        // ไม่ตรงหมวด -> ไม่แสดง
        if (!matchesSelectedCategory) {
          return null;
        }

        // =====================================================
        // SEARCH STORE NAME
        // =====================================================

        const matchesStoreName = store.storeName?.toLowerCase().includes(q);

        // =====================================================
        // SEARCH CATEGORY
        // =====================================================

        const matchesCategory = storeCategoryNames.some((name) =>
          name.includes(q),
        );

        // =====================================================
        // SEARCH MENU
        // =====================================================

        const matchingMenus = Array.isArray(store.menus)
          ? store.menus.filter((menu) => {
              const menuName = (menu.menuItem || menu.name || "").toLowerCase();

              return menuName.includes(q);
            })
          : [];

        const matchesMenu = matchingMenus.length > 0;

        // =====================================================
        // ไม่ได้ค้นหา
        // =====================================================

        if (!q) {
          return {
            ...store,
            matchingMenus: [],
          };
        }

        // =====================================================
        // ค้นหาแล้วไม่เจอร้าน / หมวด / เมนู
        // =====================================================

        if (!matchesStoreName && !matchesCategory && !matchesMenu) {
          return null;
        }

        // =====================================================
        // คืนค่าร้าน + เมนูที่ตรงคำค้นหา
        // =====================================================

        return {
          ...store,
          matchingMenus,
        };
      })
      .filter(Boolean);
  }, [storeList, search, selectedCategory]);

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen w-full bg-[#FFF8F0] pb-10">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Kanit:wght@600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
      />
      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-[#FFF8F0] border-b border-orange-100">
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-orange-200/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-8">
          {/* ================================================= */}
          {/* TITLE */}
          {/* ================================================= */}

          <div className="flex items-center gap-3 mb-7">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-200 flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>

            <div>
              <h1 className="font-['Kanit'] text-3xl font-bold text-[#2A1B12]">
                ร้านอาหาร
              </h1>

              <p className="text-[#6B5647] font-['Noto_Sans_Thai']">
                เลือกประเภทร้านที่คุณต้องการ
              </p>
            </div>
          </div>

          {/* ================================================= */}
          {/* CATEGORY */}
          {/* ================================================= */}

          <div className="mb-7">
            <div className="flex items-center gap-2 mb-4">
              <Tags className="w-5 h-5 text-orange-500" />

              <h2 className="font-['Kanit'] text-lg font-bold text-[#2A1B12]">
                ประเภทร้าน
              </h2>
            </div>

            {/* CATEGORY CARD แนวนอน */}

            <div
              className="
            flex
            gap-3
            overflow-x-auto
            pb-3
            scrollbar-hide
          "
            >
              {categoryList.map((category) => {
                const isSelected = selectedCategory === category.name;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`
                  relative
                  min-w-[140px]
                  rounded-2xl
                  p-4
                  text-left
                  border
                  transition-all
                  duration-200
                  shrink-0

                  ${
                    isSelected
                      ? `
                        bg-gradient-to-br
                        from-orange-400
                        to-orange-600
                        text-white
                        border-orange-500
                        shadow-lg
                        shadow-orange-200
                        scale-[1.02]
                      `
                      : `
                        bg-white
                        text-[#2A1B12]
                        border-orange-100
                        hover:border-orange-300
                        hover:shadow-md
                        hover:-translate-y-1
                      `
                  }
                `}
                  >
                    {/* ICON */}

                    <div
                      className={`
                    w-10
                    h-10
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    mb-3

                    ${isSelected ? "bg-white/20" : "bg-orange-50"}
                  `}
                    >
                      <Tags
                        className={`
                      w-5
                      h-5

                      ${isSelected ? "text-white" : "text-orange-500"}
                    `}
                      />
                    </div>

                    {/* CATEGORY NAME */}

                    <p
                      className="
                    font-['Noto_Sans_Thai']
                    font-semibold
                    text-sm
                    whitespace-nowrap
                    overflow-hidden
                    text-ellipsis
                  "
                    >
                      {category.name}
                    </p>

                    {/* SELECTED */}

                    {isSelected && (
                      <div
                        className="
                      absolute
                      top-3
                      right-3
                      w-2
                      h-2
                      rounded-full
                      bg-white
                    "
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================================================= */}
          {/* SEARCH */}
          {/* ================================================= */}

          <div className="relative">
            <Search
              className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            w-5
            h-5
            text-[#B0937E]
          "
            />

            <input
              className="
            w-full
            bg-white
            border
            border-orange-100
            rounded-2xl
            py-4
            pl-12
            pr-4
            shadow-sm
            shadow-orange-100/60
            focus:outline-none
            focus:ring-2
            focus:ring-orange-300
            transition
            font-['Noto_Sans_Thai']
          "
              placeholder="ค้นหาร้านอาหาร หรือ เมนู "
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      {/* ===================================================== */}
      {/* STORE LIST */}
      {/* ===================================================== */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* ================================================= */}
        {/* HEADER LIST */}
        {/* ================================================= */}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-['Kanit'] text-2xl font-bold text-[#2A1B12]">
              ร้านค้าทั้งหมด
            </h2>

            {selectedCategory !== "ทั้งหมด" && (
              <p className="text-sm text-orange-500 font-['Noto_Sans_Thai']">
                ประเภท: {selectedCategory}
              </p>
            )}
          </div>

          <span className="text-sm text-[#8A6A54] font-['Noto_Sans_Thai']">
            {result.length} ร้าน
          </span>
        </div>

        {/* ================================================= */}
        {/* NO RESULT */}
        {/* ================================================= */}

        {result.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 text-[#B0937E] bg-white rounded-3xl border border-dashed border-orange-200">
            <SearchX className="w-10 h-10 mb-3" />

            <p className="font-['Kanit'] font-semibold text-lg text-[#2A1B12]">
              ไม่พบร้านที่ตรงกับคำค้นหา
            </p>

            <p className="text-sm mt-1 font-['Noto_Sans_Thai']">
              ลองค้นหาด้วยชื่อร้าน เมนู หรือประเภทของร้าน
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {result.map((store) => {
              // =============================================
              // PROFILE IMAGE
              // =============================================

              const profileImage = Array.isArray(store.images)
                ? store.images.find((image) =>
                    image.public_id?.startsWith("StoreProfile2026"),
                  )
                : null;

              // =============================================
              // CATEGORY ของร้าน
              // =============================================
              // =============================================
              // CATEGORY ของร้าน
              // =============================================

              const storeCategories = [];

              if (Array.isArray(store.storeCategories)) {
                store.storeCategories.forEach((category) => {
                  if (category?.storeCategory?.name) {
                    storeCategories.push(category.storeCategory.name);
                  }
                });
              }

              if (store.storeCategory?.name) {
                storeCategories.push(store.storeCategory.name);
              }

              const uniqueStoreCategories = [...new Set(storeCategories)];
              // =============================================
              // มีเมนูตรงคำค้นหาหรือไม่
              // =============================================

              const hasMatchingMenus =
                search.trim() &&
                Array.isArray(store.matchingMenus) &&
                store.matchingMenus.length > 0;

              return (
                <div
                  key={store.id}
                  onClick={() => {
                    navigate(`/ClientPublic/${store.id}`);
                  }}
                  className={`
                group
                bg-white
                rounded-2xl
                overflow-hidden
                border
                border-orange-100
                shadow-sm
                hover:shadow-lg
                hover:shadow-orange-100/60
                hover:-translate-y-0.5
                transition-all
                duration-300
                cursor-pointer

                ${hasMatchingMenus ? "md:col-span-2" : ""}
              `}
                >
                  {/* ===================================================== */}
                  {/* ส่วนบน : รูปร้าน + ข้อมูลร้าน */}
                  {/* ===================================================== */}

                  <div className="flex min-h-[165px]">
                    {/* PROFILE IMAGE */}

                    <div className="relative w-[145px] shrink-0 overflow-hidden">
                      {profileImage?.url ? (
                        <img
                          src={profileImage.url}
                          alt={store.storeName || "ร้านอาหาร"}
                          className="
                        w-full
                        h-full
                        min-h-[165px]
                        object-cover
                        group-hover:scale-105
                        transition-transform
                        duration-500
                      "
                        />
                      ) : (
                        <div className="w-full h-full min-h-[165px] flex items-center justify-center bg-orange-100">
                          <Store className="w-10 h-10 text-orange-400" />
                        </div>
                      )}

                      {/* STATUS */}

                      <span
                        className={`
                      absolute
                      top-3
                      left-3
                      flex
                      items-center
                      gap-1.5
                      px-2.5
                      py-1
                      rounded-full
                      text-[11px]
                      font-semibold
                      font-['Noto_Sans_Thai']
                      shadow-sm

                      ${
                        store.status === "OPEN"
                          ? "bg-green-500/90 text-white"
                          : "bg-gray-700/85 text-white"
                      }
                    `}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />

                        {store.status === "OPEN" ? "เปิด" : "ปิด"}
                      </span>
                    </div>

                    {/* STORE INFO */}

                    <div className="flex-1 min-w-0 p-4 flex flex-col">
                      {/* NAME */}

                      <h3
                        className="
                      font-['Kanit']
                      font-bold
                      text-lg
                      text-[#2A1B12]
                      line-clamp-1
                      group-hover:text-orange-500
                      transition-colors
                    "
                      >
                        {store.storeName || "ไม่พบชื่อร้าน"}
                      </h3>

                      {/* CATEGORY */}

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {uniqueStoreCategories.length > 0 ? (
                          uniqueStoreCategories.map((categoryName) => (
                            <span
                              key={categoryName}
                              className="
                            inline-flex
                            items-center
                            px-2.5
                            py-1
                            rounded-full
                            bg-orange-50
                            text-orange-600
                            text-[11px]
                            font-medium
                            font-['Noto_Sans_Thai']
                            border
                            border-orange-100
                          "
                            >
                              {categoryName}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#9A7B66]">
                            ไม่ระบุประเภท
                          </span>
                        )}
                      </div>

                      {/* TIME */}

                      <div
                        className="
                      flex
                      items-center
                      gap-1.5
                      mt-3
                      text-xs
                      text-[#6B5647]
                      font-['Noto_Sans_Thai']
                    "
                      >
                        <Clock className="w-3.5 h-3.5 text-orange-400" />

                        <span>
                          {store.timeOpen || "--:--"}
                          {" - "}
                          {store.timeClose || "--:--"}
                        </span>
                      </div>

                      {/* BUTTON */}

                      <div className="mt-auto pt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/ClientPublic/${store.id}`);
                          }}
                          className="
                        w-full
                        py-2
                        rounded-lg
                        bg-orange-50
                        text-orange-600
                        font-['Noto_Sans_Thai']
                        font-semibold
                        text-xs
                        group-hover:bg-orange-500
                        group-hover:text-white
                        transition-all
                      "
                        >
                          ดูร้าน
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ===================================================== */}
                  {/* MATCHING MENUS */}
                  {/* แสดงเฉพาะตอนค้นหาแล้วเจอเมนู */}
                  {/* ===================================================== */}

                  {hasMatchingMenus && (
                    <div className="border-t border-orange-100 bg-orange-50/30 p-4">
                      {/* TITLE */}

                      <div className="flex items-center justify-between mb-3">
                        <p
                          className="
                        text-sm
                        font-bold
                        text-[#2A1B12]
                        font-['Noto_Sans_Thai']
                      "
                        >
                          เมนูที่ตรงกับคำค้นหา
                        </p>

                        <span
                          className="
                        text-[11px]
                        text-orange-500
                        font-['Noto_Sans_Thai']
                      "
                        >
                          พบ {store.matchingMenus.length} เมนู
                        </span>
                      </div>

                      {/* ================================================= */}
                      {/* MENU HORIZONTAL */}
                      {/* ================================================= */}

                      <div
                        className="
                      flex
                      gap-3
                      overflow-x-auto
                      pb-2
                      scrollbar-hide
                    "
                      >
                        {store.matchingMenus.map((menu) => {
                          const menuImage =
                            menu.images?.[0]?.url ||
                            menu.images?.[0]?.secure_url ||
                            menu.imageUrl ||
                            menu.image ||
                            "";

                          const menuName =
                            menu.menuItem || menu.name || "ไม่พบชื่อเมนู";

                          const menuPrice = menu.price ?? 0;

                          const isAvailable = menu.isAvailable !== false;

                          return (
                            <div
                              key={menu.id}
                              onClick={(e) => {
                                e.stopPropagation();

                                if (!isAvailable) return;

                                navigate(`/ClientPublic/${store.id}`);
                              }}
                              className={`
    shrink-0
    w-[170px]
    overflow-hidden
    rounded-2xl
    bg-white
    border
    border-orange-100
    shadow-sm
    transition-all
    ${
      isAvailable
        ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
        : "cursor-default"
    }
  `}
                            >
                              {/* รูปเมนู */}

                              <div className="relative w-full h-[125px] bg-orange-50 overflow-hidden">
                                {menuImage ? (
                                  <img
                                    src={menuImage}
                                    alt={menuName}
                                    className={`
        w-full
        h-full
        object-cover
        transition-all
        duration-300
        ${isAvailable ? "hover:scale-105" : "grayscale opacity-60"}
      `}
                                  />
                                ) : (
                                  <div
                                    className="
                                  w-full
                                  h-full
                                  flex
                                  items-center
                                  justify-center
                                  text-xs
                                  text-gray-400
                                  font-['Noto_Sans_Thai']
                                "
                                  >
                                    ไม่มีรูปเมนู
                                  </div>
                                )}

                                {!isAvailable && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                    <span
                                      className="
        px-4
        py-2
        rounded-full
        bg-gray-800/90
        text-white
        text-sm
        font-bold
        font-['Noto_Sans_Thai']
        shadow-lg
      "
                                    >
                                      หมด
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* ชื่อ + ราคา */}

                              <div className="p-3">
                                <p
                                  className="
                                text-sm
                                font-semibold
                                text-[#2A1B12]
                                truncate
                                font-['Noto_Sans_Thai']
                              "
                                  title={menuName}
                                >
                                  {menuName}
                                </p>

                                <p
                                  className="
                                mt-1
                                text-sm
                                font-bold
                                text-orange-500
                                font-['Noto_Sans_Thai']
                              "
                                >
                                  ฿{Number(menuPrice).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
