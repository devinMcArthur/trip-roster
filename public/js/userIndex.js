function loadAssociationForm(association, user) {
  var template = $('#association-form-template').html();
  var html = Mustache.render(template, {user});
  $(`#association-form-div-${user}`).append(html);
  $(`#edit-button-${user}`).remove();
  $('.ui.search.dropdown').dropdown('set selected', association);
  $('form').form().submit(function(evt) {});
}
function closeAssociationForm(user) {
  var template = $('#association-edit-button-template').html();
  var html = Mustache.render(template, {user});
  $('#edit-button-holder').append(html);
  $(`#association-form-${user}`).remove();
}

function adminToggle(id, status) {
  $.ajax({
    contentType: 'application/json',
    dataType: 'json',
    type: 'POST',
    url: `/user/${id}/update`,
    data: JSON.stringify({admin: status}),
    success: function() {
      location.reload();
    }
  });
}