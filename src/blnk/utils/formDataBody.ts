import FormDataNode from "form-data";
import {PassThrough, Readable} from "node:stream";

export function isNodeFormData(data: unknown): data is FormDataNode {
  return data instanceof FormDataNode;
}

export function isWebFormData(data: unknown): data is FormData {
  return typeof FormData !== `undefined` && data instanceof FormData;
}

/**
 * Converts npm `form-data` (including stream-backed file parts) to a body
 * native `fetch` accepts.
 */
export function isStreamingFetchBody(body: BodyInit | undefined): boolean {
  return typeof ReadableStream !== `undefined` && body instanceof ReadableStream;
}

export function nodeFormDataToFetchBody(formData: FormDataNode): {
  body: ReadableStream<Uint8Array>;
  headers: Record<string, string>;
} {
  const passthrough = new PassThrough();
  formData.pipe(passthrough);

  return {
    body: Readable.toWeb(passthrough) as ReadableStream<Uint8Array>,
    headers: formData.getHeaders() as Record<string, string>,
  };
}
