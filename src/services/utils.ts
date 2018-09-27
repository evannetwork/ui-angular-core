/*
  Copyright (C) 2018-present evan GmbH.

  This program is free software: you can redistribute it and/or modify it
  under the terms of the GNU Affero General Public License, version 3,
  as published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program. If not, see http://www.gnu.org/licenses/ or
  write to the Free Software Foundation, Inc., 51 Franklin Street,
  Fifth Floor, Boston, MA, 02110-1301 USA, or download the license from
  the following URL: https://evan.network/license/

  You can be released from the requirements of the GNU Affero General Public
  License by purchasing a commercial license.
  Buying such a license is mandatory as soon as you use this software or parts
  of it on other blockchains than evan.network.

  For more information, please contact evan GmbH at this address:
  https://evan.network/license/
*/

import { Logger, logLog } from 'bcc';

import {
  utils, browserCore, queue
} from 'dapp-browser';

import {
  Injectable, OnDestroy,    // '@angular/core';
  Platform,                 // ionic-angular
  Observable, Subscription
} from 'angular-libs';

import { SingletonService } from './singleton-service';

/**************************************************************************************************/
/**
 * Utility service for the whole angular core module
 *
 * @class      Injectable EvanUtilService
 */
@Injectable()
export class EvanUtilService implements OnDestroy {
  /**
   * array of functions, that should be called, when the browser was resized
   */
  private resizeFunctions: Array<Function>;

  /**
   * function that handles the window resize
   */
  private resizingFunction: Function;

  /**
   * add & remove temporary dynamic styles
   */
  private styles: any;

  /**
   * function that handles the window resize
   */
  private watchScreenSize: Function;

  /**
   * is devMode enabled?
   */
  public devMode: boolean;

  /**
   * is browser width greater than 1500?
   */
  public isXXL: boolean;
  
  /**
   * is browser width greater than 1200?
   */
  public isXL: boolean;
  /**
   * is browser width greater than 992?
   */
  public isLG: boolean;

  /**
   * is browser width greater than 768?
   */
  public isMD: boolean;

  /**
   * is browser width greater than 576?
   */
  public isSM: boolean;

  /**
   * current window size
   */
  public screenSize: number;

  /**
   * BCC logger instance
   */
  public logger: Logger;

  /**
   * Create a singleton service instance. Start screen size watching. Prefill
   * dev ens variables
   */
  constructor(
    private platform: Platform,
    private singleton: SingletonService
  ) {
    return singleton.create(EvanUtilService, this, async () => {
      this.styles = {};
      this.resizeFunctions = [];
      this.devMode = utils.devMode;
      this.logger = new Logger({ logLog });

      this.watchScreenSize = await this.windowSize((width: number) => {
        this.screenSize = width;
        this.isSM = false;
        this.isMD = false;
        this.isLG = false;
        this.isXL = false;
        this.isXXL = false;

        if (width > 1500) {
          this.isXXL = true;
        }

        if (width > 1200) {
          this.isXL = true;
        }

        if (width > 992) {
          this.isLG = true;
        }

        if (width > 768) {
          this.isMD = true;
        }

        if (width > 576) {
          this.isSM = true;
        }
      })

      this.fillDevEnvVariables();

      (<any>window).evanFillDevEnvVariables = this.fillDevEnvVariables.bind(this, true);
    });
  }

  /**
   * remove listeners for resizing functions
   */
  ngOnDestroy() {
    this.resizeFunctions = [ ];
    this.watchScreenSize();

    window.removeEventListener('resize', <any>this.resizingFunction);
  }

