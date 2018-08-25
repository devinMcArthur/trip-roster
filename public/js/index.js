function loadTripForm(id) {
  var template = $('#trip-form-template').html();
  var html = Mustache.render(template, {teamId: id});
  $('#trip-form-div-'+id).append(html);
  $('#trip-form-button-'+id).html('Close Form');
  $('#trip-form-button-'+id).attr('onclick', "closeTripForm('"+id+"');");
  $('.ui.search.dropdown').dropdown();
  $('form').form().submit(function(evt) {});
}

function closeTripForm(id) {
  $('#trip-form-button-'+id).html('Start Trip');
  $('#trip-form-button-'+id).attr('onclick', "loadTripForm('"+id+"');");
  $('#trip-form-'+id).remove();
}