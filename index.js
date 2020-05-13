const express = require("express");
const morgan = require("morgan");
const morganBody = require("morgan-body");
const cors = require("cors");
const app = express();
const baseUrl = "/api";

let persons = [
  {
    name: "Arto Hellas",
    number: "040-123456",
    id: 1,
  },
  {
    name: "Ada Lovelace",
    number: "39-44-5323523",
    id: 2,
  },
  {
    name: "Dan Abramov",
    number: "12-43-234345",
    id: 3,
  },
  {
    name: "Mary Poppendieck",
    number: "39-23-6423122",
    id: 4,
  },
  {
    name: "Anton Abramov",
    number: "39-23-6423122",
    id: 5,
  },
];

const generateId = (min) => {
  return Math.random() * (10000 - min) + min;
};

const isNameUnique = (name, persons) => {
  const query = persons.find((person) => person.name === name);
  return query ? false : true;
};

app.use(express.json());
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :res[body]",
    {
      skip: function (req, res) {
        return req.method !== "POST";
      },
    }
  )
);
app.use(cors())
morganBody(app, { noColors: true });

app.get("/api", (req, res) => {
  res.json({ message: "KEK" });
});

app.get(`${baseUrl}/persons`, (req, res) => {
  res.json(persons);
});

app.get(`${baseUrl}/info`, (req, res) => {
  const phonebook = `<p>Phonebook has info for ${persons.length} people</p>`;
  const timestamp = `<p>${new Date()}</p>`;
  const html = `<div>${phonebook} ${timestamp}</div>`;
  res.status(200).send(html);
});

app.get(`${baseUrl}/persons/:id`, (req, res) => {
  const id = Number(req.params.id);
  const person = persons.find((person) => person.id === id);
  if (person) {
    res.json(person);
  } else {
    res.status(404).end();
  }
});

app.delete(`${baseUrl}/persons/:id`, (req, res) => {
  const id = Number(req.params.id);
  persons = persons.filter((person) => person.id !== id);

  res.status(204).end();
});

app.post(`${baseUrl}/persons`, (req, res) => {
  const id = generateId(persons.length);
  const body = req.body;

  if (!body.name || !body.number) {
    return res.status(400).json({
      error: "name and number are required",
    });
  }

  const person = {
    name: body.name,
    number: body.number,
    id: id,
  };

  if (!isNameUnique(person.name, persons)) {
    return res.status(403).json({ error: "name must be unique" });
  }

  persons = [...persons, person];

  res.json(person);
});

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
