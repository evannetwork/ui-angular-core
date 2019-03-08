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

import * as ProfileBundle from 'bcc';
import { bccHelper, config, dapp, getDomainName, ipfs, lightwallet, System, routing, } from 'dapp-browser';
import { Router, OnInit, Injectable, Observable, CanActivate, Http } from 'angular-libs';

import { SingletonService } from '../singleton-service';
import { EvanBCCService } from './bcc';
import { EvanCoreService } from './core';
import { EvanDescriptionService } from './description';
import { EvanRoutingService } from '../ui/routing';
import { EvanUtilService } from '../utils';
import { EvanTranslationService } from '../ui/translate';

/**************************************************************************************************/

/**
 * Onboarding wrapper service, with some utility functions. Primary used by the
 * core-dapps/onboarding Dapp.
 *
 * @class      Injectable EvanOnboardingService
 */
@Injectable()
export class EvanOnboardingService {
  /**
   * ProfileBundle.Onboarding instance
   */
  onboarding: ProfileBundle.Onboarding;

  /**
   * make it standalone and load dependency services and initialize a bcc onboarding
   */
  constructor(
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private http: Http,
    private routingService: EvanRoutingService,
    private singleton: SingletonService,
    private translate: EvanTranslationService,
    private utils: EvanUtilService,
  ) {
    return singleton.create(EvanOnboardingService, this, () => {
      this.onboarding = new ProfileBundle.Onboarding({
        mailbox: this.bcc.mailbox,
        smartAgentId: config.smartAgents.onboarding.accountId,
        executor: this.bcc.executor,
        logLog: ProfileBundle.logLog
      });
    }, true);
  }

  /**
   * Check if the account id is onboarded. Uses a custom created blockchain-core
   * profile => not depending on global core instance
   *
   * @param      {string}   accountId  account id to check
   * @return     {boolean}  True if onboarded, False otherwise.
   */
  async isOnboarded(accountId?: string): Promise<boolean> {
    return bccHelper.isAccountOnboarded(accountId || this.core.activeAccount());
  }

  /**
   * Get the current onboarding params with default values.
   * 
   * result: { "origin": "dashboard.test" }
   *
   * @return     {any}  Original query parameters from the page from which we
   *                    were redirected to onboarding.
   */
  getOnboardingQueryParams(): any {
    let queryParams = this.routingService.getQueryparams();
    queryParams.origin = queryParams.origin ||
      this.routingService.getRouteFromUrl(window.location.hash);

    if (queryParams.origin && queryParams.origin.indexOf('onboarding') !== -1) {
      queryParams.origin = routing.defaultDAppENS;
    }

    return queryParams;
  }

  /**
   * Finish onboarding process.
   *   - update blockchain-core for current provider and accountId
   *   - navigate to dashboard or latest route
   */
  finishOnboarding() {
    const queryParams = this.getOnboardingQueryParams();

    if (queryParams.origin.indexOf('/') !== 0) {
      queryParams.origin = '/' + queryParams.origin;
    }

    this.bcc.updateBCC();
    this.routingService.navigate(queryParams.origin ||
      routing.defaultDAppENS
    );
  }

  /**
   * Navigate to onboarding.
   */
  goToOnboarding() {
    let queryParams = this.getOnboardingQueryParams();

    this.routingService.openENS(
      `onboarding.${ getDomainName() }`,
      '',
      queryParams
    );
  }
}

