$(document).ready(function () {
  $('.ui .item').on('click', function() {
    $('.ui .item').removeClass('active');
    $(this).addClass('active');
  });  
  $('.ui.checkbox').checkbox();
  $('form').form().submit(function(evt) {});
  $('#alert-close').click(function () {
    $("#alert-box").fadeOut("slowest", function () {
    });
  });
  $('.ui.browse').popup({
    on: 'click'
  });
  if(location.pathname == '/teams') {
    $('#teams-item').addClass('active');
  }
  if(location.pathname == '/') {
    $('#home-item').addClass('active');
  }
  if(location.pathname == '/login') {
    $('#login-item').addClass('active');
  }
  if(location.pathname.toString().includes('/team/')) {
    $('#team-item').addClass('active');
  }
});