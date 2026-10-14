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
    nombre: "Canva Pro",
    categoria: "software",
    descripcion: "Acceso a todas las plantillas premium y herramientas de diseño.",
    precio: "\$3.00",
    periodo: "/ mes",
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
// 2. MOTOR INTELIGENTE DE IMÁGENES POR PRODUCTO
// ==========================================
function obtenerDisenoVisualProducto(prod) {
  const n = (prod.nombre || "").toLowerCase();
  const c = (prod.categoria || "").toLowerCase();

  // Si pusiste un link de imagen personalizado en la Columna F de Google Sheets, lo usa directamente:
  if (prod.imagen && prod.imagen.startsWith("http")) {
    return {
      fondo: "linear-gradient(135deg, #1e293b, #0f172a)",
      imgUrl: prod.imagen,
      esPortadaCompleta: true,
      emoji: "✨"
    };
  }

  // Catálogo visual automático según lo que se vende
  const marcas = [
    { claves: ["netflix"], fondo: "linear-gradient(135deg, #000000 0%, #831010 55%, #e50914 100%)", logo: "https://cdn.simpleicons.org/netflix/ffffff", emoji: "🎬" },
    { claves: ["disney"], fondo: "linear-gradient(135deg, #040714 0%, #0a1d56 55%, #113ccf 100%)", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg", emoji: "🏰" },
    { claves: ["hbo", "max"], fondo: "linear-gradient(135deg, #090326 0%, #2e0f75 55%, #6610f2 100%)", logo: "https://cdn.simpleicons.org/hbo/ffffff", emoji: "🍿" },
    { claves: ["paramount"], fondo: "linear-gradient(135deg, #001540 0%, #003899 55%, #0064ff 100%)", logo: "https://cdn.simpleicons.org/paramountplus/ffffff", emoji: "⛰️" },
    { claves: ["crunchyroll", "anime"], fondo: "linear-gradient(135deg, #1f0c00 0%, #993d00 55%, #f47521 100%)", logo: "https://cdn.simpleicons.org/crunchyroll/ffffff", emoji: "🍥" },
    { claves: ["prime", "amazon"], fondo: "linear-gradient(135deg, #051923 0%, #004e75 55%, #00a8e1 100%)", logo: "https://cdn.simpleicons.org/primevideo/ffffff", emoji: "📺" },
    { claves: ["vix"], fondo: "linear-gradient(135deg, #2b0c00 0%, #ff5100 100%)", logo: "", emoji: "📡" },
    { claves: ["spotify"], fondo: "linear-gradient(135deg, #071f10 0%, #0f682f 55%, #1db954 100%)", logo: "https://cdn.simpleicons.org/spotify/ffffff", emoji: "🎧" },
    { claves: ["youtube"], fondo: "linear-gradient(135deg, #1f0000 0%, #8f0000 55%, #ff0000 100%)", logo: "https://cdn.simpleicons.org/youtube/ffffff", emoji: "▶️" },
    { claves: ["apple", "music", "icloud"], fondo: "linear-gradient(135deg, #1c1c1e 0%, #8e2de2 50%, #fa243c 100%)", logo: "https://cdn.simpleicons.org/applemusic/ffffff", emoji: "🎵" },
    { claves: ["deezer", "tidal"], fondo: "linear-gradient(135deg, #12072b 0%, #7928ca 55%, #ff0080 100%)", logo: "", emoji: "🎶" },
    { claves: ["canva"], fondo: "linear-gradient(135deg, #005163 0%, #00c4cc 50%, #7d2ae8 100%)", logo: "https://cdn.simpleicons.org/canva/ffffff", emoji: "🎨" },
    { claves: ["chatgpt", "openai", "gpt"], fondo: "linear-gradient(135deg, #052e24 0%, #0b6e56 55%, #10a37f 100%)", logo: "https://cdn.simpleicons.org/openai/ffffff", emoji: "🤖" },
    { claves: ["gemini", "google"], fondo: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #9333ea 100%)", logo: "https://cdn.simpleicons.org/googlegemini/ffffff", emoji: "✨" },
    { claves: ["capcut"], fondo: "linear-gradient(135deg, #090d16 0%, #334155 55%, #00f2fe 100%)", logo: "", emoji: "🎬" },
    { claves: ["adobe", "photoshop", "illustrator"], fondo: "linear-gradient(135deg, #2b0000 0%, #990000 55%, #ff0000 100%)", logo: "https://cdn.simpleicons.org/adobe/ffffff", emoji: "🖌️" },
    { claves: ["office", "microsoft", "windows", "365"], fondo: "linear-gradient(135deg, #0c2340 0%, #005a9e 55%, #00a4ef 100%)", logo: "", emoji: "💻" },
    { claves: ["roblox", "robux"], fondo: "linear-gradient(135deg, #111827 0%, #374151 55%, #ef4444 100%)", logo: "https://cdn.simpleicons.org/roblox/ffffff", emoji: "🎮" },
    { claves: ["minecraft"], fondo: "linear-gradient(135deg, #143601 0%, #245501 55%, #538d22 100%)", logo: "", emoji: "⛏️" },
    { claves: ["free fire", "diamantes", "garena"], fondo: "linear-gradient(135deg, #3b1d00 0%, #b45309 55%, #f59e0b 100%)", logo: "", emoji: "💎" },
    { claves: ["playstation", "psn", "ps4", "ps5"], fondo: "linear-gradient(135deg, #001233 0%, #00287a 55%, #00439c 100%)", logo: "https://cdn.simpleicons.org/playstation/ffffff", emoji: "🕹️" },
    { claves: ["xbox", "game pass"], fondo: "linear-gradient(135deg, #062905 0%, #0e5c0c 55%, #107c10 100%)", logo: "https://cdn.simpleicons.org/xbox/ffffff", emoji: "🎮" },
    { claves: ["steam"], fondo: "linear-gradient(135deg, #0b141e 0%, #1b2838 55%, #2a475e 100%)", logo: "https://cdn.simpleicons.org/steam/ffffff", emoji: "🎲" }
  ];

  for (const m of marcas) {
    if (m.claves.some(k => n.includes(k))) {
      return {
        fondo: m.fondo,
        imgUrl: m.logo,
        esPortadaCompleta: false,
        emoji: m.emoji
      };
    }
  }

  // Respaldo por categoría si es un producto nuevo
  if (c.includes("stream")) {
    return { fondo: "linear-gradient(135deg, #1e1b4b, #6d28d9, #db2777)", imgUrl: "", esPortadaCompleta: false, emoji: "🍿" };
  }
  if (c.includes("musica") || c.includes("música")) {
    return { fondo: "linear-gradient(135deg, #064e3b, #059669, #10b981)", imgUrl: "", esPortadaCompleta: false, emoji: "🎧" };
  }
  if (c.includes("juego") || c.includes("game") || c.includes("recarga")) {
    return { fondo: "linear-gradient(135deg, #31102f, #be123c, #f43f5e)", imgUrl: "", esPortadaCompleta: false, emoji: "🎮" };
  }

  return {
    fondo: "linear-gradient(135deg, #0f172a, #312e81, #6366f1)",
    imgUrl: "",
    esPortadaCompleta: false,
    emoji: "⚡"
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

  lista.forEach((prod, idx) => {
    const precioBase = obtenerPrecioNumerico(prod.precio);
    const tieneSelectorMeses = permiteElegirMeses(prod);
    const visual = obtenerDisenoVisualProducto(prod);

    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";
    tarjeta.style.animationDelay = `${idx * 0.05}s`;

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

    const contenidoMedia = visual.imgUrl
      ? `<img src="${visual.imgUrl}" alt="${prod.nombre}" class="${visual.esPortadaCompleta ? 'img-cover' : 'img-logo'}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
         <span class="icono-respaldo" style="display:none;">${visual.emoji}</span>`
      : `<span class="icono-respaldo">${visual.emoji}</span>`;

    const mensajeInicial = `¡Hola! Me interesa comprar: *${prod.nombre}*${tieneSelectorMeses ? " (1 mes)" : ""} (${prod.precio} ${prod.periodo})`;
    const urlWhatsappInicial = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensajeInicial)}`;

    tarjeta.innerHTML = `
      <div class="tarjeta-media" style="background: ${visual.fondo};">
        <span class="badge-flotante">${prod.categoria}</span>
        ${contenidoMedia}
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

// Enviar pedido por WhatsApp (completo o sin completar verificación)
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
          imagen: (col[5] || "").trim() // Lee link de imagen opcional en la Columna F
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
