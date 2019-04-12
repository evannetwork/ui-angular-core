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
  prottle
} from 'bcc';

import {
  getDomainName
} from 'dapp-browser';

import {
  OnInit, Injectable, // '@angular/core';
} from 'angular-libs';

import { EvanBCCService } from './bcc';
import { EvanDescriptionService } from '../bcc/description';
import { EvanCoreService } from './core';
import { EvanQueue } from './queue';
import { EvanUtilService } from '../utils';
import { QueueId } from './queue-utilities';
import { SingletonService } from '../singleton-service';

/**************************************************************************************************/

/**
 * Blockchain-core wrapper service to handle users verifications.
 *
 * @class      Injectable EvanVerificationService
 */
@Injectable()
export class EvanVerificationService {
  /**
   * owner of the evan root verification domain
   */
  public ensRootOwner: string = '0x4a6723fC5a926FA150bAeAf04bfD673B056Ba83D';

  /**
   * make it standalone and load dependency services
   */
  constructor(
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private descriptionService: EvanDescriptionService,
    private queue: EvanQueue,
    private singleton: SingletonService,
    private utils: EvanUtilService,
  ) {
    return singleton.create(EvanVerificationService, this, () => {

    }, true);
  }

  /**
   * Return the queue id to watch for any action for a demo.
   *
   * @param      {string}   dispatcher  optional name of the dispatcher (default is * = watch
   *                                    everything)
   * @param      {string}   id          optional id for the queue id
   * @return     {QueueId}  The handling queue identifier.
   */
  public getQueueId(dispatcher: string = '*', id: string = '*'): QueueId {
    return new QueueId(`verifications.${ getDomainName() }`, dispatcher, id);
  }

  /**
   * Checks if a verification is current loading (issuing, accepting, deleting).
   *
   * @param      {any}   verification   the verification object that should be checked (loaded vom api-blockchain-core / getVerifications function)
   * @return     {boolean}  True if verificationn loading, False otherwise.
   */
  public isVerificationLoading(verification: any) {
    const activeAccount = this.core.activeAccount();
    const issueData = this.queue.getQueueEntry(this.getQueueId('issueDispatcher'), true).data;
    const acceptData = this.queue.getQueueEntry(this.getQueueId('acceptDispatcher'), true).data;
    const deleteData = this.queue.getQueueEntry(this.getQueueId('deleteDispatcher'), true).data;

    // check if the current logged in user, accepts or deletes a verification
    const acceptOrDelete = [ ].concat(acceptData, deleteData).filter(entry => {
      return activeAccount === verification.subject && entry.topic === verification.name;
    }).length > 0;

    // check if the current logged in user issues a new verification
    const issue = issueData.filter(entry => {
      return entry.topic === verification.name;
    }).length > 0;

    return acceptOrDelete || issue;
  }

  /**
   * Set the loading status for all verifications, sub verifications and parentComputed verifications. Use it to reset
   * cache loading states.
   *
   * @param      {Array<any>}  verifications  the verifications that should be computed
   */
  public setVerificationsLoading(verifications: Array<any>) {
    for (let i = 0; i < verifications.length; i++) {
      verifications[i].loading = this.isVerificationLoading(verifications[i]);

      if (verifications[i].parentComputed) {
        verifications[i].parentComputed.loading = verifications[i].parentComputed.verifications
          .filter(verification => verification.loading).length > 0;
      }
    }
  }

  /**
   * Get all the claims for a specific subject, including all nested verifications for a deep
   * integrity check. (wrappper for api-blockchain-core getNestedVerifications)
   *
   * @param      {string}      subject     subject to load the verifications for.
   * @param      {string}      topic       topic to load the verifications for.
   * @param      {boolean}     isIdentity  optional indicates if the subject is already a identity
   * @return     {Promise<Array<any>>}  all the verifications with the following properties.
   *   {
   *     // creator of the verification
   *     issuer: '0x1813587e095cDdfd174DdB595372Cb738AA2753A',
   *     // topic of the verification
   *     name: '/company/b-s-s/employee/swo',
   *     // -1: Not issued => no verification was issued
   *     // 0: Issued => status = 0, warning.length > 0
   *     // 1: Confirmed => issued by both, self issued state is 2, values match
   *     // 2: Rejected => reject by the creator / subject
   *     status: 2,
   *     // verification for account id / contract id
   *     subject: subject,
   *     // ???
   *     value: '',
   *     // ???
   *     uri: '',
   *     // ???
   *     signature: ''
   *     // icon for cards display
   *     icon: 'icon to display',
   *     // if the verification was rejected, a reject reason could be applied
   *     rejectReason: '' || { },
   *     // subjec type
   *     subjectType: 'account' || 'contract',
   *     // if it's a contract, it can be an contract
   *     owner: 'account' || 'contract',: 'account' || 'contract',
   *     // warnings
   *     [
   *       'issued', // verification.status === 0
   *       'missing', // no verification exists
   *       'expired', // is the verification expired?
   *       'rejected', // rejected
   *       'selfIssued' // issuer === subject
   *       'invalid', // signature is manipulated
   *       'parentMissing',  // parent path does not exist
   *       'parentUntrusted',  // root path (/) is not issued by evan
   *       'notEnsRootOwner', // invalid ens root owner when check topic is
   *       'noIdentity', // checked subject has no identity
   *     ],
   *     // parent verifications not valid
   *     parents: [ ... ],
   *     parentComputed: [ ... ]
   *   }
   */
  public async getVerifications(subject: string, topic: string, isIdentity?: boolean) {
    return await this.bcc.verifications.getNestedVerifications(
      subject,
      topic,
      isIdentity
    );
  }

  /**
   * Takes an array of verifications and combines all the states for one quick view.
   *
   * @param      {string}      topic   topic of all the verifications
   * @param      {Array<any>}  verifications  all verifications of a specific topic
   * @return     {any}         computed verification including latest creationDate, combined color,
   *                           displayName
   */
  public async computeVerifications(topic: string, verifications: Array<any>) {
    return await this.bcc.verifications.computeVerifications(topic, verifications);
  }

  /**
   * Load the list of verification topics, that are configured as active for the current profile
   *
   * @param      {boolean}     includeSaving  should the saving flag returned?
   * @return     {Array<any>}  Array of topics or object including verifications array and saving property
   */
  public async getProfileActiveVerifications(includeSaving?: boolean) {
    const queueData = this.queue.getQueueEntry(
      new QueueId(`profile.${ getDomainName() }`,
      'profileVerificationsDispatcher'), true
    ).data;

    // use queue data or load latest verifications from profile
    let verifications = queueData.length > 0 ? queueData[0].verifications :
      (await this.bcc.profile.loadActiveVerifications());

    if (includeSaving) {
      return {
        saving: queueData.length > 0,
        verifications: verifications || [ ],
      }
    } else {
      return verifications;
    }
  }

  /**
   * Delete a single entry from the verification cache object using subject and topic
   *
   * @param      {string}  subject  the subject that should be removed
   * @param      {string}  topic    the topic that should be removed
   * @return     {void}  
   */
  public deleteFromVerificationCache(subject: string, topic: string) {
    this.bcc.verifications.deleteFromVerificationCache(subject, topic);
  }
}
