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
  Component, OnInit, OnDestroy, // @angular/core
  Router, NavigationEnd,        // @angular/router
  Input, ChangeDetectorRef,
  Validators, FormBuilder, FormGroup,  // @angular/forms
} from 'angular-libs';

import { EvanAddressBookService } from '../../services/bcc/address-book';
import { EvanTranslationService } from '../../services/ui/translate';
import { createOpacityTransition } from '../../animations/opacity';

/**************************************************************************************************/

/**
 * Dialog to request user to accept permissions.
 * 
 * Usage:
 *   await this.modalService.createModal(TrustDialogComponent, {
 *     smartAgentName: 'Onboarding Smart Agent',
 *     smartAgentRights: [
 *       'key-exchange',
 *       'mailbox-send'
 *     ],
 *     smartAgentDetails: {
 *       description: `
 *         The onboarding Smart Agent gives you the ability, to invite persons via Email and send
 *         them EVE\'s as seed money. They receive a custom Email with an invite link.
 *         You get a mailbox message with the onboarded user id and the new alias of the account
 *       `,
 *       verifiedBy: 'evan.network',
 *       verifiedAt: '28.02.2018',
 *       createdBy: 'evan.network',
 *       createdAt: '28.02.2018',
 *     },
 *     smartAgentAccountId: '0x063fB42cCe4CA5448D69b4418cb89E663E71A139',
 *     smartAgentTrustFn: async() => {
 *       // do something when user accepted
 *     }
 *   });
 * 
 * @class      Component TrustDialogComponent
 */
@Component({
  selector: 'trust-dialog',
  templateUrl: 'trust-dialog.html',
  animations: [
    createOpacityTransition()
  ]
})
export class TrustDialogComponent implements OnInit {
  /*****************    variables    *****************/
  /**
   * name of the smart agent
   */
  private smartAgentName: string;

  /**
   * permissions that are needed 
   */
  private smartAgentRights: any;

  /**
   * detail text of the smart agent
   */
  private smartAgentDetails: any;

  /**
   * smart agent account id
   */
  private smartAgentAccountId: string;

  /**
   * function that should be called, when the trust was accepted
   */
  private smartAgentTrustFn: Function;

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
    private addressBook: EvanAddressBookService,
    private formBuilder: FormBuilder,
    private translate: EvanTranslationService,
    private ref: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.ref.detach();
    this.ref.detectChanges();
  }

  /*****************    functions    *****************/
  /**
   * run when user accepts the trust
   */
  async finish() {
    this.loading = true;
    this.ref.detectChanges();

    try {
      await this.smartAgentTrustFn();
      this.resolveDialog();
    } catch (ex) { }

    this.loading = false;
    this.ref.detectChanges();
  }
}
