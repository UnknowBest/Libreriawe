// ==========================================
// 1. CONFIGURACIÓN PRINCIPAL DE TU TIENDA
// ==========================================
const NUMERO_WHATSAPP = "593999999999"; // Tu número con código de país (sin +)
const CLAVE_ADMIN = "admin123";         // Tu contraseña para abrir el panel Admin

// OPCIONAL: Si conectas una Hoja de Cálculo de Google publicada como CSV, pega el link aquí:
const GOOGLE_SHEET_CSV_URL = ""; 

// ==========================================
// 2. CATÁLOGO BASE DE PRODUCTOS
// ==========================================
const catalogoBase = [
  {
    nombre: "Pantalla Completa Streaming HD",
    categoria: "streaming",
    descripcion: "Acceso por 30 días en 1 dispositivo con perfil privado y soporte garantizado.",
    precio: "\$3.50",
    periodo: "/ mes"
  },
  {
    nombre: "Canva Pro (30 Días)",
    categoria: "software",
    descripcion: "Acceso a todas las plantillas premium, quitafondos y herramientas de diseño.",
    precio: "\$3.00",
    periodo: "/ mes"
  },
  {
    nombre: "Recarga de Monedas / Gaming",
    categoria: "gaming",
    descripcion: "Recargas rápidas para tus juegos favoritos (Roblox, Free Fire, Minecraft).",
    precio: "\$5.00",
    periodo: "desde"
  }
];

// Cargar productos guardados en el navegador o usar el catálogo base
let productos = JSON.parse(localStorage.getItem("catalogo_tienda")) || catalogoBase;
let modoAdmin = false;
let categoriaActual = "todos";

// Referencias del DOM
const contenedor = document.getElementById("contenedor-productos");
const buscador = document.getElementById("buscador");
const botonesFiltro = document.querySelectorAll(".btn-filtro");
const navWhatsapp = document.getElementById("nav-whatsapp");
const panelAdmin = document.getElementById("panel-admin");
const btnAdminLogin = document.getElementById("btn-admin-login");
const btnCerrarAdmin = document.getElementById("btn-cerrar-admin");
const formProducto = document.getElementById("form-producto");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");

navWhatsapp.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent("¡Hola! Quiero consultar sobre el catálogo digital.")}`;

// ==========================================
// 3. MOSTRAR PRODUCTOS EN PANTALLA
// ==========================================
function mostrarProductos(lista) {
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `<p style="color: #94a3b8; grid-column: 1/-1; text-align: center;">No se encontraron productos.</p>`;
    return;
  }

  lista.forEach((prod, index) => {
    const mensaje = `¡Hola! Me interesa pedir: *${prod.nombre}* (${prod.precio} ${prod.periodo})`;
    const urlWhatsapp = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

    const controlesAdminHTML = modoAdmin ? `
      <div class="acciones-admin">
        <button class="btn-editar" onclick="prepararEdicion(${index})">✏️ Editar</button>
        <button class="btn-borrar" onclick="eliminarProducto(${index})">🗑️ Borrar</button>
      </div>
    ` : "";

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
        ${controlesAdminHTML}
      </div>
    `;
    contenedor.appendChild(tarjeta);
  });
}

function guardarLocalmente() {
  localStorage.setItem("catalogo_tienda", JSON.stringify(productos));
  filtrarCatalogo();
}

// ==========================================
// 4. FUNCIONES DEL PANEL DE ADMINISTRADOR
// ==========================================
btnAdminLogin.addEventListener("click", () => {
  if (modoAdmin) {
    panelAdmin.classList.toggle("oculto");
    return;
  }
  const clave = prompt("Ingresa tu clave de Administrador:");
  if (clave === CLAVE_ADMIN) {
    modoAdmin = true;
    panelAdmin.classList.remove("oculto");
    btnAdminLogin.textContent = "⚙️ Panel Abierto";
    filtrarCatalogo();
  } else if (clave !== null) {
    alert("Contraseña incorrecta.");
  }
});

btnCerrarAdmin.addEventListener("click", () => {
  modoAdmin = false;
  panelAdmin.classList.add("oculto");
  btnAdminLogin.textContent = "🔒 Admin";
  filtrarCatalogo();
});

// Agregar o editar un producto desde el formulario
formProducto.addEventListener("submit", (e) => {
  e.preventDefault();
  const editIndex = parseInt(document.getElementById("edit-index").value);

  const nuevoProd = {
    nombre: document.getElementById("prod-nombre").value.trim(),
    categoria: document.getElementById("prod-categoria").value,
    precio: document.getElementById("prod-precio").value.trim(),
    periodo: document.getElementById("prod-periodo").value.trim(),
    descripcion: document.getElementById("prod-desc").value.trim()
  };

  if (editIndex >= 0) {
    productos[editIndex] = nuevoProd;
    document.getElementById("edit-index").value = "-1";
    document.getElementById("titulo-form").textContent = "➕ Añadir / Editar Producto";
    btnCancelarEdicion.classList.add("oculto");
  } else {
    productos.push(nuevoProd);
  }

  formProducto.reset();
  guardarLocalmente();
});

