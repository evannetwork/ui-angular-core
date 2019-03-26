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

import * as bcc from 'bcc';
import * as SmartContracts from 'smart-contracts';
import {
  AccountStore,
  bccHelper,
  config,
  core,
  getCoreOptions,
  getDomainName,
  getLatestKeyProvider,
  KeyProvider,
  lightwallet,
  queue,
  routing,
  System,
  updateCoreRuntime,
  web3,
  web3Helper,
} from 'dapp-browser';

import {
  Router,             // '@angular/router';
  OnInit, Injectable, // '@angular/core';
  NgZone,
  Injector,
} from 'angular-libs';

import { GlobalPasswordComponent } from '../../components/global-password/global-password';
import { EvanTermsOfUseComponent } from '../../components/terms-of-use/terms-of-use';

import { EvanCoreService } from './core';
import { EvanToastService } from '../ui/toast';
import { EvanTranslationService } from '../ui/translate';
import { EvanUtilService } from '../utils';
import { SingletonService } from '../singleton-service';
import { EvanModalService } from '../ui/modal';

/**************************************************************************************************/

/**
 * Core blockchain-core angular-core wrapper. Initializes and extends new
 * runtimes from dapp-browser, when user unlocked successfully its account, to
 * handle correct user encryption keys and object instances
 *
 * @class      Injectable EvanBCCService
 */
@Injectable()
export class EvanBCCService {
  /**
   * metamask web3 instance (copy from window for quicker access)
   */
  private metamaskWeb3: any;

  /**
   * wait for password dialog to be resolved
   */
  private passwordModalPromise: any;

  /**
   * wait for terms of use dialog to be resolved
   */
  private termsOfUseModalPromise: any;

  /**
   * wait for bcc is updated to be resolved
   */
  public updateBCCPromise: any;

  /**
   * blockchain-core original properties. Mapped from e.g
   * BCC.coreInstance.executor => this.executor
   */
  public config: any;
  public contractLoader: any;
  public contracts: any;
  public CoreBundle: any;
  public coreRuntime: any;
  public cryptoProvider: any;
  public dataContract: bcc.DataContract;
  public description: any;
  public dfs: any;
  public executor: any;
  public ipldInstance: any;
  public keyExchange: any;
  public keyProvider: any;
  public mailbox: any;
  public nameResolver: any;
  public payments: any;
  public profile: any;
  public ProfileBundle: any;
  public profileRuntime: any;
  public rightsAndRoles: bcc.RightsAndRoles;
  public serviceContract: bcc.ServiceContract;
  public sharing: bcc.Sharing;
  public uiEvents: any;
  public verifications: bcc.Verifications;
  public web3: any;

  /**
   * initialize and make it standalone
   */
  constructor(
    private _ngZone: NgZone,
    private injector: Injector,
    private modalService: EvanModalService,
    private utils: EvanUtilService,
    public core: EvanCoreService,
    public singleton: SingletonService,
  ) {
    return singleton.create(EvanBCCService, this);
  }

  /**
   * Initialize the bcc service using a password unlocking function.
   *
   * Usage (used in every DApp RootComponent):
   *   await this.bcc.initialize((accountId) => this.bcc.globalPasswordDialog(accountId));
   *
   * @param      {Function}       passwordFunction  function that is used to
   *                                                unlock current lightwallet
   *                                                vault
   * @return     {Promise<void>}  resolved when bcc was updated for the current
   *                              profile
   */
  async initialize(passwordFunction?: Function): Promise<void> {
    if (passwordFunction) {
      lightwallet.setPasswordFunction(passwordFunction);
    }

    if (!bccHelper.profileRuntimes[bcc.instanceId]) {
      await this.updateBCC();
      await this.updateTermsOfUse();
    } else {
      this.copyProfileToInstance();
    }
  }

  /**
   * Copy BCC profile object instances into the service this scope.
   */
  copyProfileToInstance() {
    const runtime = bccHelper.profileRuntimes[bcc.instanceId] ||
      bccHelper.coreRuntimes[bcc.instanceId];
    this.profileRuntime = runtime;
    this.coreRuntime = runtime;
    this.CoreBundle = bcc;

    this.config = config;
    this.web3 = runtime.web3;
    this.contractLoader = runtime.contractLoader;
    this.executor = runtime.executor;
    this.description = runtime.description;
    this.nameResolver = runtime.nameResolver;
    this.cryptoProvider = this.description.cryptoProvider;
    this.contracts = runtime.contracts;
    this.dfs = runtime.dfs;
    this.dataContract = runtime.dataContract;
    this.ipldInstance = runtime.ipldInstance;
    this.keyExchange = runtime.keyExchange;
    this.keyProvider = runtime.keyProvider;
    this.mailbox = runtime.mailbox;
    this.profile = runtime.profile;
    this.ProfileBundle = bcc;
    this.serviceContract = runtime.serviceContract;
    this.sharing = runtime.sharing;
    this.verifications = runtime.verifications;
    this.payments = runtime.payments;
  }

