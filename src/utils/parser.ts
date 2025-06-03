export function parseGenres(input: string | null): string[] {
  try {
    return input ? JSON.parse(input) : []
  } catch {
    return []
  }
}