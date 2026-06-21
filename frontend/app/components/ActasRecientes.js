"use client";

import { useEffect, useState } from "react";
import { listarReportes } from "../lib/api";
import { CANDIDATOS } from "../lib/constantes";

export default function ActasRecientes({ refrescarTrigger }) {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    listarReportes(8)
      .then((r) => { if (activo) setReportes(r.reportes); })
      .catch(() => { if (activo) setError("No se pudieron cargar las actas."); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [refrescarTrigger]);

  return (
    <div className="border rounded-lg bg-white p-6">
      <h2 className="font-semibold text-lg mb-4">Actas recientes</h2>

      {cargando && <p className="text-sm text-gray-500">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!cargando && !error && reportes.length === 0 && (
        <p className="text-sm text-gray-500">Aun no hay actas registradas.</p>
      )}

      {!cargando && reportes.length > 0 && (
        <ul className="divide-y">
          {reportes.map((r) => (
            <li key={r._id} className="py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">Mesa {r.mesa_votacion}</p>
                <p className="text-xs text-gray-500">{r.region || "Sin region"}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-600">{r.votos?.fuerza_popular ?? 0}</span>
                <span className="text-gray-400">/</span>
                <span className="text-green-700">{r.votos?.juntos_por_el_peru ?? 0}</span>
                {r.candidato_ganador_mesa && (
                  <span className={`ml-1 px-2 py-0.5 rounded ${CANDIDATOS[r.candidato_ganador_mesa]?.colorClaro} ${CANDIDATOS[r.candidato_ganador_mesa]?.colorTexto}`}>
                    gana
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
