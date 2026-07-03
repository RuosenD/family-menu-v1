const CART_KEY = "home-menu-cart-v8";
const RESERVATION_KEY = "home-menu-reservation-v5";
const NOTE_KEY = "home-menu-note";
const CATEGORY_KEY = "home-menu-category";
const CHINESE_CATEGORY = "中餐";
const WESTERN_CATEGORY = "西餐";
const DRINK_CATEGORY = "饮品";
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DEFAULT_DATE = getTodayDateString();
const MENU_TYPES = [CHINESE_CATEGORY, WESTERN_CATEGORY, DRINK_CATEGORY];
const COURSE_ORDER = ["海鲜", "肉菜", "蔬菜", "主食"];
const COURSE_ENGLISH = {
  海鲜: "Seafood",
  肉菜: "Meat",
  蔬菜: "Vegetables",
  主食: "Rice & Noodles"
};
const DISH_DISPLAY_ORDER = [
  "dish-01", "dish-27",
  "dish-04", "dish-16", "dish-11", "dish-13", "dish-25", "dish-24",
  "dish-22", "dish-14", "dish-12", "dish-26", "dish-21", "dish-07", "dish-31", "dish-03",
  "dish-10", "dish-09", "dish-19", "dish-28",
  "dish-36", "dish-33", "dish-29",
  "dish-20", "dish-34", "dish-05", "dish-35", "dish-15", "dish-17"
];
const DRINK_ITEM_DISPLAY_ORDER = [
  "drink-coffee-09", "drink-coffee-02", "drink-coffee-03", "drink-coffee-04", "drink-coffee-05", "drink-coffee-07", "drink-coffee-06", "drink-coffee-08",
  "drink-alcohol-02", "drink-alcohol-07", "drink-alcohol-01", "drink-alcohol-03", "drink-alcohol-04", "drink-alcohol-05", "drink-alcohol-06",
  "drink-soft-03", "drink-soft-06", "drink-soft-04", "drink-soft-01", "drink-soft-02", "drink-soft-05"
];
const DISH_ORDER_INDEX = Object.fromEntries(DISH_DISPLAY_ORDER.map((id, index) => [id, index]));
const DRINK_ORDER_INDEX = Object.fromEntries(DRINK_ITEM_DISPLAY_ORDER.map((id, index) => [id, index]));
const WESTERN_APPETIZER_IDS = new Set(["dish-33", "dish-36", "dish-29"]);
const MENU_COPY = {
  [CHINESE_CATEGORY]: {
    eyebrow: "HOME COOKING · MADE TO SHARE",
    title: "今天想吃点什么？",
    description: "慢慢选，喜欢的都可以点。",
    footer: "A table made for sharing, chatting, and eating well."
  },
  [WESTERN_CATEGORY]: {
    eyebrow: "FRENCH BISTRO · COURSES TO SHARE",
    title: "来一点西餐仪式感",
    description: "从前菜开始，慢慢进入主菜，像翻一份真正的西餐菜单。",
    footer: "A slower rhythm, a lighter mood, and courses worth savoring."
  },
  [DRINK_CATEGORY]: {
    eyebrow: "DRINKS · COFFEE · WINE & JUICE",
    title: "喝点什么？",
    description: "咖啡、果汁和酒都可以慢慢配。",
    footer: "Choose something warm, chilled, light, or a little sparkling."
  }
};
const WESTERN_COURSES = [
  {
    key: "appetizer",
    title: "前菜",
    english: "Appetizers",
    items: (menuItems) => menuItems.filter((item) => WESTERN_APPETIZER_IDS.has(item.id))
  },
  {
    key: "main",
    title: "主菜",
    english: "Mains",
    items: (menuItems) => menuItems.filter((item) => !WESTERN_APPETIZER_IDS.has(item.id))
  }
];

const defaultReservation = {
  date: DEFAULT_DATE,
  datePending: false,
  meal: "午餐",
  count: "2",
  name: "",
  completed: false
};

const state = {
  category: localStorage.getItem(CATEGORY_KEY) || CHINESE_CATEGORY,
  cart: JSON.parse(localStorage.getItem(CART_KEY) || "{}"),
  reservation: { ...defaultReservation, ...JSON.parse(localStorage.getItem(RESERVATION_KEY) || "{}") }
};

state.reservation.completed = false;

Object.keys(state.cart).forEach((id) => {
  if (state.cart[id]?.temp === "冷") {
    state.cart[id].temp = "冰";
  }
});
localStorage.setItem(CART_KEY, JSON.stringify(state.cart));

const welcomeScreen = document.querySelector("#welcomeScreen");
const menuScreen = document.querySelector("#menuScreen");
const reservationForm = document.querySelector("#reservationForm");
const dinnerDate = document.querySelector("#dinnerDate");
const datePending = document.querySelector("#datePending");
const mealPeriodInputs = [...document.querySelectorAll("input[name='mealPeriod']")];
const guestCount = document.querySelector("#guestCount");
const guestName = document.querySelector("#guestName");
const filters = document.querySelector("#filters");
const menuGrid = document.querySelector("#menuGrid");
const drinkMenu = document.querySelector("#drinkMenu");
const drinkGrid = document.querySelector("#drinkGrid");
const cartCount = document.querySelector("#cartCount");
const openCartButton = document.querySelector("#openCart");
const orderPanel = document.querySelector("#orderPanel");
const orderItems = document.querySelector("#orderItems");
const orderReservationText = document.querySelector("#orderReservationText");
const scrim = document.querySelector("#scrim");
const orderNotePresets = [...document.querySelectorAll("input[name='orderNotePreset']")];
const orderNoteOther = document.querySelector("#orderNoteOther");
const menuFooterNote = document.querySelector("#menuFooterNote");
const brandCuisineLine = document.querySelector("#brandCuisineLine");

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
}

