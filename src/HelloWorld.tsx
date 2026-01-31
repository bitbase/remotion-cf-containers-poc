import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { helloWorldSchema } from "./Root";

type Props = z.infer<typeof helloWorldSchema>;

export const HelloWorld: React.FC<Props> = ({ titleText, titleColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          fontSize: 120,
          fontWeight: 800,
          color: titleColor,
          fontFamily: "Arial, Helvetica, sans-serif",
          textAlign: "center",
          letterSpacing: -2,
        }}
      >
        {titleText}
      </div>
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontSize: 36,
          color: "#94a3b8",
          fontFamily: "Arial, Helvetica, sans-serif",
          marginTop: 20,
        }}
      >
        AI-Powered Ad Operations
      </div>
    </AbsoluteFill>
  );
};
