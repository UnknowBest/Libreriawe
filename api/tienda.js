export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, mensaje: "Método no permitido" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    const accionesProhibidas = [
      "loginAdmin", "obtenerCuentas", "guardarCuenta",
      "renovarCuenta", "eliminarCuenta", "togglePago",
      "guardarGasto", "eliminarGasto"
    ];
    if (accionesProhibidas.includes(body.accion)) {
      return res.status(403).json({ ok: false, mensaje: "Acceso denegado" });
    }

    const params = new URLSearchParams();
    Object.entries(body).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        params.append(key, String(val));
      }
    });
    params.append("token", process.env.GAS_SECRET);

    const urlFinal = `${process.env.GAS_URL}?${params.toString()}`;
    const respuestaGAS = await fetch(urlFinal, { method: "GET", redirect: "follow" });
    const data = await respuestaGAS.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: "Error conectando con el servidor" });
  }
}