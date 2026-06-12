/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import FormDataNode from "form-data";
import {createReadStream, mkdtempSync, writeFileSync} from "fs";
import {createServer} from "http";
import {tmpdir} from "os";
import {join} from "path";
import {
  isNodeFormData,
  nodeFormDataToFetchBody,
} from "../../../../src/blnk/utils/formDataBody";
import {readWebStreamBody} from "../../../mocks/streamTestUtils";

tap.test(`formDataBody`, async t => {
  t.test(`isNodeFormData identifies npm form-data instances`, tt => {
    tt.ok(isNodeFormData(new FormDataNode()));
    tt.notOk(isNodeFormData({}));
    tt.end();
  });

  t.test(
    `nodeFormDataToFetchBody returns ReadableStream for buffer-backed parts`,
    async tt => {
      const formData = new FormDataNode();
      formData.append(`source`, `stripe`);
      formData.append(`file`, Buffer.from(`a,b,c`), {filename: `test.csv`});

      const {body, headers} = nodeFormDataToFetchBody(formData);

      tt.ok(body instanceof ReadableStream);
      const payload = await readWebStreamBody(body);
      tt.match(payload, /stripe/);
      tt.match(payload, /a,b,c/);
      tt.match(headers[`content-type`], /multipart\/form-data/);
      tt.end();
    },
  );

  t.test(
    `nodeFormDataToFetchBody returns ReadableStream for file stream parts`,
    async tt => {
      const dir = mkdtempSync(join(tmpdir(), `blnk-formdata-`));
      const filePath = join(dir, `upload.csv`);
      writeFileSync(filePath, `amount,ref\n100,abc`);

      const formData = new FormDataNode();
      formData.append(`source`, `stripe`);
      formData.append(`file`, createReadStream(filePath), {
        filename: `upload.csv`,
      });

      const {body, headers} = nodeFormDataToFetchBody(formData);

      tt.ok(body instanceof ReadableStream);
      const payload = await readWebStreamBody(body);
      tt.match(payload, /stripe/);
      tt.match(payload, /amount,ref/);
      tt.match(payload, /100,abc/);
      tt.match(headers[`content-type`], /multipart\/form-data/);
      tt.end();
    },
  );

  t.test(
    `native fetch accepts stream multipart body when duplex is half`,
    async tt => {
      const dir = mkdtempSync(join(tmpdir(), `blnk-native-fetch-`));
      const filePath = join(dir, `upload.csv`);
      writeFileSync(filePath, `amount,ref\n300,native`);

      const formData = new FormDataNode();
      formData.append(`source`, `stripe`);
      formData.append(`file`, createReadStream(filePath), {
        filename: `upload.csv`,
      });
      const {body, headers} = nodeFormDataToFetchBody(formData);

      const server = createServer((req, res) => {
        let payload = ``;
        req.on(`data`, chunk => {
          payload += chunk.toString();
        });
        req.on(`end`, () => {
          res.writeHead(201, {"Content-Type": `application/json`});
          res.end(
            JSON.stringify({
              ok: payload.includes(`stripe`) && payload.includes(`300,native`),
            }),
          );
        });
      });

      await new Promise<void>((resolve, reject) => {
        server.listen(0, async () => {
          try {
            const address = server.address();
            if (!address || typeof address === `string`) {
              throw new Error(`Expected server to listen on a TCP port`);
            }

            const fetchInit: RequestInit & {duplex?: `half`} = {
              method: `POST`,
              headers: headers as HeadersInit,
              body,
              duplex: `half`,
            };
            const response = await globalThis.fetch(
              `http://127.0.0.1:${address.port}/upload`,
              fetchInit,
            );

            tt.equal(response.status, 201);
            const json = (await response.json()) as {ok: boolean};
            tt.ok(json.ok);
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            server.close();
          }
        });
      });

      tt.end();
    },
  );
});
