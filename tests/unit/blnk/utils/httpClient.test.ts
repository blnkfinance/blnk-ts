/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {
  parseJsonWithBigInt,
  readResponseJsonBody,
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

  t.test(`keeps a balance above MAX_SAFE_INTEGER exact`, async tt => {
    const response = {
      text: async () => `{"balance":123456789012345678901234567890}`,
    } as Response;

    const body = (await readResponseJsonBody(response)) as {balance: bigint};
    tt.equal(body.balance, BigInt(`123456789012345678901234567890`));
    tt.end();
  });

  t.end();
});

tap.test(`parseJsonWithBigInt`, t => {
  t.test(`returns bigint only outside the safe range`, tt => {
    tt.same(parseJsonWithBigInt(`{"a":42,"b":-9007199254740993}`), {
      a: 42,
      b: BigInt(`-9007199254740993`),
    });
    tt.end();
  });

  t.test(`leaves non-integer numbers alone`, tt => {
    tt.same(parseJsonWithBigInt(`{"a":1.5,"b":1e21}`), {a: 1.5, b: 1e21});
    tt.end();
  });

  t.test(`never rewrites numbers inside strings`, tt => {
    tt.same(
      parseJsonWithBigInt(
        `{"ref":"123456789012345678901","note":"a \\" 123456789012345678901"}`,
      ),
      {ref: `123456789012345678901`, note: `a " 123456789012345678901`},
    );
    tt.end();
  });

  t.test(`does not mistake a payload string for a marker`, tt => {
    tt.same(parseJsonWithBigInt(`{"d":"\\u0000123"}`), {d: `\u0000123`});
    tt.end();
  });

  t.test(`converts nested values`, tt => {
    tt.same(parseJsonWithBigInt(`{"a":[{"b":123456789012345678901}],"c":7}`), {
      a: [{b: BigInt(`123456789012345678901`)}],
      c: 7,
    });
    tt.end();
  });

  t.end();
});
