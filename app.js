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
