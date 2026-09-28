/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  readResponseJsonBody,
  serializeRequestBody,
} from "../../../../src/blnk/utils/httpClient";

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

tap.test(`serializeRequestBody`, t => {
  t.test(`writes an integer string precise_amount as a JSON number`, tt => {
    tt.equal(
      serializeRequestBody({
        precise_amount: `1000000000000000001`,
        precision: 1,
      }),
      `{"precise_amount":1000000000000000001,"precision":1}`,
    );
    tt.end();
  });

  t.test(`normalizes whitespace and leading zeros`, tt => {
    tt.equal(
      serializeRequestBody({
        transactions: [{precise_amount: ` 007 `}, {precise_amount: `8`}],
      }),
      `{"transactions":[{"precise_amount":7},{"precise_amount":8}]}`,
    );
    tt.end();
  });

  t.test(`leaves a non-integer precise_amount and other strings quoted`, tt => {
    const data = {
      precise_amount: `12.5`,
      sources: [{identifier: `bln_a`, precise_distribution: `500`}],
      meta_data: {note: `"precise_amount":"1"`},
    };

    tt.equal(serializeRequestBody(data), JSON.stringify(data));
    tt.end();
  });

  t.end();
});
