/** Production keeps established saves; Editor previews remain isolated. */
export const SAVE_PREFIX = (globalThis as typeof globalThis & {__productionRelease?: boolean}).__productionRelease
  ? 'arianna' : 'dumpling.editorMigration';
export const saveKey = (suffix: string) => `${SAVE_PREFIX}.${suffix}`;
