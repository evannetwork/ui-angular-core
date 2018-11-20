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

import { SingletonService } from '../singleton-service';
import { EvanCoreService } from './core';
import { EvanBCCService } from './bcc';
import { EvanUtilService } from '../utils';
import { EvanQueue } from './queue';
import { QueueId } from './queue-utilities';

/**************************************************************************************************/

/**
 * Blockchain-core wrapper service to handle users claims.
 *
 * @class      Injectable EvanClaimService
 */
@Injectable()
export class EvanClaimService {
  /**
   * make it standalone and load dependency services
   */
  constructor(
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private queue: EvanQueue,
    private singleton: SingletonService,
    private utils: EvanUtilService,
  ) {
    return singleton.create(EvanClaimService, this, () => {

    }, true);
  }

  /**
   * Return the queue id to watch for any action for a demo.
   *
   * @param      {string}   dispatcher  optional name of the dispatcher (default is * = watch
   *                                    everythign)
   * @return     {QueueId}  The handling queue identifier.
   */
  public getQueueId(dispatcher: string = '*', id: string = '*'): QueueId {
    return new QueueId(`claims.${ getDomainName() }`, dispatcher, id);
  }

  /**
   * Checks if a claim is current loading (issuing, accepting, deleting).
   *
   * @param      {<type>}   claim   The claim
   * @return     {boolean}  True if claimn loading, False otherwise.
   */
  public isClaimLoading(claim: any) {
    const activeAccount = this.core.activeAccount();
    const issueData = this.queue.getQueueEntry(this.getQueueId('issueDispatcher'), true).data;
    const acceptData = this.queue.getQueueEntry(this.getQueueId('acceptDispatcher'), true).data;
    const deleteData = this.queue.getQueueEntry(this.getQueueId('deleteDispatcher'), true).data;

    // check if the current logged in user, accepts or deletes a claim
    const acceptOrDelete = [ ].concat(acceptData, deleteData).filter(entry => {
      return activeAccount === claim.subject && entry.topic === claim.name;
    }).length > 0;

    // check if the current logged in user issues a new claim
    const issue = issueData.filter(entry => {
      return entry.topic === claim.name;
    }).length > 0;

    return acceptOrDelete || issue;
  }

  /**
   * Use this function when you want to implement the full tree view! Currently we will concadinate
   * all parents to one.
   *
   * Picks up a claim and it's origin parents tree structure and traces all claims into a flat
   * structure for displaying it easily.
   *
   * @param      {any}                claim       the claim including parents
   * @param      {Array<Array<any>>}  flatClaims  The final flatted claims, Array of arrays from the
   *                                              lowest to the highest claim
   * @param      {Array<any>}         origin      the flatted claim Array for one parent that will
   *                                              be pushed into the flatClaims array
   */
  private flatClaimsTree (claim, flatClaims, origin = [ ]) {
    origin.unshift(claim);

    if (claim.parents && claim.parents.length > 0) {
      for (let parent of claim.parents) {
        this.flatClaimsTree(parent, flatClaims, [ ].concat(origin));
      }
    } else {
      flatClaims.push(origin);
    }
  }

  /**
   * Iterates recursivly through all parents of a claim and splits them into specific levels.
   * 
   * a = {
   *   name: '/company/b-s-s/department',
   *   parent: '/company/b-s-s',
   *   parents: [
   *     {
   *       name: '/company/b-s-s',
   *       parent: '/company',
   *       parents: [
   *         { name: 'company', },
   *         { name: 'company', },
   *         { name: 'company', }
   *       ]
   *     },
   *     {
   *       name: '/company/b-s-s',
   *       parent: '/company',
   *       parents: [
   *         { name: 'company' },
   *         {
   *           name: 'company'
   *           parent: '/',
   *           parents: [
   *             { name: '/', },
   *             { name: '/', }
   *           ]
   *         }
   *       ]
   *     }
   *   ]  
   * }
   * 
   * => 
   *   [
   *     [
   *       { name: '/company/b-s-s', parent: '/company' },
   *       { name: '/company/b-s-s', parent: '/company' }
   *     ],
   *     [
   *       { name: '/company', },
   *       { name: '/company', }
   *       { name: '/company', }
   *       { name: '/company', }
   *       { name: '/company', parent: '/company' }
   *     ]
   *     [
   *       { name: '/', }
   *       { name: '/', }
   *     ]
   *   ],
   *
   * @param      {any}         claim   the claim to parse
   * @param      {Array<any>}  levels  all parent levels including the name and all claims of this
   *                                   level
   * @param      {number}      index   current level index
   * @return     {Array<any>}  combined parents splitted into levels
   */
  flatClaimsToLevels(claim, levels = [ ], index = 0) {
    if (claim.parents && claim.parents.length > 0) {
      levels[index] = levels[index] || { name: claim.parent, claims: [ ] };
      levels[index].claims = levels[index].claims.concat(claim.parents);

      for (let parent of claim.parents) {
        this.flatClaimsToLevels(parent, levels, index + 1)
      }
    }

    return levels;
  }

