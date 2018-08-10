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
  AlertController, Alert    // ionic-angular
} from 'angular-libs';

import { SingletonService } from '../singleton-service';

import { EvanTranslationService } from './translate';
import { EvanUtilService } from '../utils';

/**************************************************************************************************/

/**
 * Ionic AlertController wrapper for easier usage.
 *
 * @class      Injectable EvanAlertService
 */
@Injectable()
export class EvanAlertService {
  /**
   * require dependencies
   */
  constructor(
    private alertCtrl: AlertController,
    private translateService: EvanTranslationService,
    private utils: EvanUtilService,
    private singleton: SingletonService,
  ) { }

  /**
   * Ionic AlertController.create wrapper to handle translations of the form.
   * 
   * Usage:
   *   await this
   *     .alertService.showAlert(
   *       '_dappdapps.alert.validTitle',
   *       {
   *         key: '_dappdapps.alert.dappMessage',
   *         translateOptions: dapp
   *       }
   *     );
   *
   * @param      {string|any}  title    Title    'title'   || { key: 'title',
   *                                    translateOptions: { } }
   * @param      {string|any}  message  Message  'message' || { key: 'message',
   *                                    translateOptions: { } }
   * @param      {Array<any>}   buttons  Buttons that should be display
   * @param      {Array<any>}  inputs   Inputs that should be displayed
   * @return     {Alert}       this.alertCtrl.create result
   */
  showAlert(title: string|any, message: string|any, buttons = [ ], inputs = [ ]): Alert {
    title = this.translateService.instant(title);
    message = this.translateService.instant(message);

    buttons.forEach(button => {
      button.text = this.translateService.instant(button.text, button.translateOptions);
    });

    inputs.forEach(input => {
      input.placeholder = this.translateService.instant(input.placeholder, input.translateOptions);
      input.label = this.translateService.instant(input.label, input.translateOptions);
    });

    let alert = this.alertCtrl.create({
      title,
      message,
      buttons,
      inputs
    });

    alert.present();

    return alert;
  }

  /**
   * Shows an alert with an submit and an cancel and returns an Promise, that is
   * resolve by clicking on the specific button.
   * 
   * Usage:
   *   await this
   *     .alertService.showSubmitAlert(
   *       '_dappdapps.alert.validTitle',
   *       {
   *         key: '_dappdapps.alert.dappMessage',
   *         translateOptions: dapp
   *       },
   *       'cancel',
   *       'submit'
   *     );
   *
   * @param      {string|any}  title       'title'      || { key: '',
   *                                       translateOptions: { } }
   * @param      {string|any}  message     'message'    || { key: '',
   *                                       translateOptions: { } }
   * @param      {string}      cancelText  'cancelText' || { key: '',
   *                                       translateOptions: { } }
   * @param      {string}      submitText  'submitText' || { key: '',
   *                                       translateOptions: { } }
   * @param      {Array<any>}  inputs      Inputs that should be displayed
   * @return     {Promise}     promise that is deployed on button reject / resolve
   */
  showSubmitAlert(
    title: string | any,
    message: string | any,
    cancelText = 'cancel',
    submitText?: string | any,
    inputs = [ ]): Promise<any> {
    return new Promise((resolve, reject) => {
      const buttons: Array<any> = [
        {
          text: cancelText,
          role: 'cancel',
          handler: data => {
            reject(data);
          }
        }
      ];

      if (submitText) {
        buttons.push({
          text: submitText,
          handler: data => {
            resolve(data);
          }
        });
      }

      this.showAlert(title, message, buttons, inputs);
    });
  }

  /**
   * Adds an temporary style to show a better looking alert using the definition
   * colors and img.
   *  Usage:
   *   this.alertService.addDAppAlertStyle(this.dapps[dappKey]);
   *
   * @param      {any}  definition  DApp bookmark definition
   */
  addDAppAlertStyle(definition: any) {
    let primaryColor = definition.primaryColor;
    let secondaryColor = definition.secondaryColor;

    if (definition.dapp) {
      primaryColor = definition.dapp.primaryColor || primaryColor;
      secondaryColor = definition.dapp.secondaryColor || secondaryColor;
    }

    const trimmedName = definition.name.replace(/\s/g, '');
    this.utils.addTemporaryStyle(trimmedName, `
      .evan-temporary-${trimmedName} {
        min-width: 257px;
      }

      .evan-temporary-${trimmedName} .alert-img-container {
        background-color: ${primaryColor};
      }

      .evan-temporary-${trimmedName} .alert-img-container .alert-img {
        background-color: ${secondaryColor};
        background-image: url("${definition.imgSquare}");
      }
    `);
  }

  /**
   * Remove an temporary style that was used for the DApp definition style.
   *
   * @param      {any}     definition  DApp bookmark definition
   */
  removeDAppAlertStyle(definition: any) {
    const name = definition.name;

    // insert delay to wait before alert is finally closed
    setTimeout(() => {
      this.utils.removeTemporaryImageStyle(name);
    }, 100);
  }
}
