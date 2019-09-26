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
*/

import {
  logLog
} from 'bcc';

import {
  core
} from 'dapp-browser';

import {
  Injectable,                        // '@angular/core';
  TranslateService,                  // @ngx-translate/core,
  AlertController, Alert, Platform   // ionic-angular
} from 'angular-libs';

import { SingletonService } from '../singleton-service';
import { EvanUtilService } from '../utils';
import { EvanQueue } from '../bcc/queue';
import { EvanAddressBookService } from '../bcc/address-book';
import { EvanCoreService } from '../bcc/core';
import { EvanToastService } from '../ui/toast';
import { EvanAlertService } from '../ui/alert';
import { EvanRoutingService } from '../ui/routing';

/**************************************************************************************************/

let _LTracker;
const logglyKey = 'f00e54e6-9100-44c6-a24b-9dc38fe3e346';

/**
 * handle loggly globally, to only have one reference
 */
function setupLoggly() {
    // setup loggly
  window['_LTracker'] = window['_LTracker'] || [ ];
  _LTracker = window['_LTracker'];

  // push configuraiton
  _LTracker.push({
    logglyKey: logglyKey,
    'sendConsoleErrors' : false,
    'tag' : core.activeAccount()
  });
}

setupLoggly();

/**
 * Helper to handle logging reports.
 *
 * @class      Injectable EvanLoggingService
 */
@Injectable()
export class EvanLoggingService {
  /**
   * make it singletone and bind input focus events
   */
  constructor(
    private addressBookService: EvanAddressBookService,
    private alertService: EvanAlertService,
    private core: EvanCoreService,
    private coreService: EvanCoreService,
    private platform: Platform,
    private queue: EvanQueue,
    private singleton: SingletonService,
    private toastService: EvanToastService,
    private utils: EvanUtilService,
    private routingService: EvanRoutingService
  ) { }

  /**
   * Using BCC log function to handle a generalized logging mechanism.
   *
   * @param      {string}  message  message to log
   * @param      {string}  level    level to log the message with
   */
  log(message: string, level: string) {
    this.utils.log(message, level);
  }

  /**
   * Return all logs including the queue logs
   *
   * @return     {Array<any>}  logs including queue
   * 
   * Sample:
   *   { "timestamp": 1529064180496, "level": "notice", "message": "cool message" }
   */
  getLogsIncludingQueue() {
    const queueErrors = this.queue.queue.entries
      .filter(entry => entry.ex)
      .map(entry => entry.ex);

    return [ ]
      .concat(logLog, queueErrors)
      .sort((loga, logb) => logb.timestamp - loga.timestamp);
  }

  /**
   * enchance log message with user information
   *
   * @param      {Array<any>}  logs    logs to use
   * @return     {Array<any>}  log object
   */
  async buildLogObject(logs: Array<any>) {
    let alias = '';

    try {
      alias = await this.addressBookService.activeUserName();
    } catch (ex) { }

    return {
      logs: logs,
      timestamp: Date.now(),
      user: {
        alias: alias,
        accountId: this.coreService.activeAccount(),
        provider: this.coreService.getCurrentProvider(),
      },
      browser: {
        browser: this.coreService.currentBrowser(),
        userAgent: window.navigator.userAgent,
        isMobile: this.utils.isMobile(),
        isNativeMobile: this.utils.isNativeMobile(),
        isMobileIOS: this.utils.isMobileIOS(),
        isMobileAndroid: this.utils.isMobileAndroid(),
      },
      window: {
        height: window.outerHeight,
        width: window.outerWidth,
        location: window.location.href
      }
    }
  }

  /**
   * Choose type all for current filtered log. Choose errors for only errors.
   *
   * @param      {string}      type    all | errors
   * @return     {Array<any>}  specific logs for type
   */
  getReportLogs(types?: Array<string>) {
    let logs = this.getLogsIncludingQueue();

    if (types) {
      logs = logs.filter(log => types.indexOf(log.level) !== -1);
    }

    return logs;
  }

  /**
   * Opens an alert to ask the user to log only errors with on click or with loggin dapp.
   *
   * @return     {Promise<any>}  resolved when clicked
   */
  async logQuestionAlert(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.alertService.showAlert(
        '_logging.log_question_title',
        '_logging.log_question_message',
        [
          {
            text: '_logging.log_close',
            role: 'cancel',
            handler: () => resolve()
          },
          {
            text: '_logging.log_only_errors',
            handler: data => {
              this.sendLogs(['error']);
              resolve();
            }
          },
          {
            text: '_logging.log_detailed',
            handler: data => {
              this.routingService.goToLogging();
              resolve();
            }
          },
          {
            text: '_logging.ignore',
            handler: data => {
              logLog.splice(0, logLog.length);
              resolve();
            }
          },
        ],
        []
      );
    })
  }

  /**
   * Send log object to loggly.
   *
   * @param      {string}  type    nothing, 'all' | 'errors'
   */
  async sendLogs(types?: Array<string>) {
    const logObj = await this.buildLogObject(this.getReportLogs(types));

    _LTracker.push(logObj);

    // clear logLogs
    logLog.splice(0, logLog.length);

    this.toastService.showToast({
      message: '_logging.logs-sent',
      duration: 3000
    });
  }

  /**
   * Start copying of the error log. Choose type all for current filtered log. Choose errors for only
   * errors.
   *
   * @param      {string}  type    nothing, 'all' | 'errors'
   */
  async copy(types?: Array<string>) {
    this.core.copyString(JSON.stringify(
      await this.buildLogObject(this.getReportLogs(types)),
      null,
      2
    ));
  }
}