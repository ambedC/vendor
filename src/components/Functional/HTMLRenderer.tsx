// components/HTMLRenderer.tsx

import { FC } from "react";

interface HTMLRendererProps {
  html: string;
  className?: string;
}

const HTMLRenderer: FC<HTMLRendererProps> = ({ html, className }) => {
  return (
    <div
      className={`html-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default HTMLRenderer;
