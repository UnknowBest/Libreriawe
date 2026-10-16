// ==========================================
// 1. CONFIGURACIÓN PRINCIPAL Y DATOS BANCARIOS
// ==========================================
const NUMERO_WHATSAPP = "593963259492"; 
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNz682jLUpz3P7eKqahpH2NiLqctI5V1B2utHZ2ZMS4rsmYSwd0huivG5Qt_sM4FyxHtvS7AliVNm9/pub?gid=0&single=true&output=csv";
const URL_VERIFICADOR_PICHINCHA = "https://script.google.com/macros/s/AKfycbwmO7jW90VB-rWiF_mSfe6zgQfO9aqxGss2njfcEQOYeprd5plmgHMAUdpx1ttutlRY/exec";

const DATOS_BANCO = {
  tipoCuenta: "Cuenta de Ahorros - Banco Pichincha",
  numeroCuenta: "2213128245",
  titular: "Jostin Alejandro Cedeño López"
};

let productos = JSON.parse(localStorage.getItem("productos_cedeño_cache")) || [
  {
    nombre: "Canva Pro 3 Años",
    categoria: "software",
    descripcion: "Acceso ilimitado a millones de plantillas premium, fotos y herramientas IA.",
    precio: "\$3.00",
    periodo: "/ 3 años",
    imagen: ""
  }
];

let carrito = JSON.parse(localStorage.getItem("carrito_cedeño")) || [];
let categoriaActual = "todos";
let pagoVerificadoAutomaticamente = false;
let cuponActivo = null;

// Referencias del DOM
const contenedor = document.getElementById("contenedor-productos");
const contenedorFiltros = document.getElementById("contenedor-filtros");
const buscador = document.getElementById("buscador");
const navWhatsapp = document.getElementById("nav-whatsapp");

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

// Mostrar datos bancarios
document.getElementById("banco-tipo").textContent = DATOS_BANCO.tipoCuenta;
document.getElementById("banco-numero").textContent = DATOS_BANCO.numeroCuenta;
document.getElementById("banco-titular").textContent = DATOS_BANCO.titular;

