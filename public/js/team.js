$(document).ready(function () {
  $('.edit-form').hide();
  // var member = [
  // {"name": 'Maple Leafs Player'}, 
  // {"name": 'devin'}];
  // $('.ui.search')
  //   .search({
  //     apiSettings: {
  //       url: '//api.github.com/search/repositories?q={query}'
  //     },
  //     fields: {
  //       results : 'items',
  //       title   : 'name',
  //       url     : 'html_url'
  //     },
  //     minCharacters : 3
  //   })
  // ;
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
  $('.ui.search.dropdown').dropdown();
  $('form').form().submit(function(evt) {});
}

function closeTripForm() {
  var template = $('#trip-form-button-template').html();
  $('#trip-form-button-holder').append(template);
  $('#trip-form').remove();
}

function loadTripEditForm(id, destination, date) {
  var template = $('#trip-edit-form-template').html();
  var html = Mustache.render(template, {id, destination, date});
  $(`#trip-${id}-edit-form-div`).append(html);
  $(`#trip-${id}-edit-form-button`).remove();
  $('form').form().submit(function(evt) {});
}

function closeTripEditForm() {
  var template = $('#trip-form-button-template').html();
  $('#trip-form-button-holder').append(template);
  $('#trip-form').remove();
}

function tripDeleteForm (id) {
  $.ajax({
    type: 'DELETE',
    url: `/trip/${id}`,
    success: function () {
      location.reload();
    }
  })
}

function loadMemberForm(members) {
  var template = $('#member-form-template').html();
  $('#member-form-div').append(template);
  $('#member-button').remove();
  $('.ui.search.dropdown').dropdown();
  $('form').form().submit(function(evt) {});
  $('.ui.checkbox').checkbox();
  // $('.ui.search').search({
  //   source: member,
  //   fullTextSearch : true
  // });
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

function memberDeleteForm(teamId, memberId) {
  $.ajax({
    type: 'DELETE',
    url: `/team/${teamId}/member/${memberId}`,
    success: function () {
      location.reload();
    }
  });
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

function loadBusForm () {
  var template = $('#bus-form-template').html();
  $('#bus-form-div').append(template);
  $('#bus-form-button').remove();
  $('form').form().submit(function(evt) {});
}

function closeBusForm () {
  var template = $('#bus-form-button-template').html();
  $('#bus-form-button-holder').append(template);
  $('#bus-form').remove();
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
  $(`#bus-${companyId}-edit-form`).remove();
}

function companyDeleteForm (id, company) {
  $.ajax({
    type: 'DELETE',
    url: `/team/${id}/company/${encodeURI(company)}`,
    success: function () {
      location.reload();
    }
  })
}

function loadAccountForm () {
  var template = $('#account-form-template').html();
  $('#account-form-div').append(template);
  $('#account-form-button').remove();
  $('form').form().submit(function(evt) {});
  $('#password-form, #confirm-form, #email-form').on('keyup', function () {
    if (($('#email-form').val() != '' && $('#password-form').val() != '' && $('#confirm-form').val() != '') && ($('#password-form').val() == $('#confirm-form').val())) {
      $('#submit-button').removeClass('disabled');
      $('#confirm-icon').removeClass('open');
    } else {
      $('#submit-button').addClass('disabled');
      $('#confirm-icon').addClass('open');
    }
  });
}

function closeAccountForm () {
  var template = $('#account-form-button-template').html();
  $('#account-form-button-holder').append(template);
  $('#account-form').remove();
}

function loadAccountEditForm () {
  var template = $('#account-edit-form-template').html();
  $('#account-edit-form-div').append(template);
  $('#account-edit-form-button').remove();
  $('form').form().submit(function(evt) {});
  $('#password-form, #confirm-form, #email-form').on('keyup', function () {
    if (($('#email-form').val() != '') && ($('#password-form').val() == $('#confirm-form').val())) {
      $('#submit-button').removeClass('disabled');
      $('#confirm-icon').removeClass('open');
    } else {
      $('#submit-button').addClass('disabled');
      $('#confirm-icon').addClass('open');
    }
  });
}

function closeAccountEditForm () {
  var template = $('#account-edit-form-button-template').html();
  $('#account-form-button-holder').append(template);
  $('#account-edit-form').remove();
}