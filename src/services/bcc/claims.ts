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
 * Blockchain-core wrapper service to handle users claims.
 *
 * @class      Injectable EvanClaimService
 */
@Injectable()
export class EvanClaimService {
  /**
   * owner of the evan root claim domain
   */
  public ensRootOwner: string = '0x4a6723fC5a926FA150bAeAf04bfD673B056Ba83D';

  /**
   * backup already loaded claim descriptions
   */
  public claimDescriptions: any = { };

  /**
   * cache all the claims using an object of promises, to be sure, that the claim is loaded only
   * once
   */
  public claimCache: any = { };

  /**
   * cache all the ens owners
   */
  public ensOwners: any = { };

  /**
   * only run ensure storage once, to improve load speed (will be an promise)
   */
  public ensureStorage: any;

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
    return singleton.create(EvanClaimService, this, () => {

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
    return new QueueId(`claims.${ getDomainName() }`, dispatcher, id);
  }

  /**
   * Checks if a claim is current loading (issuing, accepting, deleting).
   *
   * @param      {any}   claim   the claim object that should be checked (loaded vom api-blockchain-core / getClaims function)
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
  private flatClaimsTree (claim: any, flatClaims: Array<Array<any>>, origin: Array<any> = [ ]) {
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
   * @return     {Promise<Array<any>>}  all the claims with the following properties.
   *   {
   *     // creator of the claim
   *     issuer: '0x1813587e095cDdfd174DdB595372Cb738AA2753A',
   *     // topic of the claim
   *     name: '/company/b-s-s/employee/swo',
   *     // -1: Not issued => no claim was issued
   *     // 0: Issued => issued by a non-issuer parent claim holder, self issued state is 0
   *     // 1: Confirmed => issued by both, self issued state is 2, values match
   *     // 2: Rejected => reject by the creator / subject
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
   *       'invalid', // signature is manipulated
   *       'parentMissing',  // parent path does not exists
   *       'parentUntrusted',  // root path (/) is not issued by evan
   *       'notEnsRootOwner' // invalid ens root owner when check topic is /
   *     ]
   *     // parent claims not valid
   *     tree: [ ... ] // result of flatClaimsToLevels
   *   }
   */
  public async getClaims(address: string, topic: string, isIdentity?: boolean) {
    // prepent starting slash if it does not exists
    if (topic.indexOf('/') !== 0) {
      topic = '/' + topic;
    }

    // if no storage was ensured before, run it only once
    if (!this.ensureStorage) {
      this.ensureStorage = this.bcc.claims.ensureStorage();
    }

    // wait for ensure storage to be finished
    await this.ensureStorage;

    // if no cache is found, set it
    this.claimCache[topic] = this.claimCache[topic] || { };
    if (!this.claimCache[topic][address]) {
      // load the claims and store promise within the claim cache object
      this.claimCache[topic][address] = (async () => {
        const isValidAddress = this.bcc.web3.utils.isAddress(address);
        let claims = [ ];

        // only load claims for correct contract / accoun id's
        if (isValidAddress) {
          try {
            const identity = await this.bcc.executor.executeContractCall(
              this.bcc.claims.contracts.storage, 'users', address);

            if (identity !== '0x0000000000000000000000000000000000000000') {
              claims = await this.bcc.claims.getClaims(address, topic, isIdentity);
            }
          } catch (ex) {
            claims = [ ];
          }
        }

        if (claims.length > 0) {
          // build display name for claims and apply computed states for ui status
          await prottle(10, claims.map(claim => async () => {
            const splitName = claim.name.split('/');

            claim.displayName = splitName.pop();
            claim.parent = splitName.join('/');
            claim.warnings = [ ];
            claim.creationDate = claim.creationDate * 1000;

            // if expiration date is given, format the unix timestamp
            if (claim.expirationDate) {
              claim.expirationDate = claim.expirationDate * 1000;
            }

            // recover the original account id for the identity issuer
            claim.subjectIdentity = await this.bcc.executor.executeContractCall(
              this.bcc.claims.contracts.storage, 'users', claim.subject);
            const dataHash = this.bcc.nameResolver
              .soliditySha3(claim.subjectIdentity, claim.topic, claim.data).replace('0x', '');
            claim.issuerAccount = this.bcc.executor.web3.eth.accounts
              .recover(dataHash, claim.signature);

            // ensure, that the description was loaded
            await this.ensureClaimDescription(claim);

            // check if anything is loading for the claim (accept, issue, delete)
            claim.loading = this.isClaimLoading(claim);

            if (claim.status === 0) {
              claim.warnings.push('issued');
            }

            if (claim.status === 2) {
              claim.warnings.unshift('rejected');
            }

            // if signature is not valid
            if (!claim.valid) {
              claim.warnings.push('invalid');
            }

            // if isser === subject and only if a parent is passed, so if the root one is empty and no
            // slash is available
            if (claim.issuerAccount === claim.subject && claim.parent) {
              claim.warnings.push('selfIssued');
            }

            if (claim.expirationDate && claim.expirationDate < Date.now()) {
              claim.warnings.push('expired');
            }

            if (claim.parent) {
              // load all sub claims
              claim.parents = await this.getClaims(claim.issuerAccount, claim.parent, false);

              // load the computed status of all parent claims, to check if the parent tree is valid
              claim.parentComputed = await this.getComputedClaim(claim.parent, claim.parents);
              if (claim.parentComputed.status === -1) {
                claim.warnings.push('parentMissing');
              } else if (claim.parentComputed.status === 0) {
                claim.warnings.push('parentUntrusted');
              }
            } else {
              claim.parents = [ ];

              if (claim.name === '/evan' &&
                 (claim.issuerAccount !== this.ensRootOwner || claim.subject !== this.ensRootOwner)) {
                claim.warnings = [ 'notEnsRootOwner' ];
              } else {
                claim.status = 1;
                claim.warnings = [ ];
              }
            }

            if (claim.status !== 2) {
              // set computed status
              claim.status = claim.warnings.length > 0 ? 0 : 1;
            }
          }));

          // calculate the computed level around all claims, so we can check all claims for this user
          // (used for issueing)
          const computed = await this.getComputedClaim(topic, claims);
          claims.forEach(claim => claim.levelComputed = computed);
        }

        // if no claims are available the status would be "no claim issued"
        if (claims.length === 0) {
          claims.push({
            displayName: topic.split('/').pop() || 'evan',
            loading: this.isClaimLoading({ address, topic }),
            name: topic,
            parents: [ ],
            status: -1,
            subject: address,
            tree: [ ],
            warnings: [ 'missing' ],
            subjectIdentity: isValidAddress ?
              await this.bcc.executor.executeContractCall(
                this.bcc.claims.contracts.storage, 'users', address) :
              '0x0000000000000000000000000000000000000000',
          });

          if (!claims[0].subjectIdentity ||
              claims[0].subjectIdentity === '0x0000000000000000000000000000000000000000') {
            claims[0].warnings.unshift('noIdentity');
          }

          await this.ensureClaimDescription(claims[0]);
        }

        return claims;
      })();
    }

    return await this.claimCache[topic][address];
  }

  /**
   * Set the loading status for all claims, sub claims and parentComputed claims. Use it to reset
   * cache loading states.
   *
   * @param      {Array<any>}  claims  the claims that should be computed
   */
  public setClaimsLoading(claims: Array<any>) {
    for (let i = 0; i < claims.length; i++) {
      claims[i].loading = this.isClaimLoading(claims[i]);

      if (claims[i].parentComputed) {
        claims[i].parentComputed.loading = claims[i].parentComputed.claims
          .filter(claim => claim.loading).length > 0;
      }
    }
  }

  /**
   * Map the topic of a claim to it's default ens domain
   *
   * @param      {string}  topic   the claim name / topic
   * @return     {string}  The claim ens address
   */
  public getClaimEnsAddress(topic: string) {
    // remove starting evan, /evan and / to get the correct domain
    const clearedTopic = topic.replace(/^(?:(?:\/)?(?:evan)?)(?:\/)?/gm, '');

    // if a reverse domain is available, add it and seperate using a dot
    let domain = 'claims.evan';
    if (clearedTopic.length > 0) {
      domain = `${ clearedTopic.split('/').reverse().join('.') }.${ domain }`;
    } else if (topic.indexOf('/evan') === 0 || topic.indexOf('evan') === 0) {
      domain = `evan.${ domain }`;
    }

    return domain;
  }

  /**
   * Gets the default description for a claim if it does not exists.
   *
   * @param      {any}     claim   the claim that should be checked
   */
  public async ensureClaimDescription(claim: any) {
    // map the topic to the claim ens name and extract the top level claims domain to check, if
    // the user can set the claim tree
    const ensAddress = this.getClaimEnsAddress(claim.name);
    const topLevelDomain = ensAddress.split('.').splice(-3, 3).join('.');

    // if no description was set, use the latest one or load it
    if (!claim.description) {
      // if the description could not be loaded, the cache will set to false, so we do not need to load again
      if (!this.claimDescriptions[ensAddress] && this.claimDescriptions[ensAddress] !== false) {
        this.claimDescriptions[ensAddress] = (async () => {
          try {
            // load the description
            return await this.bcc.description.getDescription(ensAddress);
          } catch (ex) {
            return false;
          }
        })();
      }

      claim.description = await this.claimDescriptions[ensAddress];
    }

    if (claim.description) {
      // map the properties to a flat description
      if (claim.description.public) {
        claim.description = claim.description.public;
      }

      // move the img to the basic claim
      if (claim.description.imgSquare) {
        claim.icon = claim.description.imgSquare;
      }
    } else {
      claim.description = {
        author: this.core.activeAccount(),
        dbcpVersion: 1,
        description: claim.name,
        name: claim.name,
        version: '1.0.0',
      };
    }

    claim.description.i18n = claim.description.i18n || { };
    claim.description.i18n.name = claim.description.i18n.name || { };
    claim.description.i18n.name.en = claim.description.i18n.name.en || claim.name.split('/').pop();

    // try to load a clear name
    try {
      claim.displayName = claim.description.i18n.name.en;
    } catch (ex) { }

    // if the top level ens owner was not loaded before, load it!
    if (!this.ensOwners[topLevelDomain]) {
      this.ensOwners[topLevelDomain] = (async () => {
        // transform the ens domain into a namehash and load the ens top level topic owner
        const namehash = this.bcc.nameResolver.namehash(topLevelDomain);
        return await this.bcc.executor.executeContractCall(
          this.bcc.nameResolver.ensContract, 'owner', namehash);
      })();
    }

    claim.ensAddress = ensAddress;
    claim.topLevelEnsOwner = await this.ensOwners[topLevelDomain];
  }

  /**
   * Takes an array of claims and combines all the states for one quick view.
   *
   * @param      {string}      topic   topic of all the claims
   * @param      {Array<any>}  claims  all claims of a specific topic
   * @return     {any}         computed claim including latest creationDate, combined color,
   *                           displayName
   */
  public async getComputedClaim(topic: string, claims: Array<any>) {
    const computed:any = {
      claims: claims,
      creationDate: null,
      displayName: topic.split('/').pop() || 'evan',
      loading: claims.filter(claim => claim.loading).length > 0,
      name: topic,
      status: -1,
      subjects: [ ],
      warnings: [ ],
    };

    // load the description for the given topic
    await this.ensureClaimDescription(computed);

    // keep creationDates of all claims, so we can check after the final combined status was set,
    // which creation date should be used
    const creationDates = { '-1': [ ], '0': [ ], '1': [ ], '2': [ ]};
    const expirationDates = { '-1': [ ], '0': [ ], '1': [ ], '2': [ ]};

    // iterate through all claims and check for warnings and the latest creation date of an claim
    for (let claim of claims) {
      // concadinate all warnings
      computed.warnings = computed.warnings.concat(claim.warnings);

      // use the highest status (-1 missing, 0 issued, 1 valid, 2 rejected)
      if (claim.status === 2) {
        if (computed.status === -1) {
          computed.status = 2;
        }
      } else {
        if (computed.status === 2) {
          computed.status = claim.status;
        } else {
          computed.status = computed.status < claim.status ? claim.status : computed.status;
        }
      }

      // search one subject of all
      if (computed.subjects.indexOf(claim.subject) === -1) {
        computed.subjects.push(claim.subject);
      }
      
      // save all creation dates for later usage
      if (typeof claim.creationDate !== 'undefined') {
        creationDates[claim.status].push(claim.creationDate);
      }

      // save all creation dates for later usage
      if (typeof claim.expirationDate !== 'undefined') {
        expirationDates[claim.status].push(claim.expirationDate);
      }
    }

    // use the latest creationDate for the specific status
    if (creationDates[computed.status].length > 0) {
      computed.creationDate = creationDates[computed.status].sort()[0];
    }

    // use the latest creationDate for the specific status
    if (expirationDates[computed.status].length > 0) {
      const curExpiration = expirationDates[computed.status].sort();
      computed.expirationDate = curExpiration[curExpiration.length - 1];
    }

    return computed;
  }

  /**
   * Load the list of claim topics, that are configured as active for the current profile
   *
   * @param      {boolean}     includeSaving  should the saving flag returned?
   * @return     {Array<any>}  Array of topics or object including claims array and saving property
   */
  public async getProfileActiveClaims(includeSaving?: boolean) {
    const queueData = this.queue.getQueueEntry(
      new QueueId(`profile.${ getDomainName() }`,
      'profileClaimsDispatcher'), true
    ).data;

    // use queue data or load latest claims from profile
    let claims = queueData.length > 0 ? queueData[0].claims :
      (await this.bcc.profile.loadActiveClaims());

    if (includeSaving) {
      return {
        saving: queueData.length > 0,
        claims: claims || [ ],
      }
    } else {
      return claims;
    }
  }

  /**
   * Delete a single entry from the claim cache object using address and topic
   *
   * @param      {string}  address  the address that should be removed
   * @param      {string}  topic    the topic that should be removed
   * @return     {void}  
   */
  public deleteFromClaimCache(address: string, topic: string) {
    // prepent starting slash if it does not exists
    if (topic.indexOf('/') !== 0) {
      topic = '/' + topic;
    }

    // search for all parents, that could have links to the topic, so remove them
    Object.keys(this.claimCache).forEach(key => {
      // if the key is equal to the topic that should be checked, delete only the cache for the
      // given address
      if (key === topic) {
        // delete all related addresses for the given topic, or remove all, when address is a
        // wildcard
        if (this.claimCache[topic] && (this.claimCache[topic][address] || address === '*')) {
          delete this.claimCache[topic][address];
        }

        return;
      // else remove all child topics
      } else if (key.indexOf(topic) !== -1) {
        delete this.claimCache[key];
      }
    });
  }
}
