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
import {
  OnInit,
  Http,
  Injectable,
  Observable,
} from 'angular-libs';

import { EvanBCCService } from './bcc';
import { EvanCoreService } from './core';
import { EvanDescriptionService } from './description';
import { EvanQueue } from './queue';
import { EvanTranslationService } from '../ui/translate';
import { EvanUtilService } from '../utils';
import { QueueId } from './queue-utilities';
import { SingletonService } from '../singleton-service';

/**************************************************************************************************/

/**
 * Evan payment wrapper
 *
 * @class      Injectable EvanAddressBookService
 */
@Injectable()
export class EvanPaymentService {
  /**
   * account address of the payment agent.
   */
  public paymentAgentAccountId: string = '0xAF176885bD81D5f6C76eeD23fadb1eb0e5Fe1b1F';

  /**
   * Manager of the payment channel.
   */
  public paymentChannelManagerAccountId: string = '0x0A0D9dddEba35Ca0D235A4086086AC704bbc8C2b'

  /**
   * Url to the payment agent server.
   */
  public paymentAgentUrl: string = `https://payments.test.evan.network`

  /**
   * base endpoint of the payment
   */
  public paymentEndPoint: string = 'api/smart-agents/ipfs-payments';

  /**
   * create singleton instance and create queue id
   */
  constructor(
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private description: EvanDescriptionService,
    private http: Http,
    private queue: EvanQueue,
    private singleton: SingletonService,
    private translate: EvanTranslationService,
    private utils: EvanUtilService,
  ) {
    return singleton.create(EvanPaymentService, this, () => {

    }, true);
  }

  /**
   * Send a rest get request to the payment agent using the corresponding new build headers.
   *
   * @param      {string}  endPoint  endpoint that should be called using
   *                                 `${ this.paymentAgentUrl }/${ this.paymentEndPoint }`
   * @return     {Promise<any>}  json result of the request
   */
  public async requestPaymentAgent(endPoint: string): Promise<any> {
    return (await this.http
      .get(`${ this.paymentAgentUrl }/${ this.paymentEndPoint }/${ endPoint }`, {
        authorization: await CoreBundle.utils.getSmartAgentAuthHeaders(this.bcc.coreRuntime)
      })
      .toPromise()
    ).json();
  }
}
