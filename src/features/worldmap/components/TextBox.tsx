"use client";

import React from "react";

interface TextBoxProps {
  content: React.ReactNode;
}

export default function TextBox({ content }: TextBoxProps) {
  return (
    <div className="h-[100px] md:h-[150px] border border-white p-1 bg-black mt-2">
      <div className="ring-1 ring-inset ring-white ring-offset-1 ring-offset-black h-full w-full p-3 font-sans overflow-y-auto">
        {content}
      </div>
    </div>
  );
} 