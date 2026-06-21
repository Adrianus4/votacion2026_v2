"use client";

import { useState } from "react";
import Masthead from "./components/Masthead";
import BoletaEncuesta from "./components/BoletaEncuesta";
import Marcador from "./components/Marcador";
import CargaActa from "./components/CargaActa";
import ActasRecientes from "./components/ActasRecientes";

export default function Home() {
  const [vista, setVista] = useState("encuesta");
  const [refrescar, setRefrescar] = useState(0);

  return (
    <>
      <Masthead />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setVista("encuesta")}
            className={`px-4 py-2 text-sm rounded-md ${vista === "encuesta" ? "bg-gray-900 text-white" : "bg-white border"}`}
          >
            Encuesta
          </button>
          <button
            onClick={() => setVista("actas")}
            className={`px-4 py-2 text-sm rounded-md ${vista === "actas" ? "bg-gray-900 text-white" : "bg-white border"}`}
          >
            Actas
          </button>
        </div>

        {vista === "encuesta" && (
          <div className="space-y-6">
            <BoletaEncuesta onVotoRegistrado={() => setRefrescar((n) => n + 1)} />
            <Marcador refrescarTrigger={refrescar} />
          </div>
        )}

        {vista === "actas" && (
          <div className="space-y-6">
            <CargaActa onActaRegistrada={() => setRefrescar((n) => n + 1)} />
            <ActasRecientes refrescarTrigger={refrescar} />
          </div>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-4 py-6 text-xs text-gray-400">
        Plataforma ciudadana independiente. No es un medio oficial de la ONPE ni el JNE.
      </footer>
    </>
  );
}
