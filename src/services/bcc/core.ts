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
  web3,
  loading,
  core
} from 'dapp-browser';

import {
  Router,             // '@angular/router';
  OnInit, Injectable, // '@angular/core';
} from 'angular-libs';

import { SingletonService } from '../singleton-service';

import { EvanTranslationService } from '../ui/translate';
import { EvanToastService } from '../ui/toast';
import { EvanUtilService } from '../utils';
import { EvanRoutingService } from '../ui/routing';
import { EvanAlertService } from '../ui/alert';

/**************************************************************************************************/

/**
 * Core service for angular-core that handles dapp-browser connections, active
 * accounts, current provider and more
 *
 * @class      Injectable EvanCoreService
 */
@Injectable()
export class EvanCoreService {
  /**
   * providers that can used
   */
  private validProviders: any;

  /**
   * current web3 instance
   */
  private web3: any;

  /**
   * base url of the evan.network smart agents server
   */
  public agentUrl = 'https://agents.test.evan.network';

  /**
   * load dependency services
   */
  constructor(
    public singleton: SingletonService,
    public translate: EvanTranslationService,
    public utils: EvanUtilService,
    public toast: EvanToastService,
    public routingService: EvanRoutingService,
    public alertService: EvanAlertService
  ) {
    this.web3 = web3;

    this.validProviders = [
      'metamask',
      'internal',
    ];

    // save current account to local storage to acces it from services without cross references
    this.activeAccount();
  }

  /**
   * Hides the initial loading that is embedded to the root dapp html page. =>
   * It will disappear smooth and will be removed when animation is over
   */
  finishDAppLoading() {
    loading.finishDAppLoading();
  }

  /**
   * Get the current configured current provider
   *
   * @return     {string}  The current provider.
   */
  getCurrentProvider(): string {
    return core.getCurrentProvider();
  }

  /**
   * Check if we should use internal provider.
   *
   * @return     {boolean}  True if internal provider, False otherwise.
   */
  isInternalProvider(): boolean  {
    return core.isInternalProvider();
  }

  /**
   * Checks if a injected web3 provider exists an returns it's name
   */
  getExternalProvider() {
    return core.getExternalProvider();
  }

  /**
   * Sets the current provider that should be used.
   *
   * @param      {string}  provider  provider to switch to
   */
  setCurrentProvider(provider: string) {
    core.setCurrentProvider(provider);
  }

  /**
   * Get the current selected account included the check of the current
   * provider.
   *
   * @return     {string}  active account
   */
  activeAccount(): string {
    return core.activeAccount();
  }

  /**
   * Returns the current saved account id
   *
   * @return     {string}  get account id from local storage
   */
  getAccountId(): string {
    return core.getAccountId();
  }

  /**
   * Sets an account id as active one to the local storage.
   *
   * @param      {string}  accountId  account id to set
   */
  setAccountId(accountId: string) {
    core.setAccountId(accountId);
  }

  /**
   * Checks if an external provider is activated and returns it's active account
   * id
   *
   * @return     {string}  The external account.
   */
  getExternalAccount(): string {
    return core.getExternalAccount();
  }

  /**
   * Return the name of the current used browser =>
   * https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
   *
   * @return     {string}  opera / firefox / safari / ie / edge / chrome
   */
  currentBrowser() {
    return core.currentBrowser();
  }

  /**
   * Get the balance of the current active or given account
   *
   * @param      {string}           accountId  account id to get the balance for
   * @return     {Promise<number>}  The balance.
   */
  getBalance(accountId = this.activeAccount()): Promise<number> {
    return core.getBalance(accountId);
  }

  /**
   * Logout the current user. Removes the active account, provider and terms of use acceptance.
   */
  logout() {
    core.logout();
  }

  /**
   * Copes a string into the users clipboard and shows an toast, including the copied text
   *
   * @param      {string}  stringToCopy  text that should be copied
   * @param      {string}  toastMessage  Provide a custom toast message
   */
  copyString(stringToCopy: string, toastMessage?: string) {
    const $temp: any = document.createElement('input');

    document.body.appendChild($temp);

    $temp.value = stringToCopy;
    $temp.select();

    document.execCommand('copy');

    document.body.removeChild($temp);

    toastMessage = toastMessage || this.translate.instant('_angularcore.copied', {
      stringToCopy
    }) || '';

    if (toastMessage.length > 100) {
      toastMessage = toastMessage.slice(0, 97) + '...';
    }

    this.toast.showToast({
      message: toastMessage,
      duration: 2000
    });
  }
}
