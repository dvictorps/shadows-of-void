"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const hasClickedPlay = localStorage.getItem("hasClickedPlay");
    if (hasClickedPlay === "true") {
      router.push("/characters");
    }
  }, [router]);

  const handlePlayClick = () => {
    localStorage.setItem("hasClickedPlay", "true");
    router.push("/characters");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-sans">
      <main className="flex flex-col items-center gap-12">
        <h1 className="text-6xl font-bold text-center title-shadow purple-fire">
          Shadows
          <br />
          of
          <br />
          Void
        </h1>
        <button className="modern-button" onClick={handlePlayClick}>
          Jogar
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
            Enter World Map{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Explore the world map and character interface.
          </p>
        </Link>
      </div>
    </div>
  );
}
