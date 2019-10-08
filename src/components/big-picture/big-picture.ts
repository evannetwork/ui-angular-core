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
  Component, OnInit, OnDestroy, // @angular/core
  Router, NavigationEnd,        // @angular/router
  Input,
  Validators, FormBuilder, FormGroup,  // @angular/forms
  DomSanitizer, ChangeDetectorRef,
  AfterViewInit
} from 'angular-libs';

import { EvanAddressBookService } from '../../services/bcc/address-book';
import { EvanTranslationService } from '../../services/ui/translate';
import { createOpacityTransition } from '../../animations/opacity';

/**************************************************************************************************/

/**
 * Shows an image on fullscreen (optimized for modal dialogs)
 * 
 * Usage: 
 * openPictureDetail(dataUrl) {
 *   try {
 *     return this.modalService.showBigPicture(
 *       'alertTitle',
 *       'alertText',
 *       dataUrl,
 *     );
 *   } catch (ex) { }
 * }
 *
 * @class      Component BigPictureDialog
 */
@Component({
  selector: 'big-picture',
  templateUrl: 'big-picture.html',
  animations: [
    createOpacityTransition()
  ]
})
export class BigPictureDialog implements OnInit, AfterViewInit {
  /*****************    variables    *****************/
  /**
   * img input, that is provided from the modal service
   */
  private img: string;

  /**
   * resolvle function that is applied from modal service
   */
  private resolveDialog: Function;

  /**
   * reject function that is applied from modal service
   */
  private rejectDialog: Function;

  /**
   * loading indicator
   */
  private loading: boolean;

  /***************** initialization  *****************/
  constructor(
    private translate: EvanTranslationService,
    private _DomSanitizer: DomSanitizer,
    private ref: ChangeDetectorRef
  ) {
    ref.detach();
  }

  /**
   * Update UI onetime
   */
  ngOnInit() {
    this.ref.detectChanges();
  }
}