function saveReservation() {
  localStorage.setItem(RESERVATION_KEY, JSON.stringify(state.reservation));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSavedNoteState() {
  const raw = localStorage.getItem(NOTE_KEY);
  if (!raw) {
    return { presets: [], other: "" };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      presets: Array.isArray(parsed.presets) ? parsed.presets : [],
      other: typeof parsed.other === "string" ? parsed.other : ""
    };
  } catch {
    return { presets: [], other: raw };
  }
}

function saveNoteState() {
  const data = {
    presets: orderNotePresets.filter((input) => input.checked).map((input) => input.value),
    other: orderNoteOther.value.trim()
  };
  localStorage.setItem(NOTE_KEY, JSON.stringify(data));
}

function setupFormDefaults() {
  guestCount.innerHTML = Array.from({ length: 6 }, (_, index) => {
    const value = String(index + 1);
    return `<option value="${value}">${value} 人</option>`;
  }).join("");

  dinnerDate.value = state.reservation.date || DEFAULT_DATE;
  guestCount.value = state.reservation.count || "2";
  guestName.value = state.reservation.name || "";
  mealPeriodInputs.forEach((input) => {
    input.checked = input.value === (state.reservation.meal || "午餐");
  });
  const savedNote = getSavedNoteState();
  orderNotePresets.forEach((input) => {
    input.checked = savedNote.presets.includes(input.value);
  });
  orderNoteOther.value = savedNote.other;
  syncDatePending();
}

function getMealPeriod() {
  return mealPeriodInputs.find((input) => input.checked)?.value || "午餐";
}

function readReservationFromForm({ completed = state.reservation.completed } = {}) {
  state.reservation = {
    date: dinnerDate.value || DEFAULT_DATE,
    datePending: datePending.getAttribute("aria-pressed") === "true",
    meal: getMealPeriod(),
    count: guestCount.value || "2",
    name: guestName.value.trim(),
    completed
  };
  saveReservation();
}

function syncDatePending() {
  const pending = Boolean(state.reservation.datePending);
  datePending.setAttribute("aria-pressed", String(pending));
  datePending.closest(".date-control")?.classList.toggle("is-pending", pending);
  dinnerDate.disabled = pending;
  if (!dinnerDate.value) dinnerDate.value = DEFAULT_DATE;
}

function formatDate(dateValue) {
  if (state.reservation.datePending) return "日期待定";
  const date = new Date(`${dateValue || DEFAULT_DATE}T00:00:00`);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date);
  return `${month}月${day}日${weekday}`;
}

function formatReservation() {
  const meal = state.reservation.meal || "午餐";
  const count = state.reservation.count || "2";
  const name = state.reservation.name || "未填写";
  return `${formatDate(state.reservation.date)} · ${meal} · ${count}人 · ${name}`;
}

function showWelcome() {
  welcomeScreen.classList.remove("is-hidden");
  menuScreen.classList.add("is-hidden");
}

