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
*/

import {
  evanGlobals,
  getDomainName,
  System,
  utils,
} from 'dapp-browser';

import {
  OnInit, Injectable, // '@angular/core';
} from 'angular-libs';

import { SingletonService } from '../singleton-service';

import { EvanBCCService } from './bcc';
import { EvanCoreService } from './core';
import { EvanTranslationService } from '../ui/translate';

/**************************************************************************************************/

/**
 * Blockchain-core description class wrapper.
 *
 * @class      Injectable EvanDescriptionService
 */
@Injectable()
export class EvanDescriptionService {
  /**
   * cached descriptions
   */
  public descriptions: any;

  /**
   * make it standalone and load dependency services
   */
  constructor(
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private singleton: SingletonService,
    private translate: EvanTranslationService,
  ) {
    return singleton.create(EvanDescriptionService, this, () => {
      this.descriptions = { };
    }, true);
  }

  /**
   * Returns an full evan ENS address.
   *
   * @param      {string}  ensAddress  ENS postfix (dappdapps =>
   *                                   dappdapps.evan.test)
   * @return     {string}  The evan ens address.
   */
  public getEvanENSAddress(ensAddress: string): string {
    return `${ensAddress}.${this.bcc.getDomainName()}`;
  }

  /**
   * Load the DBCP description and check if the ens address and it's DApp behind
   * can be added.
   *
   * result:
   * https://github.com/evannetwork/dbcp/blob/master/wiki/Example-DBCP-file.md
   *   + additional runtime properties (adds translation values for the current
   *     language, name without spaces, ens addres, status (invalid, valid,
   *     already_added) for easier ui checks)
   *
   * @param      {string}        ensAddress        Ens Address to load the DApp
   *                                               from
   * @param      {boolean}       clearDescription  remove runtime values like
   *                                               ensAddress, status,
   *                                               translated, trimmedName,
   *                                               currentLang
   * @return     {Promise<any>}  return the enchanced descriptions
   */
  public async getDescription(ensAddress: string, clearDescription?: boolean): Promise<any> {
    let description;

    try {
      if (!ensAddress) {
        throw new Error('no ens address provided!');
      }

      if (this.descriptions[ensAddress]) {
        description = this.descriptions[ensAddress];
      } else {
        if (ensAddress.indexOf('0x') === 0) {
          description = await this.bcc.description.getDescriptionFromContract(ensAddress, this.core.activeAccount());
        } else {
          // check if the devMode is available for this dapp
          const devName = ensAddress.replace(`.${ getDomainName() }`, '');
          if (utils.isDevAvailable(devName)) {
            description = await evanGlobals.System.import(`${ window.location.origin }/external/${ devName }/dbcp.json!json`);
          }

          // if no devMode is available for this application, load it directly from ens
          if (!description) {
            try {
              description = await System.import(`${ ensAddress }!ens`);
            } catch (ex) { }
          }

          // load definition via ens, if System.import ens could not get a value
          if (!description) {
            description = await this.bcc.description.getDescriptionFromEns(ensAddress);
          }

          // third approach is is, to load the definition from an contract address, that is laying under the ens address
          if (!description) {
            const contractAddress = await this.bcc.nameResolver.getAddress(ensAddress);

            description = await this.bcc.description.getDescriptionFromContract(contractAddress, this.core.activeAccount());
          }
        }

        // merge public and private to handle an easier nested dbcp object
        if (description.public || description.private) {
          description = Object.assign(description.public, description.private);
        }
        description = this.translate.getTranslatedDescription(description);
        description.ensAddress = ensAddress;
      }

      description.status = 'valid';

      this.descriptions[ensAddress] = description;
    } catch (ex) {
      description = this.translate.getTranslatedDescription({
        status: 'invalid',
        name: ensAddress,
        ensAddress: ensAddress,
        dapp: {}
      });
    }

    if (clearDescription) {
      const copy = JSON.parse(JSON.stringify(description));

      // remove not allowed values
      delete copy.ensAddress;
      delete copy.status;
      delete copy.translated;
      delete copy.trimmedName;
      delete copy.currentLang;

      return copy;
    } else {
      return description;
    }
  }

  /**
   * Takes an array of dapp names and loads their description from the ens.
   * 
   * result: have a look at getDescription
   *
   * @param      {Array<string>}        ensAddresses  ENS-Addresses to load
   * @return     {Promise<any>}  multiple descriptions.
   */
  public getMultipleDescriptions(ensAddresses: Array<string>): Promise<any> {
    ensAddresses = ensAddresses.map(prefix => this.getEvanENSAddress(prefix));

    // load predefine dapps that should be available as suggestion
    return Promise
      .all(
        ensAddresses
          .map(ensAddress =>
            this
              .getDescription(ensAddress)
              .catch(() => { })
          )
      )
      .then(loadedDApps => loadedDApps.filter(featuredDApp => !!featuredDApp));
  }

  /**
   * Gets the ens origin url.
   * 
   * Usage:
   *   import {
   *     getDomainName
   *   } from 'dapp-browser';
   *   ...
   *   this.ensOrigin = this.description.getENSOriginUrl(`cool-dapp.${ getDomainName() }`);
   * 
   *   <img *oneTime [src]="_DomSanitizer.bypassSecurityTrustUrl(ensOrigin + '/cool-img.png')" />
   *
   * @param      {string}  ensAddress  ens address to get the origin for
   * @return     {string}  The ens origin url.
   */
  public async getENSOriginUrl(ensAddress: string): Promise<string> {
    const withoutDomain = utils.getDAppName(ensAddress);

    if (utils.isDevAvailable(withoutDomain)) {
      return `${window.location.origin}/external/${ withoutDomain }`;
    } else {
      const description = await this.getDescription(ensAddress);

      return evanGlobals.restIpfs.api_url(`/ipfs/${ description.dapp.origin }`);
    }
  }
}
