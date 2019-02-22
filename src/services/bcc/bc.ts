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

import * as BCBundle from 'bcc';

import {
  Ipld,
  prottle
} from 'bcc';

import { EvanBCCService } from './bcc';
import { EvanCoreService } from './core';
import { EvanDescriptionService } from './description';
import { EvanQueue } from './queue';
import { QueueId } from './queue-utilities';
import { EvanRoutingService } from '../ui/routing';
import { EvanTranslationService } from '../ui/translate';
import { EvanUtilService } from '../utils';
import { SingletonService } from '../singleton-service';

import {
  Router,             // '@angular/router';
  OnInit, Injectable, // '@angular/core';
} from 'angular-libs';

/**************************************************************************************************/

/**
 * BCC business center API wrapper. Manages:
 *   - bc object initialization
 *   - bc contract creation & loading
 *   - bc member loading
 *   - ... 
 *
 * @class      Injectable EvanBcService
 */
@Injectable()
export class EvanBcService {
  /**
   * loaded business center cache
   */
  private loadedBcs: any;

  /**
   * only load members with this roles
   */
  private whitelist_roles: any = [0, 1];

  /**
   * queue id for checking joining / leaving members
   */
  public joinLeaveBcQueueId: QueueId;

  /**
   * queue id for applying business center information to the users profile
   */
  public profileQueueId: QueueId;

  /**
   * do not load bc instances duplicated times
   */
  public loadPromises: any = { };

  /**
   * initialize and make it singleton
   */
  constructor(
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private queue: EvanQueue,
    private routing: EvanRoutingService,
    private singleton: SingletonService,
    private utils: EvanUtilService,
    private descriptionService: EvanDescriptionService
  ) {
    return singleton.create(EvanBcService, this, () => {
      this.loadedBcs = { };
    }, true);
  }

  /**
   * Gets the current business center. It is created using the BCBundle.createBC
   * runtime function.
   * 
   * Returns:
   *   {
   *     ensDomain,
   *     bcAddress,
   *     businessCenter,
   *     bcRoles,
   *     ipld,
   *     bcProfiles,
   *     description: (<any>description),
   *     dataContract
   *   }
   *
   * @param      {string}        ensDomain  bc ens domain
   * @return     {Promise<any>}  the initialized business center
   */
  async getCurrentBusinessCenter(ensDomain?: string): Promise<any> {
    ensDomain = ensDomain || this.routing.getActiveRootEns();

    // if the bc was already loaded, return it directly
    if (this.loadedBcs[ensDomain]) {
      return this.loadedBcs[ensDomain];
    } else {
      if (!this.loadPromises[ensDomain]) {
        this.loadPromises[ensDomain] = new Promise(async (resolve) => {
          const loadedBc = await BCBundle.createBC({
            ensDomain,
            ProfileBundle: BCBundle
          });

          // save loadedBc to cache, to be able to load isMember previously
          this.loadedBcs[ensDomain] = loadedBc;

          // load this after the description of the loaded bc to handle inner function call
          //   of getCurrentBusinessCenter
          loadedBc.joined = await this.isMember(this.core.activeAccount(), ensDomain);
          const currentProfile = await this.profileSet(ensDomain);

          if (loadedBc.joined && currentProfile) {
            const members = await this.getMembers(null, ensDomain);
            const profiles = await this.getProfiles(members);

            loadedBc.members = members;
            loadedBc.profiles = profiles;
          }

          // save loadedBc to cache
          this.loadedBcs[ensDomain] = loadedBc;
          resolve();
          delete this.loadPromises[ensDomain];
        });
      }

      // wait for finished loading
      await this.loadPromises[ensDomain];
      return this.loadedBcs[ensDomain];
    }
  }

  /**
   * Refresh the data of a loaded business center. Have a look at
   * "getCurrentBusinessCenter"
   *
   * @param      {string}  ensDomain  ens domain to load the bc for
   * @return     {Promise<any>}  business center object
   */
  async reloadBc(ensDomain?: string): Promise<any> {
    ensDomain = ensDomain || this.routing.getActiveRootEns();

    // wait for previous loading to be finished
    if (this.loadPromises[ensDomain]) {
      await this.loadPromises[ensDomain];
    }

    // clear loaded bc and trigger reload
    delete this.loadedBcs[ensDomain];
    await this.getCurrentBusinessCenter(ensDomain);
  }

