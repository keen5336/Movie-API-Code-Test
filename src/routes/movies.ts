import { Router } from 'express'
import { getAllMovies, getMovieDetails } from '../services/movies.service'

const router = Router()

router.get('/', (req, res) => {
  const page = parseInt(req.query.page as string) || 1

  let year: number | undefined
  if (req.query.year) {
    const yearParam = parseInt(req.query.year as string)
    if (isNaN(yearParam) || yearParam < 1000 || yearParam > 9999) {
      return res.status(400).json({ error: 'Invalid year format. Must be a 4-digit number.' })
    }
    year = yearParam
  }

  const genre = req.query.genre?.toString()

  const sortOrderRaw = (req.query.sortOrder || 'asc').toString().toLowerCase()
  if (sortOrderRaw !== 'asc' && sortOrderRaw !== 'desc') {
    return res.status(400).json({ error: 'Invalid sortOrder. Must be "asc" or "desc".' })
  }
  const sortOrder = sortOrderRaw as 'asc' | 'desc'

  const movies = getAllMovies(page, 50, year, sortOrder, genre)
  res.json(movies)
})

router.get('/:imdbId', (req, res) => {
  const { imdbId } = req.params
  const movie = getMovieDetails(imdbId)
  if (!movie) {
    return res.status(404).json({ error: 'Movie not found' })
  }
  res.json(movie)
})

export default router