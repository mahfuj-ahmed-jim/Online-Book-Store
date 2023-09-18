const authRoutes = require("./routes/auth_routes.js");
const authorRoutes = require("./routes/author_routes.js");
const bookRoutes = require("./routes/book_routes.js");
const cartRoutes = require("./routes/cart_routes.js");
const discountRoutes = require("./routes/discount_routes.js");
const transactionRoutes = require("./routes/transaction_routes.js");
const userRoutes = require("./routes/user_routes.js");
const { databaseConnection } = require("./config/database.js");
const { sendResponse } = require("./utils/common.js");
const express = require("express");
const cors = require("cors");

const PORT = 8000;
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/author", authorRoutes);
app.use("/book", bookRoutes);
app.use("/cart", cartRoutes);
app.use("/discount", discountRoutes);
app.use("/transaction", transactionRoutes);
app.use("/user", userRoutes); 

app.use((req, res) => {
  return sendResponse(res, 404, "Not Found", "Request Not Found");
});

databaseConnection(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
