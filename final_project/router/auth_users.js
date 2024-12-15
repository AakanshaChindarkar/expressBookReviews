const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
let books = require("./booksdb.js");  // Make sure the correct path is provided

// Declare the users array here, or import it from the main file (if declared globally)
let users = [];  // Initialize the users array

const regd_users = express.Router();

// Helper function to check if a username is valid (not already taken)
const isValid = (username) => {
    // Check if the username already exists in the users array
    return !users.find(user => user.username === username);  // Return true if not taken, false otherwise
};

// Check if the user with the given username and password exists
const authenticatedUser = (username, password) => {
    const user = users.find(user => user.username === username && user.password === password);
    return user ? true : false;
};

// Register a new user
regd_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    // Ensure both username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    // Check if the username is already taken
    if (!isValid(username)) {
        return res.status(409).json({ message: "Username already exists!" });
    }

    // Add the new user to the users array
    users.push({ username, password });

    return res.status(200).json({ message: "User successfully registered. Now you can login." });
});

// Login route
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Ensure both username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    // Authenticate the user
    if (authenticatedUser(username, password)) {
        // Generate JWT access token
        const accessToken = jwt.sign({ username }, 'access', { expiresIn: '1h' });

        // Store the token in the session
        req.session.authorization = { accessToken, username };

        return res.status(200).json({ message: "Login successful", accessToken });
    } else {
        return res.status(401).json({ message: "Invalid login credentials." });
    }
});

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.authorization) {
        const token = req.session.authorization.accessToken;
        jwt.verify(token, 'access', (err, user) => {
            if (err) {
                return res.status(403).json({ message: "User not authenticated" });
            }
            req.user = user;  // Attach the user to the request object
            next();
        });
    } else {
        return res.status(403).json({ message: "User not logged in" });
    }
};

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;  // ISBN from the URL parameter
    const review = req.query.review;  // Review from the query string
    const username = req.session.authorization?.username;  // Get username from session

    // Check if the user is logged in
    if (!username) {
        return res.status(401).json({ message: "You must be logged in to post a review." });
    }

    // Check if a review is provided
    if (!review) {
        return res.status(400).json({ message: "Review is required." });
    }

    // Check if the book exists (i.e., the ISBN is valid)
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found." });
    }

    // Initialize reviews if they don't exist for the book
    if (!books[isbn].reviews) {
        books[isbn].reviews = {};
    }

    // Modify or add the review for the current user
    books[isbn].reviews[username] = review;

    return res.status(200).json({
        message: `Review for ISBN ${isbn} has been ${books[isbn].reviews[username] ? 'modified' : 'added'}.`,
        review: books[isbn].reviews[username]
    });
});
// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;  // Get ISBN from URL parameters
    const username = req.session.authorization?.username;  // Get username from session

    // Check if the user is logged in
    if (!username) {
        return res.status(401).json({ message: "You must be logged in to delete a review." });
    }

    // Check if the book exists
    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found." });
    }

    // Check if the user has a review for the book
    if (!books[isbn].reviews || !books[isbn].reviews[username]) {
        return res.status(404).json({ message: "Review not found for this book." });
    }

    // Delete the user's review for the book
    delete books[isbn].reviews[username];

    return res.status(200).json({
        message: `Review for ISBN ${isbn} by ${username} has been deleted.`,
        reviews: books[isbn].reviews  // Return the updated reviews object for the book
    });
});


// Apply the authentication middleware for protected routes
regd_users.use('/auth/*', isAuthenticated);

module.exports.authenticated = regd_users;
module.exports.users = users;  // Export the users array if you need it elsewhere
