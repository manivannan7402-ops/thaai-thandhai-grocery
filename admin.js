import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getFirestore, collection, onSnapshot, addDoc, doc, setDoc, updateDoc,
  deleteDoc, writeBatch, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app=initializeApp(firebaseConfig), db=getFirestore(app), auth=getAuth(app);
const $=id=>document.getElementById(id);
const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0);
const toast=t=>{$("toast").textContent=t;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),1800)};
let products=[],orders=[],unsubs=[];

const samples=[
{name:"பொன்னி அரிசி",category:"அரிசி",unit:"1 கிலோ",price:65,image:"https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",active:true},
{name:"இட்லி அரிசி",category:"அரிசி",unit:"1 கிலோ",price:52,image:"https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80",active:true},
{name:"துவரம் பருப்பு",category:"பருப்பு",unit:"1 கிலோ",price:165,image:"https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=600&q=80",active:true},
{name:"உளுந்தம் பருப்பு",category:"பருப்பு",unit:"1 கிலோ",price:150,image:"https://images.unsplash.com/photo-1612257999756-39f135b0fb03?auto=format&fit=crop&w=600&q=80",active:true},
{name:"சர்க்கரை",category:"அத்தியாவசியம்",unit:"1 கிலோ",price:48,image:"https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80",active:true},
{name:"உப்பு",category:"அத்தியாவசியம்",unit:"1 கிலோ",price:24,image:"https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80",active:true},
{name:"சமையல் எண்ணெய்",category:"எண்ணெய்",unit:"1 லிட்டர்",price:145,image:"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",active:true},
{name:"மிளகாய் தூள்",category:"மசாலா",unit:"500 கிராம்",price:160,image:"https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",active:true}
];

$("loginForm").onsubmit=async e=>{
 e.preventDefault();$("loginError").classList.add("hidden");
 try{
   const cred=await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);
   if(cred.user.email.toLowerCase()!==ADMIN_EMAIL.toLowerCase()){await signOut(auth);throw new Error("இந்த Email-க்கு Admin அனுமதி இல்லை.");}
 }catch(err){$("loginError").textContent=err.message;$("loginError").classList.remove("hidden");}
};
$("logoutButton").onclick=()=>signOut(auth);

onAuthStateChanged(auth,user=>{
  unsubs.forEach(f=>f());unsubs=[];
  const allowed=user&&user.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase();
  $("loginSection").classList.toggle("hidden",allowed);
  $("adminSection").classList.toggle("hidden",!allowed);
  if(allowed){$("userEmail").textContent=user.email;startLiveData();}
});

function startLiveData(){
 unsubs.push(onSnapshot(collection(db,"products"),snap=>{
   products=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.name||"").localeCompare(b.name||"","ta"));
   $("productStat").textContent=products.length;renderProducts();
 }));
 unsubs.push(onSnapshot(query(collection(db,"orders"),orderBy("createdAt","desc")),snap=>{
   orders=snap.docs.map(d=>({id:d.id,...d.data()}));
   $("totalOrdersStat").textContent=orders.length;
   $("pendingStat").textContent=orders.filter(o=>o.status==="pending").length;
   renderOrders();
 },err=>{console.error(err);$("ordersList").innerHTML='<p class="error">Orders ஏற்ற முடியவில்லை. Index/Rules பார்க்கவும்.</p>';}));
 onSnapshot(doc(db,"settings","store"),snap=>{
   const s=snap.exists()?snap.data():{shopName:"தாய் தந்தை மளிகை கடை",whatsapp:""};
   $("settingShopName").value=s.shopName||"";$("settingWhatsapp").value=s.whatsapp||"";
 });
}

$("saveSettings").onclick=async()=>{
 await setDoc(doc(db,"settings","store"),{shopName:$("settingShopName").value.trim()||"தாய் தந்தை மளிகை கடை",whatsapp:$("settingWhatsapp").value.trim(),updatedAt:serverTimestamp()},{merge:true});
 toast("அமைப்புகள் சேமிக்கப்பட்டன");
};

$("addProductForm").onsubmit=async e=>{
 e.preventDefault();
 await addDoc(collection(db,"products"),{name:$("newName").value.trim(),category:$("newCategory").value.trim(),unit:$("newUnit").value.trim(),price:Number($("newPrice").value),image:$("newImage").value.trim()||"https://placehold.co/600x450?text=Grocery",active:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
 e.target.reset();toast("பொருள் சேர்க்கப்பட்டது");
};

$("seedProducts").onclick=async()=>{
 if(products.length&&!confirm("ஏற்கனவே பொருட்கள் உள்ளன. மாதிரி பொருட்களையும் சேர்க்கவா?"))return;
 const batch=writeBatch(db);samples.forEach((p,i)=>batch.set(doc(collection(db,"products")), {...p,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
 await batch.commit();toast("மாதிரி பொருட்கள் சேர்க்கப்பட்டன");
};

function renderProducts(){
 $("adminProductList").innerHTML="";
 products.forEach(p=>{
  const row=document.createElement("div");row.className="admin-product-row";
  row.innerHTML=`<img src="${safe(p.image||"https://placehold.co/200?text=Item")}" onerror="this.src='https://placehold.co/200?text=Item'">
   <div><b>${safe(p.name)}</b><br><small>${safe(p.category)}</small></div>
   <input class="edit-unit" value="${safe(p.unit)}"><input class="edit-price" type="number" min="0" step="0.01" value="${Number(p.price)||0}">
   <div><button class="primary-button save">சேமிக்க</button> <button class="danger-button delete">நீக்கு</button></div>`;
  row.querySelector(".save").onclick=async()=>{await updateDoc(doc(db,"products",p.id),{unit:row.querySelector(".edit-unit").value.trim(),price:Number(row.querySelector(".edit-price").value),updatedAt:serverTimestamp()});toast(`${p.name} புதுப்பிக்கப்பட்டது`);};
  row.querySelector(".delete").onclick=async()=>{if(confirm(`${p.name} நீக்கவா?`))await deleteDoc(doc(db,"products",p.id));};
  $("adminProductList").appendChild(row);
 });
}

function formatDate(ts){try{return ts?.toDate().toLocaleString("en-IN")||"இப்போது";}catch{return "—";}}
function renderOrders(){
 $("ordersList").innerHTML=orders.length?"":'<p class="message">Orders இன்னும் இல்லை.</p>';
 orders.forEach(o=>{
  const card=document.createElement("article");card.className="order-card";
  card.innerHTML=`<div class="order-head"><div><b>${safe(o.customerName)}</b> — <a href="tel:${safe(o.customerPhone)}">${safe(o.customerPhone)}</a><p class="muted">${safe(o.customerAddress)}</p></div><div><b>${money(o.total)}</b><br><small>${formatDate(o.createdAt)}</small></div></div>
   <div class="order-items">${(o.items||[]).map(x=>`<p>${safe(x.name)} — ${x.qty} × ${safe(x.unit)} = ${money(x.qty*x.price)}</p>`).join("")}</div>
   ${o.note?`<p>📝 ${safe(o.note)}</p>`:""}
   <select class="status-select"><option value="pending">Pending</option><option value="packed">Packed</option><option value="out-for-delivery">Out for delivery</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select>`;
  const sel=card.querySelector("select");sel.value=o.status||"pending";
  sel.onchange=async()=>{await updateDoc(doc(db,"orders",o.id),{status:sel.value,updatedAt:serverTimestamp()});toast("Order status மாற்றப்பட்டது");};
  $("ordersList").appendChild(card);
 });
}
