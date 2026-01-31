import express from "express";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import {
  renderMedia,
  selectComposition,
  getCompositions,
} from "@remotion/renderer";

const app = express();
app.use(express.json());

// The bundle is pre-built in Docker via `npx remotion bundle`
const BUNDLE_DIR = path.join(process.cwd(), "build");

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", pid: process.pid });
});

app.get("/compositions", async (_req, res) => {
  try {
    const serveUrl = BUNDLE_DIR;
    const compositions = await getCompositions(serveUrl);
    res.json(
      compositions.map((c) => ({
        id: c.id,
        width: c.width,
        height: c.height,
        fps: c.fps,
        durationInFrames: c.durationInFrames,
      }))
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.post("/render", async (req, res) => {
  const { compositionId = "HelloWorld", inputProps = {} } = req.body;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "remotion-"));
  const outputPath = path.join(tmpDir, "output.mp4");

  try {
    console.log(
      `Rendering ${compositionId} with props:`,
      JSON.stringify(inputProps)
    );

    const serveUrl = BUNDLE_DIR;

    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps,
    });

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      chromiumOptions: {
        gl: "angle",
      },
    });

    // Read the rendered file and send as buffer
    const videoBuffer = fs.readFileSync(outputPath);
    console.log(`Render complete: ${videoBuffer.byteLength} bytes`);

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", videoBuffer.byteLength.toString());
    res.send(videoBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Render error:", message);
    res.status(500).json({ error: message });
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
});

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`Remotion render server listening on port ${PORT}`);
});
