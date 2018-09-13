function loadBusForm () {
  var template = $('#bus-form-template').html();
  $('#bus-form-div').append(template);
  $('#bus-form-button').remove();
  $('form').form().submit(function(evt) {});
}

function closeBusForm () {
  var template = $('#bus-form-button-template').html();
  $('#bus-form-button-holder').append(template);
  $('$bus-form').remove();
}

function loadBusEditForm (company, companyId) {
  var template = $('#bus-edit-form-template').html();
  var html = Mustache.render(template, {company});
  $(`#${companyId}-edit-div`).append(html);
  $(`#${companyId}-edit-form-button`).remove();
  $('form').form().submit(function(evt) {});
}

function closeBusEditForm(companyId) {
  var template = $('#bus-edit-form-button-template').html();
  $(`#bus-${companyId}-edit-form-button-holder`).append(template);
  $(`$bus-${companyId}-edit-form`).remove();
}

function companyDeleteForm (id, company) {
  $.ajax({
    type: 'DELETE',
    url: `/association/${id}/company/${encodeURI(company)}`,
    success: function () {
      location.reload();
    }
  })
}

function loadDirectorForm(directors) {
  directors = directors.split(',');
  var template = $('#director-form-template').html();
  $(`#director-form-div`).append(template);
  $(`#edit-director-button`).remove();
  $('.ui.search.dropdown').dropdown('set selected', directors);
  $('form').form().submit(function(evt) {});
}
function closeDirectorForm() {
  var template = $('#director-edit-button-template').html();
  $('#edit-button-holder').append(template);
  $(`#director-form`).remove();
}

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

function deleteTeam(id) {
  $.ajax({
    type: 'DELETE',
    url: `/team/${id}/`,
    success: function () {
      location.reload();
    }
  });
}