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
  AlertController, Alert,    // ionic-angular
  Injector,
  ComponentFactoryResolver,
  EmbeddedViewRef,
  ApplicationRef,
  Component,
  DomSanitizer,
  QRScanner, QRScannerStatus
} from 'angular-libs';

import { EvanUtilService } from '../utils';
import { EvanModalService } from './modal';
import { EvanTranslationService } from './translate';
import { QRCodeScannerDialogComponent } from '../../components/qr-code-scanner/qr-code-scanner';

/**************************************************************************************************/

/**
 * QR-Code Scanner service for HTML 5 / IOS / Android.
 *
 * @class      Injectable EvanQrCodeService
 */
@Injectable()
export class EvanQrCodeService {
  /**
   * require dependencies
   */
  constructor(
    private modalService: EvanModalService,
    private _DomSanitizer: DomSanitizer,
    private utils: EvanUtilService,
    private qrScanner: QRScanner,
    private translateService: EvanTranslationService
  ) { }

  /**
   * Scan an qr code and returns the result as string.
   *
   * @return     {Promise<string>}  qr-code result
   */
  public async scanQRCode(): Promise<string> {
    let picture;

    if (this.utils.isNativeMobile()) {
      const status = await this.qrScanner.prepare();

      if (status.authorized) {
        return <any>new Promise((resolve, reject) => {
          document.body.className += ' qr-code-scanning';

          // create modal close button
          const button = document.createElement('button');
          button.className = "button button-md button-default button-default-md button-round button-round-md button-md-medium-gray qr-code-close";
          button.setAttribute('color', 'medium-gray');
          button.setAttribute('icon-left', 'true');
          button.setAttribute('ion-button', 'true');
          button.innerHTML = `
            <span class="button-inner">
              <ion-icon color="light" name="close" role="img" class="icon icon-md icon-md-light ion-md-close" aria-label="close"></ion-icon>
              <span color="light" class="ng-tns-c22-4">${ this.translateService.instant('_angularcore.form-alert.close') }</span>
            </span>
            <div class="button-effect"></div>
          `;
          document.body.querySelectorAll('ion-app')[0].appendChild(button);

          // define close strategy
          const closeQRCode = (text, finishFunc) => {
            this.qrScanner.hide(); // hide camera preview
            this.qrScanner.destroy(); // kill the camera preview

            scanSub.unsubscribe(); // stop scanning

            document.body.className = document.body.className.replace('qr-code-scanning', '');

            button.parentElement.removeChild(button);

            finishFunc(text);
          }

          // wait for scanned or close button clicked
          const scanSub = this.qrScanner.scan().subscribe((text: string) => closeQRCode(text, resolve));
          button.onclick = () => closeQRCode('', reject);

          // show the qr-code scanner
          this.qrScanner.show();
        });
      } else if (status.denied) {
        throw new Error('qr-code denied');
      } else {
        throw new Error('qr-code denied');
      }
    } else {
      return await this.modalService.createModal(QRCodeScannerDialogComponent, {}, true);
    }
  }
}
