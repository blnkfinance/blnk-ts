/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {readResponseJsonBody} from "../../../../src/blnk/utils/httpClient";

tap.test(`readResponseJsonBody`, t => {
  t.test(`returns null for empty bodies`, async tt => {
    const response = {
      text: async () => ``,
    } as Response;

    tt.equal(await readResponseJsonBody(response), null);
    tt.end();
  });

  t.test(`parses non-empty JSON bodies`, async tt => {
    const response = {
      text: async () => `{"message":"deleted"}`,
    } as Response;

    tt.same(await readResponseJsonBody(response), {message: `deleted`});
    tt.end();
  });

  t.end();
});
