process.env.NODE_ENV = "test"

const request = require("supertest");


const app = require("../app");
const db = require("../db");


let book_isbn;


beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '1234567891',
        'https://amazon.com/potato_pie',
        'Peter Haverford',
        'English',
        500,
        'Best Publishing Co',
        'The Principles of Bookery', 2009)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn
});

describe("Tests for GET requests  to /books routes", () =>{
    test("Should get all books", async () =>{
        const resp = await request(app).get(`/books`);
        const books = resp.body.books;
        expect(books.length).toBe(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0].author).toEqual("Peter Haverford");
    });

    test("Should get an individual book", async ()=>{
        const resp = await request(app)
        .get(`/books/${book_isbn}`);
        expect(resp.body.book).toHaveProperty("isbn");
        expect(resp.body.book.isbn).toBe(book_isbn);
    });

    test("Should give 404 error for nonexistent book", async () =>{
        const resp = await request(app)
        .get(`/books/75`);
        expect(resp.statusCode).toBe(404);
    });
});

describe("Tests for POST requests to /books routes", () =>{
    test("Should create a book", async()=>{
      const data = {
          isbn: '8675309',
          amazon_url: "https://lilypad.com",
          author: "Cyril Figis",
          language: "english",
          pages: 250,
          publisher: "Lumpy Biscuit Publishing",
          title: "Accountant Heroics",
          year: 2010
      };
        const resp = await request(app)
        .post("/books").send(data);
        expect(resp.statusCode).toBe(201);
        expect(resp.body.book).toHaveProperty("amazon_url");
    });

    test("Prevents book creation without all requirements", async () => {
      const resp = await request(app)
          .post(`/books`)
          .send({pages: 650});
      expect(resp.statusCode).toBe(400);
    });

    test("Should update a book", async ()=>{
      const resp = await request(app)
        .put(`/books/${book_isbn}`)
        .send({
          amazon_url: "https://froggy.com",
          author: "Lana",
          language: "English",
          pages: 50,
          publisher: "Self",
          title: "Awesomesauce",
          year: 2020
        });
        expect(resp.body.book.title).toBe("Awesomesauce");
    });
});

describe("DELETE /books/:id", function () {
  test("Deletes a single a book", async function () {
    const response = await request(app)
        .delete(`/books/${book_isbn}`)
    expect(response.body).toEqual({message: "Book deleted"});
  });
});

afterEach(async  () =>{
    await db.query("DELETE FROM BOOKS");
  });
  
  
  afterAll(async () => {
    await db.end()
  });