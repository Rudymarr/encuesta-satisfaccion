// =======================
// 🔥 Firebase (v9 modular)
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLFHMLQ7aBt9oYJda3uSBcuYVHDcAXjPI",
  authDomain: "encuesta-satisfaccion-bem.firebaseapp.com",
  projectId: "encuesta-satisfaccion-bem",
  storageBucket: "encuesta-satisfaccion-bem.firebasestorage.app",
  messagingSenderId: "404203330392",
  appId: "1:404203330392:web:42582d2ca93c04f78a632d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =======================
// ✍️ FIRMA EN CANVAS
// =======================
const canvas = document.getElementById("firma");
const ctx = canvas.getContext("2d");
const limpiarBtn = document.getElementById("limpiarFirma");
const enviarBtn = document.getElementById("enviarEncuesta");

let dibujando = false;
let enviando = false;

// Ajuste retina
function ajustarCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
}
ajustarCanvas();
window.addEventListener("resize", ajustarCanvas);

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function iniciar(e) {
  dibujando = true;
  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function dibujar(e) {
  if (!dibujando) return;
  e.preventDefault();
  const pos = getPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function terminar() {
  dibujando = false;
  ctx.closePath();
}

// Mouse
canvas.addEventListener("mousedown", iniciar);
canvas.addEventListener("mousemove", dibujar);
canvas.addEventListener("mouseup", terminar);
canvas.addEventListener("mouseleave", terminar);

// Touch
canvas.addEventListener("touchstart", iniciar);
canvas.addEventListener("touchmove", dibujar);
canvas.addEventListener("touchend", terminar);

// Limpiar firma
limpiarBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// =======================
// 🛡️ VALIDACIONES
// =======================
function firmaVacia() {
  const blank = document.createElement("canvas");
  blank.width = canvas.width;
  blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}

function obtenerFirmaBase64() {
  return canvas.toDataURL("image/png");
}

// =======================
// ☁️ CLOUDINARY
// =======================
async function subirFirmaCloudinary(base64) {
  const blob = await (await fetch(base64)).blob();

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", "encuestas_unsigned");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dh9pwf0sl/image/upload",
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Error Cloudinary");

  const data = await res.json();
  return data.secure_url;
}

// =======================
// 📤 ENVÍO DE ENCUESTA
// =======================
enviarBtn.addEventListener("click", async () => {
  if (enviando) return;

  const razonSocial = document.querySelector('input[placeholder="Razón Social"]').value.trim();
  const fecha = document.querySelector('input[type="date"]').value;
  const hora = document.querySelector('input[type="time"]').value;
  const observaciones = document.querySelector("textarea").value.trim();

  if (!razonSocial || !fecha || !hora) {
    alert("⚠️ Complete todos los campos obligatorios");
    return;
  }

  if (firmaVacia()) {
    alert("⚠️ Debe firmar antes de enviar");
    return;
  }

  try {
    enviando = true;
    enviarBtn.disabled = true;
    enviarBtn.innerText = "Enviando...";

    const firmaBase64 = obtenerFirmaBase64();
    const firmaURL = await subirFirmaCloudinary(firmaBase64);

    await addDoc(collection(db, "encuestas"), {
      razonSocial,
      fecha,
      hora,
      observaciones,
      firmaURL,
      creadoEn: new Date()
    });

    alert("✅ Encuesta enviada correctamente");

    // Reset
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    enviarBtn.innerText = "Enviar encuesta";

  } catch (error) {
    console.error(error);
    alert("❌ Error al enviar la encuesta");
  } finally {
    enviando = false;
    enviarBtn.disabled = false;
  }
});