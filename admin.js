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

// ================= ELEMENTOS =================
const tabla = document.getElementById("tablaEncuestas");
let encuestas = [];

// ======================================================
// 📋 CARGAR ENCUESTAS
// ======================================================
async function cargarEncuestas() {
  const q = query(collection(db, "encuestas"), orderBy("creadoEn", "desc"));
  const snapshot = await getDocs(q);

  tabla.innerHTML = "";
  encuestas = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;

    encuestas.push({ id, ...data });

    const tr = document.createElement("tr");

    // ---------------- HTML DE LA FILA ----------------
    tr.innerHTML = `
      <td>${data.razonSocial || ""}</td>
      <td>${data.fecha || ""}</td>
      <td>${data.hora || ""}</td>

      <td>${data.p1 || ""}</td>
      <td>${data.p2 || ""}</td>
      <td>${data.p3 || ""}</td>
      <td>${data.p4 || ""}</td>

      <td>${data.observaciones || ""}</td>
      <td>${data.firmaURL ? `<img src="${data.firmaURL}" width="60">` : ""}</td>
      <td>
        ${(data.fotosURLs || []).map(
          u => `<img src="${u}" width="50" style="margin:2px">`
        ).join("")}
      </td>

      <td>
        <input
          type="text"
          id="transportista-${id}"
          value="${data.transportista || ""}"
          placeholder="Transportista"
        >
      </td>

      <td>
        <select id="especialista-${id}">
          <option value="">-- Seleccione --</option>
          <option value="Nestor Lopez">Nestor Lopez</option>
          <option value="Irween Ortiz">Irween Ortiz</option>
          <option value="Eleonora Giron">Eleonora Giron</option>
          <option value="Mariela Mazariego Jefe">Mariela Mazariego Jefe</option>
        </select>
      </td>

      <td>
        <button onclick="guardarTrazabilidad('${id}')">
          💾 Guardar
        </button>
      </td>
    `;

    tabla.appendChild(tr);

    // ---------------- PRESELECCION ----------------
    if (data.especialistaLogistica) {
      const sel = document.getElementById(`especialista-${id}`);
      if (sel) sel.value = data.especialistaLogistica;
    }

    // ---------------- VALIDAR TRAZABILIDAD (CLAVE) ----------------
    const tieneTransportista = !!data.transportista;
    const tieneEspecialista = !!data.especialistaLogistica;

    if (tieneTransportista && tieneEspecialista) {
      tr.classList.add("trazabilidad-ok");
      tr.title = "Encuesta completa";
    } else {
      tr.classList.add("falta-trazabilidad");
      tr.title = "Encuesta pendiente de trazabilidad";
    }
  });

  actualizarContadores();
}

cargarEncuestas();

// ======================================================
// 💾 GUARDAR TRAZABILIDAD
// ======================================================
window.guardarTrazabilidad = async (id) => {
  const transportista = document.getElementById(`transportista-${id}`).value.trim();
  const especialistaLogistica = document.getElementById(`especialista-${id}`).value.trim();

  if (!transportista || !especialistaLogistica) {
    alert("Debe ingresar transportista y especialista");
    return;
  }

  await updateDoc(doc(db, "encuestas", id), {
    transportista,
    especialistaLogistica,
    actualizadoEn: new Date()
  });

  await cargarEncuestas();
};

// ======================================================
// 🔢 CONTADORES
// ======================================================
function actualizarContadores() {
  let pendientes = 0;
  let completas = 0;

  document.querySelectorAll("#tablaEncuestas tr").forEach(tr => {
    if (tr.classList.contains("falta-trazabilidad")) pendientes++;
    if (tr.classList.contains("trazabilidad-ok")) completas++;
  });

  document.getElementById("contadorPendientes").textContent =
    `🔴 Pendientes: ${pendientes}`;

  document.getElementById("contadorCompletas").textContent =
    `🟢 Completas: ${completas}`;
}

// ======================================================
// 🔎 FILTROS
// ======================================================
document.getElementById("btnPendientes").addEventListener("click", () => {
  document.querySelectorAll("#tablaEncuestas tr").forEach(tr => {
    tr.style.display = tr.classList.contains("falta-trazabilidad") ? "" : "none";
  });
});

document.getElementById("btnTodas").addEventListener("click", () => {
  document.querySelectorAll("#tablaEncuestas tr").forEach(tr => {
    tr.style.display = "";
  });
});
