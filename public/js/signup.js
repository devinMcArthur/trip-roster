$(document).ready(function() {
  $('#password-form, #confirm-form, #first-name-form, #last-name-form, #email-form').on('keyup', function () {
    if (($('#first-name-form').val() != '' && $('#last-name-form').val() != '' && $('#email-form').val() != '' && $('#password-form').val() != '' && $('#confirm-form').val() != '') && ($('#password-form').val() == $('#confirm-form').val())) {
      $('#submit-button').removeClass('disabled');
      $('#confirm-icon').removeClass('open');
    } else {
      $('#submit-button').addClass('disabled');
      $('#confirm-icon').addClass('open');
    }
  });
});