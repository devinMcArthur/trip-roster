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