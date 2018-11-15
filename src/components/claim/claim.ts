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
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  MenuController,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from 'angular-libs';

import { AsyncComponent } from '../../classes/AsyncComponent';
import { EvanBCCService } from '../../services/bcc/bcc';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanClaimService } from '../../services/bcc/claims';

/**************************************************************************************************/

/**
 * { function_description }
 *
 * @class      Component EvanClaimComponent
 * @param      {<type>}  selector         The selector
 * @param      {<type>}  templateUrl      The template url
 * @param      {<type>}  animations       The animations
 * @param      {<type>}  changeDetection  The change detection
 * @return     {<type>}  { description_of_the_return_value }
 */
@Component({
  selector: 'evan-claim',
  templateUrl: 'claim.html',
  animations: [ ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvanClaimComponent extends AsyncComponent {
  /***************** inputs & outpus *****************/
  /**
   * address that for that the claims should be checked
   */
  @Input() address: string

  /**
   * the topic to load the claims for (/test/test2)
   */
  @Input() topic: string;

  /**
   * display mode that should be used (minimal, detail, full)
   */
  @Input() mode: string;

  /*****************    variables    *****************/
  /**
   * available display modes
   */
  private availableModes = [
     // one card showing claim name, issuer, subject
    'detail',
    // shows all 
    'full',
    // only one card that displays the combined status (full detail using popup by click on the
    // card)
    'minimal',
  ];

  /**
   * All available claims for the given topic
   */
  private claims: Array<any>;
  
  /**
   * concadinated claim including computed status
   */
  private claim: any;

  /**
   * Are currently the claims loading?
   */
  private loadingClaims: boolean;

  /***************** initialization  *****************/
  constructor(
    private bcc: EvanBCCService,
    private claimService: EvanClaimService,
    private core: EvanCoreService,
    private element: ElementRef,
    private menuController: MenuController,
    public ref: ChangeDetectorRef,
  ) {
    super(ref);
  }

  /**
   * 
   */
  async _ngOnInit() {
    // await this.bcc.claims.setClaim(this.core.activeAccount(), this.address, this.topic);
    if (this.availableModes.indexOf(this.mode) === -1) {
      console.error(`EvanClaimComponent: ${ this.mode } is not a valid display mode.`);
      this.mode = 'detail';
    }

    this.loadClaims();
  }

  /**
   * 
   */
  async _ngOnDestroy() {

  }

  /**
   * Load all claims for the current topic.
   *
   * @return     {Promise<void>}  resolved when done
   */
  private async loadClaims() {
    this.loadingClaims = true;
    this.ref.detectChanges();

    this.claims = await this.claimService.getClaims(this.address, this.topic);

    this.loadingClaims = false;
    this.ref.detectChanges();
  }
}
