/* eslint-disable n/no-unpublished-import */
import tap from "tap";
import {ValidateUpdateMetadataData} from "../../../../src/blnk/utils/validators/metadataValidators";
import {UpdateMetadataData} from "../../../../src/types/metadata";

const validData: UpdateMetadataData = {
  meta_data: {project_owner: `Acme LLC`},
};

tap.test(`ValidateUpdateMetadataData`, async t => {
  t.test(`accepts valid payload`, tt => {
    tt.equal(ValidateUpdateMetadataData(`ldg_123`, validData), null);
    tt.end();
  });

  t.test(`rejects empty id`, tt => {
    tt.equal(ValidateUpdateMetadataData(``, validData), `id is required`);
    tt.end();
  });

  t.test(`rejects missing meta_data`, tt => {
    tt.match(
      ValidateUpdateMetadataData(`ldg_123`, {} as UpdateMetadataData),
      /meta_data/,
    );
    tt.end();
  });

  t.test(`rejects non-object meta_data`, tt => {
    tt.match(
      ValidateUpdateMetadataData(`ldg_123`, {
        meta_data: `invalid` as unknown as Record<string, unknown>,
      }),
      /meta_data/,
    );
    tt.end();
  });
});
