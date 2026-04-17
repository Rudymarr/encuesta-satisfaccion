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

// ================= CARGAR ENCUESTAS =================
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
    const id = docSnap.id;

    encuestas.push({ id, ...data });

    const firmaHTML = data.firmaURL
      ? `<a href="${data.firmaURL}" target="_blank">
           <img src="${data.firmaURL}" width="60">
         </a>`
      : "";

    const fotosHTML = (data.fotosURLs && data.fotosURLs.length > 0)
      ? data.fotosURLs.map(url => `
          <a href="${url}" target="_blank">
            <img src="${url}" width="60" style="margin:2px">
          </a>`).join("")
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

      <!-- Transportista -->
      <td>
        <input
          type="text"
          id="transportista-${id}"
          value="${data.transportista || ""}"
          placeholder="Ingresar transportista">
      </td>

      <!-- Especialista -->
      <td>
        <select id="especialista-${id}">
          <option value="">-- Seleccione --</option>
          <option value="Nestor Lopez">Nestor Lopez</option>
          <option value="Irween Ortiz">Irween Ortiz</option>
          <option value="Eleonora Giron">Eleonora Giron</option>
          <option value="Mariela Mazariego Jefe">Mariela Mazariego Jefe</option>
        </select>
      </td>

      <!-- Accion -->
      <td>
        <button onclick="guardarTrazabilidad('${id}')">💾 Guardar</button>
      </td>
    `;

    tabla.appendChild(tr);

    // ✅ Preseleccionar especialista guardado
    if (data.especialistaLogistica) {
      const sel = document.getElementById(`especialista-${id}`);
      if (sel) sel.value = data.especialistaLogistica;
    }
  });
}

cargarEncuestas();

// ================= GUARDAR TRAZABILIDAD =================
window.guardarTrazabilidad = async (id) => {
  const transportista = document
    .getElementById(`transportista-${id}`)
    .value
    .trim();

  const especialistaLogistica = document
    .getElementById(`especialista-${id}`)
    .value
    .trim();

  if (!transportista || !especialistaLogistica) {
    alert("Debe ingresar transportista y especialista");
    return;
  }

  await updateDoc(doc(db, "encuestas", id), {
    transportista,
    especialistaLogistica,
    actualizadoEn: new Date()
  });

  await cargarEncuestas(); // ✅ refresca tabla

  alert("Trazabilidad guardada correctamente");
};

// ================= EXPORTAR EXCEL =================
document.getElementById("exportarExcel").addEventListener("click", () => {
  const ws = XLSX.utils.json_to_sheet(encuestas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Encuestas");
  XLSX.writeFile(wb, "encuestas.xlsx");
});

// ================= EXPORTAR PDF =================
document.getElementById("exportarPDF").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  let y = 10;

  encuestas.forEach((e, i) => {
    pdf.text(`Encuesta #${i + 1}`, 10, y); y += 7;
    pdf.text(`Razon Social: ${e.razonSocial || ""}`, 10, y); y += 7;
    pdf.text(`Fecha: ${e.fecha || ""} Hora: ${e.hora || ""}`, 10, y); y += 7;
    pdf.text(`Transportista: ${e.transportista || "Sin asignar"}`, 10, y); y += 7;
    pdf.text(`Especialista: ${e.especialistaLogistica || "Sin asignar"}`, 10, y); y += 10;

    if (y > 270) {
      pdf.addPage();
      y = 10;
    }
  });

  pdf.save("encuestas.pdf");
});
