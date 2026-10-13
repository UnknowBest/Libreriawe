// ==========================================
// 1. CONFIGURACIÓN PRINCIPAL Y DATOS BANCARIOS
// ==========================================
const NUMERO_WHATSAPP = "593963259492"; 
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNz682jLUpz3P7eKqahpH2NiLqctI5V1B2utHZ2ZMS4rsmYSwd0huivG5Qt_sM4FyxHtvS7AliVNm9/pub?gid=0&single=true&output=csv";

// Si al darle a "Implementar > Nueva implementación" te dio una URL nueva, reemplázala aquí:
const URL_VERIFICADOR_PICHINCHA = "https://script.google.com/macros/s/AKfycbwmO7jW90VB-rWiF_mSfe6zgQfO9aqxGss2njfcEQOYeprd5plmgHMAUdpx1ttutlRY/exec";

const DATOS_BANCO = {
  tipoCuenta: "Cuenta de Ahorros - Banco Pichincha",
  numeroCuenta: "2213128245",
  titular: "Jostin Alejandro Cedeño López"
};

let productos = [
  {
    nombre: "Canva Pro (30 Días)",
    categoria: "software",
    descripcion: "Acceso a todas las plantillas premium, quitafondos y herramientas de diseño.",
    precio: "\$3.00",
    periodo: "/ mes"
  }
];

let carrito = JSON.parse(localStorage.getItem("carrito_cedeño")) || [];
let categoriaActual = "todos";
let pagoVerificadoAutomaticamente = false;

// Referencias del DOM
const contenedor = document.getElementById("contenedor-productos");
const contenedorFiltros = document.getElementById("contenedor-filtros");
const buscador = document.getElementById("buscador");
const navWhatsapp = document.getElementById("nav-whatsapp");

// Referencias del Carrito
const modalCarrito = document.getElementById("modal-carrito");
const btnAbrirCarrito = document.getElementById("btn-abrir-carrito");
const btnCerrarCarrito = document.getElementById("btn-cerrar-carrito");
const listaCarrito = document.getElementById("lista-carrito");
const contadorCarrito = document.getElementById("contador-carrito");
const totalCarrito = document.getElementById("total-carrito");
const seccionPago = document.getElementById("seccion-pago");
const inputComprobante = document.getElementById("input-comprobante");
const btnVerificarPago = document.getElementById("btn-verificar-pago");
const estadoVerificacion = document.getElementById("estado-verificacion");
const btnFinalizarPedido = document.getElementById("btn-finalizar-pedido");

// Mostrar datos bancarios
document.getElementById("banco-tipo").textContent = DATOS_BANCO.tipoCuenta;
document.getElementById("banco-numero").textContent = DATOS_BANCO.numeroCuenta;
document.getElementById("banco-titular").textContent = DATOS_BANCO.titular;

