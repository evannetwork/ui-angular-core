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
import * as ProfileBundle from 'bcc';
import * as SmartContracts from 'smart-contracts';
import {
  AccountStore,
  config,
  core,
  getCoreOptions,
  getDomainName,
  getLatestKeyProvider,
  KeyProvider,
  lightwallet,
  queue,
  routing,
  updateCoreRuntime,
  web3,
  web3Helper,
} from 'dapp-browser';

import {
  Router,             // '@angular/router';
  OnInit, Injectable, // '@angular/core';
  NgZone,
} from 'angular-libs';

import { GlobalPasswordComponent } from '../../components/global-password/global-password';

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
   * wait for bcc is updated to be resolved
   */
  public updateBCCPromise: any;

  /**
   * blockchain-core original properties. Mapped from e.g
   * BCC.coreInstance.executor => this.executor
   */
  public verifications: ProfileBundle.Verifications;
  public config: any;
  public contractLoader: any;
  public contracts: any;
  public CoreBundle: any;
  public cryptoProvider: any;
  public dataContract: ProfileBundle.DataContract;
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
  public rightsAndRoles: CoreBundle.RightsAndRoles;
  public serviceContract: ProfileBundle.ServiceContract;
  public sharing: ProfileBundle.Sharing;
  public uiEvents: any;
  public web3: any;

  /**
   * initialize and make it standalone
   */
  constructor(
    private _ngZone: NgZone,
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

    if (!ProfileBundle.ProfileRuntime) {
      await this.updateBCC();
    } else {
      this.copyCoreToInstance();
      this.copyProfileToInstance();
    }
  }

  /**
   * Copy BCC core object instances into the service this scope.
   */
  copyCoreToInstance() {
    this.config = config;
    this.web3 = CoreBundle.CoreRuntime.web3;
    this.contractLoader = CoreBundle.CoreRuntime.contractLoader;
    this.executor = CoreBundle.CoreRuntime.executor;
    this.description = CoreBundle.CoreRuntime.description;
    this.nameResolver = CoreBundle.CoreRuntime.nameResolver;
    this.cryptoProvider = this.description.cryptoProvider;
    this.contracts = CoreBundle.CoreRuntime.contracts;
    this.dfs = CoreBundle.CoreRuntime.dfs;

    this.CoreBundle = CoreBundle;
  }
  /**
   * Copy BCC profile object instances into the service this scope.
   */
  copyProfileToInstance() {
    this.dataContract = ProfileBundle.ProfileRuntime.dataContract;
    this.ipldInstance = ProfileBundle.ProfileRuntime.ipldInstance;
    this.keyExchange = ProfileBundle.ProfileRuntime.keyExchange;
    this.keyProvider = ProfileBundle.ProfileRuntime.keyProvider;
    this.mailbox = ProfileBundle.ProfileRuntime.mailbox;
    this.profile = ProfileBundle.ProfileRuntime.profile;
    this.ProfileBundle = ProfileBundle;
    this.serviceContract = ProfileBundle.ProfileRuntime.serviceContract;
    this.sharing = ProfileBundle.ProfileRuntime.sharing;
    this.verifications = ProfileBundle.ProfileRuntime.verifications;
    this.payments = ProfileBundle.ProfileRuntime.payments;
  }

  /**
   * Returns the existing executor or creates a new one, for the active current
   * provider.
   *
   * @param      {string}                        provider  The provider
   * @return     {ProfileBundle.SignerInternal}  The signer.
   */
  getSigner(provider = this.core.getCurrentProvider()): ProfileBundle.SignerInternal {
    let signer;
    if (provider === 'internal') {
      signer = new ProfileBundle.SignerInternal({
        accountStore: new AccountStore(),
        config: { },
        contractLoader: CoreBundle.CoreRuntime.contractLoader,
        web3: CoreBundle.CoreRuntime.web3,
        logLog: CoreBundle.logLog,
        logLogLevel: CoreBundle.logLogLevel
      });
    } else {
      signer = new ProfileBundle.SignerExternal({
        logLog: CoreBundle.logLog,
        logLogLevel: CoreBundle.logLogLevel
      });
    }

    return signer;
  }


  /**
   * Returns a new rights and roles object instance.
   *
   * @return     {CoreBundle.RightsAndRoles}  The rights and roles object
   */
  getRightsAndRolesObj(): CoreBundle.RightsAndRoles {
    return new CoreBundle.RightsAndRoles({
      contractLoader: this.contractLoader,
      executor: this.executor,
      nameResolver: this.nameResolver,
      web3: this.web3,
      logLog: CoreBundle.logLog,
      logLogLevel: CoreBundle.logLogLevel
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
      // check if no user is logged in and a bcc should be initialized
      let loggedIn = core.getAccountId();
      let isOnboard = false;
      if (loggedIn) {
        // check if the current available account is onboared
        try {
          isOnboard = await CoreBundle.isAccountOnboarded(core.getAccountId());
        } catch (ex) { }
      }

      // if no user is selected / the active user isn't onboarded and we are currently not loading the
      // onboarding, navigate their
      if (!isOnboard && !routing.isOnboarding()) {
        return routing.goToOnboarding();
      }

      // start bcc setup
      const coreOptions = await getCoreOptions(CoreBundle, SmartContracts, provider);
      await CoreBundle.createAndSetCore(coreOptions);

      // set core bundle instance to this scope to use it within getSigner
      this.copyCoreToInstance();

      if (activeAccount) {
        const bccProfileOptions: any = {
          accountId: activeAccount,
          CoreBundle: CoreBundle,
          coreOptions: coreOptions,
          keyProvider: getLatestKeyProvider(),
          signer: this.getSigner(provider),
          SmartContracts: SmartContracts
        };

        // use account store from signer or use a new one
        bccProfileOptions.accountStore = bccProfileOptions.signer.accountStore ||
          new AccountStore();

        // if we are loading all data via an smart-agent, we need to create a new ExecutorAgent
        if (provider === 'agent-executor') {
          const agentExecutor = await core.getAgentExecutor();

          bccProfileOptions.executor = new CoreBundle.ExecutorAgent({
            agentUrl: agentExecutor.agentUrl,
            config: {},
            contractLoader: CoreBundle.CoreRuntime.contractLoader,
            logLog: CoreBundle.logLog,
            logLogLevel: CoreBundle.logLogLevel,
            signer: bccProfileOptions.signer,
            token: agentExecutor.token,
            web3: this.web3,
          });
        }

        // initialize bcc for an profile
        const bccProfile = ProfileBundle.createAndSet(bccProfileOptions);
        this.copyProfileToInstance();
        this.copyCoreToInstance();

        // load rightsAndRoles object for the current account
        this.rightsAndRoles = this.getRightsAndRolesObj();

        if (provider === 'metamask') {
          ProfileBundle.ProfileRuntime.coreInstance.executor.eventHub.eventWeb3 = (<any>window).web3;
        }

        if (!disableKeys) {
          await this.keyProvider.setKeys();
          await this.setExchangeKeys(activeAccount);
        }
      }

      this.utils.sendEvent('evan-core-setup');

      // update dapp queue entries
      queue.updateQueue();

      resolve();
    });
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
  public getProfileForAccount(accountId: string): ProfileBundle.Profile {
    const keyProvider = new KeyProvider(
      this.utils.deepCopy(getLatestKeyProvider().keys),
      accountId,
    );

    const cryptoProvider = new CoreBundle.CryptoProvider({
      unencrypted: new CoreBundle.Unencrypted(),
      aes: new ProfileBundle.Aes(),
      aesEcb: new ProfileBundle.AesEcb(),
      logLog: CoreBundle.logLog,
      logLogLevel: CoreBundle.logLogLevel
    });

    // set dummy encryption keys to prevent password dialog
    // !Attention : Only public key can be get! If you want to get crypted values
    //              set it by yourself
    keyProvider.setKeysForAccount(
      accountId,
      lightwallet.getEncryptionKeyFromPassword(accountId, 'unencrypted')
    );

    const ipldInstance = new ProfileBundle.Ipld({
      'ipfs': CoreBundle.CoreRuntime.dfs,
      'keyProvider': keyProvider,
      'cryptoProvider': cryptoProvider,
      defaultCryptoAlgo: 'aes',
      originator: accountId,
      logLog: CoreBundle.logLog,
      logLogLevel: CoreBundle.logLogLevel
    });

    const sharing = new ProfileBundle.Sharing({
      contractLoader: this.contractLoader,
      cryptoProvider: cryptoProvider,
      description: this.description,
      executor: this.executor,
      dfs: CoreBundle.CoreRuntime.dfs,
      keyProvider: keyProvider,
      nameResolver: this.nameResolver,
      defaultCryptoAlgo: 'aes',
      logLog: CoreBundle.logLog,
      logLogLevel: CoreBundle.logLogLevel
    });

    const dataContract = new ProfileBundle.DataContract({
      cryptoProvider: cryptoProvider,
      dfs: CoreBundle.CoreRuntime.dfs,
      executor: this.executor,
      loader: this.contractLoader,
      nameResolver: this.nameResolver,
      sharing: sharing,
      web3: this.web3,
      description: this.description,
      logLog: CoreBundle.logLog,
      logLogLevel: CoreBundle.logLogLevel
    });

    const evanProfile = new ProfileBundle.Profile({
      ipld: ipldInstance,
      nameResolver: this.nameResolver,
      defaultCryptoAlgo: 'aes',
      executor: this.executor,
      contractLoader: this.contractLoader,
      accountId: accountId,
      dataContract,
      logLog: CoreBundle.logLog,
      logLogLevel: CoreBundle.logLogLevel
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
            core: this.core,
            bcc: this,
            accountId: accountId
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