  /**
   * load the members for a contract within an business center
   *
   * @param      {string|any}              contract   contract id or contract
   *                                                  object
   * @param      {string}                  ensDomain  ens domain of the business
   *                                                  center
   * @return     {Promise<Array<string>>}  members
   */
  async getMembers(contract?: any, ensDomain?: string): Promise<Array<string>> {
    const loadedBc = await this.getCurrentBusinessCenter(ensDomain);
    let members = [];

    const roles = await loadedBc.bcRoles.getMembers(contract || loadedBc.businessCenter);
    for (let roleId in roles) {
      if (this.whitelist_roles.indexOf(parseInt(roleId, 10)) !== -1) {
        members = members.concat(roles[roleId]);
      }
    }

    members = members.filter(
      (el, index, a) => index === a.indexOf(el)
    );

    return members;
  }

  /**
   * Load profiles for an member array
   *
   * @param      {Array<string>}        members    members to load the profiles
   *                                               for
   * @param      {string}               ensDomain  ens domain to load the
   *                                               contact cards from
   * @return     {Promise<any>}  profiles analogous to addressbook
   *                                    profiles
   */
  async getProfiles(members?: Array<any>, ensDomain?: string): Promise<any> {
    const loadedBc = await this.getCurrentBusinessCenter(ensDomain);
    const profiles = {};

    members = members || loadedBc.members;

    for (let member of members) {
      await loadedBc.bcProfiles.loadForBusinessCenter(loadedBc.ensDomain, member);
      profiles[member] = await loadedBc.bcProfiles.getContactCard();
    }

    return profiles;
  }

  /**
   * Creates an queue id for users profile within a business center
   *
   * @param      {string}  ensDomain  ens domain to create the queue id for
   * @return     {QueueId}  The profile queue identifier.
   */
  getProfileQueueId(ensDomain?: string): QueueId {
    return new QueueId(
      ensDomain || this.routing.getActiveRootEns(),
      'BcProfileDispatcher',
      'profileDispatcher',
      true
    );
  }

  /**
   * Checks if a member is joined to a business center
   *
   * @param      {string}   accountId  account id to check
   * @param      {string}   ensDomain  ens domain of the business center
   * @return     {Promise<boolean>}  True if member, False otherwise.
   */
  async isMember(accountId?: string, ensDomain?: string): Promise<boolean> {
    const loadedBc = await this.getCurrentBusinessCenter(ensDomain);

    if (!accountId) {
      accountId = this.core.activeAccount();
    }

    return await this.bcc.executor.executeContractCall(
      loadedBc.businessCenter,
      'isMember',
      accountId,
      { from: accountId, gas: 3000000, }
    );
  }

  /**
   * Check if the user has a business center profile
   *
   * @param      {string}            ensDomain  ens domain of the business
   *                                            center
   * @return     {Promise<boolean>}  true if profile exists, else false
   */
  async profileSet(ensDomain?: string): Promise<boolean> {
    const loadedBc = await this.getCurrentBusinessCenter(ensDomain);
    await loadedBc.bcProfiles.loadForBusinessCenter(
      loadedBc.ensDomain,
      this.core.activeAccount()
    );

    const loadedProfile = await loadedBc.bcProfiles.getContactCard();

    return !!loadedProfile;
  }

  /**
   * Save the alias of a user to business center profile
   *
   * @param      {string}  alias      alias to save
   * @param      {string}  ensDomain  ens domain of the business center
   */
  async saveProfile(alias: string, ensDomain?: string) {
    const loadedBc = await this.getCurrentBusinessCenter(ensDomain);

    this.queue.addQueueData(this.getProfileQueueId(ensDomain), {
      alias,
      description: loadedBc.description
    });
  }

  /**
   * Get your contracts for a specific business center.
   * 
   * Result: [ this.getBCContract() ]
   *
   * @param      {string}               ensDomain  ens domain of the business center
   * @return     {Promise<Array<any>>}  The bc contracts.
   */
  async getBCContracts(ensDomain: string): Promise<Array<any>> {
    const contracts = [ ];
    const bcContracts = await this.bcc.profile.getBcContracts(ensDomain) || {};

    Ipld.purgeCryptoInfo(bcContracts);

    const contractKeys = Object.keys(bcContracts);
    if (contractKeys.length > 0) {
      await prottle(10, contractKeys.map(contract => async () => {
        const contractDetails = await this.getBCContract(ensDomain, contract);

        if (contractDetails && contractDetails.isContract) {
          contracts.push(contractDetails);
        }
      }));
    }

    return contracts;
  }

