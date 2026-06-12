export async function readWebStreamBody(
  body: ReadableStream<Uint8Array>,
): Promise<string> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const {value, done} = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks).toString(`utf8`);
}