  /**
   * Returns the existing executor or creates a new one, for the active current
   * provider.
   *
   * @param      {string}                        provider  The provider
   * @return     {ProfileBundle.SignerInternal}  The signer.
   */
  getSigner(provider = this.core.getCurrentProvider()): bcc.SignerInternal {
    return bccHelper.getSigner(bcc, provider, new AccountStore());
  }


  /**
   * Returns a new rights and roles object instance.
   *
   * @return     {CoreBundle.RightsAndRoles}  The rights and roles object
   */
  getRightsAndRolesObj(): bcc.RightsAndRoles {
    return new bcc.RightsAndRoles({
      contractLoader: this.contractLoader,
      executor: this.executor,
      nameResolver: this.nameResolver,
      web3: this.web3,
      logLog: bcc.logLog,
      logLogLevel: bcc.logLogLevel
    });
  }

  /**
   * Setup / update initial blockchain-core structure for current account id and
   * signer.
   *
   * @param      {string}         activeAccount  current active account
   * @param      {provider}       provider       internal / external
   * @param      {boolean}        disableKeys    disable keyProvider.setKeys /
   *                                             this.setExchangeKeys, used for
   *                                             disabling key setting, only
   *                                             early ui states
   * @return     {Promise<void>}  solved when bcc is updated
   */
  async updateBCC(
    activeAccount = this.core.activeAccount(),
    provider = this.core.getCurrentProvider(),
    disableKeys?: boolean
  ) {
    this.updateBCCPromise = await new Promise(async (resolve, reject) => {
      // start bcc setup
      const coreOptions = await getCoreOptions(bcc, SmartContracts, provider);
      const coreRuntime = bccHelper.coreRuntimes[bcc.instanceId];

      this.copyProfileToInstance();

      // check if no user is logged in and a bcc should be initialized
      let loggedIn = core.getAccountId();
      let isOnboard = false;
      if (loggedIn) {
        // check if the current available account is onboared
        try {
          isOnboard = await bccHelper.isAccountOnboarded(core.getAccountId());
        } catch (ex) { }
      }

      // if no user is selected / the active user isn't onboarded and we are currently not loading the
      // onboarding, navigate their
      if (!isOnboard && !routing.isOnboarding()) {
        return routing.goToOnboarding();
      }

      if (activeAccount) {
        const bccProfileOptions: any = {
          accountId: activeAccount,
          CoreBundle: bcc,
          coreOptions: coreOptions,
          keyProvider: getLatestKeyProvider(),
          signer: this.getSigner(provider),
          SmartContracts: SmartContracts
        };
        
        // load private and encryption keys
        let unlockedVault: any = { };
        let privateKey;
        if (!disableKeys && provider !== 'agent-executor') {
          unlockedVault = await lightwallet.loadUnlockedVault();
          privateKey = await lightwallet.getPrivateKey(unlockedVault, activeAccount);
          coreOptions.config.accountMap = { };
          coreOptions.config.accountMap[activeAccount] = privateKey;
        }

        // use account store from signer or use a new one
        bccProfileOptions.accountStore = bccProfileOptions.signer.accountStore ||
          new AccountStore();
        bccProfileOptions.accountStore.accounts = coreOptions.config.accountMap;

        // if we are loading all data via an smart-agent, we need to create a new ExecutorAgent
        if (provider === 'agent-executor') {
          const agentExecutor = await core.getAgentExecutor();

          bccProfileOptions.executor = new bcc.ExecutorAgent({
            agentUrl: agentExecutor.agentUrl,
            config: {},
            contractLoader: coreRuntime.contractLoader,
            logLog: bcc.logLog,
            logLogLevel: bcc.logLogLevel,
            signer: bccProfileOptions.signer,
            token: agentExecutor.token,
            web3: this.web3,
          });
        }

        // initialize bcc for an profile
        const bccProfile = await bccHelper.createDefaultRuntime(
          bcc,
          activeAccount,
          unlockedVault.encryptionKey,
          privateKey,
          JSON.parse(JSON.stringify(coreOptions.config)),
          coreRuntime.web3,
          coreRuntime.dfs,
          bccProfileOptions
        );
        bccHelper.profileRuntimes[bcc.instanceId] = bccProfile;

        this.copyProfileToInstance();

        // load rightsAndRoles object for the current account
        this.rightsAndRoles = this.getRightsAndRolesObj();

        if (provider === 'metamask') {
          this.coreRuntime.executor.eventHub.eventWeb3 = (<any>window).web3;
          this.profileRuntime.executor.eventHub.eventWeb3 = (<any>window).web3;
        }

        if (!disableKeys) {
          if (provider !== 'agent-executor') {
            this.keyProvider.init(bccProfile.profile);
          }

          await this.keyProvider.setKeys();
          try {
            await this.setExchangeKeys(activeAccount);
          } catch (ex) { }
        }
      }

      this.utils.sendEvent('evan-core-setup');

      // update dapp queue entries
      queue.updateQueue();

      resolve();
    });
  }

