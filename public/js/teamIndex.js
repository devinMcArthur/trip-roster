function loadTeamForm() {
  var template = $('#team-form-template').html();
  $('#team-form-div').append(template);
  $('#team-add-button').remove();
  $('.ui.search.dropdown').dropdown();
  $('form').form().submit(function(evt) {});
}
function closeTeamForm() {
  var template = $('#team-form-button-template').html();
  $('#team-form-button-div').append(template);
  $('#team-form').remove();
}