navWhatsapp.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent("¡Hola! Quiero consultar sobre el catálogo de Tienda Digital Cedeño.")}`;

// Copiar número de cuenta 2213128245
document.getElementById("btn-copiar-cuenta").addEventListener("click", (e) => {
  navigator.clipboard.writeText(DATOS_BANCO.numeroCuenta);
  e.target.textContent = "¡Copiado!";
  setTimeout(() => (e.target.textContent = "Copiar"), 2000);
});

// ==========================================
// 2. MOSTRAR PRODUCTOS Y CATEGORÍAS
// ==========================================
function obtenerPrecioNumerico(precioTexto) {
  const limpio = String(precioTexto).replace(/[^0-9.,]/g, "").replace(",", ".");
  return parseFloat(limpio) || 0;
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
    contenedor.innerHTML = `<p style="color: #94a3b8; grid-column: 1/-1; text-align: center;">No se encontraron productos.</p>`;
    return;
  }

  lista.forEach((prod) => {
    const mensajeDirecto = `¡Hola! Me interesa comprar: *${prod.nombre}* (${prod.precio} ${prod.periodo})`;
    const urlWhatsapp = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensajeDirecto)}`;

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
        <div class="botones-tarjeta">
          <button class="btn-agregar-carrito">🛒 Añadir al carrito</button>
          <a href="${urlWhatsapp}" target="_blank" class="btn-comprar-directo">Comprar directo</a>
        </div>
      </div>
    `;

    tarjeta.querySelector(".btn-agregar-carrito").addEventListener("click", (e) => {
      agregarAlCarrito(prod);
      const btn = e.target;
      btn.textContent = "✔ ¡Añadido!";
      setTimeout(() => (btn.textContent = "🛒 Añadir al carrito"), 1000);
    });

    contenedor.appendChild(tarjeta);
  });
}

// ==========================================
// 3. CARRITO Y VERIFICADOR BANCO PICHINCHA
// ==========================================
function agregarAlCarrito(prod) {
  const existente = carrito.find(item => item.nombre === prod.nombre);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      nombre: prod.nombre,
      precioTexto: prod.precio,
      precioNum: obtenerPrecioNumerico(prod.precio),
      periodo: prod.periodo,
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

function calcularSumaTotal() {
  return carrito.reduce((acc, item) => acc + (item.precioNum * item.cantidad), 0);
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
  let sumaTotal = 0;

  carrito.forEach((item, index) => {
    const subtotal = item.precioNum * item.cantidad;
    sumaTotal += subtotal;

    const div = document.createElement("div");
    div.className = "item-carrito";
    div.innerHTML = `
      <div class="item-info">
        <h4>${item.nombre}</h4>
        <span>${item.precioTexto} c/u</span>
      </div>
      <div class="item-controles">
        <button onclick="cambiarCantidad(${index}, -1)">-</button>
        <span>${item.cantidad}</span>
        <button onclick="cambiarCantidad(${index}, 1)">+</button>
        <strong class="item-subtotal">$${subtotal.toFixed(2)}</strong>
      </div>
    `;
    listaCarrito.appendChild(div);
  });

  totalCarrito.textContent = `$${sumaTotal.toFixed(2)}`;
}

// Resetear estado si cambia el número de comprobante
inputComprobante.addEventListener("input", () => {
  pagoVerificadoAutomaticamente = false;
  estadoVerificacion.classList.add("oculto");
});

// Conector doble (Fetch directo + respaldo JSONP) compatible con todos los navegadores
async function consultarAppsScript(url) {
  // 1. Intento directo estándar (sin cookies para evitar bloqueo CORS/Brave)
  try {
    const respuesta = await fetch(url, {
      method: "GET",
      redirect: "follow",
      credentials: "omit"
    });
    const texto = await respuesta.text();
    return JSON.parse(texto);
  } catch (e) {
    console.warn("Intentando método secundario JSONP...");
  }

  // 2. Respaldo JSONP
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
      reject(new Error("Fallo de red o bloqueo del navegador"));
    };

    script.src = `${url}${separador}callback=${nombreCallback}`;
    document.body.appendChild(script);
  });
}

// Botón para verificar comprobante en Gmail vía Google Apps Script
btnVerificarPago.addEventListener("click", async () => {
  const comprobante = inputComprobante.value.trim();
  const monto = calcularSumaTotal().toFixed(2);

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
    const url = `${URL_VERIFICADOR_PICHINCHA}?comprobante=${encodeURIComponent(comprobante)}&monto=${encodeURIComponent(monto)}&t=${Date.now()}`;
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
    estadoVerificacion.textContent = "⚠️ Verifica que la URL en la línea 8 sea la última de 'Administrar implementaciones' o desactiva el escudo de Brave.";
    estadoVerificacion.classList.add("error");
  } finally {
    btnVerificarPago.disabled = false;
    btnVerificarPago.textContent = "🔍 Verificar";
  }
});

// Abrir y cerrar modal del carrito
btnAbrirCarrito.addEventListener("click", () => modalCarrito.classList.remove("oculto"));
btnCerrarCarrito.addEventListener("click", () => modalCarrito.classList.add("oculto"));
modalCarrito.addEventListener("click", (e) => {
  if (e.target === modalCarrito) modalCarrito.classList.add("oculto");
});

// Enviar pedido por WhatsApp
btnFinalizarPedido.addEventListener("click", () => {
  if (carrito.length === 0) return;

  let sumaTotal = 0;
  let detalleProductos = "";

  carrito.forEach((item) => {
    const subtotal = item.precioNum * item.cantidad;
    sumaTotal += subtotal;
    detalleProductos += `• ${item.cantidad}x *${item.nombre}* ($${subtotal.toFixed(2)})\n`;
  });

  const comprobante = inputComprobante.value.trim() || "Enviaré captura en el chat";
  const estadoPagoTexto = pagoVerificadoAutomaticamente
    ? "✅ VERIFICADO EN SISTEMA"
    : "⏳ Pendiente de revisión";

  const mensaje = 
    `¡Hola *Tienda Digital Cedeño*! 🛒 Quiero realizar este pedido:\n\n` +
    `${detalleProductos}\n` +
    `💰 *Total a pagar:* $${sumaTotal.toFixed(2)}\n` +
    `🏦 *Cuenta Pichincha:* ${DATOS_BANCO.numeroCuenta}\n` +
    `🧾 *N° Comprobante:* ${comprobante}\n` +
    `📌 *Estado:* ${estadoPagoTexto}`;

  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
});

// ==========================================
// 4. BUSCADOR, FILTROS Y GOOGLE SHEETS
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
        let precioBruto = (col[2] || "$0.00").replace(/\\/g, "").trim();
        if (!precioBruto.startsWith("$")) {
          precioBruto = "$" + precioBruto;
        }

        listaSheet.push({
          nombre: col[0],
          categoria: (col[1] || "otros").trim().toLowerCase(),
          precio: precioBruto,
          periodo: (col[3] || "/ mes").trim(),
          descripcion: (col[4] || "").trim()
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

actualizarVistaCarrito();
cargarDesdeGoogleSheets();
