import React from "react";
import { Composition } from "remotion";
import { z } from "zod";
import { HelloWorld } from "./HelloWorld";

export const helloWorldSchema = z.object({
  titleText: z.string().default("AdOpsHQ"),
  titleColor: z.string().default("#2563eb"),
});

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={helloWorldSchema}
        defaultProps={{
          titleText: "AdOpsHQ",
          titleColor: "#2563eb",
        }}
      />
    </>
  );
};
