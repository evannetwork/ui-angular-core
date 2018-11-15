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
  OnInit, Injectable, // '@angular/core';
} from 'angular-libs';

import { SingletonService } from '../singleton-service';
import { EvanCoreService } from './core';
import { EvanBCCService } from './bcc';
import { EvanUtilService } from '../utils';


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
    private singleton: SingletonService,
    private utils: EvanUtilService,
  ) {
    return singleton.create(EvanClaimService, this, () => {

    }, true);
  }

  /**
   * Get all the claims for a specific address.
   *
   * @param      {string}      address  address to load the claims for.
   * @param      {string}      topic    topic to load the claims for.
   * @return     {Array<any>}  all the claims with the following properties.
   *   {
   *     // creator of the claim
   *     issuer: '0x1813587e095cDdfd174DdB595372Cb738AA2753A',
   *     // topic of the claim
   *     name: '/company/b-s-s/employee/swo',
   *     // 0: Issued => issued by a non-issuer parent claim holder, self issued state is 0
   *     // 1: Confirmed => issued by both, self issued state is 2, values match
   *     // 2: Not issued => no claim was issued
   *     status: 2,
   *     // claim for account id / contract id
   *     subject: address,
   *     // ???
   *     value: '',
   *     // ???
   *     uri: '',
   *     // ???
   *     signature: ''
   *     
   *     // =========> computed
   *     // claim.status === 0
   *     issued: false,
   *     
   *     // claim.status === 1
   *     confirmed: true,
   *     
   *     // 0: issued (yellow)
   *     // 1: confirmed (green)
   *     // 2: not existing (red)
   *     color: 2,
   *
   *     // not existing
   *     existing: false,
   *     
   *     // is the claim expired?
   *     expired: false,
   *     
   *     // issuer === subject 
   *     selfIssued: false
   *     
   *     // parent claims not valid
   *     treeValid: false,
   *   }
   */
  public async getClaims(address: string, topic: string) {
    const claims = await this.bcc.claims.getClaims(topic, address);

    if (claims.length > 0) {
      // build display name for claims and apply computed states for ui status
      await prottle(10, claims.map(claim => async () => {
        const splitName = claim.name.split('/');

        claim.displayName = splitName.pop();

        // set initial color status, will be overruled by computed states
        claim.color = claim.status;
        claim.issued = claim.status === 0;
        claim.confirmed = claim.status === 1;
        claim.parent = splitName.slice(0, splitName.length).join('/');

        // if signature is not valid
        if (!claim.valid) {
          claim.color = 0;
        }

        // if isser === subject, 
        if (claim.issuer === claim.subject) {
          claim.selfIssued = true;
          claim.color = 0;
        }

        if (claim.name !== '/') {
          claim.claims = await this.getClaims(claim.issuer, claim.parent);
        } else {
          claim.claims = [ ];

          // simulate evan
          claim.treeValid = true;
          claim.displayName = 'evan';
          claim.color = 1;
          claim.issued = false;
          claim.confirmed = true;
          claim.creationDate = (new Date(0)).getTime();
        }

        // TODO: expiration date
        claim.expired = false;
      }));
    }

    // if no claims are available the status would be "no claim issued"
    if (claims.length === 0) {
      claims.push({
        claims: [ ],
        color: 2,
        existing: false,
        name: topic,
        subject: '0x1637Fa43D44a1Fb415D858a3cf4F7F8596A4048F',
        treeValid: false,
        valid: false,
      });
    }

    return claims;
  }

  /**
   * Takes an array of claims and combines all the states for one quick view.
   *
   * @return     {any}  computed claim including latest creationDate, combined color, displayName
   */
  private getComputedClaim(claims: Array<any>) {
    const computed = { };

    for (let claim of claims) {
     
    }

    return computed;
  }
}
