const phone="2347039586838";
const CART_EXPIRY_MS = 12 * 60 * 60 * 1000;
let cart = {};
let filter="All";

function loadCart(){
  const saved = JSON.parse(localStorage.getItem("catalogCart") || "null");
  const expiresAt = Number(localStorage.getItem("catalogCartExpiresAt") || 0);
  if(saved && expiresAt && Date.now() < expiresAt){
    cart = saved;
  }else{
    cart = {};
    localStorage.removeItem("catalogCart");
    localStorage.removeItem("catalogCartExpiresAt");
  }
}
function startCartExpiry(){
  if(!Object.keys(cart).length) return;
  const currentExpiry = Number(localStorage.getItem("catalogCartExpiresAt") || 0);
  if(!currentExpiry || currentExpiry <= Date.now()){
    localStorage.setItem("catalogCartExpiresAt", String(Date.now() + CART_EXPIRY_MS));
  }
}
function clearExpiredCart(){
  const expiresAt = Number(localStorage.getItem("catalogCartExpiresAt") || 0);
  if(expiresAt && Date.now() >= expiresAt){
    cart = {};
    localStorage.removeItem("catalogCart");
    localStorage.removeItem("catalogCartExpiresAt");
    renderCart();
  }
}
function updateCartTimer(){
  const wrap = document.getElementById("cartTimerWrap");
  const timer = document.getElementById("cartTimer");
  const expiresAt = Number(localStorage.getItem("catalogCartExpiresAt") || 0);
  if(!Object.keys(cart).length || !expiresAt){
    wrap.classList.add("hidden");
    return;
  }
  wrap.classList.remove("hidden");
  const remaining = Math.max(0, expiresAt - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  timer.textContent = [hours, minutes, seconds].map((n,i)=>String(n).padStart(2,"0")).join(":");
  wrap.classList.toggle("expiring", remaining <= 30 * 60 * 1000);
  if(remaining <= 0) clearExpiredCart();
}
const money=n=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(n);

function save(){
  if(Object.keys(cart).length){
    startCartExpiry();
    localStorage.setItem("catalogCart",JSON.stringify(cart));
  }else{
    localStorage.removeItem("catalogCart");
    localStorage.removeItem("catalogCartExpiresAt");
  }
  updateCartTimer();
}
function renderProducts(){
  const grid=document.getElementById("productGrid");
  const list=window.PRODUCTS.filter(p=>filter==="All"||p.category===filter);
  document.getElementById("productCount").textContent=`${list.length} item${list.length!==1?"s":""}`;
  grid.innerHTML=list.length?list.map(p=>`
    <article class="product-card">
      <div class="product-image"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
      <div class="product-info">
        <span class="tag">${p.category}</span>
        <div class="product-name">${p.name}</div>
        <div class="details">${p.details}</div>
        <div class="price-row"><span class="price">${money(p.price)}</span><button class="add-btn" onclick="addToCart(${p.id})" aria-label="Add ${p.name} to cart">+</button></div>
      </div>
    </article>`).join(""):`<div class="empty">No products in this category yet.</div>`;
}
function addToCart(id){cart[id]=(cart[id]||0)+1;save();renderCart();openCart();}
function changeQty(id,delta){cart[id]=(cart[id]||0)+delta;if(cart[id]<=0)delete cart[id];save();renderCart();}
function renderCart(){
  clearExpiredCart();
  updateCartTimer();
  const ids=Object.keys(cart);
  const count=ids.reduce((s,id)=>s+cart[id],0);
  document.getElementById("cartCount").textContent=count;
  const items=document.getElementById("cartItems");
  if(!ids.length){items.innerHTML='<div class="empty">Your cart is empty.<br><br>Browse the collection and add something you love.</div>';document.getElementById("cartTotal").textContent="₦0";return;}
  let total=0;
  items.innerHTML=ids.map(id=>{
    const p=window.PRODUCTS.find(x=>x.id==id), qty=cart[id]; total+=p.price*qty;
    return `<div class="cart-item"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><small>${money(p.price)}</small><div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><span>${qty}</span><button onclick="changeQty(${p.id},1)">+</button><button class="remove" onclick="changeQty(${p.id},-${qty})">Remove</button></div></div><b>${money(p.price*qty)}</b></div>`;
  }).join("");
  document.getElementById("cartTotal").textContent=money(total);
}
function openCart(){document.getElementById("cartDrawer").classList.add("open");document.getElementById("overlay").classList.add("show");}
function closeCart(){document.getElementById("cartDrawer").classList.remove("open");document.getElementById("overlay").classList.remove("show");}
document.getElementById("cartButton").onclick=openCart;
document.getElementById("closeCart").onclick=closeCart;
document.getElementById("overlay").onclick=closeCart;
document.querySelectorAll(".chip").forEach(btn=>btn.onclick=()=>{filter=btn.dataset.filter;document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));btn.classList.add("active");renderProducts();});
document.getElementById("whatsappOrder").onclick=()=>{
  const ids=Object.keys(cart); if(!ids.length)return;
  let total=0, lines=["Hello! I'd like to place an order from the catalogue:",""];
  ids.forEach(id=>{const p=window.PRODUCTS.find(x=>x.id==id),qty=cart[id],sub=p.price*qty;total+=sub;lines.push(`• ${p.name} — ${qty} × ${money(p.price)} = ${money(sub)}`);});
  lines.push("",`Total: ${money(total)}`,"","Please confirm availability and delivery/pickup details.");
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`,"_blank");
};
loadCart();
startCartExpiry();
renderProducts();
renderCart();
updateCartTimer();
setInterval(updateCartTimer, 1000);
