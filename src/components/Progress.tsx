"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";

export function LoadingProgress({ speed }: { speed: number }) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const startTimer = setTimeout(() => {
      const timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prevProgress + 1;
        });
      }, speed);

      return () => clearInterval(timer);
    }, 1000);

    return () => clearTimeout(startTimer);
  }, [speed]);

  return <Progress value={progress} className="w-full h-1 rounded-none bg-transparent" />;
}