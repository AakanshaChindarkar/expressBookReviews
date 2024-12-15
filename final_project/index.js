const express = require('express');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

// Body parser middleware to handle JSON requests
app.use(express.json());

// Session middleware (This must be above the route definitions)
app.use("/customer", session({ 
  secret: "fingerprint_customer", 
  resave: true, 
  saveUninitialized: true 
}));

// Route for customer actions (login, register, etc.)
app.use("/customer", customer_routes);
app.use("/", genl_routes);  // General routes for books, etc.

const PORT = 7000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
