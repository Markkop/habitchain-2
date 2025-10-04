import { useState, ReactNode } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  text: string | ReactNode;
  iconSize?: number;
}

export function Tooltip({ text, iconSize = 12 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="tooltip-wrapper">
      <span
        className="tooltip-icon"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <Info size={iconSize} />
      </span>
      {isVisible && <span className="tooltip-content">{text}</span>}
    </span>
  );
}
