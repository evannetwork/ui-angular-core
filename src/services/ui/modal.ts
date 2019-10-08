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
  Injectable,               // '@angular/core';
  TranslateService,         // @ngx-translate/core,
  AlertController, Alert,    // ionic-angular
  Injector,
  ComponentFactoryResolver,
  EmbeddedViewRef,
  ApplicationRef,
  Component
} from 'angular-libs';

import { BigPictureDialog } from '../../components/big-picture/big-picture';
import { SingletonService } from '../singleton-service';
import { EvanTranslationService } from './translate';
import { EvanUtilService } from '../utils';

/**************************************************************************************************/

/**
 * Service that handles components within modals.
 *
 * @class      Injectable EvanModalService
 */
@Injectable()
export class EvanModalService {
  /**
   * require dependencies
   */
  constructor(
    private appRef: ApplicationRef,
    private factoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private singleton: SingletonService,
    private translateService: EvanTranslationService,
    private utils: EvanUtilService,
  ) { }

  /**
   * Creates a modal using an component.
   *
   * @param      {Component}     component           component to show in the modal
   * @param      {any}           payload             payload that should be applied to the
   *                                                 component[this]
   * @param      {boolean}       evanModalAnimation  a modal dialog that uses .evan-modal internally
   * @return     {Promise<any>}  modal that is resolved on modal reject / resolve
   */
  public createModal(component: any, payload: any, evanModalAnimation?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      // 1. Create a component reference from the component
      const componentRef = this.factoryResolver
        .resolveComponentFactory(component)
        .create(this.injector);

      // save payload to modal instance
      const payloadKeys = Object.keys(payload);
      for (let i = 0; i < payloadKeys.length; i++) {
        (<any>componentRef.instance)[payloadKeys[i]] = payload[payloadKeys[i]];
      }

      const removeDialog = async (removeTimeout?: any) => {
        if (!isNaN(removeTimeout)) {
          if (evanModalAnimation) {
            const evanModalEl = domElem.querySelectorAll('.evan-modal');

            if (evanModalEl.length > 0) {
              evanModalEl[0].className = evanModalEl[0].className.replace('show-modal', '');
            }
          }

          await this.utils.timeout(removeTimeout);
        }

        this.appRef.detachView(componentRef.hostView);

        componentRef.destroy();
      };

      (<any>componentRef.instance)['removeDialog'] = removeDialog;

      (<any>componentRef.instance).rejectDialog = (removeTimeout: number|boolean = 500) => {
        if (removeTimeout !== false) {
          removeDialog(removeTimeout);
        }

        reject();
      };

      (<any>componentRef.instance).resolveDialog = (result, removeTimeout: number|boolean = 500) => {
        if (removeTimeout !== false) {
          removeDialog(removeTimeout);
        }

        resolve(result);
      };

      // 2. Attach component to the appRef so that it's inside the ng component tree
      this.appRef.attachView(componentRef.hostView);

      // 3. Get DOM element from component
      const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
        .rootNodes[0] as HTMLElement;

      // 4. Append DOM element to the body
      document.body.getElementsByTagName('ion-app')[0].appendChild(domElem);

      if (evanModalAnimation) {
        const modalShowWatcher: any = setInterval(() => {
          const evanModalEl = domElem.querySelectorAll('.evan-modal');

          if (evanModalEl.length > 0) {
            evanModalEl[0].className += ' show-modal';

            window.clearInterval(modalShowWatcher);
          }
        }, 100);
      }
    });
  }

  /**
   * Modal wrapper for the angular-core BigPictureDialog component.
   *
   * @param      {string}  alertTitle  title of the alert
   * @param      {string}  alertText   text of the alert
   * @param      {string}  img         url / base64 of a img
   * @return     {Promise<any>}  modal that is resolved on modal reject / resolv
   */
  public showBigPicture(alertTitle, alertText, img) {
    return this.createModal(BigPictureDialog, {
      alertTitle,
      alertText,
      img,
    }, true);
  }
}
