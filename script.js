const NUMERO_WHATSAPP = "593963259492";
const URL_GOOGLE_REVIEW = "https://g.page/r/CcVHRoL30LsdECE/review";

// 1. URL directa publicada en CSV (Carga ultrarrápida)
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNz682jLUpz3P7eKqahpH2NiLqctI5V1B2utHZ2ZMS4rsmYSwd0huivG5Qt_sM4FyxHtvS7AliVNm9/pub?output=csv";

// Enlaces de sincronización en vivo con tus pestañas de Google Sheets
const SHEET_ID = "1zN4bHeBl8iZ4NETcDN7kKfv7z3GSHZ8kf-EX0UqJHtg";
const SHEET_GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
const SHEET_CUPONES_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Cupones`;
const SHEET_RESENAS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Resenas`;
// Conecta directo a tu pestaña "Tickets" (gid=1115065148) para leer Estado y Referencia en vivo
const SHEET_TICKETS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=1115065148`;
const SHEET_TICKETS_ALT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Tickets`;

// URL completa de tu Google Apps Script (Versión 15 actualizada)
const URL_VERIFICADOR_PICHINCHA = "https://script.google.com/macros/s/AKfycbwmO7jW90VB-rWiF_mSfe6zgQfO9aqxGss2njfcEQOYeprd5plmgHMAUdpx1ttutlRY/exec";

// Cupones de respaldo inmediato
const CUPONES_LOCALES = {
  "CEDENO10": { porcentaje: 10, categoriaRequerida: "todos", minimoProductos: 1, activo: true },
  "STREAM5":  { porcentaje: 5,  categoriaRequerida: "streaming", minimoProductos: 1, activo: true }
};

const DATOS_BANCO = {
  tipoCuenta: "Cuenta de Ahorros - Banco Pichincha",
  numeroCuenta: "2213128245",
  titular: "Jostin Alejandro Cedeño López"
};

const CACHE_KEY = "productos_cedeno_cache";
const CARRITO_KEY = "carrito_cedeno";
const TICKETS_KEY = "tickets_cedeno_cliente";
const RESENAS_CACHE_KEY = "resenas_cedeno_v2";

// Reseña oficial verificada en Google Maps
const RESENA_BASE_GOOGLE = [
  {
    nombre: "Tienda Digital Cedeño",
    estrellas: 5,
    comentario: "",
    fecha: "2026-10-17T16:40:00-05:00",
    origen: "google"
  }
];

function normalizarOrigenResena(rev) {
  const nombreLimpio = String(rev.nombre || "").trim().toLowerCase();
  const origenGuardado = String(rev.origen || "").trim().toLowerCase();

  // Si en el Excel (Columna E) dice explícitamente "google", o es la reseña oficial de Tienda Digital Cedeño en Maps
  if (origenGuardado === "google" || (!origenGuardado && nombreLimpio.includes("tienda digital cede"))) {
    return "google";
  }
  return "web";
}

let resenasLista = (JSON.parse(localStorage.getItem(RESENAS_CACHE_KEY)) || RESENA_BASE_GOOGLE).map(r => ({
  ...r,
  origen: normalizarOrigenResena(r)
}));
localStorage.setItem(RESENAS_CACHE_KEY, JSON.stringify(resenasLista));

let estrellasSeleccionadasParaPublicar = 5;

// Carga TODOS los productos guardados al instante (0.01s)
let productos = JSON.parse(localStorage.getItem(CACHE_KEY)) || [
  {
    nombre: "Canva Pro 3 Años",
    categoria: "software",
    descripcion: "Acceso ilimitado a millones de plantillas premium, fotos y herramientas IA.",
    precio: "$3.00",
    periodo: "/ 3 años",
    stock: null,
    descuento: 0,
    minimoMeses: 1
  }
];

let carrito = JSON.parse(localStorage.getItem(CARRITO_KEY)) || [];
let misTickets = JSON.parse(localStorage.getItem(TICKETS_KEY)) || [];
let categoriaActual = "todos";
let pagoVerificadoAutomaticamente = false;
let cuponActivo = null;

// Limpia cualquier referencia corrupta guardada previamente
misTickets = misTickets.map(tk => {
  if (tk.referencia && String(tk.referencia).includes("tk.referencia")) {
    tk.referencia = "";
  }
  return tk;
});
localStorage.setItem(TICKETS_KEY, JSON.stringify(misTickets));

// Referencias del DOM
const contenedor = document.getElementById("contenedor-productos");
const contenedorFiltros = document.getElementById("contenedor-filtros");
const buscador = document.getElementById("buscador");

// Referencias del Carrito y Cupones
const modalCarrito = document.getElementById("modal-carrito");
const btnAbrirCarrito = document.getElementById("btn-abrir-carrito");
const btnCerrarCarrito = document.getElementById("btn-cerrar-carrito");
const listaCarrito = document.getElementById("lista-carrito");
const contadorCarrito = document.getElementById("contador-carrito");
const subtotalCarritoEl = document.getElementById("subtotal-carrito");
const filaDescAuto = document.getElementById("fila-desc-auto");
const filaDescCupon = document.getElementById("fila-desc-cupon");
const textoDescCuponEl = document.getElementById("texto-desc-cupon");
const montoDescCuponEl = document.getElementById("monto-desc-cupon");
const totalCarrito = document.getElementById("total-carrito");
const seccionPago = document.getElementById("seccion-pago");

const inputCupon = document.getElementById("input-cupon");
const btnAplicarCupon = document.getElementById("btn-aplicar-cupon");
const mensajeCupon = document.getElementById("mensaje-cupon");

const inputComprobante = document.getElementById("input-comprobante");
const btnVerificarPago = document.getElementById("btn-verificar-pago");
const estadoVerificacion = document.getElementById("estado-verificacion");
const btnFinalizarPedido = document.getElementById("btn-finalizar-pedido");

// Referencias de Reseñas
const modalResenas = document.getElementById("modal-resenas");
const btnAbrirResenas = document.getElementById("btn-abrir-resenas");
const btnCerrarResenas = document.getElementById("btn-cerrar-resenas");
const listaResenasContenedor = document.getElementById("lista-resenas-contenedor");
const promedioResenasEl = document.getElementById("promedio-resenas");
const totalResenasCountEl = document.getElementById("total-resenas-count");
const textoOpinionPluralEl = document.getElementById("texto-opinion-plural");
const conteoGoogleTxtEl = document.getElementById("conteo-google-txt");
const conteoWebTxtEl = document.getElementById("conteo-web-txt");
const estrellasPublicarBtns = document.querySelectorAll("#estrellas-publicar button");
const formPublicarResena = document.getElementById("form-publicar-resena");
const inputNombreResena = document.getElementById("input-nombre-resena");
const inputTextoResena = document.getElementById("input-texto-resena");
const mensajeResenaPublicada = document.getElementById("mensaje-resena-publicada");

// Referencias de Soporte por Tickets
const modalSoporte = document.getElementById("modal-soporte");
const btnAbrirSoporte = document.getElementById("btn-abrir-soporte");
const btnCerrarSoporte = document.getElementById("btn-cerrar-soporte");
const tabsSoporte = document.querySelectorAll(".tab-soporte");
const vistaCrearTicket = document.getElementById("vista-crear-ticket");
const vistaHistorialTickets = document.getElementById("vista-historial-tickets");
const formTicketSoporte = document.getElementById("form-ticket-soporte");
const estadoEnvioTicket = document.getElementById("estado-envio-ticket");
const btnEnviarTicket = document.getElementById("btn-enviar-ticket");
const listaMisTicketsEl = document.getElementById("lista-mis-tickets");
const contadorMisTicketsEl = document.getElementById("contador-mis-tickets");

// Referencias Legales
const modalLegal = document.getElementById("modal-legal");
const btnCerrarLegal = document.getElementById("btn-cerrar-legal");
const btnEntendidoLegal = document.getElementById("btn-entendido-legal");
const tabsLegales = document.querySelectorAll(".tab-legal");
const checkAceptoTerminos = document.getElementById("check-acepto-terminos");

// Mostrar datos bancarios
document.getElementById("banco-tipo").textContent = DATOS_BANCO.tipoCuenta;
document.getElementById("banco-numero").textContent = DATOS_BANCO.numeroCuenta;
document.getElementById("banco-titular").textContent = DATOS_BANCO.titular;

document.getElementById("btn-copiar-cuenta").addEventListener("click", (e) => {
  navigator.clipboard.writeText(DATOS_BANCO.numeroCuenta);
  e.target.textContent = "¡Copiado!";
  setTimeout(() => (e.target.textContent = "Copiar"), 2000);
});