function showMenu() {
  welcomeScreen.classList.add("is-hidden");
  menuScreen.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function syncScreens() {
  if (state.reservation.completed) {
    showMenu();
  } else {
    showWelcome();
  }
}

function getCategories() {
  return MENU_TYPES;
}

function isWesternCategory(category = state.category) {
  return category === WESTERN_CATEGORY;
}

function getMenuCopy() {
  return MENU_COPY[state.category] || MENU_COPY[CHINESE_CATEGORY];
}

function sortByDisplayOrder(items, indexMap) {
  return [...items].sort((a, b) => {
    const aIndex = indexMap[a.id] ?? Number.MAX_SAFE_INTEGER;
    const bIndex = indexMap[b.id] ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}

function syncMenuTheme() {
  const isWestern = isWesternCategory();
  const showDrinks = state.category === DRINK_CATEGORY;
  const copy = getMenuCopy();

  menuScreen.classList.toggle("theme-western", isWestern);
  menuScreen.classList.toggle("theme-drinks", showDrinks);
  menuGrid.classList.toggle("is-western-menu", isWestern);
  menuGrid.classList.toggle("is-chinese-menu", !isWestern && !showDrinks);
  menuFooterNote.textContent = copy.footer;
  brandCuisineLine.textContent = isWestern ? "WESTERN · APPETIZERS · MAINS" : "CHINESE · WESTERN · DRINKS";
}

function getDrinkItems() {
  return window.DRINK_GROUPS.flatMap((group) =>
    sortByDisplayOrder(group.items, DRINK_ORDER_INDEX).map((item) => ({
      ...item,
      groupId: group.id,
      group: group.title,
      groupEnglish: group.english
    }))
  );
}

function getSelectedDishes() {
  return sortByDisplayOrder(window.MENU_ITEMS, DISH_ORDER_INDEX)
    .filter((item) => state.cart[item.id])
    .map((item) => ({ ...item, kind: "dish" }));
}

function getSelectedDrinks() {
  return getDrinkItems()
    .filter((item) => state.cart[item.id])
    .map((item) => ({
      ...item,
      kind: "drink",
      temp: state.cart[item.id].temp || item.defaultTemp || "",
      quantity: Number(state.cart[item.id].quantity || 1)
    }));
}

function getDishImage(item) {
  return item.image;
}

function setSelected(id, selected, options = {}) {
  if (selected) {
    state.cart[id] = { selected: true, ...options };
  } else {
    delete state.cart[id];
  }
  saveCart();
  render();
}

function setDrinkTemperature(item, temp) {
  const quantity = Number(state.cart[item.id]?.quantity || 1);
  setSelected(item.id, true, { temp, quantity });
}

function setDrinkQuantity(item, quantity) {
  const nextQuantity = Math.max(0, Math.min(6, quantity));
  if (nextQuantity === 0) {
    setSelected(item.id, false);
    return;
  }
  const temp = state.cart[item.id]?.temp || item.defaultTemp || item.temperatures?.[0] || "";
  setSelected(item.id, true, { temp, quantity: nextQuantity });
}

function formatDrinkName(item) {
  return item.temp ? `${item.name}（${item.temp}）` : item.name;
}

function getDrinkImage(item) {
  if (item.groupId === "coffee") return "assets/drink-coffee-watercolor.png";
  if (item.groupId === "alcohol") return "assets/drink-alcohol-watercolor.png";
  return "assets/drink-soft-watercolor.png";
}

function renderDishRow(item, index, { western = false } = {}) {
  const selected = Boolean(state.cart[item.id]);

  return `
    <article class="dish-row ${selected ? "is-selected" : ""} ${western ? "western-dish-row" : ""}">
      <div class="dish-number">${String(index).padStart(2, "0")}</div>
      <img class="dish-art" src="${escapeHtml(getDishImage(item))}" alt="${escapeHtml(item.name)}" loading="lazy">
      <div class="dish-copy">
        <h3>${escapeHtml(item.name)}</h3>
        <span class="english">${escapeHtml(item.english)}</span>
        <p class="line">${escapeHtml(item.line)}</p>
      </div>
      <button
        class="check-button"
        type="button"
        data-action="toggle-dish"
        data-id="${escapeHtml(item.id)}"
        aria-pressed="${selected}"
        aria-label="${selected ? "取消" : "选择"}${escapeHtml(item.name)}"
      >${selected ? "✓" : ""}</button>
    </article>
  `;
}

function renderFilters() {
  const categories = getCategories();
  if (!categories.includes(state.category)) {
    state.category = categories[0];
  }

  filters.innerHTML = categories.map((category) => `
    <button
      class="filter-button"
      type="button"
      aria-pressed="${state.category === category}"
      data-category="${escapeHtml(category)}"
    >${escapeHtml(category)}</button>
  `).join("");
}

function renderMenu() {
  const showDrinks = state.category === DRINK_CATEGORY;
  menuGrid.hidden = showDrinks;
  drinkMenu.hidden = !showDrinks;

  if (showDrinks) {
    menuGrid.innerHTML = "";
    return;
  }

  const cuisineItems = sortByDisplayOrder(
    window.MENU_ITEMS.filter((item) => item.cuisine === state.category),
    DISH_ORDER_INDEX
  );
  const westernMenu = isWesternCategory();
  let runningIndex = 0;
  const sections = westernMenu
    ? WESTERN_COURSES.map((course) => ({
        title: course.title,
        english: course.english,
        items: course.items(cuisineItems)
      }))
    : COURSE_ORDER.map((course) => ({
        title: course,
        english: COURSE_ENGLISH[course],
        items: cuisineItems.filter((item) => item.category === course)
      }));

  menuGrid.innerHTML = sections.map((section) => {
    if (!section.items.length) return "";
    const rows = section.items.map((item) => {
      runningIndex += 1;
      return renderDishRow(item, runningIndex, { western: westernMenu });
    }).join("");

    return `
      <section class="menu-course-section ${westernMenu ? "western-course-section" : ""}">
        <header class="menu-course-heading ${westernMenu ? "western-course-heading" : ""}">
          <span>${escapeHtml(section.english)}</span>
          <h2>${escapeHtml(section.title)}</h2>
        </header>
        <div class="menu-course-list">${rows}</div>
      </section>
    `;
  }).join("");
}

function renderDrinks() {
  let drinkIndex = 0;
  drinkGrid.innerHTML = window.DRINK_GROUPS.map((group) => `
    <section class="drink-group">
      <div class="drink-group-title">
        <span>${escapeHtml(group.english)}</span>
        <h3>${escapeHtml(group.title)}</h3>
      </div>
      <div class="drink-list">
        ${sortByDisplayOrder(group.items, DRINK_ORDER_INDEX).map((item) => {
          drinkIndex += 1;
          const selected = Boolean(state.cart[item.id]);
          const temp = state.cart[item.id]?.temp || item.defaultTemp || "";
          const quantity = Number(state.cart[item.id]?.quantity || 0);
          return `
            <article class="drink-row ${selected ? "is-selected" : ""}">
              <div class="drink-number">${String(drinkIndex).padStart(2, "0")}</div>
              <div class="drink-copy">
                <strong>${escapeHtml(item.name)}</strong>
                <span>${escapeHtml(item.english)}</span>
              </div>
              <div class="drink-row-controls">
                ${item.temperatures ? `
                  <div class="temperature-row" aria-label="${escapeHtml(item.name)} 温度">
                    ${item.temperatures.map((option) => `
                      <button
                        class="temp-button"
                        type="button"
                        data-action="set-temp"
                        data-id="${escapeHtml(item.id)}"
                        data-temp="${escapeHtml(option)}"
                        aria-pressed="${selected && temp === option}"
                      >${escapeHtml(option)}</button>
                    `).join("")}
                  </div>
                ` : ""}
                <div class="drink-quantity" aria-label="${escapeHtml(item.name)} 杯数">
                  <button type="button" data-action="drink-minus" data-id="${escapeHtml(item.id)}" aria-label="减少一杯">−</button>
                  <strong>${quantity}</strong>
                  <button type="button" data-action="drink-plus" data-id="${escapeHtml(item.id)}" aria-label="增加一杯">+</button>
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `).join("");
}

function renderOrder() {
  const selectedDishes = getSelectedDishes();
  const selectedDrinks = getSelectedDrinks();
  const selected = [...selectedDishes, ...selectedDrinks];
  cartCount.textContent = selectedDishes.length + selectedDrinks.reduce((sum, item) => sum + item.quantity, 0);

  if (selected.length === 0) {
    orderItems.innerHTML = '<div class="empty-order">还没有点菜<br><span>No dishes yet.</span></div>';
    return;
  }

  const dishHtml = selectedDishes.map((item) => `
    <div class="order-item">
      <img src="${escapeHtml(getDishImage(item))}" alt="">
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.english)}</p>
      </div>
      <div class="order-item-actions">
        <button
          class="order-remove-button"
          type="button"
          data-action="remove-dish"
          data-id="${escapeHtml(item.id)}"
          aria-label="删除${escapeHtml(item.name)}"
        >删除</button>
      </div>
    </div>
  `).join("");

  const drinkHtml = selectedDrinks.map((item) => `
    <div class="order-item">
      <img class="drink-mark" src="${escapeHtml(getDrinkImage(item))}" alt="">
      <div>
        <h3>${escapeHtml(formatDrinkName(item))}</h3>
        <p>${escapeHtml(item.english)}</p>
      </div>
      <div class="order-item-actions is-drink-actions">
        <div class="order-drink-stepper" aria-label="${escapeHtml(item.name)} 杯数调整">
          <button
            type="button"
            data-action="order-drink-minus"
            data-id="${escapeHtml(item.id)}"
            aria-label="减少${escapeHtml(item.name)}一杯"
          >−</button>
          <strong>${item.quantity}</strong>
          <button
            type="button"
            data-action="order-drink-plus"
            data-id="${escapeHtml(item.id)}"
            aria-label="增加${escapeHtml(item.name)}一杯"
          >+</button>
        </div>
        <button
          class="order-remove-button"
          type="button"
          data-action="remove-drink"
          data-id="${escapeHtml(item.id)}"
          aria-label="删除${escapeHtml(item.name)}"
        >删除</button>
      </div>
    </div>
  `).join("");

  orderItems.innerHTML = `
    ${selectedDishes.length ? '<p class="order-section-label">菜品</p>' : ""}
    ${dishHtml}
    ${selectedDrinks.length ? '<p class="order-section-label">饮品</p>' : ""}
    ${drinkHtml}
  `;
}

function render() {
  orderReservationText.textContent = formatReservation();
  syncMenuTheme();
  renderFilters();
  renderDrinks();
  renderMenu();
  renderOrder();
}

function togglePanel(force) {
  const shouldOpen = typeof force === "boolean" ? force : !orderPanel.classList.contains("open");
  orderPanel.classList.toggle("open", shouldOpen);
  scrim.classList.toggle("open", shouldOpen);
  openCartButton.classList.toggle("is-hidden", shouldOpen);
}

function buildOrderText() {
  const selectedDishes = getSelectedDishes();
  const selectedDrinks = getSelectedDrinks();
  const notes = [
    ...orderNotePresets.filter((input) => input.checked).map((input) => input.value),
    orderNoteOther.value.trim() ? `其他：${orderNoteOther.value.trim()}` : ""
  ].filter(Boolean);
  const note = notes.join("；") || "无";
  const lines = [
    "来家里吃饭 · 订单",
    `预约：${formatReservation()}`
  ];

  if (selectedDishes.length) {
    lines.push("菜品：", ...selectedDishes.map((item) => `- ${item.name} / ${item.english}`));
  }
  if (selectedDrinks.length) {
    lines.push("饮品：", ...selectedDrinks.map((item) => `- ${formatDrinkName(item)} × ${item.quantity}杯 / ${item.english}`));
  }
  if (!selectedDishes.length && !selectedDrinks.length) {
    lines.push("还没有点菜");
  }
  lines.push(`备注：${note}`);
  return lines.join("\n");
}

async function copyOrder() {
  const text = buildOrderText();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt("复制这份订单", text);
  }
}

setupFormDefaults();
syncScreens();
render();

datePending.addEventListener("click", () => {
  const pending = datePending.getAttribute("aria-pressed") !== "true";
  state.reservation.datePending = pending;
  datePending.setAttribute("aria-pressed", String(pending));
  datePending.closest(".date-control")?.classList.toggle("is-pending", pending);
  dinnerDate.disabled = pending;
  if (!pending && !dinnerDate.value) dinnerDate.value = DEFAULT_DATE;
  readReservationFromForm();
  render();
});

reservationForm.addEventListener("input", () => {
  readReservationFromForm();
  render();
});

reservationForm.addEventListener("change", () => {
  readReservationFromForm();
  render();
});

document.querySelector("#enterMenu").addEventListener("click", () => {
  readReservationFromForm({ completed: true });
  syncScreens();
  render();
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  localStorage.setItem(CATEGORY_KEY, state.category);
  render();
});

menuGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='toggle-dish']");
  if (!button) return;
  const id = button.dataset.id;
  setSelected(id, !state.cart[id]);
});

drinkGrid.addEventListener("click", (event) => {
  const tempButton = event.target.closest("[data-action='set-temp']");
  if (tempButton) {
    const item = getDrinkItems().find((drink) => drink.id === tempButton.dataset.id);
    if (item) setDrinkTemperature(item, tempButton.dataset.temp);
    return;
  }

  const quantityButton = event.target.closest("[data-action='drink-minus'], [data-action='drink-plus']");
  if (!quantityButton) return;
  const item = getDrinkItems().find((drink) => drink.id === quantityButton.dataset.id);
  if (!item) return;
  const currentQuantity = Number(state.cart[item.id]?.quantity || 0);
  const change = quantityButton.dataset.action === "drink-plus" ? 1 : -1;
  setDrinkQuantity(item, currentQuantity + change);
});

document.querySelector("#openCart").addEventListener("click", () => togglePanel(true));
document.querySelector("#closeCart").addEventListener("click", () => togglePanel(false));
document.querySelector("#orderEditReservation").addEventListener("click", () => {
  state.reservation.completed = false;
  saveReservation();
  togglePanel(false);
  syncScreens();
});
scrim.addEventListener("click", () => togglePanel(false));

orderItems.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const { action, id } = actionButton.dataset;
  if (!id) return;

  if (action === "remove-dish") {
    setSelected(id, false);
    return;
  }

  const drink = getDrinkItems().find((item) => item.id === id);
  if (!drink) return;

  if (action === "remove-drink") {
    setSelected(id, false);
    return;
  }

  const currentQuantity = Number(state.cart[id]?.quantity || 0);
  if (action === "order-drink-minus") {
    setDrinkQuantity(drink, currentQuantity - 1);
    return;
  }

  if (action === "order-drink-plus") {
    setDrinkQuantity(drink, currentQuantity + 1);
  }
});

orderNotePresets.forEach((input) => {
  input.addEventListener("change", saveNoteState);
});

orderNoteOther.addEventListener("input", saveNoteState);
const CART_KEY = "home-menu-cart-v8";
const RESERVATION_KEY = "home-menu-reservation-v5";
const NOTE_KEY = "home-menu-note";
const CATEGORY_KEY = "home-menu-category";
const CHINESE_CATEGORY = "中餐";
const WESTERN_CATEGORY = "西餐";
const DRINK_CATEGORY = "饮品";
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DEFAULT_DATE = getTodayDateString();
const MENU_TYPES = [CHINESE_CATEGORY, WESTERN_CATEGORY, DRINK_CATEGORY];
const COURSE_ORDER = ["海鲜", "肉菜", "蔬菜", "主食"];
const COURSE_ENGLISH = {
  海鲜: "Seafood",
  肉菜: "Meat",
  蔬菜: "Vegetables",
  主食: "Rice & Noodles"
};
const DISH_DISPLAY_ORDER = [
  "dish-01", "dish-27",
  "dish-04", "dish-16", "dish-11", "dish-13", "dish-25", "dish-24",
  "dish-22", "dish-14", "dish-12", "dish-26", "dish-21", "dish-07", "dish-31", "dish-03",
  "dish-10", "dish-09", "dish-19", "dish-28",
  "dish-36", "dish-33", "dish-29",
  "dish-20", "dish-34", "dish-05", "dish-35", "dish-15", "dish-17"
];
const DRINK_ITEM_DISPLAY_ORDER = [
  "drink-coffee-09", "drink-coffee-02", "drink-coffee-03", "drink-coffee-04", "drink-coffee-05", "drink-coffee-07", "drink-coffee-06", "drink-coffee-08",
  "drink-alcohol-02", "drink-alcohol-07", "drink-alcohol-01", "drink-alcohol-03", "drink-alcohol-04", "drink-alcohol-05", "drink-alcohol-06",
  "drink-soft-03", "drink-soft-06", "drink-soft-04", "drink-soft-01", "drink-soft-02", "drink-soft-05"
];
const DISH_ORDER_INDEX = Object.fromEntries(DISH_DISPLAY_ORDER.map((id, index) => [id, index]));
const DRINK_ORDER_INDEX = Object.fromEntries(DRINK_ITEM_DISPLAY_ORDER.map((id, index) => [id, index]));
const WESTERN_APPETIZER_IDS = new Set(["dish-33", "dish-36", "dish-29"]);
const MENU_COPY = {
  [CHINESE_CATEGORY]: {
    eyebrow: "HOME COOKING · MADE TO SHARE",
    title: "今天想吃点什么？",
    description: "慢慢选，喜欢的都可以点。",
    footer: "A table made for sharing, chatting, and eating well."
  },
  [WESTERN_CATEGORY]: {
    eyebrow: "FRENCH BISTRO · COURSES TO SHARE",
    title: "来一点西餐仪式感",
    description: "从前菜开始，慢慢进入主菜，像翻一份真正的西餐菜单。",
    footer: "A slower rhythm, a lighter mood, and courses worth savoring."
  },
  [DRINK_CATEGORY]: {
    eyebrow: "DRINKS · COFFEE · WINE & JUICE",
    title: "喝点什么？",
    description: "咖啡、果汁和酒都可以慢慢配。",
    footer: "Choose something warm, chilled, light, or a little sparkling."
  }
};
const WESTERN_COURSES = [
  {
    key: "appetizer",
    title: "前菜",
    english: "Appetizers",
    items: (menuItems) => menuItems.filter((item) => WESTERN_APPETIZER_IDS.has(item.id))
  },
  {
    key: "main",
    title: "主菜",
    english: "Mains",
    items: (menuItems) => menuItems.filter((item) => !WESTERN_APPETIZER_IDS.has(item.id))
  }
];

const defaultReservation = {
  date: DEFAULT_DATE,
  datePending: false,
  meal: "午餐",
  count: "2",
  name: "",
  completed: false
};

const state = {
  category: localStorage.getItem(CATEGORY_KEY) || CHINESE_CATEGORY,
  cart: JSON.parse(localStorage.getItem(CART_KEY) || "{}"),
  reservation: { ...defaultReservation, ...JSON.parse(localStorage.getItem(RESERVATION_KEY) || "{}") }
};

state.reservation.completed = false;

Object.keys(state.cart).forEach((id) => {
  if (state.cart[id]?.temp === "冷") {
    state.cart[id].temp = "冰";
  }
});
localStorage.setItem(CART_KEY, JSON.stringify(state.cart));

const welcomeScreen = document.querySelector("#welcomeScreen");
const menuScreen = document.querySelector("#menuScreen");
const reservationForm = document.querySelector("#reservationForm");
const dinnerDate = document.querySelector("#dinnerDate");
const datePending = document.querySelector("#datePending");
const mealPeriodInputs = [...document.querySelectorAll("input[name='mealPeriod']")];
const guestCount = document.querySelector("#guestCount");
const guestName = document.querySelector("#guestName");
const filters = document.querySelector("#filters");
const menuGrid = document.querySelector("#menuGrid");
const drinkMenu = document.querySelector("#drinkMenu");
const drinkGrid = document.querySelector("#drinkGrid");
const cartCount = document.querySelector("#cartCount");
const openCartButton = document.querySelector("#openCart");
const orderPanel = document.querySelector("#orderPanel");
const orderItems = document.querySelector("#orderItems");
const orderReservationText = document.querySelector("#orderReservationText");
const scrim = document.querySelector("#scrim");
const orderNotePresets = [...document.querySelectorAll("input[name='orderNotePreset']")];
const orderNoteOther = document.querySelector("#orderNoteOther");
const menuFooterNote = document.querySelector("#menuFooterNote");
const brandCuisineLine = document.querySelector("#brandCuisineLine");

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
}

function saveReservation() {
  localStorage.setItem(RESERVATION_KEY, JSON.stringify(state.reservation));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSavedNoteState() {
  const raw = localStorage.getItem(NOTE_KEY);
  if (!raw) {
    return { presets: [], other: "" };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      presets: Array.isArray(parsed.presets) ? parsed.presets : [],
      other: typeof parsed.other === "string" ? parsed.other : ""
    };
  } catch {
    return { presets: [], other: raw };
  }
}

function saveNoteState() {
  const data = {
    presets: orderNotePresets.filter((input) => input.checked).map((input) => input.value),
    other: orderNoteOther.value.trim()
  };
  localStorage.setItem(NOTE_KEY, JSON.stringify(data));
}

function setupFormDefaults() {
  guestCount.innerHTML = Array.from({ length: 6 }, (_, index) => {
    const value = String(index + 1);
    return `<option value="${value}">${value} 人</option>`;
  }).join("");

  dinnerDate.value = state.reservation.date || DEFAULT_DATE;
  guestCount.value = state.reservation.count || "2";
  guestName.value = state.reservation.name || "";
  mealPeriodInputs.forEach((input) => {
    input.checked = input.value === (state.reservation.meal || "午餐");
  });
  const savedNote = getSavedNoteState();
  orderNotePresets.forEach((input) => {
    input.checked = savedNote.presets.includes(input.value);
  });
  orderNoteOther.value = savedNote.other;
  syncDatePending();
}

function getMealPeriod() {
  return mealPeriodInputs.find((input) => input.checked)?.value || "午餐";
}

function readReservationFromForm({ completed = state.reservation.completed } = {}) {
  state.reservation = {
    date: dinnerDate.value || DEFAULT_DATE,
    datePending: datePending.getAttribute("aria-pressed") === "true",
    meal: getMealPeriod(),
    count: guestCount.value || "2",
    name: guestName.value.trim(),
    completed
  };
  saveReservation();
}

function syncDatePending() {
  const pending = Boolean(state.reservation.datePending);
  datePending.setAttribute("aria-pressed", String(pending));
  datePending.closest(".date-control")?.classList.toggle("is-pending", pending);
  dinnerDate.disabled = pending;
  if (!dinnerDate.value) dinnerDate.value = DEFAULT_DATE;
}

function formatDate(dateValue) {
  if (state.reservation.datePending) return "日期待定";
  const date = new Date(`${dateValue || DEFAULT_DATE}T00:00:00`);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date);
  return `${month}月${day}日${weekday}`;
}

function formatReservation() {
  const meal = state.reservation.meal || "午餐";
  const count = state.reservation.count || "2";
  const name = state.reservation.name || "未填写";
  return `${formatDate(state.reservation.date)} · ${meal} · ${count}人 · ${name}`;
}

function showWelcome() {
  welcomeScreen.classList.remove("is-hidden");
  menuScreen.classList.add("is-hidden");
}

function showMenu() {
  welcomeScreen.classList.add("is-hidden");
  menuScreen.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function syncScreens() {
  if (state.reservation.completed) {
    showMenu();
  } else {
    showWelcome();
  }
}

function getCategories() {
  return MENU_TYPES;
}

function isWesternCategory(category = state.category) {
  return category === WESTERN_CATEGORY;
}

function getMenuCopy() {
  return MENU_COPY[state.category] || MENU_COPY[CHINESE_CATEGORY];
}

function sortByDisplayOrder(items, indexMap) {
  return [...items].sort((a, b) => {
    const aIndex = indexMap[a.id] ?? Number.MAX_SAFE_INTEGER;
    const bIndex = indexMap[b.id] ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}

function syncMenuTheme() {
  const isWestern = isWesternCategory();
  const showDrinks = state.category === DRINK_CATEGORY;
  const copy = getMenuCopy();

  menuScreen.classList.toggle("theme-western", isWestern);
  menuScreen.classList.toggle("theme-drinks", showDrinks);
  menuGrid.classList.toggle("is-western-menu", isWestern);
  menuGrid.classList.toggle("is-chinese-menu", !isWestern && !showDrinks);
  menuFooterNote.textContent = copy.footer;
  brandCuisineLine.textContent = isWestern ? "WESTERN · APPETIZERS · MAINS" : "CHINESE · WESTERN · DRINKS";
}

function getDrinkItems() {
  return window.DRINK_GROUPS.flatMap((group) =>
    sortByDisplayOrder(group.items, DRINK_ORDER_INDEX).map((item) => ({
      ...item,
      groupId: group.id,
      group: group.title,
      groupEnglish: group.english
    }))
  );
}

function getSelectedDishes() {
  return sortByDisplayOrder(window.MENU_ITEMS, DISH_ORDER_INDEX)
    .filter((item) => state.cart[item.id])
    .map((item) => ({ ...item, kind: "dish" }));
}

function getSelectedDrinks() {
  return getDrinkItems()
    .filter((item) => state.cart[item.id])
    .map((item) => ({
      ...item,
      kind: "drink",
      temp: state.cart[item.id].temp || item.defaultTemp || "",
      quantity: Number(state.cart[item.id].quantity || 1)
    }));
}

function getDishImage(item) {
  return item.image;
}

function setSelected(id, selected, options = {}) {
  if (selected) {
    state.cart[id] = { selected: true, ...options };
  } else {
    delete state.cart[id];
  }
  saveCart();
  render();
}

function setDrinkTemperature(item, temp) {
  const quantity = Number(state.cart[item.id]?.quantity || 1);
  setSelected(item.id, true, { temp, quantity });
}

function setDrinkQuantity(item, quantity) {
  const nextQuantity = Math.max(0, Math.min(6, quantity));
  if (nextQuantity === 0) {
    setSelected(item.id, false);
    return;
  }
  const temp = state.cart[item.id]?.temp || item.defaultTemp || item.temperatures?.[0] || "";
  setSelected(item.id, true, { temp, quantity: nextQuantity });
}

function formatDrinkName(item) {
  return item.temp ? `${item.name}（${item.temp}）` : item.name;
}

function getDrinkImage(item) {
  if (item.groupId === "coffee") return "assets/drink-coffee-watercolor.png";
  if (item.groupId === "alcohol") return "assets/drink-alcohol-watercolor.png";
  return "assets/drink-soft-watercolor.png";
}

function renderDishRow(item, index, { western = false } = {}) {
  const selected = Boolean(state.cart[item.id]);

  return `
    <article class="dish-row ${selected ? "is-selected" : ""} ${western ? "western-dish-row" : ""}">
      <div class="dish-number">${String(index).padStart(2, "0")}</div>
      <img class="dish-art" src="${escapeHtml(getDishImage(item))}" alt="${escapeHtml(item.name)}" loading="lazy">
      <div class="dish-copy">
        <h3>${escapeHtml(item.name)}</h3>
        <span class="english">${escapeHtml(item.english)}</span>
        <p class="line">${escapeHtml(item.line)}</p>
      </div>
      <button
        class="check-button"
        type="button"
        data-action="toggle-dish"
        data-id="${escapeHtml(item.id)}"
        aria-pressed="${selected}"
        aria-label="${selected ? "取消" : "选择"}${escapeHtml(item.name)}"
      >${selected ? "✓" : ""}</button>
    </article>
  `;
}

function renderFilters() {
  const categories = getCategories();
  if (!categories.includes(state.category)) {
    state.category = categories[0];
  }

  filters.innerHTML = categories.map((category) => `
    <button
      class="filter-button"
      type="button"
      aria-pressed="${state.category === category}"
      data-category="${escapeHtml(category)}"
    >${escapeHtml(category)}</button>
  `).join("");
}

function renderMenu() {
  const showDrinks = state.category === DRINK_CATEGORY;
  menuGrid.hidden = showDrinks;
  drinkMenu.hidden = !showDrinks;

  if (showDrinks) {
    menuGrid.innerHTML = "";
    return;
  }

  const cuisineItems = sortByDisplayOrder(
    window.MENU_ITEMS.filter((item) => item.cuisine === state.category),
    DISH_ORDER_INDEX
  );
  const westernMenu = isWesternCategory();
  let runningIndex = 0;
  const sections = westernMenu
    ? WESTERN_COURSES.map((course) => ({
        title: course.title,
        english: course.english,
        items: course.items(cuisineItems)
      }))
    : COURSE_ORDER.map((course) => ({
        title: course,
        english: COURSE_ENGLISH[course],
        items: cuisineItems.filter((item) => item.category === course)
      }));

  menuGrid.innerHTML = sections.map((section) => {
    if (!section.items.length) return "";
    const rows = section.items.map((item) => {
      runningIndex += 1;
      return renderDishRow(item, runningIndex, { western: westernMenu });
    }).join("");

    return `
      <section class="menu-course-section ${westernMenu ? "western-course-section" : ""}">
        <header class="menu-course-heading ${westernMenu ? "western-course-heading" : ""}">
          <span>${escapeHtml(section.english)}</span>
          <h2>${escapeHtml(section.title)}</h2>
        </header>
        <div class="menu-course-list">${rows}</div>
      </section>
    `;
  }).join("");
}

function renderDrinks() {
  let drinkIndex = 0;
  drinkGrid.innerHTML = window.DRINK_GROUPS.map((group) => `
    <section class="drink-group">
      <div class="drink-group-title">
        <span>${escapeHtml(group.english)}</span>
        <h3>${escapeHtml(group.title)}</h3>
      </div>
      <div class="drink-list">
        ${sortByDisplayOrder(group.items, DRINK_ORDER_INDEX).map((item) => {
          drinkIndex += 1;
          const selected = Boolean(state.cart[item.id]);
          const temp = state.cart[item.id]?.temp || item.defaultTemp || "";
          const quantity = Number(state.cart[item.id]?.quantity || 0);
          return `
            <article class="drink-row ${selected ? "is-selected" : ""}">
              <div class="drink-number">${String(drinkIndex).padStart(2, "0")}</div>
              <div class="drink-copy">
                <strong>${escapeHtml(item.name)}</strong>
                <span>${escapeHtml(item.english)}</span>
              </div>
              <div class="drink-row-controls">
                ${item.temperatures ? `
                  <div class="temperature-row" aria-label="${escapeHtml(item.name)} 温度">
                    ${item.temperatures.map((option) => `
                      <button
                        class="temp-button"
                        type="button"
                        data-action="set-temp"
                        data-id="${escapeHtml(item.id)}"
                        data-temp="${escapeHtml(option)}"
                        aria-pressed="${selected && temp === option}"
                      >${escapeHtml(option)}</button>
                    `).join("")}
                  </div>
                ` : ""}
                <div class="drink-quantity" aria-label="${escapeHtml(item.name)} 杯数">
                  <button type="button" data-action="drink-minus" data-id="${escapeHtml(item.id)}" aria-label="减少一杯">−</button>
                  <strong>${quantity}</strong>
                  <button type="button" data-action="drink-plus" data-id="${escapeHtml(item.id)}" aria-label="增加一杯">+</button>
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `).join("");
}

function renderOrder() {
  const selectedDishes = getSelectedDishes();
  const selectedDrinks = getSelectedDrinks();
  const selected = [...selectedDishes, ...selectedDrinks];
  cartCount.textContent = selectedDishes.length + selectedDrinks.reduce((sum, item) => sum + item.quantity, 0);

  if (selected.length === 0) {
    orderItems.innerHTML = '<div class="empty-order">还没有点菜<br><span>No dishes yet.</span></div>';
    return;
  }

  const dishHtml = selectedDishes.map((item) => `
    <div class="order-item">
      <img src="${escapeHtml(getDishImage(item))}" alt="">
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.english)}</p>
      </div>
      <div class="order-item-actions">
        <button
          class="order-remove-button"
          type="button"
          data-action="remove-dish"
          data-id="${escapeHtml(item.id)}"
          aria-label="删除${escapeHtml(item.name)}"
        >删除</button>
      </div>
    </div>
  `).join("");

  const drinkHtml = selectedDrinks.map((item) => `
    <div class="order-item">
      <img class="drink-mark" src="${escapeHtml(getDrinkImage(item))}" alt="">
      <div>
        <h3>${escapeHtml(formatDrinkName(item))}</h3>
        <p>${escapeHtml(item.english)}</p>
      </div>
      <div class="order-item-actions is-drink-actions">
        <div class="order-drink-stepper" aria-label="${escapeHtml(item.name)} 杯数调整">
          <button
            type="button"
            data-action="order-drink-minus"
            data-id="${escapeHtml(item.id)}"
            aria-label="减少${escapeHtml(item.name)}一杯"
          >−</button>
          <strong>${item.quantity}</strong>
          <button
            type="button"
            data-action="order-drink-plus"
            data-id="${escapeHtml(item.id)}"
            aria-label="增加${escapeHtml(item.name)}一杯"
          >+</button>
        </div>
        <button
          class="order-remove-button"
          type="button"
          data-action="remove-drink"
          data-id="${escapeHtml(item.id)}"
          aria-label="删除${escapeHtml(item.name)}"
        >删除</button>
      </div>
    </div>
  `).join("");

  orderItems.innerHTML = `
    ${selectedDishes.length ? '<p class="order-section-label">菜品</p>' : ""}
    ${dishHtml}
    ${selectedDrinks.length ? '<p class="order-section-label">饮品</p>' : ""}
    ${drinkHtml}
  `;
}

function render() {
  orderReservationText.textContent = formatReservation();
  syncMenuTheme();
  renderFilters();
  renderDrinks();
  renderMenu();
  renderOrder();
}

function togglePanel(force) {
  const shouldOpen = typeof force === "boolean" ? force : !orderPanel.classList.contains("open");
  orderPanel.classList.toggle("open", shouldOpen);
  scrim.classList.toggle("open", shouldOpen);
  openCartButton.classList.toggle("is-hidden", shouldOpen);
}

function buildOrderText() {
  const selectedDishes = getSelectedDishes();
  const selectedDrinks = getSelectedDrinks();
  const notes = [
    ...orderNotePresets.filter((input) => input.checked).map((input) => input.value),
    orderNoteOther.value.trim() ? `其他：${orderNoteOther.value.trim()}` : ""
  ].filter(Boolean);
  const note = notes.join("；") || "无";
  const lines = [
    "来家里吃饭 · 订单",
    `预约：${formatReservation()}`
  ];

  if (selectedDishes.length) {
    lines.push("菜品：", ...selectedDishes.map((item) => `- ${item.name} / ${item.english}`));
  }
  if (selectedDrinks.length) {
    lines.push("饮品：", ...selectedDrinks.map((item) => `- ${formatDrinkName(item)} × ${item.quantity}杯 / ${item.english}`));
  }
  if (!selectedDishes.length && !selectedDrinks.length) {
    lines.push("还没有点菜");
  }
  lines.push(`备注：${note}`);
  return lines.join("\n");
}

async function copyOrder() {
  const text = buildOrderText();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt("复制这份订单", text);
  }
}

setupFormDefaults();
syncScreens();
render();

datePending.addEventListener("click", () => {
  const pending = datePending.getAttribute("aria-pressed") !== "true";
  state.reservation.datePending = pending;
  datePending.setAttribute("aria-pressed", String(pending));
  datePending.closest(".date-control")?.classList.toggle("is-pending", pending);
  dinnerDate.disabled = pending;
  if (!pending && !dinnerDate.value) dinnerDate.value = DEFAULT_DATE;
  readReservationFromForm();
  render();
});

reservationForm.addEventListener("input", () => {
  readReservationFromForm();
  render();
});

reservationForm.addEventListener("change", () => {
  readReservationFromForm();
  render();
});

document.querySelector("#enterMenu").addEventListener("click", () => {
  readReservationFromForm({ completed: true });
  syncScreens();
  render();
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  localStorage.setItem(CATEGORY_KEY, state.category);
  render();
});

menuGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='toggle-dish']");
  if (!button) return;
  const id = button.dataset.id;
  setSelected(id, !state.cart[id]);
});

