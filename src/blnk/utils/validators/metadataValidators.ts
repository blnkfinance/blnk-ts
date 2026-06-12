import {UpdateMetadataData} from "../../../types/metadata";
import {IsValidString} from "../stringUtils";
import {isValidMetaData} from "./ledgerBalance";

export function ValidateUpdateMetadataData(
  id: string,
  data: UpdateMetadataData,
): string | null {
  if (!IsValidString(id) || id === ``) {
    return `id is required`;
  }

  if (!data || typeof data !== `object`) {
    return `Data must be a valid object of type UpdateMetadataData`;
  }

  if (data.meta_data === undefined || !isValidMetaData(data.meta_data)) {
    return `meta_data must be a valid object`;
  }

  return null;
}
