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

import {
  Component, OnInit,     // @angular/core
  Input, ViewChild, ElementRef, OnDestroy,
  Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef,
  MenuController, AfterViewInit
} from 'angular-libs';

import { EvanCoreService } from '../../services/bcc/core';
import { EvanAddressBookService } from '../../services/bcc/address-book';
import { EvanUtilService } from '../../services/utils';

/**************************************************************************************************/

/**
 * QR-Code display component
 * 
 * @class      Component ListPagingComponent
 */
@Component({
  selector: 'evan-qr-code',
  templateUrl: 'qr-code.html',
  animations: [ ]
})
export class QrCodeComponent implements AfterViewInit {
  /***************** inputs & outpus *****************/
  /**
   * text to generate the qr-code for
   */
  @Input() text: number;

  /**
   * width of the qr-code
   */
  @Input() width: number;

  /**
   * height of the qr-code
   */
  @Input() height: number;

  /*****************    variables    *****************/
  /**
   * blockie element references
   */
  @ViewChild('qrCode') $qrCode: ElementRef;

  /***************** initialization  *****************/
  constructor(
    private ref: ChangeDetectorRef,
    private utils: EvanUtilService
  ) { }

  /**
   * render the qr-code
   */
  async ngAfterViewInit() {
    this.$qrCode.nativeElement.id = this.utils.generateID();
    const qrCode = new (<any>window).QRCode(this.$qrCode.nativeElement.id, {
      text: this.text,
      width: this.width,
      height: this.height,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : (<any>window).QRCode.CorrectLevel.H
    });

    this.ref.detach();
  }
}