// ==========================================
// 2. LOGOS OFICIALES ADAPTABLES A MÓVIL Y PC
// ==========================================
function obtenerDisenoVisualProducto(prod) {
  const n = (prod.nombre || "").toLowerCase();

  if (n.includes("netflix")) {
    return {
      fondo: "radial-gradient(circle at center, #7f1d1d 0%, #1a0404 65%, #050505 100%)",
      colorMarca: "#e50914",
      htmlLogo: `<div class="logo-netflix">NETFLIX</div>`
    };
  }
  if (n.includes("disney")) {
    return {
      fondo: "radial-gradient(circle at center, #113ccf 0%, #07133a 65%, #030712 100%)",
      colorMarca: "#38bdf8",
      htmlLogo: `
        <div class="logo-disney">
          <svg class="arco-disney" viewBox="0 0 180 42" fill="none">
            <path d="M8 36 Q 90 -8 172 30" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
            <circle cx="172" cy="30" r="4" fill="#ffffff"/>
          </svg>
          <span>Disney</span><span class="mas-disney">+</span>
        </div>`
    };
  }
  if (n.includes("hbo") || n.includes("max")) {
    return {
      fondo: "radial-gradient(circle at center, #4c1d95 0%, #1e0b4b 65%, #070312 100%)",
      colorMarca: "#a855f7",
      htmlLogo: `
        <div class="logo-hbomax">
          <span class="txt-hbo">HB<svg width="34" height="34" viewBox="0 0 36 36" style="margin-left:1px;"><circle cx="18" cy="18" r="14" fill="none" stroke="#ffffff" stroke-width="7"/><circle cx="18" cy="18" r="4.5" fill="#ffffff"/></svg></span>
          <span class="txt-max">max</span>
        </div>`
    };
  }
  if (n.includes("paramount")) {
    return {
      fondo: "radial-gradient(circle at center, #0055ff 0%, #001e6c 68%, #020817 100%)",
      colorMarca: "#3b82f6",
      htmlLogo: `
        <div class="logo-paramount">
          <svg width="78" height="46" viewBox="0 0 100 58">
            <path d="M50 8 C28 8 16 26 16 40" fill="none" stroke="#93c5fd" stroke-width="3" stroke-dasharray="3 5" stroke-linecap="round"/>
            <path d="M50 8 C72 8 84 26 84 40" fill="none" stroke="#93c5fd" stroke-width="3" stroke-dasharray="3 5" stroke-linecap="round"/>
            <path d="M50 12 L20 54 L36 54 L50 32 L64 54 L80 54 Z" fill="#ffffff"/>
          </svg>
          <span>Paramount+</span>
        </div>`
    };
  }
  if (n.includes("crunchyroll") || n.includes("anime")) {
    return {
      fondo: "radial-gradient(circle at center, #ea580c 0%, #7c2d12 65%, #140703 100%)",
      colorMarca: "#f97316",
      htmlLogo: `
        <div class="logo-texto-icono">
          <svg width="42" height="42" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="22" fill="#ffffff"/>
            <circle cx="28" cy="27" r="14" fill="#ea580c"/>
            <circle cx="32" cy="22" r="5" fill="#ffffff"/>
          </svg>
          <span>crunchyroll</span>
        </div>`
    };
  }
  if (n.includes("prime") || n.includes("amazon")) {
    return {
      fondo: "radial-gradient(circle at center, #0284c7 0%, #082f49 65%, #020b14 100%)",
      colorMarca: "#00a8e1",
      htmlLogo: `
        <div class="logo-prime">
          <span class="txt-prime">prime video</span>
          <svg viewBox="0 0 140 28">
            <path d="M 18 8 Q 70 26 122 6" fill="none" stroke="#00a8e1" stroke-width="4.5" stroke-linecap="round"/>
            <path d="M 112 3 L 125 5 L 118 17" fill="none" stroke="#00a8e1" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>`
    };
  }
  if (n.includes("canva")) {
    return {
      fondo: "linear-gradient(135deg, #008996 0%, #00c4cc 35%, #5b21b6 75%, #3b0764 100%)",
      colorMarca: "#00c4cc",
      htmlLogo: `
        <div class="logo-canva">
          <div class="circulo-canva">Canva</div>
          <span class="tag-pro">👑 PRO</span>
        </div>`
    };
  }
  if (n.includes("spotify")) {
    return {
      fondo: "radial-gradient(circle at center, #15803d 0%, #052e16 68%, #020f07 100%)",
      colorMarca: "#1db954",
      htmlLogo: `
        <div class="logo-texto-icono">
          <svg width="42" height="42" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="23" fill="#1db954"/>
            <path d="M 14 19 Q 25 14 36 20" fill="none" stroke="#060911" stroke-width="4" stroke-linecap="round"/>
            <path d="M 16 26 Q 25 22 34 27" fill="none" stroke="#060911" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M 18 33 Q 25 30 32 34" fill="none" stroke="#060911" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <span>Spotify</span>
        </div>`
    };
  }
  if (n.includes("youtube")) {
    return {
      fondo: "radial-gradient(circle at center, #991b1b 0%, #2a0404 68%, #090101 100%)",
      colorMarca: "#ff0000",
      htmlLogo: `
        <div class="logo-texto-icono">
          <svg width="46" height="34" viewBox="0 0 56 40">
            <rect x="0" y="0" width="56" height="40" rx="11" fill="#ff0000"/>
            <polygon points="22,11 22,29 38,20" fill="#ffffff"/>
          </svg>
          <span>YouTube</span>
        </div>`
    };
  }
  if (n.includes("apple")) {
    return {
      fondo: "linear-gradient(135deg, #fa243c 0%, #8e2de2 60%, #1c1c1e 100%)",
      colorMarca: "#fa243c",
      htmlLogo: `
        <div class="logo-texto-icono">
          <svg width="38" height="38" viewBox="0 0 50 50">
            <rect width="50" height="50" rx="12" fill="#fa243c"/>
            <path d="M34 13 L20 16 L20 33 C20 36 17 38 14 37 C11 36 11 32 14 31 C16 30 18 31 18 31 L18 19 L32 16 L32 29 C32 32 29 34 26 33 C23 32 23 28 26 27 C28 26 30 27 30 27 L34 13 Z" fill="#ffffff"/>
          </svg>
          <span>Apple Music</span>
        </div>`
    };
  }
  if (n.includes("deezer")) {
    return {
      fondo: "radial-gradient(circle at center, #a855f7 0%, #3b0764 65%, #090314 100%)",
      colorMarca: "#a855f7",
      htmlLogo: `
        <div class="logo-texto-icono">
          <svg width="40" height="36" viewBox="0 0 48 40">
            <rect x="2" y="24" width="8" height="12" rx="2" fill="#a855f7"/>
            <rect x="13" y="16" width="8" height="20" rx="2" fill="#ec4899"/>
            <rect x="24" y="8" width="8" height="28" rx="2" fill="#eab308"/>
            <rect x="35" y="18" width="8" height="18" rx="2" fill="#22c55e"/>
          </svg>
          <span>deezer</span>
        </div>`
    };
  }
  if (n.includes("chatgpt") || n.includes("openai") || n.includes("gpt")) {
    return {
      fondo: "radial-gradient(circle at center, #0d9488 0%, #064e3b 65%, #021713 100%)",
      colorMarca: "#10a37f",
      htmlLogo: `
        <div class="logo-texto-icono">
          <svg width="40" height="40" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="12 5"/>
            <circle cx="25" cy="25" r="8" fill="#10a37f"/>
          </svg>
          <span>ChatGPT</span>
        </div>`
    };
  }
  if (n.includes("gemini") || n.includes("google")) {
    return {
      fondo: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #7e22ce 100%)",
      colorMarca: "#60a5fa",
      htmlLogo: `
        <div class="logo-texto-icono">
          <svg width="40" height="40" viewBox="0 0 50 50">
            <path d="M25 4 Q25 25 46 25 Q25 25 25 46 Q25 25 4 25 Q25 25 25 4 Z" fill="#60a5fa"/>
          </svg>
          <span>Gemini</span>
        </div>`
    };
  }
  if (n.includes("roblox") || n.includes("robux")) {
    return {
      fondo: "radial-gradient(circle at center, #374151 0%, #111827 70%, #030712 100%)",
      colorMarca: "#ef4444",
      htmlLogo: `
        <div class="logo-texto-icono">
          <svg width="38" height="38" viewBox="0 0 50 50">
            <g transform="translate(25,25) rotate(14)">
              <rect x="-18" y="-18" width="36" height="36" rx="4" fill="#ffffff"/>
              <rect x="-6" y="-6" width="12" height="12" fill="#111827"/>
            </g>
          </svg>
          <span style="letter-spacing:1px;">ROBLOX</span>
        </div>`
    };
  }

  const tituloCorto = (prod.nombre || "PREMIUM").split(" ")[0].toUpperCase();
  return {
    fondo: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)",
    colorMarca: "#818cf8",
    htmlLogo: `<div class="logo-texto-icono"><span>${tituloCorto}</span></div>`
  };
}

// ==========================================
// 3. MOSTRAR PRODUCTOS, STOCK, DESCUENTO Y MÍNIMO DE MESES
// ==========================================
function obtenerPrecioNumerico(precioTexto) {
  const limpio = String(precioTexto).replace(/[^0-9.,]/g, "").replace(",", ".");
  return parseFloat(limpio) || 0;
}

function permiteElegirMeses(prod) {
  const per = (prod.periodo || "").toLowerCase().trim();
  const nom = (prod.nombre || "").toLowerCase();

  if (/\d/.test(per) || per.includes("año") || per.includes("anual")) {
    return false;
  }
  if (/\d+\s*mes/.test(nom)) {
    return false;
  }
  return per === "/ mes" || per === "mes" || per === "mensual";
}

