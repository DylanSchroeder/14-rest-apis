'use strict'

// Application dependencies
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT;
const TOKEN = process.env.TOKEN;

// COMMENT: Explain the following line of code. What is the API_KEY? Where did it come from?
// RESPONSE: It is the global variable for the google api key which gives you access to the google book api that is used throughout the app. It comes from the 
const API_KEY = process.env.GOOGLE_API_KEY;

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// Application Middleware
app.use(cors());

// API Endpoints
app.get('/api/v1/admin', (req, res) => {
  console.log({ TOKEN, query: req.query });
  res.send(TOKEN === req.query.token);
});

app.get('/api/v1/books/find', (req, res) => {
  let url = 'https://www.googleapis.com/books/v1/volumes';

  // COMMENT: Explain the following four lines of code. How is the query built out? What information will be used to create the query?
  let query = ''
  if(req.query.title) query += `+intitle:${req.query.title}`;
  if(req.query.author) query += `+inauthor:${req.query.author}`;
  if(req.query.isbn) query += `+isbn:${req.query.isbn}`;

  console.log({ query });

  // COMMENT: What is superagent? How is it being used here? What other libraries are available that could be used for the same purpose?
  // RESPONSE: It's an ajax api that is used to simplify http requests. AXIOS and Got are two others I found.
  superagent.get(url)
    .query({'q': query})
    .query({'key': API_KEY})
    .then(response => {
      console.log(response.body);

      return response.body.items.map((book, idx) => {

        // COMMENT: The line below is an example of destructuring. Explain destructuring in your own words.
        // RESPONSE: It lets you take multiple values or properties and turn them into one variable.
        let { title, authors, industryIdentifiers, imageLinks, description } = book.volumeInfo;

        // COMMENT: What is the purpose of the following placeholder image?
        //RESPONSE: It's a placeholder that tells the user that something went wrong loading the page they were looking for.
        let placeholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';

        // COMMENT: Explain how ternary operators are being used below.
        // RESONSE: They are basically just simplifying the code so you don't have to do a bunch of if else statements.
        return {
          title: title || 'No title available',
          author: authors ? authors[0] : 'No authors available',
          isbn: industryIdentifiers ? `ISBN_13 ${industryIdentifiers[0].identifier}` : 'No ISBN available',
          image_url: imageLinks ? imageLinks.smallThumbnail : placeholderImage,
          description: description ? description : 'No description available',
          book_id: industryIdentifiers ? `${industryIdentifiers[0].identifier}` : '',
        }
      })
    })
    .then(arr => res.send(arr))
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    });
})

// COMMENT: How does this route differ from the route above? What does ':isbn' refer to in the code below?
// RESPONSE: It is finding books based only on the isbn number.
app.get('/api/v1/books/find/:isbn', (req, res) => {
  let url = 'https://www.googleapis.com/books/v1/volumes';
  superagent.get(url)
    .query({ 'q': `+isbn:${req.params.isbn}`})
    .query({ 'key': API_KEY })
    .then(response => response.body.items.map((book, idx) => {
      let { title, authors, industryIdentifiers, imageLinks, description } = book.volumeInfo;
      let placeholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';

      return {
        title: title ? title : 'No title available',
        author: authors ? authors[0] : 'No authors available',
        isbn: industryIdentifiers ? `ISBN_13 ${industryIdentifiers[0].identifier}` : 'No ISBN available',
        image_url: imageLinks ? imageLinks.smallThumbnail : placeholderImage,
        description: description ? description : 'No description available',
      }
    }))
    .then(book => res.send(book[0]))
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    });
})



app.get('/api/v1/books', (req, res) => {
  let SQL = 'SELECT book_id, title, author, image_url, isbn FROM books;';
  client.query(SQL)
    .then(results => res.send(results.rows))
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    });
});


app.get('/api/v1/books/:id', (req, res) => {
  let SQL = 'SELECT * FROM books WHERE book_id=$1';
  let values = [req.params.id];
  
  client.query(SQL, values)
    .then(results => res.send(results.rows))
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    });
});

app.post('/api/v1/books', express.urlencoded(), (req, res) => {
  let {title, author, isbn, image_url, description} = req.body;
  
  let SQL = 'INSERT INTO books(title, author, isbn, image_url, description) VALUES($1, $2, $3, $4, $5);';
  let values = [title, author, isbn, image_url, description];
  
  client.query(SQL, values)
    .then(() => res.sendStatus(201))
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    });
});

app.put('/api/v1/books/:id', express.urlencoded(), (req, res) => {
  let {title, author, isbn, image_url, description} = req.body;
  
  let SQL = 'UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5 WHERE book_id=$6;';
  let values = [title, author, isbn, image_url, description, req.params.id];
  
  client.query(SQL, values)
    .then(() => res.sendStatus(204))
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    });
})

app.delete('/api/v1/books/:id', (req, res) => {
  let SQL = 'DELETE FROM books WHERE book_id=$1;';
  let values = [req.params.id];
  
  client.query(SQL, values)
    .then(() => res.sendStatus(204))
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    });
});

app.get('*', (req, res) => res.status(403).send('This route does not exist'));

loadDB();
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));






  


function loadDB() {
  client.query(`
    CREATE TABLE IF NOT EXISTS books (
      book_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      isbn VARCHAR(255) NOT NULL,
      "image_url" VARCHAR (400),
      description VARCHAR(1000) NOT NULL)`)
    .catch(err => {
      console.error(err);
    });
};