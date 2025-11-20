import { useState, useEffect } from "react";
import { Shield, ChevronRight, Activity, Lock, Globe, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WelcomeScreenProps = {
  onCreateAccount: () => void;
  onRestoreAccount: () => void;
};

export function WelcomeScreen({
  onCreateAccount,
  onRestoreAccount,
}: WelcomeScreenProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"create" | "restore" | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white overflow-hidden relative flex flex-col font-sans selection:bg-white/30">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(20,20,30,1)_0%,_rgba(0,0,0,1)_100%)]" />

        <div
          className="absolute inset-0 opacity-40"
          style={{
            transform: `translate(${mousePos.x * -1}px, ${mousePos.y * -1}px)`,
          }}
        >
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.7,
              }}
            />
          ))}
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <nav className="relative z-50 flex items-center justify-between px-8 py-6 md:px-16">
        <div className="flex items-center gap-4 group cursor-pointer">
          <Shield className="w-6 h-6 text-white transition-all duration-500 group-hover:scale-110" />
          <span className="font-bold text-xl tracking-[0.25em] text-white group-hover:text-gray-300 transition-colors">
            NYX
          </span>
        </div>

        <div className="hidden md:flex items-center gap-12 text-[11px] font-bold tracking-[0.2em] text-gray-500">
          {["Nyx POTOCOL", "NODES", "SECURITY", "MANIFESTO"].map((item) => (
            <span
              key={item}
              className="hover:text-white cursor-pointer transition-all duration-300 hover:tracking-[0.3em]"
            >
              {item}
            </span>
          ))}
        </div>

        <Button
          onClick={() =>
            document
              .getElementById("action-area")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="rounded-full bg-white text-black hover:bg-gray-200 transition-all duration-300 px-8 py-6 text-xs font-bold tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
        >
          GET STARTED
        </Button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <div className="mb-8 overflow-hidden">
          <p className="text-[10px] md:text-xs font-mono text-gray-500 tracking-[1.5em] uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            PROJECT
          </p>
        </div>

        <h1 className="relative text-[140px] md:text-[280px] font-bold leading-none tracking-tighter select-none animate-in zoom-in-95 duration-1000 fill-mode-forwards">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-300 to-gray-800 drop-shadow-2xl">
            Nyx
          </span>

          <span className="absolute inset-0 bg-clip-text text-transparent bg-gradient-to-tr from-transparent via-white/20 to-transparent bg-[length:200%_auto] animate-shine pointer-events-none" />
        </h1>

        <div
          id="action-area"
          className="mt-24 w-full max-w-4xl perspective-1000"
        >
          <div
            className={cn(
              "relative grid grid-cols-1 md:grid-cols-2 gap-6 p-1 transition-all duration-500",
              activeTab ? "opacity-100 translate-y-0" : "opacity-100"
            )}
          >
            <div
              onClick={onCreateAccount}
              className="group relative h-64 bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/20 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="absolute top-6 left-6">
                <Cpu className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-500" />
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  Create Account
                  <ChevronRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </h3>
                <p className="text-sm text-gray-500 font-mono group-hover:text-gray-300 transition-colors">
                  Initialize new Curve25519 cryptographic keys. Zero knowledge
                  generation.
                </p>
              </div>
            </div>

            <div
              onClick={onRestoreAccount}
              className="group relative h-64 bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/20 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="absolute top-6 left-6">
                <Globe className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-500" />
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  Restore Access
                  <ChevronRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </h3>
                <p className="text-sm text-gray-500 font-mono group-hover:text-gray-300 transition-colors">
                  Recover session using 12-word mnemonic or Nyx private key.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 p-8 text-center">
        <div className="inline-flex items-center gap-8 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
          <span className="hover:text-white transition-colors cursor-help">
            Project Nyx v0.07
          </span>
          <span className="w-1 h-1 bg-gray-800 rounded-full" />
          <span className="hover:text-white transition-colors cursor-help">
            No Metadata
          </span>
          <span className="w-1 h-1 bg-gray-800 rounded-full" />
          <span className="hover:text-white transition-colors cursor-help">
            Open Source
          </span>
        </div>
      </footer>
    </div>
  );
}
