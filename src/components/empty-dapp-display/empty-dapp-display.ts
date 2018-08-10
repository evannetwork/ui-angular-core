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
  Component, OnInit, Input, ViewChild, AfterViewInit, ElementRef, // @angular/core
  OnChanges, SimpleChanges, SimpleChange, ChangeDetectorRef,      // @angular/core
  DomSanitizer
} from 'angular-libs';

import {
  EvanDescriptionService
} from '../../services/bcc/description';


import {
  createOpacityTransition
} from '../../animations/opacity';

import { AsyncComponent } from '../../classes/AsyncComponent';

/**************************************************************************************************/

/**
 * shows an generalized "Theirs no data." screen using DApp DBCP descriptions 
 * 
 * Usage:
 *   <evan-empty-dapp
 *     [text]="'_dappcontacts.nothing-found' | translate:{ filter: filterString })"
 *     ensAddress="addressbook">
 *   </evan-empty-dapp>
 *
 * @class      Component EmptyDAppDisplayComponent
 */
@Component({
  selector: 'evan-empty-dapp',
  templateUrl: 'empty-dapp-display.html',
  animations: [
    createOpacityTransition()
  ]
})
export class EmptyDAppDisplayComponent extends AsyncComponent {
  /***************** inputs & outpus *****************/
  /**
   * ens address to load the empty preview img from
   */
  @Input() ensAddress: string;

  /**
   * text to display under neath the window
   */
  @Input() text: string;

  /**
   * apply dynamic applied img, overwrites ensAddress img
   */
  @Input() img: string;

  /***************** initialization  *****************/
  constructor(
    private description: EvanDescriptionService,
    private ref: ChangeDetectorRef,
    private _DomSanitizer: DomSanitizer,
  ) {
    super(ref);
  }

  /**
   * load dbcp address and set img, if not set before.
   */
  async _ngOnInit() {
    if (!this.img) {
      this.ref.detectChanges();

      const dbcp = (await this.description.getMultipleDescriptions([ this.ensAddress ]))[0];

      if (dbcp && dbcp.imgSquare) {
        this.img = dbcp.imgSquare;
      }
    }
  }
}
