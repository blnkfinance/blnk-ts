import FormDataNode from "form-data";

export function isNodeFormData(data: unknown): data is FormDataNode {
  return data instanceof FormDataNode;
}

export function isWebFormData(data: unknown): data is FormData {
  return typeof FormData !== `undefined` && data instanceof FormData;
}

/**
 * Converts the npm `form-data` payload to a body + headers native `fetch` accepts.
 */
export function nodeFormDataToFetchBody(formData: FormDataNode): {
  body: Uint8Array;
  headers: Record<string, string>;
} {
  return {
    body: new Uint8Array(formData.getBuffer()),
    headers: formData.getHeaders() as Record<string, string>,
  };
}
