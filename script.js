// ==========================================
// 1. CONFIGURACIÓN PRINCIPAL DE TU TIENDA
// ==========================================
const NUMERO_WHATSAPP = "593963259492"; 
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNz682jLUpz3P7eKqahpH2NiLqctI5V1B2utHZ2ZMS4rsmYSwd0huivG5Qt_sM4FyxHtvS7AliVNm9/pub?gid=0&single=true&output=csv";

// Catálogo de respaldo mientras carga Google Sheets
let productos = [
  {
    nombre: "Canva Pro (30 Días)",
    categoria: "software",
    descripcion: "Acceso a todas las plantillas premium, quitafondos y herramientas de diseño.",
    precio: "\$3.00",
    periodo: "/ mes"
  }
];

let categoriaActual = "todos";

// Referencias del DOM
const contenedor = document.getElementById("contenedor-productos");
const contenedorFiltros = document.getElementById("contenedor-filtros");
const buscador = document.getElementById("buscador");
const navWhatsapp = document.getElementById("nav-whatsapp");

navWhatsapp.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent("¡Hola! Quiero consultar sobre el catálogo de Tienda Digital Cedeño.")}`;

// ==========================================
// 2. MOSTRAR PRODUCTOS Y CATEGORÍAS
// ==========================================
function actualizarBotonesFiltro() {
  if (!contenedorFiltros) return;

  const categoriasUnicas = [...new Set(productos.map(p => p.categoria.toLowerCase()))];
  contenedorFiltros.innerHTML = `<button class="btn-filtro ${categoriaActual === 'todos' ? 'activo' : ''}" data-categoria="todos">Todos</button>`;

  categoriasUnicas.forEach((cat) => {
    if (!cat) return;
    const nombreBoton = cat.charAt(0).toUpperCase() + cat.slice(1);
    const btn = document.createElement("button");
    btn.className = `btn-filtro ${categoriaActual === cat ? "activo" : ""}`;
    btn.setAttribute("data-categoria", cat);
    btn.textContent = nombreBoton;
    contenedorFiltros.appendChild(btn);
  });

  const botonesFiltro = contenedorFiltros.querySelectorAll(".btn-filtro");
  botonesFiltro.forEach((boton) => {
    boton.addEventListener("click", () => {
      botonesFiltro.forEach((b) => b.classList.remove("activo"));
      boton.classList.add("activo");
      categoriaActual = boton.getAttribute("data-categoria");
      filtrarCatalogo();
    });
  });
}

function mostrarProductos(lista) {
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `<p style="color: #94a3b8; grid-column: 1/-1; text-align: center;">No se encontraron productos.</p>`;
    return;
  }

  lista.forEach((prod) => {
    const mensaje = `¡Hola! Me interesa pedir: *${prod.nombre}* (${prod.precio} ${prod.periodo})`;
    const urlWhatsapp = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";
    tarjeta.innerHTML = `
      <div>
        <span class="etiqueta-cat">${prod.categoria}</span>
        <h3>${prod.nombre}</h3>
        <p>${prod.descripcion}</p>
      </div>
      <div>
        <div class="precio">${prod.precio} <span>${prod.periodo}</span></div>
        <a href="${urlWhatsapp}" target="_blank" class="btn-comprar">Pedir por WhatsApp</a>
      </div>
    `;
    contenedor.appendChild(tarjeta);
  });
}

// ==========================================
// 3. BUSCADOR Y FILTROS
// ==========================================
function filtrarCatalogo() {
  const texto = buscador.value.toLowerCase();
  const filtrados = productos.filter((prod) => {
    const coincideCategoria = categoriaActual === "todos" || prod.categoria.toLowerCase() === categoriaActual;
    const coincideTexto = prod.nombre.toLowerCase().includes(texto) || prod.descripcion.toLowerCase().includes(texto);
    return coincideCategoria && coincideTexto;
  });
  mostrarProductos(filtrados);
}

buscador.addEventListener("input", filtrarCatalogo);

// ==========================================
// 4. LECTOR AUTOMÁTICO DE GOOGLE SHEETS
// ==========================================
function dividirFilaCSV(fila) {
  const resultado = [];
  let actual = "";
  let dentroDeComillas = false;

  for (let i = 0; i < fila.length; i++) {
    const letra = fila[i];
    if (letra === '"') {
      dentroDeComillas = !dentroDeComillas;
    } else if (letra === "," && !dentroDeComillas) {
      resultado.push(actual.trim());
      actual = "";
    } else {
      actual += letra;
    }
  }
  resultado.push(actual.trim());
  return resultado;
}

async function cargarDesdeGoogleSheets() {
  if (!GOOGLE_SHEET_CSV_URL) {
    actualizarBotonesFiltro();
    mostrarProductos(productos);
    return;
  }
  try {
    const urlSinCache = GOOGLE_SHEET_CSV_URL + (GOOGLE_SHEET_CSV_URL.includes("?") ? "&" : "?") + "t=" + new Date().getTime();
    const res = await fetch(urlSinCache);
    const csv = await res.text();
    const filas = csv.split(/\r?\n/);
    const listaSheet = [];

    filas.forEach((fila, index) => {
      if (!fila.trim()) return;
      const col = dividirFilaCSV(fila);

      // Si la Fila 1 tiene la palabra "nombre" como título, la salta; si tiene un producto, lo muestra
      if (index === 0 && col[0].toLowerCase() === "nombre") return;

      if (col[0]) {
        const cEsPrecio = /\d/.test(col[2] || "") && (col[2] || "").length <= 12;
        let precioBruto = cEsPrecio ? col[2] : col[3];
        let descripcion = cEsPrecio ? (col[4] || col[3] || "") : col[2];
        let periodo = cEsPrecio ? (col[3] || "/ mes") : (col[4] || "/ mes");

        precioBruto = (precioBruto || "0.00").replace(/\\/g, "").trim();
        if (!precioBruto.startsWith("\$")) {
          precioBruto = "\$" + precioBruto;
        }

        listaSheet.push({
          nombre: col[0],
          categoria: (col[1] || "otros").trim().toLowerCase(),
          precio: precioBruto,
          periodo: periodo,
          descripcion: descripcion
        });
      }
    });

    if (listaSheet.length > 0) {
      productos = listaSheet;
    }
  } catch (err) {
    console.error("Error cargando Google Sheet:", err);
  }
  actualizarBotonesFiltro();
  filtrarCatalogo();
}

cargarDesdeGoogleSheets();
