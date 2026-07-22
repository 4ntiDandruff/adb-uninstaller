export interface DebloatPreset {
  brand: string;
  packages: { name: string; description: string; safe_to_remove: boolean }[];
}
