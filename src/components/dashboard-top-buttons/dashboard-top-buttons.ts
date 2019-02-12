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
  logLog
} from 'bcc';

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
} from 'angular-libs';

import { AsyncComponent } from '../../classes/AsyncComponent';
import { EvanMailboxService } from '../../services/bcc/mailbox';
import { EvanQueue } from '../../services/bcc/queue';
import { EvanUtilService } from '../../services/utils';

/**************************************************************************************************/

/**
 * Display buttons on big screens on the top right, used to be included remotly into the
 * dapp-wrapper top bar. Use the "on-small-move-down" class to move it automtically to the bottom
 * right corner of the screen. Within this component ion-searchbars will be hidden on small devices,
 * so you can easily create dynamic scaled top bar elements.
 *
 * @class      Component DashboardTopButtons
 */
@Component({
  selector: 'dashboard-top-buttons',
  templateUrl: 'dashboard-top-buttons.html'
})
export class DashboardTopButtons {
  /**
   * event handler that watches for queue updates
   */
  private onQueueButtonChange: Function;

  /***************** initialization  *****************/
  constructor(
    private element: ElementRef,
    private mailboxService: EvanMailboxService,
    private queue: EvanQueue,
    private ref: ChangeDetectorRef,
    private utilService: EvanUtilService,
  ) {
    this.ref.detach();
    this.ref.detectChanges();
  }

  /**
   * TODO: Optionally it can be move to body level to handle fixed containing elements
   */
  async ngAfterViewInit() {
    this.onQueueButtonChange = this.utilService.onEvent('evan-queue-button-count', async () => {
      this.setQueueButtonCount();
      this.ref.detectChanges();
    });

    const ionApp = document.body.querySelector('ion-app');
    for (let i = 0; i < ionApp.childNodes.length; i++) {
      if ((<any>ionApp.childNodes[i]).tagName.toLowerCase() === 'dashboard-top-buttons') {
        ionApp.removeChild(ionApp.childNodes[i]);
      }
    }

    ionApp.appendChild(this.element.nativeElement);
    this.setQueueButtonCount();
  }

  ngOnDestroy() {
    if (this.element.nativeElement && this.element.nativeElement.parentElement) {
      this.element.nativeElement.parentElement.removeChild(this.element.nativeElement);
    }

    this.onQueueButtonChange();
  }

  /**
   * Return the count of top right buttons that should be displayed (queue, mail, log)
   *
   * @return     {number}  Number of buttons to show
   */
  setQueueButtonCount() {
    const logErrors = logLog.filter(entry => entry.level === 'error');

    // remove the previous added queue button active class
    this.element.nativeElement.className = this.element.nativeElement.className
      .replace(/ queue-button-active-*/g, '');

    // add the new queue button active class
    this.element.nativeElement.className += ' queue-button-active-' + ([
      this.queue.queue.entries.length > 0,
      this.mailboxService.newMailCount > 0,
      logErrors.length > 0 && !this.queue.exception
    ].filter(check => check === true).length);
  }
}
