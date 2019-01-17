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
  getDomainName
} from 'dapp-browser';

import {
  ActivatedRoute,
  ChangeDetectorRef,
  Component,
  Input,
  NavController,
  OnInit,
  TranslateService,
  ViewChild,
} from 'angular-libs';

import { AsyncComponent } from '../../classes/AsyncComponent';
import { EvanVerificationService } from '../../services/bcc/verifications';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanQueue, } from '../../services/bcc/queue';
import { QueueId, } from '../../services/bcc/queue-utilities';

/**************************************************************************************************/

/**
 * Display all for the user configured active verifications for a specific topic.
 */
@Component({
  selector: 'evan-profile-verifications',
  templateUrl: 'profile-verifications.html',
  animations: [  ]
})

export class EvanProfileVerificationsComponent extends AsyncComponent {
  /***************** inputs & outpus *****************/
  /**
   * address that for that the verifications should be checked
   */
  @Input() address: string;

  /**
   * display mode that should be used (minimal, detail, full)
   */
  @Input() mode: any;

  /*****************    variables    *****************/
  /**
   * for the current profile activated verifications
   */
  private verifications: Array<string> = [ ];

  /**
   * Function to unsubscribe from profile verifications watcher queue results.
   */
  private profileVerificationsWatcher: Function;

  constructor(
    private verificationsService: EvanVerificationService,
    private core: EvanCoreService,
    private queueService: EvanQueue,
    private ref: ChangeDetectorRef,
  ) {
    super(ref);
  }

  async _ngOnInit() {
    // load profile active verifications
    this.profileVerificationsWatcher = await this.queueService.onQueueFinish(
      new QueueId(`profile.${ getDomainName() }`, '*'),
      async (reload, results) => {
        reload && await this.core.utils.timeout(0);
        this.verifications = await this.verificationsService.getProfileActiveVerifications();
        this.ref.detectChanges();
      }
    );
  }

  /**
   * Clear the queue
   */
  async _ngOnDestroy() {
    this.profileVerificationsWatcher();
  }
}
