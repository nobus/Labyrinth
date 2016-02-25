'use strict';

function addMessageToChat(message) {
  // for the future
  var htmlString = $('.chat-block').html() + '<p>' + message + '</p>';
  $('.chat-block').html(htmlString);
  var top = $('.chat-block').get(0).scrollHeight;
  $('.chat-block').scrollTop(top);
}