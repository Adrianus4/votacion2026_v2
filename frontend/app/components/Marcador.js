"use client";

import { useEffect, useState, useCallback } from "react";
import { obtenerResultados } from "../lib/api";
import { CANDIDATOS } from "../lib/constantes";

export default function Marcador({ refrescarTrigger }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const r = await obtenerResultados();
      setDatos(r);
      setError(null);
    } catch (err) {
      setError("No se pudieron cargar los resultados.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 15000);
    return () => clearInterval(intervalo);
  }, [cargar, refrescarTrigger]);

  if (cargando) return <div className="border rounded-lg bg-white p-6 text-sm text-gray-500">Cargando resultados...</div>;
  if (error) return <div className="border rounded-lg bg-white p-6 text-sm text-red-600">{error}</div>;

  const { conteo, porcentaje, total } = datos;

  return (
    <div className="border rounded-lg bg-white p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Resultados en vivo</h2>
        <span className="text-xs text-gray-500">{total} voto{total !== 1 ? "s" : ""}</span>
      </div>

      <Barra candidato={CANDIDATOS.fuerza_popular} pct={porcentaje.fuerza_popular} valor={conteo.fuerza_popular} />
      <Barra candidato={CANDIDATOS.juntos_por_el_peru} pct={porcentaje.juntos_por_el_peru} valor={conteo.juntos_por_el_peru} />

      <p className="text-xs text-gray-400">Se actualiza cada 15 segundos</p>
    </div>
  );
}

function Barra({ candidato, pct, valor }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={`font-medium ${candidato.colorTexto}`}>{candidato.nombre}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${candidato.color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{valor} votos</p>
    </div>
  );
}
