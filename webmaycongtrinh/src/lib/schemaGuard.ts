/**
 * schemaGuard – dev-only warnings for missing API fields.
 * Silent in production (import.meta.env.DEV is false at build time).
 */

/**
 * Warn when any expected top-level field is absent (null / undefined / "")
 * from a single API response object.
 *
 * @param data    - raw API response record
 * @param fields  - keys we expect to be present
 * @param context - label for the warning prefix, e.g. "CompanyInfo"
 */
export function warnMissingFields(
  data: Record<string, unknown>,
  fields: readonly string[],
  context: string,
): void {
  if (!import.meta.env.DEV) return;

  for (const field of fields) {
    const value = data[field];
    if (value === undefined || value === null || value === "") {
      console.warn(`[SchemaGuard][${context}] Missing field: "${field}"`);
    }
  }
}

/**
 * Warn when any expected field is missing from an item inside a collection.
 *
 * @param rows    - array of raw API rows
 * @param fields  - keys we expect on each row
 * @param context - label, e.g. "News"
 */
export function warnMissingCollectionFields(
  rows: Record<string, unknown>[],
  fields: readonly string[],
  context: string,
): void {
  if (!import.meta.env.DEV) return;

  rows.forEach((row, index) => {
    for (const field of fields) {
      const value = row[field];
      if (value === undefined || value === null || value === "") {
        const rowId =
          row.id !== undefined && row.id !== null ? String(row.id) : `#${index}`;
        console.warn(
          `[SchemaGuard][${context}] Row ${rowId}: Missing field: "${field}"`,
        );
      }
    }
  });
}
