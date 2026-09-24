/** Production keeps established saves; Editor previews remain isolated. */
export const SCHOOL_REVIEW = new URLSearchParams(globalThis.location?.search??'').get('preview')==='school';
const OPENING_REVIEW = new URLSearchParams(globalThis.location?.search??'').get('preview')==='opening';
export const OUTDOOR_REVIEW = new URLSearchParams(globalThis.location?.search??'').get('preview')==='outdoors';
export const SAVE_PREFIX = OUTDOOR_REVIEW ? 'dumpling.outdoorReview' : OPENING_REVIEW ? 'dumpling.openingReview' : SCHOOL_REVIEW ? 'dumpling.schoolReview' : (globalThis as typeof globalThis & {__productionRelease?: boolean}).__productionRelease
  ? 'arianna' : 'dumpling.editorMigration';
export const saveKey = (suffix: string) => `${SAVE_PREFIX}.${suffix}`;
