// ================= 🔐 SEGURIDAD POR URL =================
const CLAVE_ADMIN = "Bemisal2026";

const params = new URLSearchParams(window.location.search);
const clave = params.get("clave");

if (clave !== CLAVE_ADMIN) {
  document.body.innerHTML = "<h2>⛔ Acceso denegado</h2>";
  throw new Error("Acceso no autorizado");
}

// ================= 🔥 FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLFHMLQ7aBt9oYJda3uSBcuYVHDcAXjPI",
  authDomain: "encuesta-satisfaccion-bem.firebaseapp.com",
  projectId: "encuesta-satisfaccion-bem"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ======================================================
// 📋 ENCUESTAS
// ======================================================
const tabla = document.getElementById("tablaEncuestas");
let encuestas = [];

async function cargarEncuestas() {
  const q = query(
    collection(db, "encuestas"),
    orderBy("creadoEn", "desc")
  );

  const snap = await getDocs(q);
  encuestas = [];
  tabla.innerHTML = "";

  snap.forEach(docSnap => {
    const data = docSnap.data();
    encuestas.push(data);

    // Firma
    const firmaHTML = data.firmaURL
      ? `<img src="${data.firmaURL}" width="80"
              style="cursor:pointer;border:1px solid #ccc"
              onclick="window.open('${data.firmaURL}','_blank')">`
      : "";

    // Fotos
    const fotosHTML = (data.fotosURLs && data.fotosURLs.length > 0)
      ? data.fotosURLs.map(url => `
          <a href="${url}" target="_blank">
            <img src="${url}" style="width:60px;margin:4px;border-radius:6px;border:1px solid #ccc">
          </a>
        `).join("")
      : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${data.razonSocial || ""}</td>
      <td>${data.fecha || ""}</td>
      <td>${data.hora || ""}</td>
      <td>${data.p1 || ""}</td>
      <td>${data.p2 || ""}</td>
      <td>${data.p3 || ""}</td>
      <td>${data.p4 || ""}</td>
      <td>${data.observaciones || ""}</td>
      <td>${firmaHTML}</td>
      <td>${fotosHTML}</td>
    `;

    tabla.appendChild(tr);
  });
}

cargarEncuestas();

// ======================================================
// 🚚 CATÁLOGO TRANSPORTISTAS
// ======================================================
const transportistasRef = collection(db, "transportistas");

document.getElementById("btnAddTransportista")?.addEventListener("click", async () => {
  const input = document.getElementById("nuevoTransportista");
  const nombre = input.value.trim();

  if (!nombre) {
    alert("Ingrese el nombre del transportista");
    return;
  }

  await addDoc(transportistasRef, {
    nombre,
    activo: true,
    creadoEn: new Date()
  });

  input.value = "";
  cargarTransportistas();
});

async function cargarTransportistas() {
  const cont = document.getElementById("listaTransportistas");
  if (!cont) return;

  cont.innerHTML = "";
  const snap = await getDocs(transportistasRef);

  snap.forEach(d => {
    const data = d.data();
    const div = document.createElement("div");
    div.className = "catalogo-item";

    div.innerHTML = `
      <span class="${data.activo ? "" : "inactivo"}">${data.nombre}</span>
      <button>${data.activo ? "Desactivar" : "Activar"}</button>
    `;

    div.querySelector("button").onclick = async () => {
      await updateDoc(doc(db, "transportistas", d.id), {
        activo: !data.activo
      });
      cargarTransportistas();
    };

    cont.appendChild(div);
  });
}

// ======================================================
// 👤 CATÁLOGO ESPECIALISTAS
// ======================================================
const especialistasRef = collection(db, "especialistas");

document.getElementById("btnAddEspecialista")?.addEventListener("click", async () => {
  const input = document.getElementById("nuevoEspecialista");
  const nombre = input.value.trim();

  if (!nombre) {
    alert("Ingrese el nombre del especialista");
    return;
  }

  await addDoc(especialistasRef, {
    nombre,
    activo: true,
    creadoEn: new Date()
  });

  input.value = "";
  cargarEspecialistas();
});

async function cargarEspecialistas() {
  const cont = document.getElementById("listaEspecialistas");
  if (!cont) return;

  cont.innerHTML = "";
  const snap = await getDocs(especialistasRef);

  snap.forEach(d => {
    const data = d.data();
    const div = document.createElement("div");
    div.className = "catalogo-item";

    div.innerHTML = `
      <span class="${data.activo ? "" : "inactivo"}">${data.nombre}</span>
      <button>${data.activo ? "Desactivar" : "Activar"}</button>
    `;

    div.querySelector("button").onclick = async () => {
      await updateDoc(doc(db, "especialistas", d.id), {
        activo: !data.activo
      });
      cargarEspecialistas();
    };

    cont.appendChild(div);
  });
}

// ======================================================
// 🚀 INIT
// ======================================================
cargarTransportistas();
cargarEspecialistas();

// ======================================================
// 📊 EXPORTAR A EXCEL
// ======================================================
document.getElementById("exportarExcel").addEventListener("click", () => {
  const ws = XLSX.utils.json_to_sheet(encuestas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Encuestas");
  XLSX.writeFile(wb, "encuestas.xlsx");
});

// ======================================================
// 📄 EXPORTAR A PDF
// ======================================================
document.getElementById("exportarPDF").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  let y = 10;

  encuestas.forEach((e, i) => {
    pdf.text(`Encuesta #${i + 1}`, 10, y); y += 8;
    pdf.text(`Razón Social: ${e.razonSocial || ""}`, 10, y); y += 8;
    pdf.text(`Fecha: ${e.fecha || ""}  Hora: ${e.hora || ""}`, 10, y); y += 8;
    pdf.text(`Observaciones: ${e.observaciones || ""}`, 10, y); y += 12;

    if (y > 270) {
      pdf.addPage();
      y = 10;
    }
  });

  pdf.save("encuestas.pdf");
});
