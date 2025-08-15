import React from "react";
import { cn } from "@/lib/utils";

interface AppIconProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showBackground?: boolean;
  alt?: string;
}

const sizeConfig = {
  sm: {
    container: "w-12 h-12",
    icon: "h-8 w-8",
  },
  md: {
    container: "w-16 h-16",
    icon: "h-10 w-10",
  },
  lg: {
    container: "w-20 h-20",
    icon: "h-12 w-12",
  },
  xl: {
    container: "w-24 h-24",
    icon: "h-16 w-16",
  },
};

export const AppIcon: React.FC<AppIconProps> = ({
  size = "md",
  className,
  showBackground = true,
  alt = "Lunch with Gareth",
}) => {
  const config = sizeConfig[size];

  if (!showBackground) {
    return (
      <img src="/logo.png" alt={alt} className={cn(config.icon, className)} />
    );
  }

  return (
    <div
      className={cn(
        "bg-gradient-primary rounded-full flex items-center justify-center",
        config.container,
        className
      )}
    >
      <img src="/logo.png" alt={alt} className={config.icon} />
    </div>
  );
};
