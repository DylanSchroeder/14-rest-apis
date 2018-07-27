'use strict';

var app = app || {};

(function (module) {
  const adminView = {};

  adminView.initAdminPage = () => {
    app.showOnly('.admin-view');

    $('#admin-form').on('submit', event => {
      event.preventDefault();
      let token = event.target.passphrase.value;

      // COMMENT: Is the token cleared out of local storage? Do you agree or disagree with this structure?
      $.get(`${app.ENVIRONMENT.apiUrl}/api/v1/admin`, {token})
        .then(res => {
          if(res) {
            localStorage.token = true;
            page('/');
          } else {
            console.error('Invalid Login.');
          }
        })
        .catch(() => page('/'));
    })
  };

  adminView.verify = (ctx, next) => {
    if(!localStorage.token) $('.admin').addClass('admin-only');
    else $('.admin').show();
    next();
  }

  module.adminView = adminView;
})(app)