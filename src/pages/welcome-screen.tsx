import { useState, useEffect, useRef } from "react";
import { Shield, ChevronRight, Cpu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;

  
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }


  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.50000 * snoise(p); p *= 2.02;
    f += 0.25000 * snoise(p); p *= 2.03;
    f += 0.12500 * snoise(p); p *= 2.01;
    return f;
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float ratio = u_resolution.x / u_resolution.y;
    st.x *= ratio;
    
    vec2 mouse = u_mouse.xy / u_resolution.xy;
    mouse.x *= ratio;

  
    vec2 parallax = (mouse - vec2(0.5 * ratio, 0.5)) * 0.05;
    st += parallax;

  
    float dist = distance(st, mouse);
    float lightRadius = 0.65;
    float lightIntensity = 1.1 - smoothstep(0.1, lightRadius, dist);
    lightIntensity = pow(lightIntensity, 1.5);

  
    float t = u_time * 0.08;
    vec2 q = vec2(0.);
    q.x = fbm(st + vec2(0.0, 0.0) + t * 0.4);
    q.y = fbm(st + vec2(5.2, 1.3) + t * 0.6);

    vec2 r = vec2(0.);
    r.x = fbm(st + 4.0 * q + vec2(1.7, 9.2) + t);
    r.y = fbm(st + 4.0 * q + vec2(8.3, 2.8) + t);

    float f = fbm(st + 4.0 * r);

  
    vec3 c1 = vec3(0.0, 0.01, 0.02); 
    vec3 c2 = vec3(0.02, 0.1, 0.25);  
    vec3 c3 = vec3(0.0, 0.6, 0.8);   
    vec3 c4 = vec3(0.9, 0.95, 1.0);   

    vec3 color = mix(c1, c2, f);
    color = mix(color, c3, length(q));
    color = mix(color, c4, r.y * r.x); 

    float ambient = 0.15;
    vec3 finalColor = color * (ambient + lightIntensity * (f * 2.0 + 0.5));

    float vignette = 1.0 - smoothstep(0.4, 1.5, length(st - vec2(0.5 * ratio, 0.5)));
    finalColor *= vignette;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

type WelcomeScreenProps = {
  onCreateAccount: () => void;
  onRestoreAccount: () => void;
};

