$(document).ready(function() {
  $('#password-form, #confirm-form').on('keyup', function () {
    if (($('#first-name-form').val() != '' && $('#last-name-form').val() != '' && $('#email-form').val() != '' && $('#password-form').val() != '' && $('#confirm-form').val() != '') && ($('#password-form').val() == $('#confirm-form').val())) {
      $('#submit-button').removeClass('disabled');
      $('#confirm-icon').removeClass('open');
    } else {
      $('#submit-button').addClass('disabled');
      $('#confirm-icon').addClass('open');
    }
  });
});