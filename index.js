/* eslint-disable no-undef */
const express = require("express")
const morgan = require("morgan")
const morganBody = require("morgan-body")
const mongoose = require("mongoose")
const cors = require("cors")
const app = express()
const baseUrl = "/api"
require("dotenv").config()

const Person = require("./models/person")
const persons = []

const url = process.env.MONGODB_URI
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("connected to MongoDB")
  })
  .catch((error) => {
    console.log("error in connect", error)
  })

const isNameUnique = (name, persons) => {
  const query = persons.find((person) => person.name === name)
  return query ? false : true
}

app.use(express.json())
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :res[body]",
    {
      skip: function (req) {
        return req.method !== "POST"
      },
    }
  )
)
app.use(cors())
app.use(express.static("build"))
morganBody(app, { noColors: true })

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" })
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

app.get("/", (req, res) => {
  const welcome = "<h1>Welcome, available routes: </h1>"
  const list = `<ul>
    <pre>GET /api/persons</pre>
    <pre>GET /api/persons/:id</pre>
    <pre>POST /api/persons</pre>
    <pre>DELETE /api/persons/:id</pre>
  </ul>`
  res.send(`${welcome} ${list}`)
})

app.get(`${baseUrl}/persons`, (req, res, next) => {
  Person.find({})
    .then((notes) => {
      res.json(notes.map((note) => note.toJSON()))
    })
    .catch((error) => next(error))
})

app.get(`${baseUrl}/info`, (req, res) => {
  const phonebook = `<p>Phonebook has info for ${persons.length} people</p>`
  const timestamp = `<p>${new Date()}</p>`
  const html = `<div>${phonebook} ${timestamp}</div>`
  res.status(200).send(html)
})

app.get(`${baseUrl}/persons/:id`, (req, res, next) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person.toJSON())
      } else {
        res.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.delete(`${baseUrl}/persons/:id`, (req, res, next) => {
  const id = req.params.id
  Person.findByIdAndRemove(id)
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => next(error))
})

app.post(`${baseUrl}/persons`, (req, res, next) => {
  const body = req.body
  if (!body.name || !body.number) {
    return res.status(400).json({
      error: "name and number are required",
    })
  }

  const person = new Person({
    name: req.body.name,
    number: req.body.number,
  })

  if (!isNameUnique(person.name, persons)) {
    return res.status(403).json({ error: "name must be unique" })
  }

  person
    .save()
    .then((savedPerson) => {
      console.log(
        `added ${savedPerson.name} number ${savedPerson.number} to phonebook`
      )
      return savedPerson.toJSON()
    })
    .then((formattedPerson) => {
      res.json(formattedPerson)
    })
    .catch((error) => next(error))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