  /**
   * Prefill localStorage dev environment variables.
   *
   * @param      {boolean}  full    check if all internal variables should
   *                                enrolled too
   */
  fillDevEnvVariables(full?: boolean) {
    let devVariables = [
      'angular-dev-logs', // enable logs for frontend debug logs
      'bc-dev-logs', // enable log for blockchain-core dev logs
    ];

    if (full) {
      devVariables = devVariables.concat([
        'evan-account', // current account is saved here to access it globally without any service
        'evan-bc-root', // blockchain-core configuration for default business center
        'evan-ens-address', // blockchain-core configuration for the ens address
        'evan-ens-events', // blockchain-core configuration for ens eventhub address
        'evan-ens-mailbox', // blockchain-core configuration for ens mailbox address
        'evan-ens-profiles', // blockchain-core configuration for ens profile address
        'evan-ens-resolver', // blockchain-core configuration for ens contract resolver address
        'evan-ens-root', // blockchain-core configuration for root ens (default = 'evan') 
        'evan-language', // overwrite the current used language (values: 'en', 'de', 'fr')
        'evan-mail-read', // list of mail address that were readed by the user 
        'evan-mail-read-count', // amount of mails that the user readed
        'evan-profile-creation', // check if the user is within the profile creation,
                                 // used to navigate again to onboarding when the user reloads
                                 // the page during profile creation
        'evan-provider', // current used login provider (internal / external)
        'evan-small-toolbar', // check if the evan-split-pane component is within the small view
        'evan-terms-of-use', // has the user accepted the terms of use? (only for local checking,
                             // is also saved within blockchain)
        'evan-test-password', // password that is used for testing, user gets automatically logged with this password
                              //   DANGER: should not be used in production, its a big security
                              //           leak by passing clear text passwords to localStorage 
        'evan-vault', // encrypted vault of the current logged in user
        'evan-web3-provider', // overwrite web3 connection url (default is 'wss://testcore.evan.network/ws')
      ]);
    }

    for (let i = 0; i < devVariables.length; i++) {
      window.localStorage[devVariables[i]] = window.localStorage[devVariables[i]] || '';
    }
  }

  /**
   * Add a temporary css style to the document head. E.g. it is used to style an image within an
   * alert dialog.
   *
   * @param      {string}  name    Name for the style. Style is available under class :
   *                               evan-img-${name}
   * @param      {string}  css     css definition
   * 
   * Usage:
   *   
   *  this.utils.addTemporaryStyle(trimmedName, `
   *    .evan-temporary-${trimmedName} {
   *      min-width: 257px;
   *    }
   *  `);
   */
  addTemporaryStyle(name: string, css: string) {
    if (!this.styles[name]) {
      const head = document.head || document.getElementsByTagName('head')[0];
      const style = document.createElement('style');

      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));

      this.styles[name] = style;

