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

import * as CoreBundle from 'bcc';
import * as SmartContracts from 'smart-contracts';
import {
  bccHelper,
  config,
  dapp,
  getCoreOptions,
  getDomainName,
  ipfs,
  lightwallet,
  System,
} from 'dapp-browser';

import {
  Component, OnInit, OnDestroy, // @angular/core
  Router, NavigationEnd,        // @angular/router
  Input, ViewChild, ElementRef,
  Validators, FormBuilder, FormGroup,  // @angular/forms
  AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy,
  Http
} from 'angular-libs';

import { createGrowTransition } from '../../animations/grow';
import { createOpacityTransition } from '../../animations/opacity';
import { EvanAlertService } from '../../services/ui/alert';
import { EvanBCCService } from '../../services/bcc/bcc';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanOnboardingService } from '../../services/bcc/onboarding';
import { EvanTranslationService } from '../../services/ui/translate';

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
  selector: 'terms-of-use',
  templateUrl: 'terms-of-use.html',
  animations: [
    createOpacityTransition(),
    createGrowTransition()
  ]
})
export class EvanTermsOfUseComponent implements OnInit, AfterViewInit {
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
   * current terms of use specification
   */
  private termsOfUse: string;

  /**
   * if the terms of use could not be accepted, show an error message!
   */
  private error: any;

  /**
   * Url to the faucet agent server.
   */
  private faucetAgentUrl: string = 'https://agents.test.evan.network';

  /**
   * base endpoint for identity create
   */
  private faucetEndPoint: string = 'api/smart-agents/faucet';

  /***************** initialization  *****************/
  constructor(
    private alertService: EvanAlertService,
    private formBuilder: FormBuilder,
    private http: Http,
    private ref: ChangeDetectorRef,
    private translate: EvanTranslationService,
  ) { }

  async ngOnInit() {
    this.termsOfUse = await this.loadTermsOfUse();
    this.ref.detach();
    this.ref.detectChanges();
  }

  ngAfterViewInit() {
    // check if currently a password dialog is opened, so remove it!  
    const passwordDialogs = document.querySelectorAll('global-password');
    if (passwordDialogs.length > 0) {
      passwordDialogs[0].parentElement.removeChild(passwordDialogs[0]);
    }

    this.showBackground = true;
    this.ref.detectChanges();
  }

  /*****************    functions    *****************/
  /**
   * Load the terms of for the current chain the current language.
   */
  async loadTermsOfUse() {
    // load the terms of use origin url
    const termsOfUseEns = `termsofuse.${ getDomainName() }`;
    const termsOfUseDbcp = await System.import(`${ termsOfUseEns }!ens`);
    const termsOfUseOrigin = dapp.getDAppBaseUrl(termsOfUseDbcp, termsOfUseEns);
    const ipfsHost = ipfs.ipfsConfig.host;

    // multiple url's that can be requested one after another to fallback current runtime configurations
    const fallbacks = [
      // load from current ipfs host the current language, else fallback to english
      `${ termsOfUseOrigin }/${ ipfsHost }/${ this.translate.getCurrentLang() }.html`,
      `${ termsOfUseOrigin }/${ ipfsHost }/en.html`,
      // if a not registered ipfs host is requested, load the current language for mainnet, else
      // fallback to en
      `${ termsOfUseOrigin }/storage.evan.network/${ this.translate.getCurrentLang() }.html`,
      `${ termsOfUseOrigin }/storage.evan.network/en.html`,
    ];

    // try to load the terms of use for the current language, if this is not available, load the 
    // next fallback
    for (let i = 0; i < fallbacks.length; i++) {
      try {
        return await this.http
          .get(fallbacks[i])
          .map((res) => res.text())
          .toPromise();
      } catch (ex) { }
    }
  }

  /**
   * Accept the new terms of use.
   *
   * @return     {Promise<void>}  resolved when done
   */
  private async acceptTermsOfUse() {
    this.loading = true;
    this.ref.detectChanges();

    try {
      const activeAccount = this.core.activeAccount();
      // load the current terms of use ipfs that must be signed for a validity check
      const termsOfUseIpfs = (await this.http
        .get(`${ this.core.agentUrl }/api/smart-agents/faucet/terms-of-use/get`)
        .toPromise()
      ).json().results;
      // load my private key for signing
      const privateKey = await lightwallet.getPrivateKey(await lightwallet.loadUnlockedVault(),
        activeAccount);

      if (!(await this.bcc.verifications.identityAvailable(activeAccount))) {
        await this.requestFaucetAgent(
          'identity/create', { accountIdChild: this.core.activeAccount() });
      }
      
      // accept the new terms of use
      await this.http
        .post(`${ this.core.agentUrl }/api/smart-agents/faucet/terms-of-use/accept`, {
          accountId: activeAccount,
          // sign the accept terms of use message 
          signature: this.bcc.web3.eth.accounts.sign(termsOfUseIpfs, `0x${ privateKey }`).signature
        })
        .toPromise();

      // disable remove element to handle it by the global-password dialog
      this.resolveDialog(null, 500);
    } catch (ex) {
      this.error = ex;
    }

    this.loading = false;
    this.ref.detectChanges();
  }

  /**
   * Send a rest get request to the faucet agent using the corresponding new build headers.
   *
   * @param      {string}        endPoint  endpoint that should be called
   * @return     {Promise<any>}  json result of the request
   */
  private async requestFaucetAgent(endPoint: string, search = {}): Promise<any> {
    const activeAccount = this.core.activeAccount();
    const message = new Date().getTime();
    const signature = await this.signMessage(message.toString(10), activeAccount);
    const headers = {
      authorization: [
        `EvanAuth ${ activeAccount }`,
        `EvanMessage ${ message }`,
        `EvanSignedMessage ${ signature }`
      ].join(',')
    };

    return (await this.http
      .get(`${ this.faucetAgentUrl }/${ this.faucetEndPoint }/${ endPoint }`, { headers,search })
      .toPromise()
    ).json();
  }

  /**
   * Sign a message for a specific account
   *
   * @param      {string}  msg      message that should be signed
   * @param      {string}  account  account id to sign the message with (default = activeAccount)
   * @return     {string}  signed message signature
   */
  private async signMessage(msg: string, account: string = this.core.activeAccount()): Promise<string> {
    const signer = account.toLowerCase();
    const pk = await this.bcc.executor.signer.accountStore.getPrivateKey(account);

    return this.bcc.web3.eth.accounts.sign(msg, '0x' + pk).signature;
  }
}