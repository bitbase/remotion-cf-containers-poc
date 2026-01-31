import { Container } from "@cloudflare/containers";

interface Env {
  REMOTION_CONTAINER: DurableObjectNamespace;
  R2_BUCKET: R2Bucket;
  R2_BUCKET_NAME: string;
}

export class RemotionContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "10m" as const;

  override onStart(): void {
    console.log("RemotionContainer started");
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/status") {
      return Response.json({ status: "ok", timestamp: Date.now() });
    }

    if (url.pathname === "/render" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          compositionId?: string;
          inputProps?: Record<string, unknown>;
        };

        const compositionId = body.compositionId || "HelloWorld";
        const inputProps = body.inputProps || {};

        // Route to the container via Durable Object
        const id = env.REMOTION_CONTAINER.idFromName("renderer");
        const stub = env.REMOTION_CONTAINER.get(id);

        const containerResponse = await stub.fetch(
          new Request("http://container/render", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ compositionId, inputProps }),
          })
        );

        if (!containerResponse.ok) {
          const errorText = await containerResponse.text();
          return Response.json(
            { error: "Render failed", details: errorText },
            { status: 500 }
          );
        }

        // Save the MP4 buffer to R2
        const mp4Buffer = await containerResponse.arrayBuffer();
        const renderId = crypto.randomUUID();
        const key = `renders/${renderId}.mp4`;

        await env.R2_BUCKET.put(key, mp4Buffer, {
          httpMetadata: { contentType: "video/mp4" },
          customMetadata: {
            compositionId,
            renderedAt: new Date().toISOString(),
          },
        });

        return Response.json({
          renderId,
          key,
          size: mp4Buffer.byteLength,
          bucket: env.R2_BUCKET_NAME,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ error: message }, { status: 500 });
      }
    }

    return Response.json(
      {
        error: "Not found",
        routes: {
          "POST /render":
            '{ compositionId: "HelloWorld", inputProps: { titleText: "...", titleColor: "#..." } }',
          "GET /status": "Health check",
        },
      },
      { status: 404 }
    );
  },
};
