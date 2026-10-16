import type { Locale } from "./config";
import { es, type Dict } from "./dict/es";
import { ca } from "./dict/ca";
import { eu } from "./dict/eu";
import { gl } from "./dict/gl";
import { en } from "./dict/en";

export const DICTS: Record<Locale, Dict> = { es, ca, eu, gl, en };
export type { Dict };
export * from "./config";