  /**
    * Check the terms of use has changed and if the current user accepted it.
    *
    * @param      {string}         activeAccount  current active account
    * @return     {Promise<void>}  resolved when done
    */
  async updateTermsOfUse(activeAccount = this.core.activeAccount(), provider = this.core.getCurrentProvider()) {
    if (activeAccount && provider !== 'agent-executor') {
      let newTermsOfUse = true;

      // check if the verification management is missing, then it's an old account and the terms of
      // use must be accepted and an identity must be created.
      if (await this.verifications.identityAvailable(activeAccount)) {
        // load the origin of the current terms of use dapp and check if a '/evan/onboarding/termsofuse'
        // verification for the current user exists for this origin hash, else, it has been changed and
        // needs to be accepted again
        const termsOfUseEns = `termsofuse.${ getDomainName() }`;
        const termsOfUseOrigin = (await this.description.getDescription(termsOfUseEns)).public.dapp
          .origin;
        const termsOfUseVerifications = await this.verifications.getVerifications(
          this.core.activeAccount(), `/evan/onboarding/termsofuse-${ termsOfUseOrigin }`);

        // iterate through all verifications and check, if this terms of use verification is issued by
        // the faucet agent
        for (let i = 0; i < termsOfUseVerifications.length; i++) {
          // extract the issuer account
          const verification = termsOfUseVerifications[i];
          const subjectIdentity = await this.verifications.getIdentityForAccount(verification.subject,
            true);
          const dataHash = this.nameResolver
            .soliditySha3(subjectIdentity, verification.topic, verification.data)
            .replace('0x', '');
          const issuerAccount = this.executor.web3.eth.accounts.recover(dataHash,
            verification.signature);

          // check if the user has accepted the latest terms of use and if the terms of use
          // verification is issued by the faucet agetn
          if (issuerAccount === config.faucetAccount) {
            newTermsOfUse = false;
            break;
          }
        }
      }

      // if new terms of use are available, load the terms of use and show them, so the user can
      // read and accept them
      if (newTermsOfUse) {
        await new Promise((resolve) => {
          this._ngZone.run(async () => {
            // let the user update the terms of use
            if (!this.termsOfUseModalPromise) {
              this.termsOfUseModalPromise = this.modalService.createModal(EvanTermsOfUseComponent, {
                bcc: this,
                core: this.core,
              });
            }

            // wait to be finished
            await this.termsOfUseModalPromise;
            this.termsOfUseModalPromise = null;

            resolve();
          })
        }) 
      }
    }
  }