  /**
   * load a contract of a business center
   *
   * Result: { address, isContract, ... }
   *
   * @param      {string}  ensDomain   ens domain of the business center
   * @param      {string}  contractId  The contract identifier
   * @return     {any}  The bc contract.
   */
  async getBCContract(ensDomain: string, contractId: string): Promise<any> {
    let contractDetails;

    try {
      const loadedBc = await this.getCurrentBusinessCenter(ensDomain);
      let description = await this.bcc.description.getDescriptionFromContract(contractId, this.core.activeAccount());

      description = Object.assign(description.public, description.private);

      contractDetails = await this.bcc.profile.getBcContract(ensDomain, contractId) || {};

      contractDetails.address = contractId;
      contractDetails.isContract = await this.bcc.executor.executeContractCall(
        loadedBc.businessCenter,
        'isContract',
        contractId
      );

      const descriptionParams = Object.keys(description);
      for (let i = 0; i < descriptionParams.length; i++) {
        contractDetails[descriptionParams[i]] = description[descriptionParams[i]];
      }
    } catch (ex) {
      console.error(`Error while loading contract ${ contractId } from ens address ${ ensDomain }: ${ ex.message || ex }`);
    }

    return contractDetails;
  }

  /**
   * Gets the join leave bc QueueId.
   *
   * @param      {string}   ensDomain  The ens domain
   * @return     {QueueId}  The join leave bc queue identifier.
   */
  getJoinLeaveBcQueueId(ensDomain?: string): QueueId {
    return new QueueId(
      ensDomain || this.routing.getActiveRootEns(),
      'JoinLeaveBcDispatcher',
      'bcDispatcher',
      true
    );
  }

  /**
   * Get the current entries within the profile join / leave queue
   *
   * @param      {string}  ensDomain  ens domain of the business center
   * @return     {any}     content of the current joining queue
   */
  getJoinLeaveQueue(ensDomain?: string): any {
    return this.queue.getQueueEntry(this.getJoinLeaveBcQueueId(ensDomain), true);
  }

  /**
   * Join a business center using the bc profile QueueId
   *
   * @param      {string}  ensDomain  ens domain of the business center
   */
  async joinBcViaQueue(ensDomain?: string) {
    const loadedBc = await this.getCurrentBusinessCenter(ensDomain);

    this.queue.addQueueData(this.getJoinLeaveBcQueueId(ensDomain), {
      bc: loadedBc.businessCenter.options.address,
      description: loadedBc.description,
      operation: 'join',
    });
  }

  /**
   * Join a business center using the bc profile QueueId
   *
   * @param      {string}  ensDomain  The ens domain
   */
  async leaveBcViaQueue(ensDomain?: string) {
    const loadedBc = await this.getCurrentBusinessCenter(ensDomain);

    this.queue.addQueueData(this.getJoinLeaveBcQueueId(ensDomain), {
      bc: loadedBc.businessCenter.options.address,
      description: loadedBc.description,
      operation: 'cancel',
    });
  }

  /**
   * Run a business-center contract function.
   *
   * @param      {string}         ensDomain  ens domain of the business center
   * @param      {string}         operation  contract function
   * @return     {Promise<void>}  resolved when done
   */
  async executeOperationOnBC(ensDomain, operation): Promise<void> {
    const loadedBc = await this.getCurrentBusinessCenter(ensDomain);

    const businessCenter = this.bcc.contractLoader.loadContract(
      'BusinessCenter',
      loadedBc.businessCenter.options.address
    );

    await this.bcc.executor.executeContractTransaction(
      businessCenter,
      operation,
      { from: this.core.activeAccount(), autoGas: 1.1, }
    );
  }

  /**
   * Join a business center
   *
   * @param      {string}         ensDomain  ens domain of the business center
   * @return     {Promise<void>}  resolved when done
   */
  async joinBc(ensDomain?: string): Promise<void> {
    const loadedBc = await this.getCurrentBusinessCenter(ensDomain);

    await this.executeOperationOnBC(ensDomain, 'join');

    loadedBc.joined = true;
  }

  /**
   * leave a business center
   *
   * @param      {string}         ensDomain  ens domain of the business center
   * @return     {Promise<void>}  resolved when done
   */
  async leaveBc(ensDomain?: string): Promise<void>  {
    const loadedBc = await this.getCurrentBusinessCenter(ensDomain);

    await this.executeOperationOnBC(ensDomain, 'join');

    loadedBc.joined = false;
  }
}
