/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import FormDataNode from "form-data";
import {
  isNodeFormData,
  nodeFormDataToFetchBody,
} from "../../../../src/blnk/utils/formDataBody";

tap.test(`formDataBody`, async t => {
  t.test(`isNodeFormData identifies npm form-data instances`, tt => {
    tt.ok(isNodeFormData(new FormDataNode()));
    tt.notOk(isNodeFormData({}));
    tt.end();
  });

  t.test(
    `nodeFormDataToFetchBody returns Buffer and multipart headers`,
    async tt => {
      const formData = new FormDataNode();
      formData.append(`source`, `stripe`);
      formData.append(`file`, Buffer.from(`a,b,c`), {filename: `test.csv`});

      const {body, headers} = nodeFormDataToFetchBody(formData);

      tt.ok(body instanceof Uint8Array);
      tt.ok(body.length > 0);
      tt.match(headers[`content-type`], /multipart\/form-data/);
      tt.end();
    },
  );
});