  /**
   * Returns an new blockchain-core profile instance. !Attention : It's only
   * builded for load values to check for public and private keys (e.g. used by
   * onboarding or global-password) Executor is the normal one from the global
   * core!!!
   *
   * @param      {string}                 accountId  account id to create a new
   *                                                 profile instance for
   * @return     {ProfileBundle.Profile}  The profile for account.
   */
  public getProfileForAccount(accountId: string, password: string = 'unencrypted'): bcc.Profile {
    const keyProvider = new KeyProvider(
      this.utils.deepCopy(getLatestKeyProvider().keys),
      accountId,
    );

    const cryptoProvider = new bcc.CryptoProvider({
      unencrypted: new bcc.Unencrypted(),
      aes: new bcc.Aes(),
      aesEcb: new bcc.AesEcb(),
      logLog: bcc.logLog,
      logLogLevel: bcc.logLogLevel
    });

    // set dummy encryption keys to prevent password dialog
    // !Attention : Only public key can be get! If you want to get crypted values
    //              set it by yourself
    keyProvider.setKeysForAccount(
      accountId,
      lightwallet.getEncryptionKeyFromPassword(accountId, 'unencrypted')
    );

    const ipldInstance = new bcc.Ipld({
      'ipfs': this.coreRuntime.dfs,
      'keyProvider': keyProvider,
      'cryptoProvider': cryptoProvider,
      defaultCryptoAlgo: 'aes',
      nameResolver: this.nameResolver,
      originator: accountId,
      logLog: bcc.logLog,
      logLogLevel: bcc.logLogLevel
    });

    const sharing = new bcc.Sharing({
      contractLoader: this.contractLoader,
      cryptoProvider: cryptoProvider,
      description: this.description,
      executor: this.executor,
      dfs: this.coreRuntime.dfs,
      keyProvider: keyProvider,
      nameResolver: this.nameResolver,
      defaultCryptoAlgo: 'aes',
      logLog: bcc.logLog,
      logLogLevel: bcc.logLogLevel
    });

    const dataContract = new bcc.DataContract({
      cryptoProvider: cryptoProvider,
      dfs: this.coreRuntime.dfs,
      executor: this.executor,
      loader: this.contractLoader,
      nameResolver: this.nameResolver,
      sharing: sharing,
      web3: this.web3,
      description: this.description,
      logLog: bcc.logLog,
      logLogLevel: bcc.logLogLevel
    });

    const evanProfile = new bcc.Profile({
      ipld: ipldInstance,
      nameResolver: this.nameResolver,
      defaultCryptoAlgo: 'aes',
      executor: this.executor,
      contractLoader: this.contractLoader,
      accountId: accountId,
      dataContract,
      logLog: bcc.logLog,
      logLogLevel: bcc.logLogLevel
    });

    keyProvider.profile = evanProfile;

    return evanProfile;
  }

  /**
   * run keyExchange.setPublicKey
   *
   * @param      {string}  accountId  Account id to set the exchange keys for
   */
  async setExchangeKeys(accountId = this.core.activeAccount()) {
    const targetPubKey = await this.profile.getPublicKey();
    const targetPrivateKey = await this.profile.getContactKey(
      accountId,
      'dataKey'
    );

    if (!!targetPrivateKey) {
      this.keyExchange.setPublicKey(targetPubKey, targetPrivateKey);
    }
  }

  /**
   * Returns a new web3 instances. If a web3 currentProvider is provided, it
   * will be used.
   *
   * @return     {Web3}  window.web3
   */
  getMetamaskWeb3() {
    if (!this.metamaskWeb3) {
      if ((<any>window).web3) {
        const newWeb3 = new web3Helper.getWeb3Instance();
        const existingWeb3 = (<any>window).web3;

        newWeb3.setProvider(existingWeb3.currentProvider);

        newWeb3.eth.defaultAccount = existingWeb3.eth.defaultAccount;

        this.metamaskWeb3 = newWeb3;
      }
    }

    return this.metamaskWeb3;
  }

  /**
   * Get the existing web3 or metamask web3.
   *
   * @param      {provider}  provider  internal, metamask
   * @return     {Web3}  this.web3 / this.getMetamaskWeb3
   */
  getWeb3(provider = this.core.getCurrentProvider()) {
    if (provider === 'metamask') {
      return this.getMetamaskWeb3();
    } else {
      return this.web3;
    }
  }

  /**
   * builds full domain name
   *
   * @param      {Array<string>}  subLabels  used to enhance nameResolver config
   * @return     {<type>}         The domain name.
   */
  getDomainName(subLabels?: Array<string>): string {
    return getDomainName(subLabels);
  }

  /**
   * angular-core default password dialog function that is used for lightwallet
   * unlocking.
   *
   * @param      {string}           accountId  account id to load password for
   * @return     {Promise<string>}  the password
   */
  async globalPasswordDialog(accountId?: string): Promise<string> {
    let password;

    await new Promise((resolve) => {
      this._ngZone.run(async () => {
        if (this.passwordModalPromise) {
          password = await this.passwordModalPromise;
        } else {
          this.passwordModalPromise = this.modalService.createModal(GlobalPasswordComponent, {
            accountId: accountId,
            bcc: this,
            core: this.core,
          });

          password = await this.passwordModalPromise;
          this.passwordModalPromise = false;
        }

        resolve();
      })
    })

    return password;
  }
}