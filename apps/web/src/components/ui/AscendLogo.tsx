interface AscendLogoProps {
  /** Use "light" on dark backgrounds (e.g. green header) for contrast */
  variant?: "default" | "light";
}

export default function AscendLogo({ variant = "default" }: AscendLogoProps) {
  const isLight = variant === "light";
  return (
    <div className="flex flex-col leading-none">
      <div className={`text-lg font-bold tracking-widest ${isLight ? "text-white" : "text-gray-900"}`}>
        ASCEN<span className="text-green-500">D</span>
      </div>
      <div className={`w-full h-[1px] my-[2px] ${isLight ? "bg-white/30" : "bg-gray-300"}`} />
      <div className={`text-[10px] tracking-wide ${isLight ? "text-white/70" : "text-gray-400"}`}>
        A Coheron Product
      </div>
    </div>
  );
}
