import { moviesDb, ratingsDb } from '../db'
import { parseGenres, formatBudget } from '../utils'

type MovieRow = {
  imdbId: string
  title: string
  genres: string | null
  releaseDate: string | null
  budget: number | null
}

export function getAllMovies(
  page = 1,
  limit = 50,
  year?: number,
  sortOrder: 'asc' | 'desc' = 'asc',
  genre?: string
) {
  const offset = (page - 1) * limit
  let query = 'SELECT * FROM movies'
  const params: any[] = []
  let whereClauseAdded = false

  if (year) {
    query += " WHERE releaseDate IS NOT NULL AND strftime('%Y', releaseDate) = ?"
    params.push(year.toString())
    whereClauseAdded = true
  }

  if (genre) {
    query += `${whereClauseAdded ? ' AND' : ' WHERE'} genres LIKE ?`
    params.push(`%"${genre}"%`)
    whereClauseAdded = true
  }

  query += ' ORDER BY releaseDate ' + sortOrder.toUpperCase()
  query += ' LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const stmt = moviesDb.prepare(query)
  const rows: MovieRow[] = stmt.all(...params)

  return rows.map(row => ({
    imdbId: row.imdbId,
    title: row.title,
    genres: parseGenres(row.genres),
    releaseDate: row.releaseDate || null,
    budget: formatBudget(row.budget || 0),
  }))
}

type MovieDetail = {
  imdbId: string
  title: string
  description: string | null
  releaseDate: string | null
  budget: string | null
  runtime: number | null
  genres: string[] | null
  originalLanguage: string | null
  productionCompanies: string[] | null
  averageRating: number | null
}

export function getMovieDetails(imdbId: string): MovieDetail | null {
  const movieStmt = moviesDb.prepare(`
    SELECT imdbId, title, overview AS description, releaseDate, budget, runtime, genres, language, productionCompanies
    FROM movies
    WHERE imdbId = ?
  `)
  const movie = movieStmt.get(imdbId)

  if (!movie) return null

  const ratingStmt = ratingsDb.prepare(`
    SELECT AVG(rating) as averageRating
    FROM ratings
    WHERE movieId = ?
  `)
  const ratingRow = ratingStmt.get(imdbId)

  return {
    imdbId: movie.imdbId,
    title: movie.title,
    description: movie.description || null,
    releaseDate: movie.releaseDate || null,
    budget: formatBudget(movie.budget || 0),
    runtime: movie.runtime || null,
    genres: parseGenres(movie.genres),
    originalLanguage: movie.language || null,
    productionCompanies: parseGenres(movie.productionCompanies),
    averageRating: ratingRow?.averageRating || null
  }
}