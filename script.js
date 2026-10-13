// 1. CONFIGURA TU NÚMERO DE WHATSAPP AQUÍ (Con código de país, sin el signo +)
// Ejemplo para Ecuador: "593999999999"
const NUMERO_WHATSAPP = "593999999999";

// 2. LISTA DE PRODUCTOS DE TU CATÁLOGO
const productos = [
  {
    nombre: "Pantalla Completa Streaming HD",
    categoria: "streaming",
    descripcion: "Acceso por 30 días en 1 dispositivo con perfil privado y soporte garantizado.",
    precio: "\$3.50",
    periodo: "/ mes"
  },
  {
    nombre: "Combo Entretenimiento Plus",
    categoria: "streaming",
    descripcion: "2 plataformas de series y películas en alta definición por 30 días.",
    precio: "\$5.50",
    periodo: "/ mes"
  },
  {
    nombre: "Música Premium Sin Anuncios",
    categoria: "streaming",
    descripcion: "Suscripción mensual en tu propia cuenta o cuenta nueva, con descargas offline.",
    precio: "\$2.50",
    periodo: "/ mes"
  },
  {
    nombre: "Canva Pro (Equipo Educativo / Pro)",
    categoria: "software",
    descripcion: "Acceso a todas las plantillas premium, quitafondos y herramientas de diseño.",
    precio: "\$3.00",
    periodo: "/ mes"
  },
  {
    nombre: "Licencia Office / Suite Creativa",
    categoria: "software",
    descripcion: "Activación rápida para PC o laptop con guía de instalación paso a paso.",
    precio: "\$8.00",
    periodo: "pago único"
  },
  {
    nombre: "Recarga de Monedas / Tarjeta Regalo",
    categoria: "gaming",
    descripcion: "Recargas rápidas para tus juegos favoritos (Roblox, Free Fire, Minecraft).",
    precio: "\$5.00",
    periodo: "desde"
  }
];

// Referencias a elementos de la página
const contenedor = document.getElementById("contenedor-productos");
const buscador = document.getElementById("buscador");
const botonesFiltro = document.querySelectorAll(".btn-filtro");
const navWhatsapp = document.getElementById("nav-whatsapp");

// Configurar botón superior de contacto
navWhatsapp.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent("¡Hola! Quiero consultar sobre el catálogo digital.")}`;

// Función para mostrar los productos en pantalla
function mostrarProductos(lista) {
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `<p style="color: #94a3b8; grid-column: 1/-1; text-align: center;">No se encontraron productos con ese nombre.</p>`;
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

// Filtrar por categoría y texto de búsqueda
let categoriaActual = "todos";

function filtrarCatalogo() {
  const texto = buscador.value.toLowerCase();

  const filtrados = productos.filter((prod) => {
    const coincideCategoria = categoriaActual === "todos" || prod.categoria === categoriaActual;
    const coincideTexto = prod.nombre.toLowerCase().includes(texto) || prod.descripcion.toLowerCase().includes(texto);
    return coincideCategoria && coincideTexto;
  });

  mostrarProductos(filtrados);
}

// Eventos para los botones de filtro
botonesFiltro.forEach((boton) => {
  boton.addEventListener("click", () => {
    botonesFiltro.forEach((b) => b.classList.remove("activo"));
    boton.classList.add("activo");
    categoriaActual = boton.getAttribute("data-categoria");
    filtrarCatalogo();
  });
});

// Evento para la barra de búsqueda
buscador.addEventListener("input", filtrarCatalogo);

// Cargar todos los productos al iniciar
mostrarProductos(productos);
