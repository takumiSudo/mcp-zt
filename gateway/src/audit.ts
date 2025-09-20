import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { AuditRecord, GatewayConfig } from './types.js';

async function streamToString(body: any): Promise<string> {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (body instanceof Uint8Array) {
    return Buffer.from(body).toString('utf-8');
  }
  if (typeof body.text === 'function') {
    return body.text();
  }
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf-8');
  }
  return '';
}

interface Manifest {
  updated_at: string;
  files: { key: string; sha256: string }[];
}

export class AuditWriter {
  private client: S3Client;

  constructor(private config: GatewayConfig) {
    this.client = new S3Client({
      region: 'us-east-1',
      endpoint: config.minioEndpoint,
      credentials: {
        accessKeyId: config.minioAccessKey,
        secretAccessKey: config.minioSecretKey,
      },
      forcePathStyle: true,
    });
  }

  private buildKey(session: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `records/${date}/${session}.json`;
  }

  private async fetchManifest(): Promise<Manifest> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.config.minioBucket, Key: 'manifest.json' })
      );
      const text = await streamToString(res.Body);
      return JSON.parse(text) as Manifest;
    } catch (err) {
      return { updated_at: new Date().toISOString(), files: [] };
    }
  }

  private async writeManifest(manifest: Manifest) {
    manifest.updated_at = new Date().toISOString();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.minioBucket,
        Key: 'manifest.json',
        Body: JSON.stringify(manifest, null, 2),
        ContentType: 'application/json',
      })
    );
  }

  async write(record: AuditRecord): Promise<void> {
    const key = this.buildKey(record.session);
    const body = JSON.stringify(record, null, 2);
    const hash = createHash('sha256').update(body).digest('hex');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.minioBucket,
        Key: key,
        Body: body,
        ContentType: 'application/json',
      })
    );

    const manifest = await this.fetchManifest();
    const withoutKey = manifest.files.filter((f) => f.key !== key);
    withoutKey.push({ key, sha256: hash });
    manifest.files = withoutKey.sort((a, b) => a.key.localeCompare(b.key));
    await this.writeManifest(manifest);
  }
}
