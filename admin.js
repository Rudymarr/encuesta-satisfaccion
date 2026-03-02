// ================= 🔐 SEGURIDAD POR URL =================
const CLAVE_ADMIN = "Bemisal2026";

const params = new URLSearchParams(window.location.search);
const clave = params.get("clave");

if (clave !== CLAVE_ADMIN) {
  document.body.innerHTML = "<h2>⛔ Acceso denegado</h2>";
  throw new Error("Acceso no autorizado");
}

// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
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

// ================= CARGAR ENCUESTAS =================
const tabla = document.getElementById("tablaEncuestas");
let encuestas = [];

async function cargarEncuestas() {
  const q = query(
    collection(db, "encuestas"),
    orderBy("creadoEn", "desc")
  );

  const querySnapshot = await getDocs(q);
  encuestas = [];
  tabla.innerHTML = "";

  querySnapshot.forEach(doc => {
    const data = doc.data();
    encuestas.push(data);

    const tr = document.createElement("tr");

    // 👉 Firma (miniatura)
    const firmaHTML = data.firmaURL
      ? `<img src="${data.firmaURL}" width="80" style="cursor:pointer;border:1px solid #ccc"
           onclick="window.open('${data.firmaURL}','_blank')">`
      : "";

    // 👉 Fotos adjuntas (miniaturas)
    // 🖼️ MINIATURAS DE FOTOS
const fotosHTML = (data.fotosURLs && data.fotosURLs.length > 0)
  ? data.fotosURLs.map(url => `
      <a href="${url}" target="_blank">
        <img 
          src="${url}" 
          style="width:60px;height:auto;margin:4px;border-radius:6px;border:1px solid #ccc"
        >
      </a>
    `).join("")
  : "";

    tr.innerHTML = `
      <td>${data.razonSocial || ""}</td>
      <td>${data.fecha || ""}</td>
      <td>${data.hora || ""}</td>
      <td>${data.observaciones || ""}</td>
      <td>${firmaHTML}</td>
      <td>${fotosHTML}</td>
    `;

    tabla.appendChild(tr);
  });
}

cargarEncuestas();

// ================= EXPORTAR A EXCEL =================
document.getElementById("exportarExcel").addEventListener("click", () => {
  const ws = XLSX.utils.json_to_sheet(encuestas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Encuestas");
  XLSX.writeFile(wb, "encuestas.xlsx");
});

// ================= EXPORTAR A PDF =================
document.getElementById("exportarPDF").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  let y = 10;

  encuestas.forEach((e, i) => {
    pdf.text(`Encuesta #${i + 1}`, 10, y);
    y += 8;
    pdf.text(`Razón Social: ${e.razonSocial || ""}`, 10, y);
    y += 8;
    pdf.text(`Fecha: ${e.fecha || ""}  Hora: ${e.hora || ""}`, 10, y);
    y += 8;
    pdf.text(`Observaciones: ${e.observaciones || ""}`, 10, y);
    y += 12;

    if (y > 270) {
      pdf.addPage();
      y = 10;
    }
  });

  pdf.save("encuestas.pdf");
});



