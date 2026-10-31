export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, mensaje: "Método no permitido" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const claveRecibida = body.adminPass || body.clave || "";

    if (claveRecibida !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({
        ok: false,
        errorAuth: true,
        mensaje: "❌ Contraseña de administrador incorrecta."
      });
    }

    const params = new URLSearchParams();
    Object.entries(body).forEach(([key, val]) => {
      if (key !== "adminPass" && key !== "clave" && val !== undefined && val !== null) {
        params.append(key, String(val));
      }
    });
    params.append("token", process.env.GAS_SECRET);

    const urlFinal = `${process.env.GAS_URL}?${params.toString()}`;
    const respuestaGAS = await fetch(urlFinal, { method: "GET", redirect: "follow" });
    const texto = await respuestaGAS.text();

    let data;
    try {
      data = JSON.parse(texto);
    } catch (e) {
      return res.status(500).json({ ok: false, mensaje: "Respuesta inválida de Google Apps Script" });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: "Error interno en /api/clientes" });
  }
}