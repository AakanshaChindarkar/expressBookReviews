const express = require('express');
let users = []; // This will hold registered users.
const public_users = express.Router();
const axios = require('axios'); // Import axios to make HTTP requests
let books = require("./booksdb.js"); // Assuming you have a booksdb.js file containing your books data


// Function to simulate fetching books asynchronously using a Promise
const fetchBooks = () => {
    return new Promise((resolve, reject) => {
        // Simulate a delay (e.g., fetching data from an API or database)
        setTimeout(() => {
            // Check if the books object exists
            if (books) {
                resolve(books); // Resolve the promise with the books data
            } else {
                reject("Books not found"); // Reject the promise if the books data is unavailable
            }
        }, 1000); // Simulate a 1-second delay
    });
};


// Get the book list available in the shop using the fetchBooks function
public_users.get('/', (req, res) => {
    fetchBooks()
        .then((booksData) => {
            // If the promise resolves successfully, send the books data as a JSON response
            return res.json(booksData);
        })
        .catch((error) => {
            // If the promise is rejected, send the error message
            return res.status(500).json({ message: error });
        });
});


// Check if user already exists
const doesExist = (username) => {
    return users.some(user => user.username === username); // Check if username is taken
}

// Register a new user
public_users.post("/register", (req, res) => {
    const { username, password } = req.body; // Extract the username and password from the request body

    // Ensure both username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    // Check if the username is already taken
    if (doesExist(username)) {
        return res.status(400).json({ message: "User already exists!" });
    }

    // Register the new user
    users.push({ username, password });
    return res.status(200).json({ message: "User successfully registered. Now you can login." });
});



// Function to fetch a book by ISBN
const fetchBookByIsbn = (isbn) => {
    return new Promise((resolve, reject) => {
        const book = books[isbn];  // Try to get the book by ISBN from the local data
        if (book) {
            resolve(book);  // Resolve with the book details
        } else {
            reject("Book not found");  // Reject if the book is not found
        }
    });
};
// Route to get book details by ISBN
public_users.get('/isbn/:isbn', (req, res) => {
    const isbn = req.params.isbn;  // Retrieve the ISBN from the URL parameters
    fetchBookByIsbn(isbn)
        .then((bookData) => {
            return res.json(bookData);  // Return the book data as JSON
        })
        .catch((error) => {
            return res.status(404).json({ message: error });  // Return error if book not found
        });
});
// Route to get books by a specific author
public_users.get('/author/:author', (req, res) => {
    const authorName = req.params.author.toLowerCase(); // Normalize author name to lower case
    fetchBooks()
        .then((booksData) => {
            const matchingBooks = Object.values(booksData).filter(book => 
                book.author.toLowerCase() === authorName  // Match the author
            );
            if (matchingBooks.length > 0) {
                return res.json(matchingBooks);  // Return matching books as JSON
            } else {
                return res.status(404).json({ message: 'No books found by this author' });
            }
        })
        .catch((error) => {
            return res.status(500).json({ message: error });
        });
});

// Route to get books by a specific title
public_users.get('/title/:title', (req, res) => {
    const bookTitle = req.params.title.toLowerCase(); // Normalize title to lower case
    fetchBooks()
        .then((booksData) => {
            const matchingBooks = Object.values(booksData).filter(book => 
                book.title.toLowerCase() === bookTitle  // Match the title
            );
            if (matchingBooks.length > 0) {
                return res.json(matchingBooks);  // Return matching books as JSON
            } else {
                return res.status(404).json({ message: 'No books found by this title' });
            }
        })
        .catch((error) => {
            return res.status(500).json({ message: error });
        });
});

// Export the public routes to be used in index.js
module.exports.general = public_users;
