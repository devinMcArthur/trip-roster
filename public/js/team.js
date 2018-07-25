$(document).ready(function () {
  $('.edit-form').hide();
})


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
  $('.ui.search.dropdown'+ `#member-${id}`).dropdown('set selected', rels);
  $('form').form().submit(function(evt) {});
  $('.ui.checkbox').checkbox();
  $(`#member-${id}-edit-div`).show();
}

function closeMemberEditForm(id) {
  var template = $('#member-edit-button').html();
  var html = Mustache.render(template, {id})
  $(`#member-${id}-edit-button-holder`).append(html);
  $(`#member-${id}-edit-div`).hide();
}