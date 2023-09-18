const sendResponse = (res, statusCode, message, result = null) => {
  const response = {};
  if (statusCode >= 400) {
    response.success = false;
    response.message = message;
    response.error = result;
  } else {
    response.success = true;
    response.message = message;
    response.data = result;
  }

  res.status(statusCode).send(response);
};

const discountQuery = (bookIds, authorIds) => {
  const query = {
    $and: [
      { validFrom: { $lte: new Date() } },
      { validTo: { $gte: new Date() } },
    ],
    $or: [
      { books: { $in: bookIds } },
      { authors: { $in: authorIds } },
    ],
  };

  return query;
}

const countBookDiscount = (books, discounts) => {
  const booksWithDiscounts = books.map((book) => {
    const discount = discounts.find((discount) => {
      return (
        discount.books.includes(book._id) ||
        discount.authors.includes(book.author._id)
      );
    });

    if (discount) {
      if (discount.discountPercentage) {
        const discountPrice = (book.price / 100) * discount.discountPercentage;
        return { ...book.toObject(), discountPrice: book.price - discountPrice };
      } else if (discount.discountAmount) {
        return { ...book.toObject(), discountPrice: book.price - discount.discountAmount };
      }
    } else {
      return book;
    }
  });

  return booksWithDiscounts;
}

module.exports = { sendResponse, discountQuery, countBookDiscount };
