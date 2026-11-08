import { AwsClient } from "aws4fetch";

export interface PhotoStorage {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
  urlFor(key: string): string;
}

/** Cloudflare R2 through its S3-compatible API. Public reads go through the bucket's public URL. */
export class R2Storage implements PhotoStorage {
  private readonly client: AwsClient;
  private readonly base: string;

  constructor(
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    private readonly bucket: string,
    private readonly publicBase: string,
  ) {
    this.client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
    this.base = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    const body = new Blob([bytes.slice().buffer as ArrayBuffer], { type: contentType });
    const res = await this.client.fetch(`${this.base}/${key}`, {
      method: "PUT",
      body,
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    });
    if (!res.ok) throw new Error(`Storage upload failed with status ${res.status}`);
  }

  async remove(key: string): Promise<void> {
    const res = await this.client.fetch(`${this.base}/${key}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) throw new Error(`Storage delete failed with status ${res.status}`);
  }

  urlFor(key: string): string {
    return `${this.publicBase.replace(/\/$/, "")}/${key}`;
  }
}

let cached: PhotoStorage | null | undefined;

/** Null when R2 is not configured, so the rest of the site keeps working without photos. */
export function getStorage(): PhotoStorage | null {
  if (cached !== undefined) return cached;
  const e = process.env;
  cached =
    e.R2_ACCOUNT_ID && e.R2_ACCESS_KEY_ID && e.R2_SECRET_ACCESS_KEY && e.R2_BUCKET && e.R2_PUBLIC_BASE_URL
      ? new R2Storage(e.R2_ACCOUNT_ID, e.R2_ACCESS_KEY_ID, e.R2_SECRET_ACCESS_KEY, e.R2_BUCKET, e.R2_PUBLIC_BASE_URL)
      : null;
  return cached;
}

/** Turns stored keys into public URLs. Returns an empty list when storage is not configured. */
export function photoUrls(keys: string[]): string[] {
  const s = getStorage();
  return s ? keys.map((k) => s.urlFor(k)) : [];
}
