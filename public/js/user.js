function loadAssociationForm(association) {
  var template = $('#association-form-template').html();
  $(`#association-form-div`).append(template);
  $(`#edit-association-button`).remove();
  $('.ui.search.dropdown').dropdown('set selected', association);
  $('form').form().submit(function(evt) {});
}
function closeAssociationForm() {
  var template = $('#association-edit-button-template').html();
  $('#edit-button-holder').append(template);
  $(`#association-form`).remove();
}