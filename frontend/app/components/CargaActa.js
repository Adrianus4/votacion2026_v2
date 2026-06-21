"use client";

import { useState } from "react";
import { subirArchivoActa, enviarReporteActa } from "../lib/api";
import { CANDIDATOS, REGIONES } from "../lib/constantes";

export default function CargaActa({ onActaRegistrada }) {
  const [archivo, setArchivo] = useState(null);
  const [mesa, setMesa] = useState("");
  const [region, setRegion] = useState("Lima");
  const [votosFp, setVotosFp] = useState("");
  const [votosJp, setVotosJp] = useState("");
  const [observacion, setObservacion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResultado(null);

    if (!mesa.trim()) return setError("Indica el numero de mesa.");
    if (!archivo) return setError("Adjunta una foto o PDF del acta.");

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("mesa_votacion", mesa.trim());
      formData.append("region", region);

      const respArchivo = await subirArchivoActa(formData);

      const fp = Number(votosFp || 0);
      const jp = Number(votosJp || 0);
      const candidatoGanador = fp === jp ? null : fp > jp ? "fuerza_popular" : "juntos_por_el_peru";

      const respReporte = await enviarReporteActa({
        mesa_votacion: mesa.trim(),
        region,
        candidato_ganador_mesa: candidatoGanador,
        votos: { fuerza_popular: fp, juntos_por_el_peru: jp },
        observaciones: observacion ? [observacion] : [],
        acta_b2_key: respArchivo.archivo.b2_key,
      });

      setResultado(respReporte.reporte);
      setArchivo(null);
      setMesa("");
      setVotosFp("");
      setVotosJp("");
      setObservacion("");
      onActaRegistrada?.();
    } catch (err) {
      setError(err.message || "No se pudo registrar el acta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg bg-white p-6 space-y-4">
      <h2 className="font-semibold text-lg">Registrar acta de mesa</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Numero de mesa</label>
          <input
            type="text"
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
            placeholder="045821"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-red-600 mb-1">Votos {CANDIDATOS.fuerza_popular.nombre}</label>
          <input
            type="number"
            min="0"
            value={votosFp}
            onChange={(e) => setVotosFp(e.target.value)}
            placeholder="0"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-green-700 mb-1">Votos {CANDIDATOS.juntos_por_el_peru.nombre}</label>
          <input
            type="number"
            min="0"
            value={votosJp}
            onChange={(e) => setVotosJp(e.target.value)}
            placeholder="0"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Foto o PDF del acta</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setArchivo(e.target.files?.[0] || null)}
          className="w-full text-sm border rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Observaciones (opcional)</label>
        <textarea
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          rows={2}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {resultado && (
        <p className="text-sm text-green-700">
          Acta de mesa {resultado.mesa_votacion} registrada correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {enviando ? "Subiendo..." : "Registrar acta"}
      </button>
    </form>
  );
}
