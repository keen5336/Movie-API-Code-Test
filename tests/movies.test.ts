

import request from 'supertest'
import express from 'express'
import movieRoutes from '../src/routes/movies'

const app = express()
app.use(express.json())
app.use('/movies', movieRoutes)

describe('GET /movies', () => {
  it('returns 200 and a list of 50 movies', async () => {
    const res = await request(app).get('/movies?page=1')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeLessThanOrEqual(50)

    const sample = res.body[0]
    expect(sample).toHaveProperty('imdbId')
    expect(sample).toHaveProperty('title')
    expect(sample).toHaveProperty('genres')
    expect(sample).toHaveProperty('releaseDate')
    expect(sample).toHaveProperty('budget')

    expect(typeof sample.budget).toBe('string')
    expect(Array.isArray(sample.genres)).toBe(true)
  })

  it('handles invalid page numbers gracefully', async () => {
    const res = await request(app).get('/movies?page=abc')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('returns an empty array for out-of-range page', async () => {
    const res = await request(app).get('/movies?page=99999')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(0)
  })
})

describe('GET /movies/:imdbId', () => {
  it('returns 200 and full details for a valid movie', async () => {
    const validId = 'tt0111161'
    const res = await request(app).get(`/movies/${validId}`)
    expect(res.status).toBe(200)
    const body = res.body
    expect(body.imdbId).toBe(validId)
    expect(typeof body.title).toBe('string')
    expect(typeof body.description).toBe('string')
    expect(typeof body.releaseDate).toBe('string')
    expect(typeof body.budget).toBe('string')
    expect(typeof body.runtime).toBe('number')
    expect(Array.isArray(body.genres)).toBe(true)
    expect(typeof body.originalLanguage === 'string' || body.originalLanguage === null).toBe(true)
    expect(Array.isArray(body.productionCompanies)).toBe(true)
    expect(typeof body.averageRating === 'number' || body.averageRating === null).toBe(true)
  })

  it('returns 404 for unknown imdbId', async () => {
    const res = await request(app).get('/movies/tt0000000')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  it('handles garbage imdbId with special chars', async () => {
    const res = await request(app).get('/movies/!@#$%^&*()')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  it('returns null fields gracefully when data is missing', async () => {
    const partialId = 'tt0111161'
    const res = await request(app).get(`/movies/${partialId}`)
    expect(res.status).toBe(200)
    expect(res.body.description).not.toBeUndefined()
    expect(res.body.originalLanguage).not.toBeUndefined()
    expect(res.body.productionCompanies).toBeDefined()
  })
})

describe('GET /movies with year filtering, sort order, and pagination', () => {
  it('filters movies by year', async () => {
    const res = await request(app).get('/movies?year=1994')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    for (const movie of res.body) {
      expect(movie.releaseDate?.startsWith('1994')).toBe(true)
    }
  })

  it('returns 400 for invalid year format', async () => {
    const res = await request(app).get('/movies?year=20ab')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns 400 for short year', async () => {
    const res = await request(app).get('/movies?year=99')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('returns movies in ascending order by default', async () => {
    const res = await request(app).get('/movies')
    expect(res.status).toBe(200)
    const dates = res.body.map((m: any) => m.releaseDate).filter(Boolean)
    const sorted = [...dates].sort()
    expect(dates).toEqual(sorted)
  })

  it('returns movies in descending order when specified', async () => {
    const res = await request(app).get('/movies?sortOrder=desc')
    expect(res.status).toBe(200)
    const dates = res.body.map((m: any) => m.releaseDate).filter(Boolean)
    const sorted = [...dates].sort().reverse()
    expect(dates).toEqual(sorted)
  })

  it('returns 400 for invalid sortOrder value', async () => {
    const res = await request(app).get('/movies?sortOrder=banana')
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('paginates correctly for filtered results', async () => {
    const page1 = await request(app).get('/movies?year=1994&page=1')
    const page2 = await request(app).get('/movies?year=1994&page=2')
    expect(page1.status).toBe(200)
    expect(page2.status).toBe(200)
    if (page2.body.length > 0) {
      const ids1 = page1.body.map((m: any) => m.imdbId)
      const ids2 = page2.body.map((m: any) => m.imdbId)
      const dupes = ids1.filter((id: any) => ids2.includes(id))
      expect(dupes.length).toBe(0)
    }
  })

  it('returns required columns in correct format', async () => {
    const res = await request(app).get('/movies?year=1994')
    expect(res.status).toBe(200)
    for (const movie of res.body) {
      expect(movie).toEqual(
        expect.objectContaining({
          imdbId: expect.any(String),
          title: expect.any(String),
          genres: expect.any(Array),
          releaseDate: expect.any(String),
          budget: expect.stringMatching(/^\$\d{1,3}(,\d{3})*$/),
        })
      )
    }
  })
})

describe('GET /movies with genre filtering', () => {
  it('filters movies by genre', async () => {
    const res = await request(app).get('/movies?genre=Comedy')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    for (const movie of res.body) {
      expect(movie.genres.some((g: any) => g.name?.toLowerCase().includes('comedy'))).toBe(true)
    }
  })

  it('paginates correctly for genre filtered results', async () => {
    const page1 = await request(app).get('/movies?genre=Comedy&page=1')
    const page2 = await request(app).get('/movies?genre=Comedy&page=2')
    expect(page1.status).toBe(200)
    expect(page2.status).toBe(200)

    if (page2.body.length > 0) {
      const ids1 = page1.body.map((m: any) => m.imdbId)
      const ids2 = page2.body.map((m: any) => m.imdbId)
      const dupes = ids1.filter((id: string) => ids2.includes(id))
      expect(dupes.length).toBe(0)
    }
  })

  it('returns required columns in correct format for genre filter', async () => {
    const res = await request(app).get('/movies?genre=Comedy')
    expect(res.status).toBe(200)
    for (const movie of res.body) {
      expect(movie.imdbId).toEqual(expect.any(String))
      expect(movie.title).toEqual(expect.any(String))
      expect(movie.budget).toEqual(expect.any(String))
      expect(movie.releaseDate === null || typeof movie.releaseDate === 'string').toBe(true)

      expect(Array.isArray(movie.genres)).toBe(true)
      for (const genre of movie.genres) {
        expect(genre).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
          })
        )
      }
    }
  })
})