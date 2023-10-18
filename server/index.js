const logger = require('morgan')
const express = require('express')

const port = process.env.port ?? 3000

const app = express()
app.use(logger('dev'))

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})