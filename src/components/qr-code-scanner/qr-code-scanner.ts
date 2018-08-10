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
  Component, OnInit, ViewChild,     // @angular/core
  DomSanitizer,
  ZXingScannerComponent,
  Result
} from 'angular-libs';

import { createOpacityTransition } from '../../animations/opacity';

/**************************************************************************************************/

/**
 * Shows an QR-Code Scanner Dialog for HTML 5. Should only be used within a modal.
 * 
 * Usage:
 *   await this.modalService.createModal(QRCodeScannerDialogComponent, {});
 *
 * @class      Component QRCodeScannerDialogComponent
 */
@Component({
  selector: 'qr-code-scanner-dialog',
  templateUrl: 'qr-code-scanner.html',
  animations: [
    createOpacityTransition()
  ]
})
export class QRCodeScannerDialogComponent implements OnInit {
  /*****************    variables    *****************/
  /**
   * available camera devices
   */
  private availableDevices: MediaDeviceInfo[];

  /**
   * check if camera is available
   */
  private hasCameras = false;

  /**
   * qr code scanned result
   */
  private qrResult: Result;

  /**
   * formatted result to resolved dialog
   */
  private qrResultString: string;

  /**
   * resolvle function that is applied from modal service
   */
  private resolveDialog: Function;

  /**
   * reject function that is applied from modal service
   */
  private rejectDialog: Function;

  /**
   * ZXingsScanner instance
   */
  @ViewChild('scanner') private scanner: ZXingScannerComponent;

  /**
   * active selected device
   */
  private selectedDevice: MediaDeviceInfo;
  

  /***************** initialization  *****************/
  constructor() { }

   /**
    * Search for cameras and set the active one for scanning
    */
  ngOnInit() {
    this.scanner.camerasFound.subscribe((devices: MediaDeviceInfo[]) => {
      this.hasCameras = true;

      // selects the devices's back camera by default
      for (const device of devices) {
        if (/back|rear|environment/gi.test(device.label)) {
          this.scanner.changeDevice(device);
          this.selectedDevice = device;
          break;
        }
      }
      // otherwise select the first camery
      if (!this.selectedDevice) {
        this.selectedDevice = devices[0];
      }
    });

    this.scanner.scanComplete.subscribe((result: Result) => {
      this.qrResult = result;
    });
  }

  /*****************    functions    *****************/
  /**
   * show detected camereas in frontend
   *
   * @param      {<type>}  cameras  The cameras
   * @return     {<type>}  { description_of_the_return_value }
   */
  displayCameras(cameras: MediaDeviceInfo[]) {
    this.availableDevices = cameras;
  }

  /**
   * resolve the dialog with the qr-code result
   *
   * @param      {string}  resultString  qr-code result
   */
  handleQrCodeResult(resultString: string) {
    this.qrResultString = resultString;

    this.resolveDialog(this.qrResultString);
  }

  /**
   * Switch to the next available camera (only can handle two devices)
   */
  switchCamera() {
    for (let i = 0; i < this.availableDevices.length; i++) {
      if (this.selectedDevice !== this.availableDevices[i]) {
        this.selectedDevice = this.availableDevices[i];

        this.scanner.changeDevice(this.selectedDevice);
        break;
      }
    }
  }
}