function actualizarBotonesFiltro() {
  if (!contenedorFiltros) return;

  const categoriasUnicas = [...new Set(productos.map(p => (p.categoria || "otros").toLowerCase()))];
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
    contenedor.innerHTML = `<p style="color: #94a3b8; grid-column: 1/-1; text-align: center; padding: 30px;">No se encontraron productos con esa búsqueda.</p>`;
    return;
  }

  lista.forEach((prod) => {
    const precioOriginalBase = obtenerPrecioNumerico(prod.precio);
    const descPorcentaje = parseFloat(prod.descuento) || 0;
    const tieneDescuento = descPorcentaje > 0;
    const precioConDescuentoBase = tieneDescuento
      ? precioOriginalBase * (1 - descPorcentaje / 100)
      : precioOriginalBase;

    const stockDisponible = (prod.stock === null || prod.stock === undefined || prod.stock === "" || isNaN(prod.stock))
      ? null
      : parseInt(prod.stock, 10);
    const estaAgotado = stockDisponible !== null && stockDisponible <= 0;

    const tieneSelectorMeses = permiteElegirMeses(prod);
    const minMeses = (tieneSelectorMeses && prod.minimoMeses && prod.minimoMeses > 1)
      ? parseInt(prod.minimoMeses, 10)
      : 1;

    const visual = obtenerDisenoVisualProducto(prod);

    const tarjeta = document.createElement("div");
    tarjeta.className = `tarjeta ${estaAgotado ? "sin-stock" : ""}`;
    tarjeta.style.setProperty("--color-marca", visual.colorMarca || "#6366f1");

    let htmlBadgeDerecha = `<span class="badge-derecha oficial">✔ Oficial</span>`;
    if (estaAgotado) {
      htmlBadgeDerecha = `<span class="badge-derecha agotado">🚫 Agotado</span>`;
    } else if (stockDisponible !== null) {
      htmlBadgeDerecha = `<span class="badge-derecha stock-limitado">📦 Stock: ${stockDisponible}</span>`;
    }

    const htmlBadgeDescuento = tieneDescuento
      ? `<span class="badge-descuento-card">🔥 -${descPorcentaje}% OFF</span>`
      : "";

    const opcionesBase = [1, 2, 3, 6, 12];
    if (!opcionesBase.includes(minMeses)) {
      opcionesBase.push(minMeses);
      opcionesBase.sort((a, b) => a - b);
    }
    const opcionesFiltradas = opcionesBase.filter(m => m >= minMeses);

    const htmlOpcionesMeses = opcionesFiltradas.map(m => {
      if (m === 1) return `<option value="1">1 mes</option>`;
      if (m === 12) return `<option value="12">12 meses (1 año)</option>`;
      return `<option value="${m}">${m} meses</option>`;
    }).join("");

    const textoLabelDuracion = minMeses > 1 ? `📅 Duración (Mín. ${minMeses}m):` : `📅 Duración:`;

    const htmlSelectorMeses = (tieneSelectorMeses && !estaAgotado) ? `
      <div class="caja-selector-meses">
        <label>${textoLabelDuracion}</label>
        <select class="select-meses">
          ${htmlOpcionesMeses}
        </select>
      </div>
    ` : "";

    const precioMostradoInicial = (precioConDescuentoBase * minMeses).toFixed(2);
    const precioOriginalInicial = (precioOriginalBase * minMeses).toFixed(2);
    const precioMostradoTexto = `$${precioMostradoInicial}`;

    const htmlPrecioOriginalTachado = tieneDescuento
      ? `<span class="precio-original">$${precioOriginalInicial}</span>`
      : "";

    const textoPeriodoInicial = (tieneSelectorMeses && minMeses > 1)
      ? `por ${minMeses} meses`
      : prod.periodo;

    const etiquetaMesesInicial = minMeses === 1 ? "1 mes" : `${minMeses} meses`;
    const mensajeInicial = tieneSelectorMeses
      ? `¡Hola! Me interesa comprar: *${prod.nombre} (${etiquetaMesesInicial})* - Total: ${precioMostradoTexto}`
      : `¡Hola! Me interesa comprar: *${prod.nombre}* (${precioMostradoTexto} ${prod.periodo})`;
    const urlWhatsappInicial = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensajeInicial)}`;

    tarjeta.innerHTML = `
      <div class="tarjeta-media" style="background: ${visual.fondo};">
        <span class="badge-flotante">${prod.categoria}</span>
        ${htmlBadgeDerecha}
        ${htmlBadgeDescuento}
        <div class="contenedor-logo-oficial">${visual.htmlLogo}</div>
      </div>
      <div class="tarjeta-cuerpo">
        <div>
          <h3>${prod.nombre}</h3>
          <p>${prod.descripcion}</p>
        </div>
        <div>
          ${htmlSelectorMeses}
          <div class="precio">
            ${htmlPrecioOriginalTachado}
            <strong class="valor-precio ${tieneDescuento ? 'en-oferta' : ''}">${precioMostradoTexto}</strong> 
            <span class="texto-periodo">${textoPeriodoInicial}</span>
          </div>
          <div class="botones-tarjeta">
            <button class="btn-agregar-carrito" ${estaAgotado ? "disabled" : ""}>
              ${estaAgotado ? "🚫 Sin Stock" : "🛒 Añadir al carrito"}
            </button>
            <a href="${urlWhatsappInicial}" target="_blank" class="btn-comprar-directo">⚡ Comprar directo</a>
          </div>
        </div>
      </div>
    `;

    const selectMeses = tarjeta.querySelector(".select-meses");
    const valorPrecioEl = tarjeta.querySelector(".valor-precio");
    const precioOrigEl = tarjeta.querySelector(".precio-original");
    const textoPeriodoEl = tarjeta.querySelector(".texto-periodo");
    const btnComprarDirecto = tarjeta.querySelector(".btn-comprar-directo");

    if (selectMeses) {
      selectMeses.addEventListener("change", () => {
        const meses = parseInt(selectMeses.value, 10) || minMeses;
        const nuevoTotal = (precioConDescuentoBase * meses).toFixed(2);
        const etiquetaMeses = meses === 1 ? "1 mes" : `${meses} meses`;

        valorPrecioEl.textContent = `$${nuevoTotal}`;
        if (precioOrigEl) {
          precioOrigEl.textContent = `$${(precioOriginalBase * meses).toFixed(2)}`;
        }
        textoPeriodoEl.textContent = meses === 1 ? prod.periodo : `por ${meses} meses`;

        const nuevoMensaje = `¡Hola! Me interesa comprar: *${prod.nombre} (${etiquetaMeses})* - Total: $${nuevoTotal}`;
        btnComprarDirecto.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(nuevoMensaje)}`;
      });
    }

    const btnAgregar = tarjeta.querySelector(".btn-agregar-carrito");
    if (btnAgregar && !estaAgotado) {
      btnAgregar.addEventListener("click", (e) => {
        const mesesElegidos = selectMeses ? (parseInt(selectMeses.value, 10) || minMeses) : minMeses;
        const exito = agregarAlCarrito(prod, mesesElegidos, tieneSelectorMeses);
        if (exito) {
          const btn = e.target;
          btn.textContent = "✔ ¡Añadido!";
          setTimeout(() => (btn.textContent = "🛒 Añadir al carrito"), 1000);
        }
      });
    }

    contenedor.appendChild(tarjeta);
  });
}

// ==========================================
// 4. CARRITO, REGLA DE NO ACUMULAR DESCUENTOS Y STOCK
// ==========================================
function carritoTieneProductoConDescuento() {
  return carrito.some(item => (parseFloat(item.descuentoProducto) || 0) > 0);
}

function agregarAlCarrito(prod, meses = 1, mostrarMeses = false) {
  const stockMax = (prod.stock === null || prod.stock === undefined || prod.stock === "" || isNaN(prod.stock))
    ? null
    : parseInt(prod.stock, 10);

  const unidadesEnCarrito = carrito
    .filter(item => item.nombreBase === prod.nombre)
    .reduce((acc, item) => acc + item.cantidad, 0);

  if (stockMax !== null && unidadesEnCarrito + 1 > stockMax) {
    alert(`⚠️ Solo quedan ${stockMax} unidad(es) disponibles en stock de "${prod.nombre}".`);
    return false;
  }

  const precioOriginalBase = obtenerPrecioNumerico(prod.precio);
  const descPorcentaje = parseFloat(prod.descuento) || 0;

  const yaHayDescuentoEnCarrito = carritoTieneProductoConDescuento();
  const aplicaDescuentoProducto = descPorcentaje > 0 && (!yaHayDescuentoEnCarrito || carrito.some(i => i.nombreBase === prod.nombre && i.descuentoProducto > 0));

  const precioUnitarioBase = aplicaDescuentoProducto
    ? precioOriginalBase * (1 - descPorcentaje / 100)
    : precioOriginalBase;

  const precioFinalNum = precioUnitarioBase * meses;
  const precioFinalTexto = `$${precioFinalNum.toFixed(2)}`;

  const etiquetaMeses = meses === 1 ? "1 mes" : `${meses} meses`;
  const nombreConMeses = mostrarMeses ? `${prod.nombre} (${etiquetaMeses})` : prod.nombre;

  const existente = carrito.find(item => item.nombre === nombreConMeses);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      nombre: nombreConMeses,
      nombreBase: prod.nombre,
      categoria: (prod.categoria || "otros").toLowerCase(),
      precioTexto: precioFinalTexto,
      precioNum: precioFinalNum,
      periodo: mostrarMeses ? etiquetaMeses : prod.periodo,
      cantidad: 1,
      stockMax: stockMax,
      descuentoProducto: aplicaDescuentoProducto ? descPorcentaje : 0,
      intentoSegundoDescuento: (descPorcentaje > 0 && !aplicaDescuentoProducto)
    });
  }

  actualizarVistaCarrito();
  return true;
}

window.cambiarCantidad = function(index, cambio) {
  const item = carrito[index];
  if (cambio > 0 && item.stockMax !== null && item.stockMax !== undefined) {
    const totalMismoProducto = carrito
      .filter(i => i.nombreBase === item.nombreBase)
      .reduce((acc, i) => acc + i.cantidad, 0);

    if (totalMismoProducto + cambio > item.stockMax) {
      alert(`⚠️ No puedes agregar más: solo hay ${item.stockMax} en stock.`);
      return;
    }
  }

  item.cantidad += cambio;
  if (item.cantidad <= 0) {
    carrito.splice(index, 1);
  }
  actualizarVistaCarrito();
};

function verificarRequisitosCarritoParaCupon(cupon) {
  if (!cupon) return { cumple: false, motivo: "" };

  if (carritoTieneProductoConDescuento()) {
    return {
      cumple: false,
      motivo: "⚠️ Ya tienes un producto con descuento en el carrito, así que ya no aplica otro descuento adicional."
    };
  }

  const catReq = (cupon.categoriaRequerida || "todos").toLowerCase().trim();
  const minProd = parseInt(cupon.minimoProductos, 10) || 1;

  let cantidadValida = 0;
  carrito.forEach((item) => {
    const catItem = (item.categoria || "otros").toLowerCase().trim();
    if (catReq === "todos" || catReq === "" || catItem === catReq) {
      cantidadValida += item.cantidad;
    }
  });

  if (cantidadValida < minProd) {
    const textoCat = (catReq === "todos" || catReq === "") ? "en total" : `de la categoría "${catReq}"`;
    return {
      cumple: false,
      motivo: `⚠️ El cupón ${cupon.codigo} requiere al menos ${minProd} producto(s) ${textoCat} en tu carrito (tienes ${cantidadValida}).`
    };
  }

  return { cumple: true, motivo: "" };
}

