import { useState } from "react";
import { Clipboard, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  size?: number;
}

export function CopyButton({ textToCopy, label, size = 12 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("📋 Copied to clipboard!", {
        description: label ? `${label} copied` : "Address copied",
      });

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="icon-btn-inline"
      title={`Copy ${label || "address"}`}
      type="button"
      style={{ display: "inline-flex" }}
    >
      {copied ? <Check size={size} /> : <Clipboard size={size} />}
    </button>
  );
}