// Preparar edición de un producto
window.prepararEdicion = function(index) {
  const prod = productos[index];
  document.getElementById("edit-index").value = index;
  document.getElementById("prod-nombre").value = prod.nombre;
  document.getElementById("prod-categoria").value = prod.categoria;
  document.getElementById("prod-precio").value = prod.precio;
  document.getElementById("prod-periodo").value = prod.periodo;
  document.getElementById("prod-desc").value = prod.descripcion;

  document.getElementById("titulo-form").textContent = "✏️ Editando: " + prod.nombre;
  btnCancelarEdicion.classList.remove("oculto");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

btnCancelarEdicion.addEventListener("click", () => {
  formProducto.reset();
  document.getElementById("edit-index").value = "-1";
  document.getElementById("titulo-form").textContent = "➕ Añadir / Editar Producto";
  btnCancelarEdicion.classList.add("oculto");
});

// Eliminar un producto
window.eliminarProducto = function(index) {
  if (confirm(`¿Seguro que deseas borrar "${productos[index].nombre}"?`)) {
    productos.splice(index, 1);
    guardarLocalmente();
  }
};

// Carga Masiva de productos pegando texto
document.getElementById("btn-carga-masiva").addEventListener("click", () => {
  const texto = document.getElementById("texto-masivo").value.trim();
  if (!texto) return alert("Pega al menos una línea de producto.");

  const lineas = texto.split("\n");
  let agregados = 0;

  lineas.forEach((linea) => {
    const partes = linea.split("|").map(p => p.trim());
    if (partes.length >= 3) {
      productos.push({
        nombre: partes[0],
        categoria: (partes[1] || "otros").toLowerCase(),
        precio: partes[2],
        periodo: partes[3] || "/ mes",
        descripcion: partes[4] || "Entrega inmediata y soporte garantizado."
      });
      agregados++;
    }
  });

  document.getElementById("texto-masivo").value = "";
  guardarLocalmente();
  alert(`¡Se añadieron ${agregados} productos al catálogo!`);
});

// Exportar el catálogo listo para pegar en GitHub sin saber programar
document.getElementById("btn-exportar-codigo").addEventListener("click", () => {
  const bloqueCodigo = `const catalogoBase = ${JSON.stringify(productos, null, 2)};`;
  navigator.clipboard.writeText(bloqueCodigo).then(() => {
    alert("¡Catálogo copiado al portapapeles!\n\nAhora solo abre tu archivo script.js en GitHub, reemplaza la parte de 'const catalogoBase = [...];' pegando esto, y todos tus clientes verán los nuevos productos.");
  });
});

// ==========================================
// 5. BUSCADOR, FILTROS Y GOOGLE SHEETS
// ==========================================
function filtrarCatalogo() {
  const texto = buscador.value.toLowerCase();
  const filtrados = productos.filter((prod) => {
    const coincideCategoria = categoriaActual === "todos" || prod.categoria === categoriaActual;
    const coincideTexto = prod.nombre.toLowerCase().includes(texto) || prod.descripcion.toLowerCase().includes(texto);
    return coincideCategoria && coincideTexto;
  });
  mostrarProductos(filtrados);
}

botonesFiltro.forEach((boton) => {
  boton.addEventListener("click", () => {
    botonesFiltro.forEach((b) => b.classList.remove("activo"));
    boton.classList.add("activo");
    categoriaActual = boton.getAttribute("data-categoria");
    filtrarCatalogo();
  });
});

buscador.addEventListener("input", filtrarCatalogo);

// Si configuraste un Google Sheet CSV, carga los productos en vivo desde ahí
async function cargarDesdeGoogleSheets() {
  if (!GOOGLE_SHEET_CSV_URL) {
    mostrarProductos(productos);
    return;
  }
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL);
    const csv = await res.text();
    const filas = csv.split("\n").slice(1); // Ignora la fila de títulos
    const listaSheet = [];

    filas.forEach((fila) => {
      const col = fila.split(",").map(c => c.replace(/^"|"\$/g, "").trim());
      if (col[0]) {
        listaSheet.push({
          nombre: col[0],
          categoria: (col[1] || "otros").toLowerCase(),
          precio: col[2] || "\$0.00",
          periodo: col[3] || "/ mes",
          descripcion: col[4] || ""
        });
      }
    });

    if (listaSheet.length > 0) {
      productos = listaSheet;
    }
  } catch (err) {
    console.error("Error cargando Google Sheet:", err);
  }
  mostrarProductos(productos);
}

cargarDesdeGoogleSheets();
