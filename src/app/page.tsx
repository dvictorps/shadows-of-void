"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { loadCharacters, loadOverallData } from "../utils/localStorage";
import { Character } from "../types/gameData";

export default function Home() {
  const router = useRouter();
  const [worldMapDescription, setWorldMapDescription] = useState(
    "Explorar o mapa do mundo e interface de personagem."
  );

  useEffect(() => {
    try {
      const overallData = loadOverallData();
      const lastPlayedId = overallData.lastPlayedCharacterId;

      if (lastPlayedId !== null) {
        const characters = loadCharacters();
        const lastChar = characters.find(
          (c: Character) => c.id === lastPlayedId
        );

        if (lastChar) {
          setWorldMapDescription(
            `Continuar como: ${lastChar.name} (${lastChar.class} - Nv. ${lastChar.level})`
          );
        }
      }
    } catch (error) {
      console.error(
        "Error loading last character data for description:",
        error
      );
    }
  }, []);

  const handlePlayClick = () => {
    router.push("/characters");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-sans">
      <main className="flex flex-col items-center gap-12 mb-12">
        <h1 className="text-6xl font-bold text-center title-shadow purple-fire">
          Shadows
          <br />
          of
          <br />
          Void
        </h1>
        <button className="modern-button" onClick={handlePlayClick}>
          Entrar
        </button>
      </main>

      <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]">
        {/* Image or central element irrelevant to this change */}
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-1 lg:text-left">
        <Link
          href="/world-map"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          rel="noopener noreferrer"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Entrar no Mapa{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 text-sm opacity-50 whitespace-nowrap overflow-hidden text-ellipsis">
            {worldMapDescription}
          </p>
        </Link>
      </div>
    </div>
  );
}
