function loadAssociationForm() {
  var template = $('#association-form-template').html();
  $('#association-form-div').append(template);
  $('#association-add-button').remove();
  $('.ui.search.dropdown').dropdown();
  $('form').form().submit(function(evt) {});
}
function closeAssociationForm() {
  var template = $('#association-form-button-template').html();
  $('#association-form-button-div').append(template);
  $('#association-form').remove();
}

function loadDirectorForm(directors, association) {
  directors = directors.split(',');
  var template = $('#director-form-template').html();
  var html = Mustache.render(template, {association});
  $(`#director-form-div-${association}`).append(html);
  $(`#edit-button-${association}`).remove();
  $('.ui.search.dropdown').dropdown('set selected', directors);
  $('form').form().submit(function(evt) {});
}
function closeDirectorForm(association) {
  var template = $('#director-edit-button-template').html();
  var html = Mustache.render(template, {association});
  $('#edit-button-holder').append(html);
  $(`#director-form-${association}`).remove();
}