navWhatsapp.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent("¡Hola! Quiero consultar sobre el catálogo de Tienda Digital Cedeño.")}`;

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

  if (prod.imagen && prod.imagen.startsWith("http")) {
    return {
      fondo: "linear-gradient(135deg, #1e293b, #0f172a)",
      colorMarca: "#6366f1",
      customImg: prod.imagen,
      htmlLogo: ""
    };
  }

  // 1. NETFLIX
  if (n.includes("netflix")) {
    return {
      fondo: "radial-gradient(circle at center, #7f1d1d 0%, #1a0404 65%, #050505 100%)",
      colorMarca: "#e50914",
      htmlLogo: `<div class="logo-netflix">NETFLIX</div>`
    };
  }

  // 2. DISNEY+
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

  // 3. HBO MAX (Corregido con O vectorial exacta para que nunca salga "HBC")
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

  // 4. PARAMOUNT+
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

  // 5. CRUNCHYROLL
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

  // 6. PRIME VIDEO
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

  // 7. CANVA PRO
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

  // 8. SPOTIFY
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

  // 9. YOUTUBE
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

  // 10. CHATGPT
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

  // 11. GOOGLE GEMINI
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

  // 12. ROBLOX
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
// 3. MOSTRAR PRODUCTOS Y SELECTOR DE MESES
// ==========================================
function obtenerPrecioNumerico(precioTexto) {
  const limpio = String(precioTexto).replace(/[^0-9.,]/g, "").replace(",", ".");
  return parseFloat(limpio) || 0;
}

function permiteElegirMeses(prod) {
  const per = (prod.periodo || "").toLowerCase();
  const cat = (prod.categoria || "").toLowerCase();
  return per.includes("mes") || cat.includes("mes") || cat.includes("plan") || cat.includes("suscripcion");
}

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
    contenedor.innerHTML = `<p style="color: #94a3b8; grid-column: 1/-1; text-align: center; padding: 30px;">No se encontraron productos con esa búsqueda.</p>`;
    return;
  }

  lista.forEach((prod) => {
    const precioBase = obtenerPrecioNumerico(prod.precio);
    const tieneSelectorMeses = permiteElegirMeses(prod);
    const visual = obtenerDisenoVisualProducto(prod);

    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";
    tarjeta.style.setProperty("--color-marca", visual.colorMarca || "#6366f1");

    const htmlSelectorMeses = tieneSelectorMeses ? `
      <div class="caja-selector-meses">
        <label>📅 Duración:</label>
        <select class="select-meses">
          <option value="1">1 mes</option>
          <option value="2">2 meses</option>
          <option value="3">3 meses</option>
          <option value="6">6 meses</option>
          <option value="12">12 meses (1 año)</option>
        </select>
      </div>
    ` : "";

    const contenidoCabecera = visual.customImg
      ? `<img src="${visual.customImg}" alt="${prod.nombre}" class="img-cover">`
      : `<div class="contenedor-logo-oficial">${visual.htmlLogo}</div>`;

    const mensajeInicial = `¡Hola! Me interesa comprar: *${prod.nombre}*${tieneSelectorMeses ? " (1 mes)" : ""} (${prod.precio} ${prod.periodo})`;
    const urlWhatsappInicial = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensajeInicial)}`;

    tarjeta.innerHTML = `
      <div class="tarjeta-media" style="background: ${visual.fondo};">
        <span class="badge-flotante">${prod.categoria}</span>
        <span class="badge-garantia">✔ Oficial</span>
        ${contenidoCabecera}
      </div>
      <div class="tarjeta-cuerpo">
        <div>
          <h3>${prod.nombre}</h3>
          <p>${prod.descripcion}</p>
        </div>
        <div>
          ${htmlSelectorMeses}
          <div class="precio">
            <strong class="valor-precio">${prod.precio}</strong> 
            <span class="texto-periodo">${prod.periodo}</span>
          </div>
          <div class="botones-tarjeta">
            <button class="btn-agregar-carrito">🛒 Añadir al carrito</button>
            <a href="${urlWhatsappInicial}" target="_blank" class="btn-comprar-directo">⚡ Comprar directo</a>
          </div>
        </div>
      </div>
    `;

    const selectMeses = tarjeta.querySelector(".select-meses");
    const valorPrecioEl = tarjeta.querySelector(".valor-precio");
    const textoPeriodoEl = tarjeta.querySelector(".texto-periodo");
    const btnComprarDirecto = tarjeta.querySelector(".btn-comprar-directo");

    if (selectMeses) {
      selectMeses.addEventListener("change", () => {
        const meses = parseInt(selectMeses.value, 10) || 1;
        const nuevoTotal = (precioBase * meses).toFixed(2);
        const etiquetaMeses = meses === 1 ? "1 mes" : `${meses} meses`;

        valorPrecioEl.textContent = `$${nuevoTotal}`;
        textoPeriodoEl.textContent = meses === 1 ? prod.periodo : `por ${meses} meses`;

        const nuevoMensaje = `¡Hola! Me interesa comprar: *${prod.nombre} (${etiquetaMeses})* - Total: $${nuevoTotal}`;
        btnComprarDirecto.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(nuevoMensaje)}`;
      });
    }

    tarjeta.querySelector(".btn-agregar-carrito").addEventListener("click", (e) => {
      const mesesElegidos = selectMeses ? (parseInt(selectMeses.value, 10) || 1) : 1;
      agregarAlCarrito(prod, mesesElegidos, tieneSelectorMeses);
      
      const btn = e.target;
      btn.textContent = "✔ ¡Añadido!";
      setTimeout(() => (btn.textContent = "🛒 Añadir al carrito"), 1000);
    });

    contenedor.appendChild(tarjeta);
  });
}

// ==========================================
// 4. CARRITO Y CUPONES CON REGLAS DE CATEGORÍA Y CANTIDAD
// ==========================================
function agregarAlCarrito(prod, meses = 1, mostrarMeses = false) {
  const precioBase = obtenerPrecioNumerico(prod.precio);
  const precioFinalNum = precioBase * meses;
  const precioFinalTexto = `$${precioFinalNum.toFixed(2)}`;

  const etiquetaMeses = meses === 1 ? "1 mes" : `${meses} meses`;
  const nombreConMeses = mostrarMeses ? `${prod.nombre} (${etiquetaMeses})` : prod.nombre;

  const existente = carrito.find(item => item.nombre === nombreConMeses);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      nombre: nombreConMeses,
      categoria: (prod.categoria || "otros").toLowerCase(),
      precioTexto: precioFinalTexto,
      precioNum: precioFinalNum,
      periodo: mostrarMeses ? etiquetaMeses : prod.periodo,
      cantidad: 1
    });
  }
  actualizarVistaCarrito();
}

window.cambiarCantidad = function(index, cambio) {
  carrito[index].cantidad += cambio;
  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }
  actualizarVistaCarrito();
};

function verificarRequisitosCarritoParaCupon(cupon) {
  if (!cupon) return { cumple: false, motivo: "" };

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

  let aplicaCupon = false;
  let montoDescCupon = 0;
  let motivoNoCumple = "";

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
    aplicaCupon,
    montoDescCupon,
    motivoNoCumple,
    totalFinal
  };
}

function actualizarVistaCarrito() {
  localStorage.setItem("carrito_cedeño", JSON.stringify(carrito));

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

    const div = document.createElement("div");
    div.className = "item-carrito";
    div.innerHTML = `
      <div class="item-info">
        <h4>${item.nombre}</h4>
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
      if (cuponActivo && resumen.motivoNoCumple && mensajeCupon) {
        mensajeCupon.classList.remove("oculto", "exito");
        mensajeCupon.classList.add("error");
        mensajeCupon.textContent = resumen.motivoNoCumple;
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
    console.warn("Intentando respaldo...");
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

if (btnAplicarCupon) {
  btnAplicarCupon.addEventListener("click", async () => {
    const codigo = inputCupon.value.trim().toUpperCase();
    mensajeCupon.classList.remove("oculto", "exito", "error");

    if (!codigo) {
      mensajeCupon.textContent = "⚠️ Escribe un código de cupón.";
      mensajeCupon.classList.add("error");
      return;
    }

    btnAplicarCupon.disabled = true;
    btnAplicarCupon.textContent = "Validando...";
    mensajeCupon.textContent = "🔄 Verificando cupón en el sistema...";

    try {
      const url = `${URL_VERIFICADOR_PICHINCHA}?accion=validarCupon&cupon=${encodeURIComponent(codigo)}&t=${Date.now()}`;
      const data = await consultarAppsScript(url);

      if (data.valido) {
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
        mensajeCupon.textContent = data.mensaje;
        mensajeCupon.classList.add("error");
      }
      actualizarVistaCarrito();
    } catch (err) {
      mensajeCupon.textContent = "⚠️ No se pudo validar el cupón. Revisa tu conexión.";
      mensajeCupon.classList.add("error");
    } finally {
      btnAplicarCupon.disabled = false;
      btnAplicarCupon.textContent = "Aplicar";
    }
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

  estadoVerificacion.classList.remove("oculto", "exito", "error");

  if (!comprobante) {
    estadoVerificacion.textContent = "⚠️ Escribe el número de comprobante de tu transferencia.";
    estadoVerificacion.classList.add("error");
    return;
  }

  btnVerificarPago.disabled = true;
  btnVerificarPago.textContent = "Buscando...";
  estadoVerificacion.textContent = "🔄 Verificando transferencia con Banco Pichincha...";

  try {
    const url = `${URL_VERIFICADOR_PICHINCHA}?comprobante=${encodeURIComponent(comprobante)}&monto=${encodeURIComponent(monto)}&cupon=${encodeURIComponent(codigoCupon)}&t=${Date.now()}`;
    const data = await consultarAppsScript(url);

    estadoVerificacion.textContent = data.mensaje;
    if (data.verificado) {
      pagoVerificadoAutomaticamente = true;
      estadoVerificacion.classList.add("exito");
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

btnAbrirCarrito.addEventListener("click", () => modalCarrito.classList.remove("oculto"));
btnCerrarCarrito.addEventListener("click", () => modalCarrito.classList.add("oculto"));
modalCarrito.addEventListener("click", (e) => {
  if (e.target === modalCarrito) modalCarrito.classList.add("oculto");
});

// Enviar pedido por WhatsApp
btnFinalizarPedido.addEventListener("click", () => {
  if (carrito.length === 0) return;

  let detalleProductos = "";
  carrito.forEach((item) => {
    const subtotalItem = item.precioNum * item.cantidad;
    detalleProductos += `• ${item.cantidad}x *${item.nombre}* [${item.categoria}] ($${subtotalItem.toFixed(2)})\n`;
  });

  const resumen = obtenerResumenTotales();

  if (cuponActivo && resumen.aplicaCupon && !pagoVerificadoAutomaticamente) {
    const urlUso = `${URL_VERIFICADOR_PICHINCHA}?accion=usarCupon&cupon=${encodeURIComponent(cuponActivo.codigo)}&t=${Date.now()}`;
    consultarAppsScript(urlUso).catch(() => {});
  }

  let lineaCuponTexto = "🎟️ *Cupón:* Ninguno\n";

  if (cuponActivo && resumen.aplicaCupon) {
    lineaCuponTexto = `🎟️ *Cupón aplicado:* ${cuponActivo.codigo} (-${cuponActivo.porcentaje}% | -$${resumen.montoDescCupon.toFixed(2)})\n`;
  } else if (cuponActivo && !resumen.aplicaCupon) {
    lineaCuponTexto = `🎟️ *Cupón ingresado (${cuponActivo.codigo}):* No aplicó por falta de requisitos\n`;
  }

  const comprobanteEscrito = inputComprobante.value.trim();
  const comprobanteTexto = comprobanteEscrito ? comprobanteEscrito : "No ingresado (Enviaré captura por aquí)";

  let estadoOrdenTexto = "";
  if (pagoVerificadoAutomaticamente) {
    estadoOrdenTexto = "✅ ORDEN COMPLETA (Pago Verificado en Sistema)";
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
    `📌 *Estado de Orden:* ${estadoOrdenTexto}`;

  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
});

// ==========================================
// 5. BUSCADOR, FILTROS Y GOOGLE SHEETS
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

      if (index === 0 && col[0].toLowerCase() === "nombre") return;

      if (col[0]) {
        let col2Limpia = (col[2] || "").replace(/\\/g, "").trim();
        let col3Limpia = (col[3] || "").replace(/\\/g, "").trim();
        
        let esPrecioEnC = /\d/.test(col2Limpia) && col2Limpia.length <= 10;
        
        let precioBruto = esPrecioEnC ? col2Limpia : col3Limpia;
        if (!precioBruto.startsWith("\$")) {
          precioBruto = "$" + precioBruto.replace("$", "");
        }

        let periodoTexto = esPrecioEnC ? (col[3] || "/ mes") : (col[4] || "/ mes");
        let descripcionTexto = esPrecioEnC ? (col[4] || "") : (col[2] || "");

        if (descripcionTexto.startsWith("\$")) {
          descripcionTexto = descripcionTexto.substring(1).trim();
        }

        listaSheet.push({
          nombre: col[0],
          categoria: (col[1] || "otros").trim().toLowerCase(),
          precio: precioBruto,
          periodo: periodoTexto.trim(),
          descripcion: descripcionTexto.trim(),
          imagen: (col[5] || "").trim()
        });
      }
    });

    if (listaSheet.length > 0) {
      productos = listaSheet;
      localStorage.setItem("productos_cedeño_cache", JSON.stringify(productos));
    }
  } catch (err) {
    console.error("Error cargando Google Sheet:", err);
  }

  actualizarBotonesFiltro();
  filtrarCatalogo();
}

actualizarBotonesFiltro();
filtrarCatalogo();
actualizarVistaCarrito();
cargarDesdeGoogleSheets();
