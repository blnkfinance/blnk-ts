/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import FormDataNode from "form-data";
import {createReadStream, mkdtempSync, writeFileSync} from "fs";
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
});
