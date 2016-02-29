'use strict';

function addMessageToChat(message) {
  // for the future
  let htmlString = $('.chat-block').html() + '<p>' + message + '</p>';
  $('.chat-block').html(htmlString);
  let top = $('.chat-block').get(0).scrollHeight;
  $('.chat-block').scrollTop(top);
}