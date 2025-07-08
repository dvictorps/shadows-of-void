import React from "react";

interface FloatingRubyChange {
  value: number;
  type: "gain" | "loss";
  id: string;
}

interface FloatingRubyTextProps {
  change: FloatingRubyChange | null;
}

export default function FloatingRubyText({ change }: FloatingRubyTextProps) {
  if (!change) return null;
  return (
    <div
      key={change.id}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[100] 
                       text-2xl font-bold animate-float-up-fade drop-shadow-lg 
                       ${change.type === "gain" ? "text-green-400" : "text-red-500"}`}
    >
      {change.type === "gain" ? "+" : "-"}
      {change.value} Rubis
    </div>
  );
} 