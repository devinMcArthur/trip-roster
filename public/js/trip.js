$(document).ready(function () {
  $('#time-manager').hide();
  if (location.hash.indexOf('toggle-time') !== -1) {
    showManager();
  }
  $('.toggleMember').on('change', function (e) {
    e.preventDefault();
    var tripId = $(this).siblings('.id').val();
    var memberId = $(this).val();
    if ($(this).is(':checked')) {
      $.ajax({
        type: 'POST',
        url: `/trip/${tripId}/member/${memberId}`
      });
    } else {
      $.ajax({
        type: 'DELETE',
        url: `/trip/${tripId}/member/${memberId}`
      });
    }
  });
  $('#departHome').on('click', function (e) {
    $(this).addClass('disabled');
    $('#arriveDestination').removeClass("disabled");
    var tripId = $(this).val();
    $.ajax({
      type: 'POST',
      url: `/trip/${tripId}/time`,
      data: {
        type: "homeDepartTime"
      },
      success: function () {
        location.reload();
      }
    })
  });
  $('#arriveDestination').on('click', function (e) {
    $(this).addClass('disabled');
    $('#departDestination').removeClass("disabled");
    var tripId = $(this).val();
    $.ajax({
      type: 'POST',
      url: `/trip/${tripId}/time`,
      data: {
        type: "destinationArrivalTime"
      },
      success: function () {
        location.reload();
      }
    })
  });
  $('#departDestination').on('click', function (e) {
    $(this).addClass('disabled');
    $('#arriveHome').removeClass("disabled");
    var tripId = $(this).val();
    $.ajax({
      type: 'POST',
      url: `/trip/${tripId}/time`,
      data: {
        type: "destinationDepartTime"
      },
      success: function () {
        location.reload();
      }
    })
  });
  $('#arriveHome').on('click', function (e) {
    $(this).addClass('disabled');
    var tripId = $(this).val();
    $.ajax({
      type: 'POST',
      url: `/trip/${tripId}/time`,
      data: {
        type: "homeArrivalTime"
      },
      success: function () {
        location.reload();
      }
    });
  });
  if ($('#homeDepartTime').is(":visible")) {
    $('#departHome').addClass('disabled');
    if ($('#destinationArrivalTime').is(":visible")) {
      $('#arriveDestination').addClass('disabled');
      if($('#destinationDepartTime').is(":visible")) {
        $('#departDestination').addClass('disabled');
        if($('#homeArrivalTime').is(":visible")) {
          $('#arriveHome').addClass('disabled');
        } else {
          $('#arriveHome').removeClass('disabled');
        }
      } else {
        $('#departDestination').removeClass('disabled');
      }
    } else {
      $('#arriveDestination').removeClass('disabled')
    }
  }
});

function showManager() {
  $('#time-manager-closed').hide();
  $('#time-manager').show();
  $('#time-manager-toggle').attr('onclick', 'hideManager()');
  $('#time-manager-toggle').html('close');
  $('#departHomeMobile').on('click', function (e) {
    $(this).addClass('disabled');
    $('#arriveDestination').removeClass("disabled");
    var tripId = $(this).val();
    $.ajax({
      type: 'POST',
      url: `/trip/${tripId}/time`,
      data: {
        type: "homeDepartTime"
      },
      success: function () {
        location.hash = 'toggle-time';
        location.reload();
      }
    })
  });
  $('#arriveDestinationMobile').on('click', function (e) {
    $(this).addClass('disabled');
    $('#departDestination').removeClass("disabled");
    var tripId = $(this).val();
    $.ajax({
      type: 'POST',
      url: `/trip/${tripId}/time`,
      data: {
        type: "destinationArrivalTime"
      },
      success: function () {
        location.hash = 'toggle-time';
        location.reload();
      }
    })
  });
  $('#departDestinationMobile').on('click', function (e) {
    $(this).addClass('disabled');
    $('#arriveHome').removeClass("disabled");
    var tripId = $(this).val();
    $.ajax({
      type: 'POST',
      url: `/trip/${tripId}/time`,
      data: {
        type: "destinationDepartTime"
      },
      success: function () {
        location.hash = 'toggle-time';
        location.reload();
      }
    })
  });
  $('#arriveHomeMobile').on('click', function (e) {
    $(this).addClass('disabled');
    var tripId = $(this).val();
    $.ajax({
      type: 'POST',
      url: `/trip/${tripId}/time`,
      data: {
        type: "homeArrivalTime"
      },
      success: function () {
        location.hash = '';
        location.reload();
      }
    });

  });
  if ($('#homeDepartTimeMobile').is(":visible")) {
    $('#departHomeMobile').addClass('disabled');
    if ($('#destinationArrivalTimeMobile').is(":visible")) {
      $('#arriveDestinationMobile').addClass('disabled');
      if($('#destinationDepartTimeMobile').is(":visible")) {
        $('#departDestinationMobile').addClass('disabled');
        if($('#homeArrivalTimeMobile').is(":visible")) {
          $('#arriveHomeMobile').addClass('disabled');
        } else {
          $('#arriveHomeMobile').removeClass('disabled');
        }
      } else {
        $('#departDestinationMobile').removeClass('disabled');
      }
    } else {
      $('#arriveDestinationMobile').removeClass('disabled')
    }
  }
}

function hideManager() {
  $('#time-manager').hide();
  $('#time-manager-closed').show();
  $('#time-manager-toggle').attr('onclick', 'showManager()');
  $('#time-manager-toggle').html('expand');
  location.hash = '';
}

function loadTimeEditForm(type, text, mobile, time) {
  var template = $('#time-edit-form-template').html();
  var html = Mustache.render(template, {type, text, time});
  if (mobile == 'true' && (type == 'homeDepartTime' || type == 'destinationArrivalTime')) {
    $('#mobile-time-edit-div-1').append(html);
  } else if (mobile == 'true' && (type == 'destinationDepartTime' || type == 'homeArrivalTime')) {
    $('#mobile-time-edit-div-2').append(html);
  } else {
    $('#time-edit-div').append(html);
  }
  if (mobile == 'false') {
    $(`#${type}-edit`).attr('onclick', `hideTimeEditForm('${type}','${text}', '${mobile}'); return false;`);
  } else {
    $(`#${type}-mobile-edit`).attr('onclick', `hideTimeEditForm('${type}','${text}', '${mobile}'); return false;`);
  }
  $('form').form().submit(function(evt) {});
}

function hideTimeEditForm(type, text, mobile) {
  $('#time-edit-form').remove();
  if (mobile == 'false') {
    $(`#${type}-edit`).attr('onclick', `loadTimeEditForm('${type}', '${text}', '${mobile}'); return false;`);
  } else {
    $(`#${type}-mobile-edit`).attr('onclick', `loadTimeEditForm('${type}', '${text}', '${mobile}'); return false;`);
  }
}

