'use strict';

class MessageContainer {
  /**
   * @param {number} ttl time-to-live
   * @param {string} myLogin login of the current player
   * @param {object} mapContainer PIXI container
   */
  constructor (ttl, myLogin) {
    this.ttl = ttl;
    this.myLogin = myLogin;

    this.messages = new Map();
  }

  /**
   * Create and return PIXI.Text object
   *
   * @param {string} message
   */
  getMessageObj (message) {
    return new PIXI.Text(
        message,
        { font: '15px Snippet', fill: 'white', align: 'center' }
      );
  }

  /**
   * Print mesage of current user to the gameStage
   *
   * @param {string} message
   */
  printMyMessage (message) {
    const messageObj = this.getMessageObj(message);
    messageObj.position.y = SIZE / 2 - SPRITE_SIZE;
    messageObj.position.x = SIZE / 2;
    messageObj.gameTTL = Date.now() + this.ttl;

    if (this.messages.has(this.myLogin)) this.deleteMyMessage();

    gameStage.addChild(messageObj);
    this.messages.set(this.myLogin, messageObj);
  }

  /**
   * Print mesage of another users to the mapContainer
   *
   * @param {string} message
   * @param {string} login
   * @param {number} x
   * @param {number} y
   */
  printAnotherMessage (message, login, mapContainer, x, y) {
    const messageObj = this.getMessageObj(message);
    messageObj.position.y = y - SPRITE_SIZE;
    messageObj.position.x = x;
    messageObj.gameTTL = Date.now() + this.ttl;

    if (this.messages.has(login)) this.deleteAnotherMessage(login, mapContainer);

    mapContainer.addChild(messageObj);
    this.messages.set(login, messageObj);
  }

  /**
   * Delete mesage of current user from the gameStage
   */
  deleteMyMessage () {
    gameStage.removeChild(this.messages.get(this.myLogin));
    this.messages.delete(this.myLogin);
  }

  /**
   * Delete mesage of another users from the mapContainer
   *
   * @param {string} login
   */
  deleteAnotherMessage (login, mapContainer) {
    mapContainer.removeChild(this.messages.get(login));
    this.messages.delete(login);
  }
}