  /**
   * Get all the claims for a specific address.
   *
   * @param      {string}      address     address to load the claims for.
   * @param      {string}      topic       topic to load the claims for.
   * @param      {boolean}     isIdentity  optional indicates if the subject is already a identity
   * @return     {Array<any>}  all the claims with the following properties.
   *   {
   *     // creator of the claim
   *     issuer: '0x1813587e095cDdfd174DdB595372Cb738AA2753A',
   *     // topic of the claim
   *     name: '/company/b-s-s/employee/swo',
   *     // -1: Not issued => no claim was issued
   *     // 0: Issued => issued by a non-issuer parent claim holder, self issued state is 0
   *     // 1: Confirmed => issued by both, self issued state is 2, values match
   *     status: 2,
   *     // claim for account id / contract id
   *     subject: address,
   *     // ???
   *     value: '',
   *     // ???
   *     uri: '',
   *     // ???
   *     signature: ''
   *     // icon for cards display
   *     icon: 'icon to display',
   *     
   *     // warnings
   *     [
   *       'issued', // claim.status === 0
   *       'missing', // no claim exists
   *       'expired', // is the claim expired?
   *       'selfIssued' // issuer === subject
   *     ]
   *     // parent claims not valid
   *     treeValid: false,
   *   }
   */
  public async getClaims(address: string, topic: string, isIdentity?: boolean) {
    const claims = await this.bcc.claims.getClaims(topic, address, isIdentity);

    if (claims.length > 0) {
      // build display name for claims and apply computed states for ui status
      await prottle(10, claims.map(claim => async () => {
        const splitName = claim.name.split('/');

        claim.displayName = splitName.pop();
        claim.parent = splitName.join('/');
        claim.warnings = [ ];
        claim.creationDate = claim.creationDate * 1000;

        // recover the original account id for the identity issuer
        claim.subjectIdentity = await this.bcc.executor.executeContractCall(
          this.bcc.claims.contracts.storage, 'users', claim.subject);
        const dataHash = this.bcc.nameResolver
          .soliditySha3(claim.subjectIdentity, claim.topic, claim.data).replace('0x', '');
        claim.issuerAccount = this.bcc.executor.web3.eth.accounts
          .recover(dataHash, claim.signature);

        // check if anything is loading for the claim (accept, issue, delete)
        claim.loading = this.isClaimLoading(claim);

        if (claim.status === 0) {
          claim.warnings.push('issued');
        }

        // if signature is not valid
        if (!claim.valid) {
          claim.warnings.push('invalid');
        }

        // if isser === subject, 
        if (claim.issuerAccount === claim.subject) {
          claim.warnings.push('selfIssued');
        }

        // TODO: expiration date
        claim.expired = false;

        // load all sub claims
        claim.parents = await this.getClaims(claim.issuerAccount, claim.parent, false);

        // use all the parents and create a viewable computed tree
        claim.tree = this
          .flatClaimsToLevels(claim)
          .map(level => this.getComputedClaim(level.name, level.claims));

        // load the computed status of all parent claims, to check if the parent tree is valid
        claim.parentComputed = this.getComputedClaim(claim.parent, claim.parents);
        if (claim.parentComputed.status === -1) {
          claim.warnings.push('parentMissing');
        } else if (claim.parentComputed.status === 0) {
          claim.warnings.push('parentUntrusted');
        }

        // set computed status
        claim.status = claim.warnings.length > 0 ? 0 : 1;
      }));
    }

    // if no claims are available the status would be "no claim issued"
    if (claims.length === 0) {
      claims.push({
        displayName: topic.split('/').pop(),
        loading: this.isClaimLoading({ address, topic }),
        name: topic,
        parents: [ ],
        status: -1,
        subject: '0x1637Fa43D44a1Fb415D858a3cf4F7F8596A4048F',
        tree: [ ],
        warnings: [ 'missing' ],
      });

      // TODO: enable evan tree checking, if root evan claim was issued
      if (topic === '') {
        // simulate evan
        claims[0].creationDate = (new Date(0)).getTime();
        claims[0].displayName = 'evan';
        claims[0].status = 1;
        claims[0].warnings = [ ];
      }
    }

    claims[0].icon = 'https://upload.wikimedia.org/wikipedia/de/6/63/T%C3%9CV_S%C3%BCd_logo.svg'

    return claims;
  }

  /**
   * Takes an array of claims and combines all the states for one quick view.
   *
   * @param      {string}      topic   topic of all the claims
   * @param      {Array<any>}  claims  all claims of a specific topic
   * @return     {any}         computed claim including latest creationDate, combined color,
   *                           displayName
   */
  public getComputedClaim(topic: string, claims: Array<any>) {
    const computed:any = {
      claims: claims,
      creationDate: null,
      displayName: topic.split('/').pop() || 'evan',
      loading: claims.filter(claim => claim.loading).length > 0,
      name: topic,
      status: -1,
      warnings: [ ],
    };

    // keep creationDates of all claims, so we can check after the final combined status was set,
    // which creation date should be used
    const creationDates = { '-1': [ ], '0': [ ], '1': [ ]}

    // iterate through all claims and check for warnings and the latest creation date of an claim
    for (let claim of claims) {
      // concadinate all warnings
      computed.warnings = computed.warnings.concat(claim.warnings);

      // use the highest status (-1 missing, 0 issued, 1 valid)
      computed.status = computed.status < claim.status ? claim.status : computed.status;
      
      // save all creation dates for later usage
      if (typeof claim.creationDate !== 'undefined') {
        creationDates[claim.status].push(claim.creationDate);
      }
    }

    // use the latest creationDate for the specific status
    if (creationDates[computed.status].length > 0) {
      computed.creationDate = creationDates[computed.status].sort().pop();
    }

    return computed;
  }
}
