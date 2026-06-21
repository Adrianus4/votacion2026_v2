// URL del backend. En produccion, configura NEXT_PUBLIC_API_URL en Vercel
// apuntando a donde despliegues el backend (Render, Railway, Fly.io, etc).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function manejarRespuesta(res) {
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(datos.error || `Error ${res.status}`);
  }
  return datos;
}

export function obtenerOcrearSessionId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("encuesta_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("encuesta_session_id", id);
  }
  return id;
}

export async function registrarVoto({ candidato, region, comentario }) {
  const session_id = obtenerOcrearSessionId();
  const res = await fetch(`${API_URL}/api/votos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidato, region, comentario, session_id }),
  });
  return manejarRespuesta(res);
}

export async function obtenerResultados() {
  const res = await fetch(`${API_URL}/api/votos/resultados`, { cache: "no-store" });
  return manejarRespuesta(res);
}

export async function obtenerResultadosPorRegion() {
  const res = await fetch(`${API_URL}/api/votos/resultados-por-region`, { cache: "no-store" });
  return manejarRespuesta(res);
}

export async function enviarReporteActa(reporte) {
  const res = await fetch(`${API_URL}/api/reportes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reporte),
  });
  return manejarRespuesta(res);
}

export async function listarReportes(limite = 10) {
  const res = await fetch(`${API_URL}/api/reportes?limite=${limite}`, { cache: "no-store" });
  return manejarRespuesta(res);
}

export async function subirArchivoActa(formData) {
  const res = await fetch(`${API_URL}/api/archivos/acta`, {
    method: "POST",
    body: formData,
  });
  return manejarRespuesta(res);
}

export async function listarArchivos() {
  const res = await fetch(`${API_URL}/api/archivos`, { cache: "no-store" });
  return manejarRespuesta(res);
}

export async function obtenerUrlArchivo(id) {
  const res = await fetch(`${API_URL}/api/archivos/${id}/url`);
  return manejarRespuesta(res);
}

export { API_URL };
