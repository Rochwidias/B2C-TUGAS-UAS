// @types/node yang terpasang (20.x) belum menghidupkan tipe node:sqlite,
// jadi modul dideklarasikan sendiri di sini agar `import 'node:sqlite'`
// tetap ter-typed tanpa menambah dependency.
declare module 'node:sqlite' {
  export interface StatementSync {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  }

  export class DatabaseSync {
    constructor(filename: string, options?: { readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}