// Tipos mínimos para importar la función de Netlify desde vite.config.ts (desarrollo).
// Vive fuera de netlify/functions/ porque Netlify trata todo lo de esa carpeta como función.
declare module '*/netlify/functions/contacto.mjs' {
  export function parseFields(input: unknown): Record<string, string> | null
}