      head.appendChild(style);
    }
  }
  /**
   * Remove a temporary style sheet from the dom.
   *
   * @param name     Name for the style. Style is available under ID : evan-img-${name}
   */
  removeTemporaryImageStyle(name: string) {
    if (this.styles[name]) {
      const head = document.head || document.getElementsByTagName('head')[0];

      head.removeChild(this.styles[name]);

      delete this.styles[name];
    }
  }

  /**
   * Check if we are on a mobile device  (no matter if ionic app or browser).
   *
   * @return     {boolean}  True if mobile, False otherwise.
   */
  isMobile(): boolean {
    return this.platform.is('mobile');
  }

  /**
   * Check if cordova is available
   *
   * @return     {boolean}  True if native mobile, False otherwise.
   */
  isNativeMobile(): boolean {
    return this.platform.is('cordova');
  }

  /**
   * check if we are on a ios mobile device (no matter if ionic app or browser).
   *
   * @return     {boolean}  True if mobile ios, False otherwise.
   */
  isMobileIOS(): boolean {
    return this.platform.is('ios') && this.isMobile();
  }

  /**
   * check if we are on a android mobile device (no matter if ionic app or browser).
   *
   * @return     {boolean}  True if mobile android, False otherwise.
   */
  isMobileAndroid(): boolean {
    return this.platform.is('android') && this.isMobile();
  }

  /**
   * Promise wrapper for setTimeout.
   *
   * @param      {number}         ms       Milliseconds to wait
   * @return     {Promise<void>}  solved when setTimeout callback is called
   */
  timeout(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Promise wrapper for setimmediate
   *
   * @return     {Promise<void>}  solved when setImmediate callback is called
   */
  immediate(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
  }

  /**
   * Remove duplicate values from an array.
   *
   * @param      {Array<any>}  a       Input Array
   * @return     {Array<any>}  the unique array
   */
  uniqueArray(a: Array<any>): Array<any> {
    let seen = {};
    let out = [];
    let len = a.length;
    let j = 0;

    for (let i = 0; i < len; i++) {
      let item = a[i];
      if (seen[item] !== 1) {
        seen[item] = 1;
        out[j++] = item;
      }
    }
    return out;
  }

  /**
   * Registers and window resize watcher
   *
   * @param      {Function}  callback  callback is called when size has changed
   * @return     {Function}  Function to unsubscribe
   */
  async windowSize(callback: Function): Promise<Function> {
    let bounce;

    if (!this.resizingFunction) {
      this.resizingFunction = () => {
        for (let i = 0; i < this.resizeFunctions.length; i++) {
          this.resizeFunctions[i](window.outerWidth);
        }
      };

      window.addEventListener('resize', <any>this.resizingFunction);
    }

    this.resizeFunctions.push(callback);
    await callback(window.outerWidth);

    return () => {
      this.resizeFunctions.splice(this.resizeFunctions.indexOf(callback), 1);
    };
  }

  /**
   * emits a window.dispatchEvent
   *
   * @param      {string}  name    even name
   * @param      {any}  data    data to send
   */
  sendEvent(name: string, data?: any) {
    const event = new CustomEvent(name, { detail: data });

    window.dispatchEvent(event);
  }

  /**
   * runs window.addEventListener and func is called when event was triggered
   *
   * @param      {string}    name    event name
   * @param      {Function}  func    function that is called on event occurence
   * @return     {Function}    Function to unsubscribe
   */
  onEvent(name: string, func: any) {
    window.addEventListener(name, func, false);

    return () => {
      window.removeEventListener(name, func);
    };
  }

  /**
   * Runs JSON.parse(JSON.stringify(obj)) to make an maximum deep copy. Be
   * aware: dont apply recursive objects!
   *
   * @param      {any}  obj     object that should be cloned
   * @return     {any}  cloned object
   */
  deepCopy(obj: any): any {
    if (typeof obj === 'object' && obj !== null) {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch (ex) { }
    }

    return obj;
  }

  /**
   * Searches relative to an element an parent element with a specific element
   * class
   *
   * @param      {Element}  $element   reference element
   * @param      {string}   className  class name that should be searched
   * @return     {Element}  parent element that should be searched
   */
  getParentByClassName(element: any, className: string): Element {
    if (element.parentElement.className.indexOf(className) === -1 && element !== document.body) {
      return this.getParentByClassName(element.parentElement, className);
    } else {
      return element.parentElement;
    }
  }

  /**
   * Gets the full offset top of an element relative to an container
   *
   * @param      {Element}  $parent    Parent container where the offset of the
   *                                   child should be get
   * @param      {Element}  $element   Element to retrieve offset top from
   * @param      {number}   offsetTop  last offset top for recursive function
   * @return     {number}   offset
   */
  getOffsetTop($parent: Element, $element: any, offsetTop = 0): number {
    if ($parent === $element || $element === document.body || !$element || !$parent) {
      return offsetTop;
    }

    offsetTop += $element.offsetTop;

    return this.getOffsetTop($parent, $element.parentElement, offsetTop);
  }

  /**
   * Scroll a container horizontal / vertical smooth to a specific position
   *
   * @param      {Element}  $container  element that should be scrolled
   * @param      {string}   direction   horizontal / vertical
   * @param      {number}   scrollTo    position to scroll to
   */
  scrollTo($container: any, direction: string, scrollTo: number) {
    if (direction === 'vertical') {
      if (scrollTo < $container.scrollTop) {
        this.scrollUp($container, scrollTo);
      } else {
        this.scrollDown($container, scrollTo);
      }
    } else if (direction === 'horizontal') {
      if (scrollTo > $container.scrollLeft) {
        this.scrollRight($container, scrollTo);
      } else {
        this.scrollLeft($container, scrollTo);
      }
    } else {
      throw new Error('unkown scroll direction')
    }
  }

  /**
   * Scrolls the suggestions container upwards
   *
   * @param      {Element}  $container  $container that should be scrolled
   * @param      {number}   scrollTo    where the container should be scrolled
   *                                    to
   * @param      {number}   maxTurns    max turns to break animation (max.
   *                                    200px)
   */
  scrollUp($container: Element, scrollTo: number, maxTurns = 20) {
    if (scrollTo < $container.scrollTop && maxTurns !== 0) {
      $container.scrollTop -= 10;
      maxTurns--;

      setTimeout(() => {
        this.scrollUp($container, scrollTo, maxTurns)
      }, 10);
    }
  }

  /**
   * Scrolls the suggestions container downwards.
   *
   * @param      {Element}  $container  $container that should be scrolled
   * @param      {number}   scrollTo    where the container should be scrolled
   *                                    to
   * @param      {number}   maxTurns    max turns to break animation (max.
   *                                    200px)
   */
  scrollDown($container, scrollTo, maxTurns = 20) {
    if (scrollTo > $container.scrollTop && maxTurns !== 0) {
      $container.scrollTop += 10;
      maxTurns--;

      setTimeout(() => {
        this.scrollDown($container, scrollTo, maxTurns)
      }, 10);
    }
  }


  /**
   * Scrolls the suggestions container to the right.
   *
   * @param      {Element}  $container  $container that should be scrolled
   * @param      {number}   scrollTo    where the container should be scrolled
   *                                    to
   * @param      {number}   maxTurns    max turns to break animation (max.
   *                                    200px)
   */
  scrollRight($container, scrollTo, maxTurns = 20) {
    if (scrollTo > $container.scrollLeft && maxTurns !== 0) {
      $container.scrollLeft += 10;
      maxTurns--;

      setTimeout(() => {
        this.scrollRight($container, scrollTo, maxTurns)
      }, 10);
    }
  }

  /**
   * Scrolls the suggestions container to the left.

   * @param      {Element}  $container  $container that should be scrolled
   * @param      {number}   scrollTo    where the container should be scrolled
   *                                    to
   * @param      {number}   maxTurns    max turns to break animation (max.
   *                                    200px)
   */
  scrollLeft($container, scrollTo, maxTurns = 20) {
    if (scrollTo < $container.scrollLeft && maxTurns !== 0) {
      $container.scrollLeft -= 10;
      maxTurns--;

      setTimeout(() => {
        this.scrollLeft($container, scrollTo, maxTurns)
      }, 10);
    }
  }

  /**
   * Generates an uid.
   *
   * @return     {string}  uuid (257bed80-d18a-1a70-5e9b-fb4d3afa8915)
   */
  generateID(): string {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  /**
   * Using BCC log function to handle a generalized loggin mechanism.
   *
   * @param      {string}  message  message to log
   * @param      {string}  level    level to log the message with
   */
  log(message: string, level: string) {
    this.logger.log(message, level);
  }

  /**
   * Check if the user enabled developer mode within profile configuration.
   *
   * @return     {boolean}  True if developer mode, False otherwise.
   */
  isDeveloperMode() {
    return window.localStorage['evan-developer-mode'] === 'true'
  }

  /**
   * Check if the user enabled notifications on the mobile devices
   *
   * @return     {boolean}  True if notifications enabled, false otherwise.
   */
  notificationsEnabled() {
    return window.localStorage['evan-notifications'] === 'true'
  }

  /**
   * Checks if currently the evan-dapps-domain is enabled.
   *
   * @return     {string}  the defined domain.
   */
  getDevDomain() {
    return window.localStorage['evan-dev-dapps-domain'];
  }

  /**
   * Transforms an Exception into an loggable string format. Returns the string if the exception is
   * only a string.
   *
   * @param      {any}     ex      Exception / string
   * @return     {string}  Transformed exception
   */
  getErrorLog(ex: any): string {
    if (ex && ex.message) {
      return `${ ex.message } : ${ ex.stack }`;
    } else {
      return ex;
    }
  }

  /**
   * generates a ISO standard string from a date object
   *
   * @param      {object}  date    generated date object
   * @return     {string}  the iso string
   */
  toIsoString(date: any) {
    var tzo = -date.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60);
  }
}
