import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, addDoc, doc, getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let products = [];
let cart = JSON.parse(localStorage.getItem("groceryCart") || "[]");
let settings = { shopName:"தாய் தந்தை மளிகை கடை", whatsapp:"" };

const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0);
const toast = text => { $("toast").textContent=text; $("toast").classList.remove("hidden"); setTimeout(()=>$("toast").classList.add("hidden"),1800); };
const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

async function loadSettings(){
  try{
    const snap = await getDoc(doc(db,"settings","store"));
    if(snap.exists()) settings = {...settings,...snap.data()};
    $("shopName").textContent=settings.shopName;
    document.title=settings.shopName;
  }catch(e){ console.error(e); }
}

function saveCart(){
  localStorage.setItem("groceryCart",JSON.stringify(cart));
  $("cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
}

function rebuildCategories(){
  const current=$("categoryFilter").value;
  $("categoryFilter").innerHTML='<option value="all">அனைத்து வகைகள்</option>';
  [...new Set(products.map(p=>p.category).filter(Boolean))].sort().forEach(c=>{
    const o=document.createElement("option");o.value=c;o.textContent=c;$("categoryFilter").appendChild(o);
  });
  if([...$("categoryFilter").options].some(o=>o.value===current)) $("categoryFilter").value=current;
}

function renderProducts(){
  const term=$("searchInput").value.trim().toLowerCase();
  const category=$("categoryFilter").value;
  const filtered=products.filter(p=>(category==="all"||p.category===category)&&p.name.toLowerCase().includes(term));
  $("productGrid").innerHTML="";
  filtered.forEach(p=>{
    const card=document.createElement("article"); card.className="product-card";
    card.innerHTML=`<img src="${safe(p.image || "https://placehold.co/600x450?text=Grocery")}" alt="${safe(p.name)}" onerror="this.src='https://placehold.co/600x450?text=Grocery'">
      <div class="product-content"><span class="category">${safe(p.category)}</span><h3>${safe(p.name)}</h3>
      <div class="price-line"><strong class="price">${money(p.price)}</strong><span class="unit">/ ${safe(p.unit)}</span></div>
      <div class="buy-row"><select>${[1,2,3,4,5,10].map(q=>`<option value="${q}">${q} × ${safe(p.unit)}</option>`).join("")}</select>
      <button class="primary-button">சேர்</button></div></div>`;
    card.querySelector("button").onclick=()=>{
      const qty=Number(card.querySelector("select").value);
      const found=cart.find(x=>x.id===p.id);
      if(found){found.qty+=qty;found.price=p.price;found.unit=p.unit;}else cart.push({...p,qty});
      saveCart();toast(`${p.name} சேர்க்கப்பட்டது`);
    };
    $("productGrid").appendChild(card);
  });
  $("emptyMessage").classList.toggle("hidden",filtered.length!==0);
}

function renderCart(){
  $("cartItems").innerHTML="";
  if(!cart.length) $("cartItems").innerHTML='<p class="message">கார்ட்டில் பொருட்கள் இல்லை.</p>';
  cart.forEach(item=>{
    const row=document.createElement("div");row.className="cart-item";
    row.innerHTML=`<div><b>${safe(item.name)}</b><p>${item.qty} × ${safe(item.unit)} × ${money(item.price)}</p><strong>${money(item.qty*item.price)}</strong></div>
      <div class="item-actions"><button class="mini minus">−</button><span>${item.qty}</span><button class="mini plus">+</button><button class="remove">🗑</button></div>`;
    row.querySelector(".minus").onclick=()=>{item.qty--;if(item.qty<=0)cart=cart.filter(x=>x.id!==item.id);saveCart();renderCart();};
    row.querySelector(".plus").onclick=()=>{item.qty++;saveCart();renderCart();};
    row.querySelector(".remove").onclick=()=>{cart=cart.filter(x=>x.id!==item.id);saveCart();renderCart();};
    $("cartItems").appendChild(row);
  });
  $("cartTotal").textContent=money(cart.reduce((s,x)=>s+x.price*x.qty,0));
}

onSnapshot(collection(db,"products"), snap=>{
  products=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.active!==false).sort((a,b)=>(a.name||"").localeCompare(b.name||"","ta"));
  $("loading").classList.add("hidden");$("errorMessage").classList.add("hidden");
  rebuildCategories();renderProducts();
}, err=>{
  console.error(err);$("loading").classList.add("hidden");$("errorMessage").textContent="பொருட்களை ஏற்ற முடியவில்லை. Firestore Rules-ஐ publish செய்தீர்களா என்று பார்க்கவும்.";$("errorMessage").classList.remove("hidden");
});

$("searchInput").oninput=renderProducts;
$("categoryFilter").onchange=renderProducts;
$("cartButton").onclick=()=>{renderCart();$("cartOverlay").classList.remove("hidden");};
$("closeCart").onclick=()=>$("cartOverlay").classList.add("hidden");
$("cartOverlay").onclick=e=>{if(e.target.id==="cartOverlay")$("cartOverlay").classList.add("hidden");};

$("orderForm").onsubmit=async e=>{
  e.preventDefault();
  if(!cart.length){alert("முதலில் பொருட்களை சேர்க்கவும்.");return;}
  const total=cart.reduce((s,x)=>s+x.price*x.qty,0);
  const order={
    customerName:$("customerName").value.trim(),
    customerPhone:$("customerPhone").value.trim(),
    customerAddress:$("customerAddress").value.trim(),
    note:$("customerNote").value.trim(),
    items:cart.map(({id,name,unit,price,qty})=>({productId:id,name,unit,price:Number(price),qty:Number(qty)})),
    total:Number(total),status:"pending",createdAt:serverTimestamp()
  };
  const submit=e.submitter;submit.disabled=true;submit.textContent="சேமிக்கப்படுகிறது...";
  try{
    const ref=await addDoc(collection(db,"orders"),order);
    const lines=cart.map((x,i)=>`${i+1}. ${x.name} - ${x.qty} × ${x.unit} = ${money(x.price*x.qty)}`);
    const msg=`🛒 *${settings.shopName} - புதிய ஆர்டர்*\nOrder ID: ${ref.id}\n\n👤 ${order.customerName}\n📱 ${order.customerPhone}\n📍 ${order.customerAddress}\n\n${lines.join("\n")}\n\n💰 *மொத்தம்: ${money(total)}*${order.note?`\n📝 ${order.note}`:""}`;
    cart=[];saveCart();renderCart();$("orderForm").reset();toast("ஆர்டர் வெற்றிகரமாக சேமிக்கப்பட்டது");
    if(settings.whatsapp) window.open(`https://wa.me/${settings.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`,"_blank");
  }catch(err){console.error(err);alert("ஆர்டர் சேமிக்க முடியவில்லை. Firestore Rules சரியா பார்க்கவும்.");}
  finally{submit.disabled=false;submit.textContent="ஆர்டர் உறுதிசெய்யவும்";}
};

loadSettings();saveCart();$("year").textContent=new Date().getFullYear();
