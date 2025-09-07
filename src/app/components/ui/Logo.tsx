import Image from "next/image";
import Link from "next/link";
import { cn } from "./cn";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
  showText?: boolean;
}

export function Logo({ size = "md", className, showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-24 h-24",
    "3xl": "w-32 h-32"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-4xl",
    "3xl": "text-6xl"
  };

  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo/due-north-logo.png"
        alt="DueNorth Logo"
        width={size === "sm" ? 24 : size === "md" ? 32 : size === "lg" ? 48 : size === "xl" ? 64 : size === "2xl" ? 96 : 128}
        height={size === "sm" ? 24 : size === "md" ? 32 : size === "lg" ? 48 : size === "xl" ? 64 : size === "2xl" ? 96 : 128}
        className={cn(sizeClasses[size], "flex-shrink-0")}
        priority={size === "lg" || size === "xl" || size === "2xl" || size === "3xl"}
      />
      {showText && (
        <span className={cn("font-bold text-gray-900 dark:text-white", textSizes[size])}>
          DueNorth
        </span>
      )}
    </Link>
  );
}
