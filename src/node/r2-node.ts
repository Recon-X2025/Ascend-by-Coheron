/**
 * R2-compatible storage adapter for Node.js using the local filesystem.
 * Exposes the same async API as Cloudflare R2 so the Hono app can use c.env.R2_BUCKET unchanged.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { createReadStream } from "fs";
import { Readable } from "stream";
import type { R2Bucket, R2Object } from "../env-types";

function streamToArrayBuffer(stream: ReadableStream): Promise<ArrayBuffer> {
  return new Response(stream).arrayBuffer();
}

function createR2Object(
  filePath: string,
  contentType?: string
): R2Object {
  const nodeStream = createReadStream(filePath);
  const body = Readable.toWeb(nodeStream) as ReadableStream;
  return {
    body,
    httpMetadata: contentType ? { contentType } : undefined,
    arrayBuffer(): Promise<ArrayBuffer> {
      return fs.readFile(filePath).then((buf) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    },
  };
}

export function createR2Node(storageDir: string): R2Bucket {
  const root = path.resolve(process.cwd(), storageDir);

  return {
    async get(key: string): Promise<R2Object | null> {
      const filePath = path.join(root, key);
      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) return null;
        let contentType: string | undefined;
        try {
          const metaPath = filePath + ".meta";
          const meta = await fs.readFile(metaPath, "utf8");
          const parsed = JSON.parse(meta) as { contentType?: string };
          contentType = parsed.contentType;
        } catch {
          // no .meta file
        }
        return createR2Object(filePath, contentType);
      } catch (e: unknown) {
        if ((e as NodeJS.ErrnoException)?.code === "ENOENT") return null;
        throw e;
      }
    },

    async put(
      key: string,
      value: ReadableStream | ArrayBuffer | string,
      options?: { httpMetadata?: { contentType?: string } }
    ): Promise<void> {
      const filePath = path.join(root, key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const contentType = options?.httpMetadata?.contentType;
      if (typeof value === "string") {
        await fs.writeFile(filePath, value, "utf8");
      } else if (value instanceof ArrayBuffer) {
        await fs.writeFile(filePath, Buffer.from(value));
      } else {
        const buf = await streamToArrayBuffer(value);
        await fs.writeFile(filePath, Buffer.from(buf));
      }
      if (contentType) {
        await fs.writeFile(
          filePath + ".meta",
          JSON.stringify({ contentType }),
          "utf8"
        );
      }
    },
  };
}
