import express from 'express'
import movieRoutes from './routes/movies'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use('/movies', movieRoutes)

app.get('/', (req, res) => {
  res.send('Movie API is running.')
})

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})