export function WelcomeScreen({
  onCreateAccount,
  onRestoreAccount,
}: WelcomeScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<"create" | "restore" | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const createShader = (
      gl: WebGLRenderingContext,
      type: number,
      source: string
    ) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      FRAGMENT_SHADER
    );
    const program = gl.createProgram();
    if (!program || !vertexShader || !fragmentShader) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;
    let startTime = performance.now();
    let animationFrameId: number;

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      const displayWidth = Math.floor(window.innerWidth * pixelRatio);
      const displayHeight = Math.floor(window.innerHeight * pixelRatio);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform2f(uResolution, canvas.width, canvas.height);
      }
    };
    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      targetMouseX = e.clientX * pixelRatio;
      targetMouseY = (window.innerHeight - e.clientY) * pixelRatio;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      const time = (performance.now() - startTime) / 1000;
      gl.uniform1f(uTime, time);

      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;
      gl.uniform2f(uMouse, mouseX, mouseY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#050505] text-purple-500-900 overflow-hidden relative flex flex-col font-sans selection:bg-red-500/30">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 w-full h-full block"
      />

      <nav className="relative z-50 flex items-center justify-between px-8 py-6 md:px-16 mix-blend-plus-lighter">
        <div className="flex items-center gap-4 group cursor-pointer">
          <Shield className="w-6 h-6 text-white transition-all duration-500 group-hover:scale-110 group-hover:text-purple-500" />
          <span className="font-bold text-xl tracking-[0.25em] text-white group-hover:text-purple-500 tarnsition-colors drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            NYX
          </span>
        </div>

        <div className="hidden md:flex items-center gap-12 text-[11px] font-bold tracking-[0.2em] text-cyan-100/50">
          {["Nyx PROTOCOL", "NODES", "SECURITY"].map((item) => (
            <span
              key={item}
              className="hover:text-purple-400 cursor-pointer transition-all duration-300 hover:tracking-[0.3em]"
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
          className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300 px-8 py-6 text-xs font-bold tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
        >
          GET STARTED
        </Button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <div className="mb-8 overflow-hidden relative z-10">
          <p className="text-[10px] md:text-xs font-mono text-purple-200 tracking-[1.5em] uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            PROJECT
          </p>
        </div>

        <div className="relative group cursor-default">
          <h1 className="relative text-[140px] md:text-[280px] font-bold leading-none tracking-tighter select-none animate-in zoom-in-95 duration-1000 fill-mode-forwards z-10">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-600 drop-shadow-2xl">
              Nyx
            </span>
            <span className="absolute inset-0 bg-clip-text text-transparent bg-gradient-to-tr from-transparent via-white/20 to-transparent bg-[length:200%_auto] animate-shine pointer-events-none" />
          </h1>

          <div
            className="absolute inset-0 text-[150px] md:text-[280px] font-bold leading-none tracking-tighter text-transparent border-text"
            style={{
              WebkitTextStroke: "1px rgba(255,255,255,0.2)",
              pointerEvents: "none",
            }}
          >
            Nyx
          </div>
        </div>

        <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
          <p className="mt-8 text-[10px] md:text-xs font-mono text-purple-200 tracking-[1.2em] uppercase drop-shadow-md animate-pulse">
            Decentralized Security
          </p>
        </main>

        <div
          id="action-area"
          className="mt-24 w-full max-w-4xl perspective-1000 relative z-30"
        >
          <div
            className={cn(
              "relative grid grid-cols-1 md:grid-cols-2 gap-6 p-1 transition-all duration-500",
              activeTab ? "opacity-100 translate-y-0" : "opacity-100"
            )}
          >
            <div
              onClick={onCreateAccount}
              className="group relative h-64 bg-black/20 backdrop-blur-xl border border-white/10 hover:border-cyan-500/60 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_60px_rgba(0,255,255,0.1)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40  to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="absolute top-6 left-6">
                <Cpu className="w-8 h-8 text-cyan-500/60 group-hover:text-cyan-400 transition-colors duration-500" />
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  Create Account
                  <ChevronRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-cyan-400" />
                </h3>
                <p className="text-sm text-gray-400 font-mono group-hover:text-cyan-100/80 transition-colors">
                  Initialize Nyx Curve25519 cryptographic keys. Zero knowledge
                  generation.
                </p>
              </div>
            </div>

            <div
              onClick={onRestoreAccount}
              className="group relative h-64 bg-black/20 backdrop-blur-xl border border-white/10 hover:border-purple-500/60 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_60px_rgba(168,85,247,0.1)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40  to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="absolute top-6 left-6">
                <Globe className="w-8 h-8 text-purple-500/60 group-hover:text-purple-400 transition-colors duration-500" />
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  Restore Account Access
                  <ChevronRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-purple-400" />
                </h3>
                <p className="text-sm text-gray-400 font-mono group-hover:text-purple-100/80 transition-colors">
                  Recover session using 12-word mnemonic or Nyx private key.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 p-8 text-center">
        <div className="inline-flex items-center gap-8 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
          <span className="hover:text-purple-400 transition-colors cursor-help">
            Project Nyx v0.10
          </span>
          <span className="w-1 h-1 bg-gray-800 rounded-full" />
          <span className="hover:text-purple-400 transition-colors cursor-help">
            No Metadata
          </span>
          <span className="w-1 h-1 bg-gray-800 rounded-full" />
          <span className="hover:text-purple-400 transition-colors cursor-help">
            Open Source
          </span>
        </div>
      </footer>
    </div>
  );
}
