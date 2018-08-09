/*
  Copyright (C) 2018-present evan GmbH. 
  
  This program is free software: you can redistribute it and/or modify it
  under the terms of the GNU Affero General Public License, version 3, 
  as published by the Free Software Foundation. 
  
  This program is distributed in the hope that it will be useful, 
  but WITHOUT ANY WARRANTY; without even the implied warranty of 
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Affero General Public License for more details. 
  
  You should have received a copy of the GNU Affero General Public License along with this program.
  If not, see http://www.gnu.org/licenses/ or write to the
  
  Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA, 02110-1301 USA,
  
  or download the license from the following URL: https://evan.network/license/ 
  
  You can be released from the requirements of the GNU Affero General Public License
  by purchasing a commercial license.
  Buying such a license is mandatory as soon as you use this software or parts of it
  on other blockchains than evan.network. 
  
  For more information, please contact evan GmbH at this address: https://evan.network/license/ 
*/

import {
  Injectable,               // '@angular/core';
  TranslateService,         // @ngx-translate/core,
  ToastController,          // ionic-angular
} from 'angular-libs';

import { SingletonService } from '../singleton-service';
import { EvanTranslationService } from './translate';
import { EvanUtilService } from '../utils';

/**************************************************************************************************/

/**
 * Hold reference to the latest available toast service to handle cross dapp toast messages. It
 * could be possible, that the queue is running and tries to submit an toast, even when the queue
 * origin dapp was closed and the toastService is destroyed.
 */
let lastToastService;

/**
 * Ionic toast wrapper service that handles translated toasts.
 *
 * @class      Injectable EvanToastService
 */
@Injectable()
export class EvanToastService {
  /**
   * require dependencies
   */
  constructor(
    private toastCtrl: ToastController,
    private translate: EvanTranslationService,
    private utils: EvanUtilService,
    private singleton: SingletonService,
  ) {
    lastToastService = this;
  }

  /**
   * Shows a Ionic toast message using the latest available toastService.
   * 
   * Usage:
   *   this.toastService.showToast({
   *     message: '_dapptaskboard.task-reload',
   *     duration: 2000,
   *     closeButtonText: 'close'
   *   });
   *
   * @param      {any}  toastObj  toast configuration object
   * @return     {Promise<any>}  Resolved when disappeard
   */
  showToast(toastObj: any): Promise<any> {
    return lastToastService._showToast(toastObj);
  }

  /**
   * Shows a Ionic toast message.
   * 
   * Usage:
   *   this.toastService.showToast({
   *     message: '_dapptaskboard.task-reload',
   *     duration: 2000,
   *     closeButtonText: 'close'
   *   });
   *
   * @param      {any}  toastObj  toast configuration object
   * @return     {Promise<any>}  Resolved when disappeard
   */
  _showToast(toastObj: any): Promise<any> {
    toastObj.message = this.translate.instant(toastObj.message);

    if (toastObj.closeButtonText) {
      toastObj.closeButtonText = this.translate.instant(toastObj.closeButtonText);
    }

    let toast = this.toastCtrl.create(toastObj);

    return new Promise((resolve, reject) => {
      try {
        let closedByTimeout = false;

        setTimeout(() => {
          closedByTimeout = true;
        }, toastObj.duration);

        toast.onDidDismiss(() => {
          if (!closedByTimeout) {
            resolve();
          }
        });

        toast.present();
      } catch (ex) { }
    });
  }
}
