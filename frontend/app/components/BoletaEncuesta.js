"use client";

import { useState, useEffect } from "react";
import { registrarVoto, obtenerOcrearSessionId } from "../lib/api";
import { CANDIDATOS, REGIONES } from "../lib/constantes";

export default function BoletaEncuesta({ onVotoRegistrado }) {
  const [seleccion, setSeleccion] = useState(null);
  const [region, setRegion] = useState("No especificado");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [yaVoto, setYaVoto] = useState(false);

  useEffect(() => {
    const id = obtenerOcrearSessionId();
    if (localStorage.getItem(`voto_emitido_${id}`)) setYaVoto(true);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!seleccion) {
      setError("Selecciona un candidato.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await registrarVoto({ candidato: seleccion, region, comentario });
      localStorage.setItem(`voto_emitido_${obtenerOcrearSessionId()}`, "1");
      setYaVoto(true);
      onVotoRegistrado?.();
    } catch (err) {
      if (err.message.includes("ya registro")) {
        setYaVoto(true);
      } else {
        setError(err.message || "No se pudo registrar el voto.");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (yaVoto) {
    return (
      <div className="border rounded-lg p-6 bg-white text-center">
        <p className="font-medium">Tu voto ya quedo registrado.</p>
        <p className="text-sm text-gray-500 mt-1">Gracias por participar.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg bg-white p-6 space-y-4">
      <h2 className="font-semibold text-lg">Encuesta ciudadana</h2>

      <div className="grid grid-cols-2 gap-3">
        {Object.values(CANDIDATOS).map((c) => (
          <button
            type="button"
            key={c.id}
            onClick={() => setSeleccion(c.id)}
            className={`border rounded-md p-4 text-left transition-colors ${
              seleccion === c.id ? `${c.colorClaro} border-current ${c.colorTexto}` : "border-gray-200"
            }`}
          >
            <p className={`font-medium ${seleccion === c.id ? c.colorTexto : "text-gray-800"}`}>
              {c.nombre}
            </p>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Region</label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm"
        >
          {REGIONES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Comentario (opcional)</label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, 280))}
          rows={2}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Emitir voto"}
      </button>
    </form>
  );
}