function obtenerResumenTotales() {
  const subtotal = carrito.reduce((acc, item) => acc + (item.precioNum * item.cantidad), 0);
  const tieneProdConDescuento = carritoTieneProductoConDescuento();
  const tieneIntentoSegundoDesc = carrito.some(item => item.intentoSegundoDescuento);

  let aplicaCupon = false;
  let montoDescCupon = 0;
  let motivoNoCumple = "";

  if (tieneIntentoSegundoDesc) {
    motivoNoCumple = "⚠️ Ya tienes un producto con descuento en el carrito, por lo que no se acumula otro descuento adicional.";
  }

  if (cuponActivo) {
    const validacion = verificarRequisitosCarritoParaCupon(cuponActivo);
    if (validacion.cumple) {
      aplicaCupon = true;
      const catReq = (cuponActivo.categoriaRequerida || "todos").toLowerCase().trim();
      const baseDescuento = carrito.reduce((acc, item) => {
        const catItem = (item.categoria || "otros").toLowerCase().trim();
        if (catReq === "todos" || catReq === "" || catItem === catReq) {
          return acc + (item.precioNum * item.cantidad);
        }
        return acc;
      }, 0);

      montoDescCupon = baseDescuento * (cuponActivo.porcentaje / 100);
    } else {
      motivoNoCumple = validacion.motivo;
    }
  }

  const totalFinal = Math.max(0, subtotal - montoDescCupon);

  return {
    subtotal,
    tieneProdConDescuento,
    aplicaCupon,
    montoDescCupon,
    motivoNoCumple,
    totalFinal
  };
}

function actualizarVistaCarrito() {
  localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));

  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  contadorCarrito.textContent = totalItems;

  listaCarrito.innerHTML = "";

  if (carrito.length === 0) {
    listaCarrito.innerHTML = `<p class="carrito-vacio">Tu carrito está vacío. Añade productos del catálogo.</p>`;
    seccionPago.classList.add("oculto");
    return;
  }

  seccionPago.classList.remove("oculto");

  carrito.forEach((item, index) => {
    const subtotalItem = item.precioNum * item.cantidad;
    const tagDescuento = item.descuentoProducto > 0
      ? `<span class="tag-oferta-carrito">-${item.descuentoProducto}% OFF</span>`
      : "";

    const div = document.createElement("div");
    div.className = "item-carrito";
    div.innerHTML = `
      <div class="item-info">
        <h4>${item.nombre} ${tagDescuento}</h4>
        <span>Categoría: ${item.categoria} | ${item.precioTexto} c/u</span>
      </div>
      <div class="item-controles">
        <button onclick="cambiarCantidad(${index}, -1)">-</button>
        <span>${item.cantidad}</span>
        <button onclick="cambiarCantidad(${index}, 1)">+</button>
        <strong class="item-subtotal">$${subtotalItem.toFixed(2)}</strong>
      </div>
    `;
    listaCarrito.appendChild(div);
  });

  const resumen = obtenerResumenTotales();
  if (subtotalCarritoEl) subtotalCarritoEl.textContent = `$${resumen.subtotal.toFixed(2)}`;
  if (filaDescAuto) filaDescAuto.classList.add("oculto");

  if (filaDescCupon) {
    if (resumen.aplicaCupon && resumen.montoDescCupon > 0) {
      filaDescCupon.classList.remove("oculto");
      textoDescCuponEl.textContent = `🎟️ Cupón ${cuponActivo.codigo} (-${cuponActivo.porcentaje}%):`;
      montoDescCuponEl.textContent = `-$${resumen.montoDescCupon.toFixed(2)}`;
      if (mensajeCupon) {
        mensajeCupon.classList.remove("oculto", "error");
        mensajeCupon.classList.add("exito");
        mensajeCupon.textContent = `🎉 ¡Cupón ${cuponActivo.codigo} (-${cuponActivo.porcentaje}%) aplicado!`;
      }
    } else {
      filaDescCupon.classList.add("oculto");
      if (resumen.motivoNoCumple && mensajeCupon) {
        mensajeCupon.classList.remove("oculto", "exito");
        mensajeCupon.classList.add("error");
        mensajeCupon.textContent = resumen.motivoNoCumple;
      } else if (resumen.tieneProdConDescuento && mensajeCupon) {
        mensajeCupon.classList.remove("oculto", "exito");
        mensajeCupon.classList.add("error");
        mensajeCupon.textContent = "ℹ️ Ya tienes un producto con descuento en el carrito (no aplica descuento adicional).";
      } else if (!cuponActivo && mensajeCupon) {
        mensajeCupon.classList.add("oculto");
      }
    }
  }

  totalCarrito.textContent = `$${resumen.totalFinal.toFixed(2)}`;
}

async function consultarAppsScript(url) {
  try {
    const respuesta = await fetch(url, { method: "GET", redirect: "follow", credentials: "omit" });
    const texto = await respuesta.text();
    return JSON.parse(texto);
  } catch (e) {
    console.warn("Intentando respaldo JSONP...");
  }

  return new Promise((resolve, reject) => {
    const nombreCallback = "cb_" + Math.floor(Math.random() * 1000000);
    const script = document.createElement("script");
    const separador = url.includes("?") ? "&" : "?";

    window[nombreCallback] = (datos) => {
      delete window[nombreCallback];
      script.remove();
      resolve(datos);
    };

    script.onerror = () => {
      delete window[nombreCallback];
      script.remove();
      reject(new Error("Fallo de red"));
    };

    script.src = `${url}${separador}callback=${nombreCallback}`;
    document.body.appendChild(script);
  });
}

