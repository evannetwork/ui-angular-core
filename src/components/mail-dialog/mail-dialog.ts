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
  Input, ChangeDetectionStrategy, ChangeDetectorRef,
  Validators, FormBuilder, FormGroup,  // @angular/forms
} from 'angular-libs';

import { EvanAddressBookService } from '../../services/bcc/address-book';
import { EvanTranslationService } from '../../services/ui/translate';
import { createOpacityTransition } from '../../animations/opacity';
import { AsyncComponent } from '../../classes/AsyncComponent';

/**************************************************************************************************/

/**
 * Used within an modal to enable the user to edit a mail, before it's send
 * 
 * Usage:
 *   await this.mailboxService
 *     .showMailModal(
 *       this.modalService,
 *       '_dappcontacts.invitation-message',
 *       '_dappcontacts.invitation-message-long',
 *       '_dappcontacts.invitation-text.title',
 *       '_dappcontacts.invitation-text.body',
 *     );
 *
 * @class      Component MailDialogComponent
 */
@Component({
  selector: 'mail-dialog',
  templateUrl: 'mail-dialog.html',
  animations: [
    createOpacityTransition()
  ]
})
export class MailDialogComponent extends AsyncComponent {
  /*****************    variables    *****************/
  /**
   * text that should be displayed as description
   */
  private alertText: string;

  /**
   * title of the modal
   */
  private alertTitle: string;

  /**
   * mail body predefined text
   */
  private body: string;

  /**
   * form definition for input evaluations
   */
  private mailForm: FormGroup;

  /**
   * resolvle function that is applied from modal service
   */
  private resolveDialog: Function;

  /**
   * reject function that is applied from modal service
   */
  private rejectDialog: Function;

  /**
   * mail title predefined value
   */
  private title: string;

  /***************** initialization  *****************/
  constructor(
    private addressBook: EvanAddressBookService,
    private formBuilder: FormBuilder,
    private translate: EvanTranslationService,
    private ref: ChangeDetectorRef
  ) {
    super(ref);
  }

  /**
   * setup mail dialog form
   */
  async _ngOnInit() {
    const activeUserName = await this.addressBook.activeUserName();
    this.mailForm = this.formBuilder.group({
      fromAlias: [
        activeUserName,
        Validators.required
      ],
      title: [
        this.translate.instant(this.title),
        Validators.required
      ],
      body: [
        this.translate.instant(this.body, {
          fromName: activeUserName
        }),
        Validators.required
      ]
    });

    this.mailForm.valueChanges.subscribe(() => this.ref.detectChanges());
  }
}
