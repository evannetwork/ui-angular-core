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

import { lightwallet } from 'dapp-browser';

import {
  Component, OnInit, OnDestroy, // @angular/core
  Router, NavigationEnd,        // @angular/router
  Input, ViewChild, ElementRef,
  Validators, FormBuilder, FormGroup,  // @angular/forms
  AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy
} from 'angular-libs';

import { EvanTranslationService } from '../../services/ui/translate';
import { createOpacityTransition } from '../../animations/opacity';
import { createGrowTransition } from '../../animations/grow';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanBCCService } from '../../services/bcc/bcc';
import { EvanAlertService } from '../../services/ui/alert';

/**************************************************************************************************/

/**
 * Global password component that is used within each Angular DApp. Will be
 * registered in the root.ts in each evan.network featured DApp. Unlocks the
 * current users profile. Should only be used using the modal service!
 * 
 * Usage within root component:
 *   await this.bcc.initialize((accountId) => this.bcc.globalPasswordDialog(accountId));
 *   
 * Directly usage:
 *   password = await this.modalService.createModal(GlobalPasswordComponent, {
 *     core: this.core,
 *     bcc: this,
 *     accountId: accountId
 *   });
 *
 * @class      Component GlobalPasswordComponent
 */
@Component({
  selector: 'global-password',
  templateUrl: 'global-password.html',
  animations: [
    createOpacityTransition(),
    createGrowTransition()
  ]
})
export class GlobalPasswordComponent implements OnInit, AfterViewInit {
  /*****************    variables    *****************/
  /**
   * resolvle function that is applied from modal service
   */
  private resolveDialog: Function;

  /**
   * reject function that is applied from modal service
   */
  private rejectDialog: Function;

  /**
   * remove function that is applied from modal service
   */
  private removeDialog: Function;

  /**
   * used to hide the background using smooth transitions
   */
  private showBackground: boolean;

  /**
   * is the password invald?
   */
  private invalidPassword: boolean;

  /**
   * ngModel for password inptu
   */
  private password: string;

  /**
   * current account id
   */
  private accountId: string;

  /**
   * will be applied from the modal service
   */
  private bcc: EvanBCCService;

  /**
   * will be applied from the modal service
   */
  private core: EvanCoreService;
  
  /**
   * show loading
   */
  private loading: boolean;

  /**
   * password input reference for auto focus
   */
  @ViewChild('passwordInput') private passwordInput: ElementRef;

  /***************** initialization  *****************/
  constructor(
    private alertService: EvanAlertService,
    private formBuilder: FormBuilder,
    private ref: ChangeDetectorRef,
    private translate: EvanTranslationService,
  ) { }

  async ngOnInit() {
    this.ref.detach();
    this.password = '';

    this.core.finishDAppLoading();

    if (window.localStorage['evan-test-password']) {
      this.password = window.localStorage['evan-test-password'];

      this.usePassword();
    }

    this.ref.detectChanges();
  }

  /*****************    functions    *****************/
  async usePassword() {
    if (this.password.length > 7) {
      this.loading = true;
      this.ref.detectChanges();

      // get a new Profile and check with the current password, if the private key can be resolved
      const accountId = this.accountId || this.core.activeAccount();
      const profile = await this.bcc.getProfileForAccount(accountId);

      profile.ipld.keyProvider.setKeysForAccount(
        accountId,
        lightwallet.getEncryptionKeyFromPassword(this.password)
      );

      let targetPrivateKey;
      try {
        targetPrivateKey = await profile.getContactKey(
          accountId,
          'dataKey'
        );
      } catch (ex) { }

      // if a private key can be solved, we used the correct password
      //  => resolve password
      if (targetPrivateKey) {
        // overwrite hide initial loading to imitate the initial screen
        this.core.finishDAppLoading = async () => {
          const backupFinishDAppLoading = this.core.finishDAppLoading;
          this.core.finishDAppLoading = backupFinishDAppLoading;

          this.showBackground = false;
          this.loading = false;
          this.ref.detectChanges();

          // wait for animation finished and remove the dialog
          await this.core.utils.timeout(300);

          this.ref.detectChanges();
          this.removeDialog();
        }

        // disable remove element to handle it by the global-password dialog
        this.resolveDialog(this.password, false);
      } else {
        this.invalidPassword = true;

        this.loading = false;
      }
    }

    this.ref.detectChanges();
  }

  async logout() {
    try {
      await this.alertService.showSubmitAlert(
        '_angularcore.logout',
        '_angularcore.logout-desc',
        '_angularcore.cancel',
        '_angularcore.logout',
      );

      this.core.logout();
    } catch (ex) { }
  }

  ngAfterViewInit() {
    (<any>this.passwordInput)._native.nativeElement.focus();

    this.showBackground = true;
    this.ref.detectChanges();
  }
}