drinkGrid.addEventListener("click", (event) => {
  const tempButton = event.target.closest("[data-action='set-temp']");
  if (tempButton) {
    const item = getDrinkItems().find((drink) => drink.id === tempButton.dataset.id);
    if (item) setDrinkTemperature(item, tempButton.dataset.temp);
    return;
  }

  const quantityButton = event.target.closest("[data-action='drink-minus'], [data-action='drink-plus']");
  if (!quantityButton) return;
  const item = getDrinkItems().find((drink) => drink.id === quantityButton.dataset.id);
  if (!item) return;
  const currentQuantity = Number(state.cart[item.id]?.quantity || 0);
  const change = quantityButton.dataset.action === "drink-plus" ? 1 : -1;
  setDrinkQuantity(item, currentQuantity + change);
});

document.querySelector("#openCart").addEventListener("click", () => togglePanel(true));
document.querySelector("#closeCart").addEventListener("click", () => togglePanel(false));
document.querySelector("#orderEditReservation").addEventListener("click", () => {
  state.reservation.completed = false;
  saveReservation();
  togglePanel(false);
  syncScreens();
});
scrim.addEventListener("click", () => togglePanel(false));

orderItems.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const { action, id } = actionButton.dataset;
  if (!id) return;

  if (action === "remove-dish") {
    setSelected(id, false);
    return;
  }

  const drink = getDrinkItems().find((item) => item.id === id);
  if (!drink) return;

  if (action === "remove-drink") {
    setSelected(id, false);
    return;
  }

  const currentQuantity = Number(state.cart[id]?.quantity || 0);
  if (action === "order-drink-minus") {
    setDrinkQuantity(drink, currentQuantity - 1);
    return;
  }

  if (action === "order-drink-plus") {
    setDrinkQuantity(drink, currentQuantity + 1);
  }
});

orderNotePresets.forEach((input) => {
  input.addEventListener("change", saveNoteState);
});

orderNoteOther.addEventListener("input", saveNoteState);
