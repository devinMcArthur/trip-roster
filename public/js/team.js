$(document).ready(function () {
  $('.edit-form').hide();
});

function loadManagerForm(managers) {
  managers = managers.split(',');
  var template = $('#manager-form-template').html();
  $('#manager-form-div').append(template);
  $('#edit-button').remove();
  $('.ui.search.dropdown').dropdown('set selected', managers);
  $('form').form().submit(function(evt) {});
}

function closeManagerForm() {
  var template = $('#manager-edit-button-template').html();
  $('#edit-button-holder').append(template);
  $('#manager-form').remove();
}

function loadTripForm() {
  var template = $('#trip-form-template').html();
  $('#trip-form-div').append(template);
  $('#trip-form-button').remove();
  $('form').form().submit(function(evt) {});
}

function closeTripForm() {
  var template = $('#trip-form-button-template').html();
  $('#trip-form-button-holder').append(template);
  $('#trip-form').remove();
}

function loadMemberForm() {
  var template = $('#member-form-template').html();
  $('#member-form-div').append(template);
  $('#member-button').remove();
  $('.ui.search.dropdown').dropdown();
  $('form').form().submit(function(evt) {});
  $('.ui.checkbox').checkbox();
}

function closeMemberForm() {
  var template = $('#member-button-template').html();
  $('#member-button-holder').append(template);
  $('#member-form').remove();
}

function loadMemberEditForm(id, rels) {
  rels = rels.split(',');
  $(`#member-${id}-edit-button`).remove();
  $('form').form().submit(function(evt) {});
  $(`#member-${id}`+'.ui.search.dropdown').dropdown('set selected', rels);
  $(`#member-${id}`+'.ui.search.dropdown').dropdown('bind mouse events');
  $('.ui.checkbox').checkbox();
  $(`#member-${id}-edit-div`).show();
}

function closeMemberEditForm(id) {
  var template = $('#member-edit-button').html();
  var html = Mustache.render(template, {id})
  $(`#member-${id}-edit-button-holder`).append(html);
  $(`#member-${id}-edit-div`).hide();
}

function loadAssociationForm(association, team) {
  var template = $('#association-form-template').html();
  var html = Mustache.render(template, {team});
  $(`#association-form-div-${team}`).append(html);
  $(`#edit-button-${team}`).remove();
  $('.ui.search.dropdown').dropdown('set selected', association);
  $('form').form().submit(function(evt) {});
}
function closeAssociationForm(team) {
  var template = $('#association-edit-button-template').html();
  var html = Mustache.render(template, {team});
  $('#edit-button-holder').append(html);
  $(`#association-form-${team}`).remove();
}