async function buscarCuponEnSheetCSV(codigoBuscado) {
  try {
    const res = await fetch(`${SHEET_CUPONES_CSV_URL}&t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const csv = await res.text();
    const filas = csv.split(/\r?\n/);

    const cabecera = (filas[0] || "").toLowerCase();
    if (cabecera.includes("descripcion") || cabecera.includes("periodo")) return null;

    for (let i = 0; i < filas.length; i++) {
      const col = dividirFilaCSV(filas[i]);
      const codigoFila = (col[0] || "").replace(/"/g, "").trim().toUpperCase();
      if (codigoFila === codigoBuscado) {
        const porcentaje = parseFloat((col[1] || "0").replace("%", "").trim()) || 0;
        const estado = (col[2] || "activo").toLowerCase().trim();
        const categoriaReq = (col[3] || "todos").toLowerCase().trim();
        const minProd = parseInt(col[4] || "1", 10) || 1;

        if (estado === "inactivo" || estado === "usado" || estado === "no" || estado === "0") {
          return { valido: false, mensaje: "⚠️ Este cupón ya expiró o fue utilizado." };
        }
        if (porcentaje > 0) {
          return {
            valido: true,
            codigo: codigoFila,
            porcentaje: porcentaje,
            categoriaRequerida: categoriaReq,
            minimoProductos: minProd,
            mensaje: `🎉 ¡Cupón ${codigoFila} (-${porcentaje}%) aplicado!`
          };
        }
      }
    }
  } catch (e) {}
  return null;
}

if (btnAplicarCupon) {
  btnAplicarCupon.addEventListener("click", async () => {
    const codigo = inputCupon.value.trim().toUpperCase();
    mensajeCupon.classList.remove("oculto", "exito", "error");

    if (carritoTieneProductoConDescuento()) {
      cuponActivo = null;
      mensajeCupon.textContent = "⚠️ Ya tienes un producto con descuento en el carrito, así que ya no aplica el descuento.";
      mensajeCupon.classList.add("error");
      actualizarVistaCarrito();
      return;
    }

    if (!codigo) {
      mensajeCupon.textContent = "⚠️ Escribe un código de cupón.";
      mensajeCupon.classList.add("error");
      return;
    }

    btnAplicarCupon.disabled = true;
    btnAplicarCupon.textContent = "Validando...";
    mensajeCupon.textContent = "🔄 Verificando cupón en el sistema...";

    let data = null;

    try {
      const url = `${URL_VERIFICADOR_PICHINCHA}?accion=validarCupon&cupon=${encodeURIComponent(codigo)}&t=${Date.now()}`;
      data = await consultarAppsScript(url);
    } catch (err) {}

    if (!data) {
      data = await buscarCuponEnSheetCSV(codigo);
    }

    if (!data && CUPONES_LOCALES[codigo]) {
      const cLocal = CUPONES_LOCALES[codigo];
      if (cLocal.activo) {
        data = {
          valido: true,
          codigo: codigo,
          porcentaje: cLocal.porcentaje,
          categoriaRequerida: cLocal.categoriaRequerida,
          minimoProductos: cLocal.minimoProductos,
          mensaje: `🎉 ¡Cupón ${codigo} (-${cLocal.porcentaje}%) aplicado!`
        };
      } else {
        data = { valido: false, mensaje: "⚠️ Este cupón ya no está activo." };
      }
    }

    if (data && data.valido) {
      const candidatoCupon = {
        codigo: data.codigo,
        porcentaje: data.porcentaje,
        categoriaRequerida: data.categoriaRequerida || "todos",
        minimoProductos: data.minimoProductos || 1
      };

      const checkCarrito = verificarRequisitosCarritoParaCupon(candidatoCupon);
      cuponActivo = candidatoCupon;

      if (checkCarrito.cumple) {
        mensajeCupon.textContent = data.mensaje;
        mensajeCupon.classList.add("exito");
      } else {
        mensajeCupon.textContent = checkCarrito.motivo;
        mensajeCupon.classList.add("error");
      }
    } else {
      cuponActivo = null;
      mensajeCupon.textContent = (data && data.mensaje) ? data.mensaje : "❌ El cupón ingresado no existe o no es válido.";
      mensajeCupon.classList.add("error");
    }

    actualizarVistaCarrito();
    btnAplicarCupon.disabled = false;
    btnAplicarCupon.textContent = "Aplicar";
  });
}

inputComprobante.addEventListener("input", () => {
  pagoVerificadoAutomaticamente = false;
  estadoVerificacion.classList.add("oculto");
});

btnVerificarPago.addEventListener("click", async () => {
  const comprobante = inputComprobante.value.trim();
  const resumen = obtenerResumenTotales();
  const monto = resumen.totalFinal.toFixed(2);
  const codigoCupon = (cuponActivo && resumen.aplicaCupon) ? cuponActivo.codigo : "";

  const itemsParaStock = carrito.map(i => ({
    nombreBase: i.nombreBase || i.nombre,
    cantidad: i.cantidad
  }));

  estadoVerificacion.classList.remove("oculto", "exito", "error");

  if (!comprobante) {
    estadoVerificacion.textContent = "⚠️ Escribe el número de comprobante de tu transferencia.";
    estadoVerificacion.classList.add("error");
    return;
  }

  btnVerificarPago.disabled = true;
  btnVerificarPago.textContent = "Buscando...";
  estadoVerificacion.textContent = "🔄 Verificando transferencia y actualizando stock...";

  try {
    const url = `${URL_VERIFICADOR_PICHINCHA}?comprobante=${encodeURIComponent(comprobante)}&monto=${encodeURIComponent(monto)}&cupon=${encodeURIComponent(codigoCupon)}&items=${encodeURIComponent(JSON.stringify(itemsParaStock))}&t=${Date.now()}`;
    const data = await consultarAppsScript(url);

    estadoVerificacion.textContent = data.mensaje;
    if (data.verificado) {
      pagoVerificadoAutomaticamente = true;
      estadoVerificacion.classList.add("exito");

      itemsParaStock.forEach((comprado) => {
        const prodEnCatalogo = productos.find(p => p.nombre.toLowerCase() === String(comprado.nombreBase).toLowerCase());
        if (prodEnCatalogo && prodEnCatalogo.stock !== null && prodEnCatalogo.stock !== undefined && !isNaN(prodEnCatalogo.stock)) {
          prodEnCatalogo.stock = Math.max(0, parseInt(prodEnCatalogo.stock, 10) - comprado.cantidad);
        }
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(productos));
      filtrarCatalogo();
    } else {
      pagoVerificadoAutomaticamente = false;
      estadoVerificacion.classList.add("error");
    }
  } catch (err) {
    estadoVerificacion.textContent = "⚠️ No se pudo conectar con el verificador.";
    estadoVerificacion.classList.add("error");
  } finally {
    btnVerificarPago.disabled = false;
    btnVerificarPago.textContent = "🔍 Verificar";
  }
});

// ==========================================
// 5. SISTEMA DE RESEÑAS EN TIEMPO REAL (DIFERENCIA WEB Y GOOGLE)
// ==========================================
function calcularTiempoRelativo(fechaInput) {
  if (!fechaInput) return "Recién";
  const texto = String(fechaInput).trim();

  if (texto.toLowerCase().startsWith("hace") || texto.toLowerCase() === "recién" || texto.toLowerCase() === "recien") {
    return texto;
  }

  const fechaObj = new Date(texto);
  if (isNaN(fechaObj.getTime())) return texto;

  const segundos = Math.max(1, Math.floor((Date.now() - fechaObj.getTime()) / 1000));
  if (segundos < 90) return "Recién";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Hace ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `Hace ${dias} ${dias === 1 ? "día" : "días"}`;
  const semanas = Math.floor(dias / 7);
  if (semanas < 5) return `Hace ${semanas} ${semanas === 1 ? "semana" : "semanas"}`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `Hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anos = Math.floor(dias / 365);
  return `Hace ${anos} ${anos === 1 ? "año" : "años"}`;
}

function renderizarResenas() {
  if (!listaResenasContenedor) return;
  listaResenasContenedor.innerHTML = "";

  const total = resenasLista.length;
  const suma = resenasLista.reduce((acc, r) => acc + (parseFloat(r.estrellas) || 5), 0);
  const promedio = total > 0 ? (suma / total).toFixed(1) : "5.0";

  const totalGoogle = resenasLista.filter(r => normalizarOrigenResena(r) === "google").length;
  const totalWeb = total - totalGoogle;

  if (promedioResenasEl) promedioResenasEl.textContent = promedio;
  if (totalResenasCountEl) totalResenasCountEl.textContent = total;
  if (textoOpinionPluralEl) {
    textoOpinionPluralEl.textContent = total === 1 ? "opinión" : "opiniones";
  }
  if (conteoGoogleTxtEl) conteoGoogleTxtEl.textContent = `${totalGoogle} en Google`;
  if (conteoWebTxtEl) conteoWebTxtEl.textContent = `${totalWeb} en Web`;

  resenasLista.forEach((rev) => {
    const numEstrellas = Math.min(5, Math.max(1, parseInt(rev.estrellas, 10) || 5));
    const estrellasTxt = "★".repeat(numEstrellas) + "☆".repeat(5 - numEstrellas);
    const nombreLimpio = (rev.nombre || "Cliente").trim();
    const esTDC = nombreLimpio.toLowerCase().includes("tienda digital cede");
    const inicial = esTDC ? "TDC" : nombreLimpio.charAt(0).toUpperCase();
    const tiempoTexto = calcularTiempoRelativo(rev.fecha);
    const textoComentario = (rev.comentario || "").trim();

    const origenTipo = normalizarOrigenResena(rev);
    const htmlBadgeOrigen = origenTipo === "google"
      ? `<span class="badge-verificado-google" title="Reseña publicada en Google Maps">✔ Google</span>`
      : `<span style="font-size:0.68rem; background:rgba(168,85,247,0.18); color:#d8b4fe; border:1px solid rgba(168,85,247,0.45); padding:1px 7px; border-radius:99px; font-weight:800;" title="Reseña publicada en la página web">🌐 Web</span>`;

    const badgeNueva = (tiempoTexto === "Recién" || tiempoTexto.includes("minuto") || tiempoTexto.includes("hora"))
      ? `<span style="background:rgba(255,255,255,0.1); color:#e2e8f0; font-size:0.65rem; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:700;">NUEVA</span>`
      : "";

    const htmlComentario = textoComentario
      ? `<p class="comentario-resena">"${textoComentario}"</p>`
      : "";

    const card = document.createElement("div");
    card.className = "tarjeta-resena-item";
    card.innerHTML = `
      <div class="resena-cabecera" style="${!textoComentario ? 'margin-bottom:0;' : ''}">
        <div class="resena-usuario">
          <div class="avatar-resena" style="${esTDC ? 'font-size:0.75rem; background:#0f172a; border:1px solid #38bdf8;' : ''}">${inicial}</div>
          <div>
            <h4>${nombreLimpio} ${htmlBadgeOrigen}</h4>
            <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
              <span class="estrellas-item" style="font-size:0.88rem;">${estrellasTxt}</span>
              <span class="tiempo-resena">${tiempoTexto}</span>
              ${badgeNueva}
            </div>
          </div>
        </div>
      </div>
      ${htmlComentario}
    `;
    listaResenasContenedor.appendChild(card);
  });
}

async function sincronizarResenasEnTiempoReal() {
  // 1. Lee la pestaña "Resenas" del CSV (verifica que NO sea la hoja de Productos)
  try {
    const res = await fetch(`${SHEET_RESENAS_CSV_URL}&t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const csv = await res.text();
      if (!csv.includes("<!DOCTYPE") && !csv.includes("<html")) {
        const filas = csv.split(/\r?\n/).filter(f => f.trim() !== "");
        if (filas.length > 0) {
          const filaCabecera = dividirFilaCSV(filas[0]).map(c => c.toLowerCase().replace(/"/g, "").trim());
          const esHojaDeProductos = filaCabecera.includes("categoria") || filaCabecera.includes("categoría") || filaCabecera.includes("precio") || filaCabecera.includes("periodo") || filaCabecera.includes("stock");
          const esHojaDeResenas = filaCabecera.includes("estrellas") || filaCabecera.includes("comentario") || filaCabecera.includes("resena") || filaCabecera.includes("reseña") || filaCabecera.includes("calificacion");

          if (!esHojaDeProductos && esHojaDeResenas) {
            const nuevasResenas = [];
            for (let i = ( filas.length - 1 ); i >= 1; i--) {
              const col = dividirFilaCSV(filas[i]);
              const nombre = (col[0] || "").replace(/"/g, "").trim();
              if (!nombre) continue;

              const estrellas = parseInt((col[1] || "5").replace(/[^0-9]/g, ""), 10) || 5;
              const comentario = (col[2] || "").replace(/"/g, "").trim();
              const fecha = (col[3] || "").replace(/"/g, "").trim() || "Recién";
              const origenRaw = (col[4] || "").replace(/"/g, "").trim(); // Columna E: "Web" o "Google"

              nuevasResenas.push({
                nombre,
                estrellas,
                comentario,
                fecha,
                origen: normalizarOrigenResena({ nombre, origen: origenRaw })
              });
            }

            if (nuevasResenas.length > 0) {
              resenasLista = nuevasResenas;
              localStorage.setItem(RESENAS_CACHE_KEY, JSON.stringify(resenasLista));
              renderizarResenas();
              return;
            }
          }
        }
      }
    }
  } catch (e) {}

  // 2. Respaldo desde Apps Script si está activo
  try {
    const urlVivo = `${URL_VERIFICADOR_PICHINCHA}?accion=obtenerResenas&t=${Date.now()}`;
    const data = await consultarAppsScript(urlVivo);
    if (data && data.ok && Array.isArray(data.resenas) && data.resenas.length > 0) {
      resenasLista = data.resenas.map(r => ({
        ...r,
        origen: normalizarOrigenResena(r)
      }));
      localStorage.setItem(RESENAS_CACHE_KEY, JSON.stringify(resenasLista));
      renderizarResenas();
    }
  } catch (e) {}
}

estrellasPublicarBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    estrellasSeleccionadasParaPublicar = parseInt(btn.getAttribute("data-star"), 10) || 5;
    estrellasPublicarBtns.forEach((b) => {
      const valorB = parseInt(b.getAttribute("data-star"), 10);
      b.style.opacity = valorB <= estrellasSeleccionadasParaPublicar ? "1" : "0.3";
    });
  });
});

// Publicar reseña en la Web (Etiqueta 🌐 Web)
if (formPublicarResena) {
  formPublicarResena.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = (inputNombreResena.value || "").trim() || "Cliente";
    const comentario = (inputTextoResena.value || "").trim();

    const nuevaResena = {
      nombre: nombre,
      estrellas: estrellasSeleccionadasParaPublicar,
      comentario: comentario,
      fecha: new Date().toISOString(),
      origen: "web"
    };

    resenasLista.unshift(nuevaResena);
    localStorage.setItem(RESENAS_CACHE_KEY, JSON.stringify(resenasLista));
    renderizarResenas();

    if (mensajeResenaPublicada) {
      mensajeResenaPublicada.classList.remove("oculto");
      mensajeResenaPublicada.innerHTML = `✅ ¡Gracias <strong>${nombre}</strong>! Tu reseña se publicó en la <strong>Web</strong>. Si deseas que aparezca en Google Maps, pulsa el botón amarillo.`;
      setTimeout(() => mensajeResenaPublicada.classList.add("oculto"), 6000);
    }

    const urlGuardar = `${URL_VERIFICADOR_PICHINCHA}?accion=agregarResena&nombre=${encodeURIComponent(nombre)}&estrellas=${encodeURIComponent(estrellasSeleccionadasParaPublicar)}&comentario=${encodeURIComponent(comentario)}&fecha=${encodeURIComponent(nuevaResena.fecha)}&origen=Web&t=${Date.now()}`;
    consultarAppsScript(urlGuardar).catch(() => {});

    formPublicarResena.reset();
  });
}

// ==========================================
// 6. SISTEMA DE TICKETS CON ESTADO EN VIVO DESDE GOOGLE SHEETS
// ==========================================
function obtenerEstiloBadgeEstado(estadoRaw) {
  const est = String(estadoRaw || "Pendiente").trim();
  const estLower = est.toLowerCase();

  if (estLower.includes("resuelto") || estLower.includes("solucionado") || estLower.includes("completado") || estLower.includes("listo") || estLower.includes("atendido")) {
    return {
      texto: `✅ ${est.charAt(0).toUpperCase() + est.slice(1)}`,
      estilo: "background: rgba(34, 197, 94, 0.18); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.45);"
    };
  }

  if (estLower.includes("proceso") || estLower.includes("revis") || estLower.includes("verificando")) {
    return {
      texto: `🔄 ${est.charAt(0).toUpperCase() + est.slice(1)}`,
      estilo: "background: rgba(56, 189, 248, 0.16); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);"
    };
  }

  if (estLower.includes("rechazado") || estLower.includes("cancelado") || estLower.includes("incorrecto") || estLower.includes("no válido")) {
    return {
      texto: `❌ ${est.charAt(0).toUpperCase() + est.slice(1)}`,
      estilo: "background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);"
    };
  }

  if (estLower.includes("pendiente") || estLower.includes("recibido")) {
    return {
      texto: "⏳ Pendiente de revisión",
      estilo: "background: rgba(250, 204, 21, 0.14); color: #fde047; border: 1px solid rgba(250, 204, 21, 0.35);"
    };
  }

  return {
    texto: `📌 ${est}`,
    estilo: "background: rgba(168, 85, 247, 0.18); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.4);"
  };
}

async function sincronizarTicketsDesdeSheet() {
  let textoCSV = "";
  try {
    const res = await fetch(`${SHEET_TICKETS_CSV_URL}&t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) textoCSV = await res.text();
  } catch (e) {}

  if (!textoCSV || textoCSV.includes("<!DOCTYPE")) {
    try {
      const resAlt = await fetch(`${SHEET_TICKETS_ALT_URL}&t=${Date.now()}`, { cache: "no-store" });
      if (resAlt.ok) textoCSV = await resAlt.text();
    } catch (e2) {}
  }

  if (!textoCSV || textoCSV.includes("<!DOCTYPE") || textoCSV.includes("<html")) return;

  const filas = textoCSV.split(/\r?\n/).filter(f => f.trim() !== "");
  if (filas.length === 0) return;

  const cabecera = dividirFilaCSV(filas[0]).map(c => c.toLowerCase().replace(/"/g, "").trim());
  if (!cabecera.some(c => c.includes("ticket") || c.includes("asunto") || c.includes("estado"))) {
    return;
  }

  const mapaTicketsSheet = {};
  for (let i = 1; i < filas.length; i++) {
    const col = dividirFilaCSV(filas[i]);
    const idTicket = (col[0] || "").replace(/"/g, "").trim().toUpperCase();
    if (!idTicket) continue;

    mapaTicketsSheet[idTicket] = {
      id: idTicket,
      fechaSheet: (col[1] || "").replace(/"/g, "").trim(),
      nombre: (col[2] || "").replace(/"/g, "").trim(),
      contacto: (col[3] || "").replace(/"/g, "").trim(),
      asunto: (col[4] || "").replace(/"/g, "").trim(),
      referencia: (col[5] || "").replace(/"/g, "").trim(),
      mensaje: (col[6] || "").replace(/"/g, "").trim(),
      estado: (col[7] || "Pendiente").replace(/"/g, "").trim(),
      respuesta: (col[8] || "").replace(/"/g, "").trim()
    };
  }

  let huboCambios = false;
  misTickets = misTickets.map((tkLocal) => {
    const idLimpio = String(tkLocal.id || "").trim().toUpperCase();
    const datosEnSheet = mapaTicketsSheet[idLimpio];
    if (datosEnSheet) {
      huboCambios = true;
      return {
        ...tkLocal,
        asunto: datosEnSheet.asunto || tkLocal.asunto,
        referencia: datosEnSheet.referencia || tkLocal.referencia || "",
        mensaje: datosEnSheet.mensaje || tkLocal.mensaje,
        contacto: datosEnSheet.contacto || tkLocal.contacto,
        estado: datosEnSheet.estado || "Pendiente",
        respuesta: datosEnSheet.respuesta || ""
      };
    }
    return tkLocal;
  });

  if (huboCambios) {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(misTickets));
    renderizarMisTickets();
  }
}

function cambiarVistaSoporte(vista) {
  tabsSoporte.forEach((t) => {
    t.classList.toggle("activo", t.getAttribute("data-vista") === vista);
  });
  if (vista === "crear") {
    vistaCrearTicket.classList.remove("oculto");
    vistaHistorialTickets.classList.add("oculto");
  } else {
    vistaCrearTicket.classList.add("oculto");
    vistaHistorialTickets.classList.remove("oculto");
    renderizarMisTickets();
    sincronizarTicketsDesdeSheet();
  }
}

tabsSoporte.forEach((tab) => {
  tab.addEventListener("click", () => cambiarVistaSoporte(tab.getAttribute("data-vista")));
});

function renderizarMisTickets() {
  if (contadorMisTicketsEl) contadorMisTicketsEl.textContent = misTickets.length;
  if (!listaMisTicketsEl) return;

  listaMisTicketsEl.innerHTML = "";
  if (misTickets.length === 0) {
    listaMisTicketsEl.innerHTML = `<p class="carrito-vacio">Aún no has creado ningún ticket de soporte.</p>`;
    return;
  }

  misTickets.slice().reverse().forEach((tk) => {
    const infoEstado = obtenerEstiloBadgeEstado(tk.estado);
    const refLimpia = (tk.referencia && !String(tk.referencia).includes("tk.referencia"))
      ? String(tk.referencia).trim()
      : "";

    const htmlReferencia = refLimpia
      ? `<span style="color: #93c5fd; font-weight: 700;"> (Ref: ${refLimpia})</span>`
      : "";

    const htmlRespuestaAdmin = tk.respuesta
      ? `<div style="margin-top:8px; padding:8px 10px; background:rgba(34,197,94,0.1); border-left:3px solid #4ade80; border-radius:6px; font-size:0.82rem; color:#e2e8f0;">
           <strong>💬 Respuesta Soporte:</strong> ${tk.respuesta}
         </div>`
      : "";

    const div = document.createElement("div");
    div.className = "item-ticket-historial";
    div.innerHTML = `
      <div class="ticket-top">
        <span class="codigo-ticket">🎫 Ticket #${tk.id}</span>
        <span class="estado-ticket-badge" style="${infoEstado.estilo}">${infoEstado.texto}</span>
      </div>
      <p class="ticket-asunto-txt"><strong>${tk.asunto}</strong>${htmlReferencia}</p>
      <p class="ticket-mensaje-txt">${tk.mensaje}</p>
      ${htmlRespuestaAdmin}
      <div class="ticket-footer-info">
        <span>📱 Contacto: ${tk.contacto}</span>
        <span>🕒 ${calcularTiempoRelativo(tk.fecha)}</span>
      </div>
    `;
    listaMisTicketsEl.appendChild(div);
  });
}

if (formTicketSoporte) {
  formTicketSoporte.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("ticket-nombre").value.trim();
    const contacto = document.getElementById("ticket-contacto").value.trim();
    const asunto = document.getElementById("ticket-asunto").value;
    const referencia = document.getElementById("ticket-referencia").value.trim();
    const mensaje = document.getElementById("ticket-mensaje").value.trim();

    if (!nombre || !contacto || !mensaje) return;

    const codigoTicket = "TDC-" + Math.floor(10000 + Math.random() * 90000);
    const fechaISO = new Date().toISOString();

    btnEnviarTicket.disabled = true;
    btnEnviarTicket.textContent = "⏳ Registrando Ticket...";
    estadoEnvioTicket.classList.remove("oculto", "exito", "error");
    estadoEnvioTicket.textContent = "🔄 Creando tu ticket en el sistema...";

    const nuevoTicket = {
      id: codigoTicket,
      nombre: nombre,
      contacto: contacto,
      asunto: asunto,
      referencia: referencia,
      mensaje: mensaje,
      fecha: fechaISO,
      estado: "Pendiente"
    };

    try {
      const urlTicket = `${URL_VERIFICADOR_PICHINCHA}?accion=crearTicket&id=${encodeURIComponent(codigoTicket)}&nombre=${encodeURIComponent(nombre)}&contacto=${encodeURIComponent(contacto)}&asunto=${encodeURIComponent(asunto)}&referencia=${encodeURIComponent(referencia)}&mensaje=${encodeURIComponent(mensaje)}&t=${Date.now()}`;
      await consultarAppsScript(urlTicket);
    } catch (err) {
      console.warn("Ticket guardado localmente.");
    }

    misTickets.push(nuevoTicket);
    localStorage.setItem(TICKETS_KEY, JSON.stringify(misTickets));
    if (contadorMisTicketsEl) contadorMisTicketsEl.textContent = misTickets.length;

    estadoEnvioTicket.classList.add("exito");
    estadoEnvioTicket.innerHTML = `✅ <strong>¡Ticket #${codigoTicket} creado con éxito!</strong> Puedes ver el estado en tiempo real en la pestaña "Mis Tickets".`;

    formTicketSoporte.reset();
    btnEnviarTicket.disabled = false;
    btnEnviarTicket.textContent = "📩 Generar Ticket de Soporte";

    setTimeout(() => {
      cambiarVistaSoporte("historial");
    }, 1500);
  });
}

// ==========================================
// 7. RUTAS DINÁMICAS (#carrito, #resenas, #soporte, #terminos, #garantia, #privacidad)
// ==========================================
function cerrarTodosLosModales() {
  if (modalCarrito) modalCarrito.classList.add("oculto");
  if (modalResenas) modalResenas.classList.add("oculto");
  if (modalSoporte) modalSoporte.classList.add("oculto");
  if (modalLegal) modalLegal.classList.add("oculto");
}

function limpiarHashUrl() {
  history.pushState("", document.title, window.location.pathname + window.location.search);
}

btnAbrirCarrito.addEventListener("click", () => {
  cerrarTodosLosModales();
  modalCarrito.classList.remove("oculto");
  window.location.hash = "carrito";
});

btnCerrarCarrito.addEventListener("click", () => {
  modalCarrito.classList.add("oculto");
  if (window.location.hash === "#carrito") limpiarHashUrl();
});

modalCarrito.addEventListener("click", (e) => {
  if (e.target === modalCarrito) {
    modalCarrito.classList.add("oculto");
    if (window.location.hash === "#carrito") limpiarHashUrl();
  }
});

if (btnAbrirResenas) {
  btnAbrirResenas.addEventListener("click", () => {
    cerrarTodosLosModales();
    renderizarResenas();
    sincronizarResenasEnTiempoReal();
    modalResenas.classList.remove("oculto");
    window.location.hash = "resenas";
  });
}

if (btnCerrarResenas) {
  btnCerrarResenas.addEventListener("click", () => {
    modalResenas.classList.add("oculto");
    if (window.location.hash === "#resenas") limpiarHashUrl();
  });
}

if (modalResenas) {
  modalResenas.addEventListener("click", (e) => {
    if (e.target === modalResenas) {
      modalResenas.classList.add("oculto");
      if (window.location.hash === "#resenas") limpiarHashUrl();
    }
  });
}

if (btnAbrirSoporte) {
  btnAbrirSoporte.addEventListener("click", () => {
    cerrarTodosLosModales();
    renderizarMisTickets();
    sincronizarTicketsDesdeSheet();
    modalSoporte.classList.remove("oculto");
    window.location.hash = "soporte";
  });
}

if (btnCerrarSoporte) {
  btnCerrarSoporte.addEventListener("click", () => {
    modalSoporte.classList.add("oculto");
    if (window.location.hash === "#soporte") limpiarHashUrl();
  });
}

if (modalSoporte) {
  modalSoporte.addEventListener("click", (e) => {
    if (e.target === modalSoporte) {
      modalSoporte.classList.add("oculto");
      if (window.location.hash === "#soporte") limpiarHashUrl();
    }
  });
}

function abrirPestanaLegal(nombreTab, actualizarHash = true) {
  if (!modalLegal) return;
  cerrarTodosLosModales();
  modalLegal.classList.remove("oculto");

  tabsLegales.forEach((btn) => {
    btn.classList.toggle("activo", btn.getAttribute("data-tab") === nombreTab);
  });

  ["terminos", "garantia", "privacidad"].forEach((id) => {
    const contenedorTab = document.getElementById(`contenido-${id}`);
    if (contenedorTab) {
      contenedorTab.classList.toggle("oculto", id !== nombreTab);
    }
  });

  if (actualizarHash) {
    window.location.hash = nombreTab;
  }
}

function cerrarModalLegal() {
  if (!modalLegal) return;
  modalLegal.classList.add("oculto");
  if (["#terminos", "#garantia", "#privacidad", "#legal"].includes(window.location.hash)) {
    limpiarHashUrl();
  }
}

tabsLegales.forEach((btn) => {
  btn.addEventListener("click", () => {
    abrirPestanaLegal(btn.getAttribute("data-tab"), true);
  });
});

if (btnCerrarLegal) btnCerrarLegal.addEventListener("click", cerrarModalLegal);
if (btnEntendidoLegal) {
  btnEntendidoLegal.addEventListener("click", () => {
    if (checkAceptoTerminos) checkAceptoTerminos.checked = true;
    cerrarModalLegal();
  });
}

if (modalLegal) {
  modalLegal.addEventListener("click", (e) => {
    if (e.target === modalLegal) cerrarModalLegal();
  });
}

function sincronizarRutasHash() {
  const hash = window.location.hash.replace("#", "").toLowerCase();
  if (hash === "terminos" || hash === "legal") {
    abrirPestanaLegal("terminos", false);
  } else if (hash === "garantia") {
    abrirPestanaLegal("garantia", false);
  } else if (hash === "privacidad") {
    abrirPestanaLegal("privacidad", false);
  } else if (hash === "carrito") {
    cerrarTodosLosModales();
    if (modalCarrito) modalCarrito.classList.remove("oculto");
  } else if (hash === "resenas") {
    cerrarTodosLosModales();
    renderizarResenas();
    sincronizarResenasEnTiempoReal();
    if (modalResenas) modalResenas.classList.remove("oculto");
  } else if (hash === "soporte") {
    cerrarTodosLosModales();
    renderizarMisTickets();
    sincronizarTicketsDesdeSheet();
    if (modalSoporte) modalSoporte.classList.remove("oculto");
  }
}

window.addEventListener("hashchange", sincronizarRutasHash);
window.addEventListener("load", sincronizarRutasHash);

// Sincroniza en tiempo real el estado de los tickets y reseñas cada 8 segundos
setInterval(() => {
  sincronizarTicketsDesdeSheet();
  renderizarResenas();
  sincronizarResenasEnTiempoReal();
}, 8000);

// Enviar pedido del Carrito por WhatsApp con validación legal
btnFinalizarPedido.addEventListener("click", () => {
  if (carrito.length === 0) return;

  if (checkAceptoTerminos && !checkAceptoTerminos.checked) {
    alert("⚠️ Para continuar con tu compra, debes aceptar los Términos y Condiciones y la Política de Garantía.");
    return;
  }

  let detalleProductos = "";
  carrito.forEach((item) => {
    const subtotalItem = item.precioNum * item.cantidad;
    const txtOferta = item.descuentoProducto > 0 ? ` (Oferta -${item.descuentoProducto}%)` : "";
    detalleProductos += `• ${item.cantidad}x *${item.nombre}*${txtOferta} [${item.categoria}] ($${subtotalItem.toFixed(2)})\n`;
  });

  const resumen = obtenerResumenTotales();

  if (cuponActivo && resumen.aplicaCupon && !pagoVerificadoAutomaticamente) {
    const urlUso = `${URL_VERIFICADOR_PICHINCHA}?accion=usarCupon&cupon=${encodeURIComponent(cuponActivo.codigo)}&t=${Date.now()}`;
    consultarAppsScript(urlUso).catch(() => {});
  }

  let lineaCuponTexto = "🎟️ *Descuento / Cupón:* Ninguno\n";
  if (resumen.tieneProdConDescuento) {
    lineaCuponTexto = "🔥 *Descuento aplicado:* Producto en Promoción (No acumulable con otro descuento)\n";
  } else if (cuponActivo && resumen.aplicaCupon) {
    lineaCuponTexto = `🎟️ *Cupón aplicado:* ${cuponActivo.codigo} (-${cuponActivo.porcentaje}% | -$${resumen.montoDescCupon.toFixed(2)})\n`;
  }

  const comprobanteEscrito = inputComprobante.value.trim();
  const comprobanteTexto = comprobanteEscrito ? comprobanteEscrito : "No ingresado (Enviaré captura por aquí)";

  let estadoOrdenTexto = "";
  if (pagoVerificadoAutomaticamente) {
    estadoOrdenTexto = "✅ ORDEN COMPLETA (Pago Verificado y Stock Descontado)";
  } else if (comprobanteEscrito) {
    estadoOrdenTexto = "⏳ ORDEN PENDIENTE DE VERIFICACIÓN MANUAL";
  } else {
    estadoOrdenTexto = "⚠️ ORDEN SIN COMPLETAR PAGO (Pendiente enviar comprobante)";
  }

  const mensaje = 
    `¡Hola *Tienda Digital Cedeño*! 🛒 Quiero realizar este pedido:\n\n` +
    `*📦 PRODUCTOS:*\n${detalleProductos}\n` +
    `💵 *Subtotal:* $${resumen.subtotal.toFixed(2)}\n` +
    `${lineaCuponTexto}` +
    `💰 *Total a pagar:* $${resumen.totalFinal.toFixed(2)}\n\n` +
    `🏦 *Cuenta Pichincha:* ${DATOS_BANCO.numeroCuenta}\n` +
    `🧾 *N° Comprobante:* ${comprobanteTexto}\n` +
    `📌 *Estado de Orden:* ${estadoOrdenTexto}\n` +
    `⚖️ *Términos y Garantía:* Aceptados por el cliente`;

  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
});

// ==========================================
// 8. BUSCADOR, FILTROS Y CARGA RÁPIDA DESDE GOOGLE SHEETS
// ==========================================
function filtrarCatalogo() {
  const texto = buscador.value.toLowerCase();
  const filtrados = productos.filter((prod) => {
    const coincideCategoria = categoriaActual === "todos" || (prod.categoria || "").toLowerCase() === categoriaActual;
    const coincideTexto = (prod.nombre || "").toLowerCase().includes(texto) || (prod.descripcion || "").toLowerCase().includes(texto);
    return coincideCategoria && coincideTexto;
  });
  mostrarProductos(filtrados);
}

buscador.addEventListener("input", filtrarCatalogo);

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

function normalizarProductoFila(nombre, categoria, descripcion, precioRaw, periodoRaw, stockRaw, descuentoRaw, minMesesRaw) {
  let precioBruto = String(precioRaw || "0.00").replace(/\\/g, "").trim();
  if (!precioBruto.startsWith("\$")) {
    precioBruto = "$" + precioBruto.replace("$", "");
  }

  let descTexto = String(descripcion || "").trim();
  if (descTexto.startsWith("\$")) {
    descTexto = descTexto.substring(1).trim();
  }

  const stockLimpio = (stockRaw === undefined || stockRaw === null || String(stockRaw).trim() === "")
    ? null
    : parseInt(String(stockRaw).trim(), 10);

  const descuentoLimpio = (descuentoRaw === undefined || descuentoRaw === null || String(descuentoRaw).trim() === "")
    ? 0
    : parseFloat(String(descuentoRaw).replace("%", "").trim()) || 0;

  const minMesesLimpio = (minMesesRaw === undefined || minMesesRaw === null || String(minMesesRaw).trim() === "")
    ? 1
    : Math.max(1, parseInt(String(minMesesRaw).replace(/[^0-9]/g, ""), 10) || 1);

  return {
    nombre: String(nombre).trim(),
    categoria: String(categoria || "otros").trim().toLowerCase(),
    descripcion: descTexto,
    precio: precioBruto,
    periodo: String(periodoRaw || "/ mes").trim(),
    stock: isNaN(stockLimpio) ? null : stockLimpio,
    descuento: descuentoLimpio,
    minimoMeses: minMesesLimpio
  };
}

function parsearTextoCSV(csv) {
  const filas = csv.split(/\r?\n/);
  const listaSheet = [];

  filas.forEach((fila, index) => {
    if (!fila.trim()) return;
    const col = dividirFilaCSV(fila);

    if (!col[0] || (index === 0 && col[0].toLowerCase().includes("nombre"))) return;

    let col2Limpia = (col[2] || "").replace(/\\/g, "").trim();
    let col3Limpia = (col[3] || "").replace(/\\/g, "").trim();
    let esPrecioEnC = /\d/.test(col2Limpia) && col2Limpia.length <= 10;

    let precioBruto = esPrecioEnC ? col2Limpia : col3Limpia;
    let periodoTexto = esPrecioEnC ? (col[3] || "/ mes") : (col[4] || "/ mes");
    let descripcionTexto = esPrecioEnC ? (col[4] || "") : (col[2] || "");

    if (!precioBruto && !descripcionTexto) return;

    listaSheet.push(
      normalizarProductoFila(col[0], col[1], descripcionTexto, precioBruto, periodoTexto, col[5], col[6], col[7])
    );
  });

  return listaSheet;
}

async function leerCSVDesdeUrl(urlBase) {
  const separador = urlBase.includes("?") ? "&" : "?";
  const urlSinCache = `${urlBase}${separador}t=${Date.now()}`;
  const res = await fetch(urlSinCache, { cache: "no-store" });
  if (!res.ok) throw new Error("Error HTTP al leer CSV");
  const csv = await res.text();
  return parsearTextoCSV(csv);
}

async function cargarDesdeGoogleSheets() {
  try {
    let listaCSV = await leerCSVDesdeUrl(GOOGLE_SHEET_CSV_URL);
    if (listaCSV.length === 0) {
      listaCSV = await leerCSVDesdeUrl(SHEET_GVIZ_URL);
    }
    if (listaCSV.length > 0) {
      productos = listaCSV;
      localStorage.setItem(CACHE_KEY, JSON.stringify(productos));
      actualizarBotonesFiltro();
      filtrarCatalogo();
    }
  } catch (err) {
    try {
      const listaRespaldo = await leerCSVDesdeUrl(SHEET_GVIZ_URL);
      if (listaRespaldo.length > 0) {
        productos = listaRespaldo;
        localStorage.setItem(CACHE_KEY, JSON.stringify(productos));
        actualizarBotonesFiltro();
        filtrarCatalogo();
      }
    } catch (e2) {
      console.error("Error cargando CSV:", e2);
    }
  }

  try {
    const mapaMinMesesCSV = {};
    productos.forEach(prodCSV => {
      mapaMinMesesCSV[(prodCSV.nombre || "").toLowerCase()] = prodCSV.minimoMeses || 1;
    });

    const urlVivo = `${URL_VERIFICADOR_PICHINCHA}?accion=obtenerProductos&t=${Date.now()}`;
    const dataVivo = await consultarAppsScript(urlVivo);
    if (dataVivo && dataVivo.ok && Array.isArray(dataVivo.productos) && dataVivo.productos.length > 0) {
      productos = dataVivo.productos.map(p => {
        const minMesesFinal = p.minimoMeses || mapaMinMesesCSV[(p.nombre || "").toLowerCase()] || 1;
        return normalizarProductoFila(p.nombre, p.categoria, p.descripcion, p.precio, p.periodo, p.stock, p.descuento, minMesesFinal);
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(productos));
      actualizarBotonesFiltro();
      filtrarCatalogo();
    }
  } catch (e) {}
}
// ==========================================
// 9. ESCUDO DE SEGURIDAD (ANTI-XSS, ANTI-SPAM Y PROTECCIÓN DE DATOS)
// ==========================================

// 1. Limpia cualquier etiqueta HTML maliciosa (<script>, <iframe>, onclick, etc.)
function escaparHTML(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sobrescribe la entrada de Reseñas y Tickets para filtrar código malicioso y bloquear Spam
if (formPublicarResena) {
  formPublicarResena.addEventListener("submit", (e) => {
    const ultimaResenaTime = parseInt(localStorage.getItem("ultimo_envio_resena") || "0", 10);
    const segundosRestantes = Math.ceil((60000 - (Date.now() - ultimaResenaTime)) / 1000);

    if (Date.now() - ultimaResenaTime < 60000) {
      e.stopImmediatePropagation();
      e.preventDefault();
      alert(`🛡️ Seguridad Anti-Spam: Por favor espera ${segundosRestantes} segundos antes de publicar otra reseña.`);
      return;
    }

    if (inputNombreResena) inputNombreResena.value = escaparHTML(inputNombreResena.value).slice(0, 45);
    if (inputTextoResena) inputTextoResena.value = escaparHTML(inputTextoResena.value).slice(0, 280);
    localStorage.setItem("ultimo_envio_resena", String(Date.now()));
  }, true);
}

if (formTicketSoporte) {
  formTicketSoporte.addEventListener("submit", (e) => {
    const ultimoTicketTime = parseInt(localStorage.getItem("ultimo_envio_ticket") || "0", 10);
    const segundosRestantes = Math.ceil((60000 - (Date.now() - ultimoTicketTime)) / 1000);

    if (Date.now() - ultimoTicketTime < 60000) {
      e.stopImmediatePropagation();
      e.preventDefault();
      alert(`Seguridad Anti-Spam: Ya enviaste un ticket hace poco. Espera ${segundosRestantes} segundos.`);
      return;
    }

    const campos = ["ticket-nombre", "ticket-contacto", "ticket-referencia", "ticket-mensaje"];
    campos.forEach((idCampo) => {
      const el = document.getElementById(idCampo);
      if (el) el.value = escaparHTML(el.value).slice(0, 350);
    });

    localStorage.setItem("ultimo_envio_ticket", String(Date.now()));
  }, true);
}

// 2. Bloquea clic derecho e inspección rápida (F12 / Ctrl+U / Ctrl+Shift+I) para curiosos
document.addEventListener("contextmenu", (e) => e.preventDefault());

document.addEventListener("keydown", (e) => {
  if (
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && ["I", "J", "C", "i", "j", "c"].includes(e.key)) ||
    (e.ctrlKey && ["U", "S", "u", "s"].includes(e.key))
  ) {
    e.preventDefault();
  }
});
// Inicialización general
actualizarBotonesFiltro();
filtrarCatalogo();
actualizarVistaCarrito();
renderizarResenas();
renderizarMisTickets();
cargarDesdeGoogleSheets();
sincronizarResenasEnTiempoReal();
sincronizarTicketsDesdeSheet();