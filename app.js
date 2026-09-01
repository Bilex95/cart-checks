// cart-checks — a small cart with VAT and a server-checked coupon.
// The coupon lookup goes to /api/coupon so tests can intercept it.

const VAT_RATE = 0.075;
const PRODUCTS = [
  { id: "beans", name: "Honey beans (1kg)", price: 1800 },
  { id: "rice", name: "Basmati rice (5kg)", price: 9500 },
  { id: "oil", name: "Groundnut oil (1L)", price: 2600 },
];

let cart = []; // { id, qty }
let discountPct = 0;

const catalog = document.getElementById("catalog");
const linesEl = document.getElementById("lines");
const emptyEl = document.getElementById("empty");
const totalsEl = document.getElementById("totals");
const couponMsg = document.getElementById("coupon-msg");

const naira = (n) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const product = (id) => PRODUCTS.find((p) => p.id === id);

function renderCatalog() {
  catalog.innerHTML = "";
  for (const p of PRODUCTS) {
    const row = document.createElement("div");
    row.className = "product";
    row.innerHTML = `<span>${p.name} — ${naira(p.price)}</span>`;
    const btn = document.createElement("button");
    btn.className = "primary";
    btn.textContent = "Add to cart";
    btn.dataset.add = p.id;
    btn.addEventListener("click", () => addToCart(p.id));
    row.appendChild(btn);
    catalog.appendChild(row);
  }
}

function addToCart(id) {
  const item = cart.find((c) => c.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });
  render();
}

function setQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((c) => c.id !== id);
  render();
}

function subtotal() {
  return cart.reduce((sum, c) => sum + product(c.id).price * c.qty, 0);
}

function render() {
  linesEl.innerHTML = "";
  for (const c of cart) {
    const p = product(c.id);
    const line = document.createElement("div");
    line.className = "line";
    line.dataset.line = c.id;
    line.innerHTML = `<span>${p.name}</span>`;
    const controls = document.createElement("span");
    controls.className = "qty";
    controls.innerHTML = `
      <button type="button" aria-label="Decrease ${p.name}" data-dec="${c.id}">−</button>
      <span data-qty="${c.id}">${c.qty}</span>
      <button type="button" aria-label="Increase ${p.name}" data-inc="${c.id}">+</button>
      <button type="button" aria-label="Remove ${p.name}" data-remove="${c.id}">✕</button>`;
    line.appendChild(controls);
    linesEl.appendChild(line);
  }
  linesEl.querySelectorAll("[data-dec]").forEach((b) => (b.onclick = () => setQty(b.dataset.dec, -1)));
  linesEl.querySelectorAll("[data-inc]").forEach((b) => (b.onclick = () => setQty(b.dataset.inc, 1)));
  linesEl.querySelectorAll("[data-remove]").forEach((b) => (b.onclick = () => setQty(b.dataset.remove, -9999)));

  emptyEl.hidden = cart.length > 0;

  const sub = subtotal();
  const discount = Math.round(sub * (discountPct / 100));
  const taxed = sub - discount;
  const vat = Math.round(taxed * VAT_RATE);
  const grand = taxed + vat;

  totalsEl.innerHTML = `
    <div class="row"><span>Subtotal</span><span data-total="subtotal">${naira(sub)}</span></div>
    ${discountPct ? `<div class="row"><span>Discount (${discountPct}%)</span><span data-total="discount">−${naira(discount)}</span></div>` : ""}
    <div class="row"><span>VAT (7.5%)</span><span data-total="vat">${naira(vat)}</span></div>
    <div class="row grand"><span>Total</span><span data-total="grand">${naira(grand)}</span></div>`;
}

async function applyCoupon() {
  const code = document.getElementById("coupon").value.trim();
  couponMsg.textContent = "";
  couponMsg.className = "";
  if (!code) return;
  try {
    const res = await fetch(`/api/coupon?code=${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    if (data.valid) {
      discountPct = data.percentOff;
      couponMsg.textContent = `Applied — ${data.percentOff}% off.`;
      couponMsg.className = "ok";
    } else {
      discountPct = 0;
      couponMsg.textContent = "That code isn't valid.";
      couponMsg.className = "bad";
    }
  } catch {
    couponMsg.textContent = "Couldn't check that code — try again.";
    couponMsg.className = "bad";
  }
  render();
}

document.getElementById("apply").addEventListener("click", applyCoupon);

renderCatalog();
render();
