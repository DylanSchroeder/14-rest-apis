'use strict';
var app = app || {};

(function(module) {
  $('.icon-menu').on('click', () => {
    $('.nav-menu').slideToggle(350);
  })

  const bookView = {};

  bookView.initIndexPage = (ctx, next) => {
    $('#book-list').empty();
    app.showOnly('.book-view');
    module.Book.all.forEach(book => $('#book-list').append(book.toHtml()));
    next();
  }

  bookView.initDetailPage = function (ctx, next) {
    $('.book-detail').empty();
    app.showOnly('.detail-view');
    
    $('.book-detail').append(app.render('book-detail-template', ctx.book));

    $('#update-btn').on('click', function() {
      page(`/books/${$(this).data('id')}/update`);
    });

    $('#delete-btn').on('click', function() {
      module.Book.destroy($(this).data('id'));
    });
    next();
  }

  bookView.initCreateFormPage = () => {
    app.showOnly('.create-view');
    
    $('#create-form').on('submit', (event) => {
      event.preventDefault();

      let book = {
        title: event.target.title.value,
        author: event.target.author.value,
        isbn: event.target.isbn.value,
        image_url: event.target.image_url.value,
        description: event.target.description.value,
      };

      module.Book.create(book);
    })
  }

  bookView.initUpdateFormPage = function(ctx) {
    app.showOnly('.update-view');
    
    $('#update-form input[name="title"]').val(ctx.book.title);
    $('#update-form input[name="author"]').val(ctx.book.author);
    $('#update-form input[name="isbn"]').val(ctx.book.isbn);
    $('#update-form input[name="image_url"]').val(ctx.book.image_url);
    $('#update-form textarea[name="description"]').val(ctx.book.description);

    $('#update-form').on('submit', function(event) {
      event.preventDefault();

      let book = {
        book_id: ctx.book.book_id,
        title: event.target.title.value,
        author: event.target.author.value,
        isbn: event.target.isbn.value,
        image_url: event.target.image_url.value,
        description: event.target.description.value,
      };

      module.Book.update(book, book.book_id);
    })
  };

// COMMENT: What is the purpose of this method?
// RESPONSE: Shows the search results view. Maps over the book.all array and appends the books from the search with the toHtml method 
  bookView.initSearchFormPage = () => {
    app.showOnly('.search-view');
  }

  $('#search-form').on('submit', function(event) {
    // COMMENT: What default behavior is being prevented here?
    // RESPONSE: It is preventing the submit from happening on the search-form when it is loaded.
    event.preventDefault();

    // COMMENT: What is the event.target, below? What will happen if the user does not provide the information needed for the title, author, or isbn properties?
   // RESPONSE: The submit on the search form. It will just use the fields you did enter a value to search and the rest will just be left as empty strings.
    let book = {
      title: event.target.title.value || '',
      author: event.target.author.value || '',
      isbn: event.target.isbn.value || '',
    };

    module.Book.find(book, bookView.initSearchResultsPage);

    // COMMENT: Why are these values set to an empty string?
    // RESPONSE: So that if nothing is entered on those fields in the search it will just use these empty strings as the input.
    event.target.title.value = '';
    event.target.author.value = '';
    event.target.isbn.value = '';
  })

  // COMMENT: What is the purpose of this method?
  // RESPONSE: It loads the results page and says to only show the search results and hide the search list.
  bookView.initSearchResultsPage = () => {
    app.showOnly('.search-results');
    $('#search-list').empty();

    // COMMENT: Explain how the .forEach() method is being used below.
    // It is appending a new book to the seach-list based for every book that fits the search results and adding a button and event listener to see details for each of those books.
    module.Book.all.forEach(book => $('#search-list').append(book.toHtml()));
    $('.detail-button a').text('Add to list').attr('href', '/');
    $('.detail-button').on('click', () => {
      // COMMENT: Explain the following line of code.
      module.Book.findOne($(this).parent().parent().parent().data('bookid'))
    });
  }

  module.bookView = bookView;
})(app)

