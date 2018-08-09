/*
  Copyright (C) 2018-present evan GmbH. 
  
  This program is free software: you can redistribute it and/or modify it
  under the terms of the GNU Affero General Public License, version 3, 
  as published by the Free Software Foundation. 
  
  This program is distributed in the hope that it will be useful, 
  but WITHOUT ANY WARRANTY; without even the implied warranty of 
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Affero General Public License for more details. 
  
  You should have received a copy of the GNU Affero General Public License along with this program.
  If not, see http://www.gnu.org/licenses/ or write to the
  
  Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA, 02110-1301 USA,
  
  or download the license from the following URL: https://evan.network/license/ 
  
  You can be released from the requirements of the GNU Affero General Public License
  by purchasing a commercial license.
  Buying such a license is mandatory as soon as you use this software or parts of it
  on other blockchains than evan.network. 
  
  For more information, please contact evan GmbH at this address: https://evan.network/license/ 
*/

import { logLog } from 'bcc';
import { utils } from 'dapp-browser';
import {
  Component, OnInit, OnDestroy,
  Router, NavigationEnd, RouterEvent,
  trigger, animate, style, transition,
  ViewChild, AfterViewInit,
  DomSanitizer, Output,
  MenuController, EventEmitter,
  Input, ElementRef,
  ChangeDetectorRef // optimize me
} from 'angular-libs';

import { EvanRoutingService } from '../../services/ui/routing';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanDescriptionService } from '../../services/bcc/description';
import { EvanQueue } from '../../services/bcc/queue';
import { createOpacityTransition } from '../../animations/opacity';
import { EvanMailboxService } from '../../services/bcc/mailbox';
import { EvanUtilService } from '../../services/utils';
import { EvanBCCService } from '../../services/bcc/bcc';
import { EvanTranslationService } from '../../services/ui/translate';
import { EvanLoggingService } from '../../services/ui/logging';
import { AsyncComponent } from '../../classes/AsyncComponent';

/**************************************************************************************************/

/**
 * top-bar wrapper for DApps that enables:
 *   - back navigation
 *   - url routing has as title (dynamic)
 *   - mailbox alerts
 *   - queue status
 *   
 * ng-content selectors:
 *   - "evan-content" for wrapper content
 *   
 * Usage:
 *   <dapp-wrapper *ngIf="!loading" #dappWrapper>
 *     <div evan-content [@routerTransition]="o?.activatedRouteData?.state">
 *       <router-outlet #o="outlet"></router-outlet>
 *     </div>
 *   </dapp-wrapper>
 *
 * @class      Component EvanDAppWrapperComponent
 */
@Component({
  selector: 'dapp-wrapper',
  templateUrl: 'dapp-wrapper.html',
  animations: [
    createOpacityTransition(),
    trigger('queueButtonTransition', [
      transition(':enter', [
        style({ right: '-56px' }),
        animate('500ms', style({ right: '0px' }))
      ]),
      transition(':leave', [
        style({ right: '0px' }),
        animate('500ms', style({ right: '-56px' }))
      ])
    ])
  ]
})
export class EvanDAppWrapperComponent extends AsyncComponent {
  /***************** inputs & outpus *****************/
  /**
   * Emitted when the routing data refresh property is set and the reload button
   * is clicked, so the parent module can reload the current component content.
   * 
   */
  @Output() refreshing: EventEmitter<any> = new EventEmitter();

  /*****************    variables    *****************/
  /**
   * active route name that is opening this dapp-wrapper
   */
  private activeDApp: string;

  /**
   * check if the content is loading
   */
  private contentLoading: boolean;

  /**
   * current account id
   */
  private accountId: string;

  /**
   * check if the top left showMenuButton should be displayed on small display
   */
  private showMenuButton: boolean;

  /**
   * show header or not (disable top bar)
   */
  private showHeader: boolean;

  /**
   * interval reference of setInterval that checks for new mails
   */
  private mailCheckInterval: any;

  /**
   * used to check, if the content should be refreshed (dom elements will be hidden) 
   */
  private refreshContent: boolean;

  /**
   * reloadAction from route data definition
   */
  private reloadAction: any;

  /**
   * event handler that watches for queue updates
   */
  private onQueueUpdate: Function;

  /**
   * event handler for route changes
   */
  private routerChange: any;

  /**
   * event handler for translation updates
   */
  private translationUpdate: Function;

  /**
   * handle log errors
   */
  private logErrors: Array<any>;

  /**
   * log error watcher
   */
  private logErrorWatcher: any;

  /***************** initialization  *****************/
  constructor(
    private _DomSanitizer: DomSanitizer,
    private bccService: EvanBCCService,
    private core: EvanCoreService,
    private definitionService: EvanDescriptionService,
    private elementRef: ElementRef,
    private evanQueue: EvanQueue,
    private mailboxService: EvanMailboxService,
    private menuController: MenuController,
    private ref: ChangeDetectorRef,
    private router: Router,
    private routing: EvanRoutingService,
    private translateService: EvanTranslationService,
    private utilService: EvanUtilService,
    private logging: EvanLoggingService
  ) {
    super(ref, false);
  }

  /**
   * initialize the dapp wrapper
   *   - check for show header / menu button
   *   - add route change events to handle title updates
   *   - check for new mails
   *   - check for queue updates to show top right queue status button
   *   - check for translation updates to handle it globally
   */
  async _ngOnInit() {
    this.ref.detach();

    this.accountId = this.core.activeAccount();

    // setup log errors
    this.checkLogErrors();
    this.logErrorWatcher = setInterval(() => this.checkLogErrors(), 5000);

    // prepend A to be a valid html id, needs to start with a character
    this.elementRef.nativeElement.id = 'A' + this.utilService.generateID().replace(/-/g, '');
    this.showMenuButton = document.querySelectorAll('ion-split-pane').length > 0;
    this.showHeader = document.querySelectorAll(
      `dapp-wrapper #${this.elementRef.nativeElement.id}`
    ).length === 0;

    this.loadCurrentRouteInfos();
    this.routerChange = this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationEnd) {
        this.loadCurrentRouteInfos();
      }
    });

    // check for new mails
    await this.mailboxService.checkNewMails();
    this.mailCheckInterval = setInterval(async () => {
      await this.mailboxService.checkNewMails();

      this.ref.detectChanges();
    }, 30 * 1000);

    // watch for queue changes and try to sync everything
    this.onQueueUpdate = this.utilService.onEvent('evan-queue-update', async () => {
      if (this.evanQueue.isInstantSave()) {
        await this.evanQueue.loadDispatcherForQueue();

        this.evanQueue.startSyncAll(true);
      }

      this.ref.detectChanges();
    });

    // check for new translations, submitted by sub dapps => update the i18n of
    // the current application
    this.translationUpdate = this.translateService.watchTranslationUpdate(() => this.ref.detectChanges());

    this.ref.detectChanges();
  }

  /**
   * clear all watchers
   */
  async _ngOnDestroy() {
    clearInterval(this.mailCheckInterval);
    clearInterval(this.logErrorWatcher);

    this.routerChange && this.routerChange.unsubscribe();
    this.onQueueUpdate && this.onQueueUpdate();
    this.translationUpdate && this.translationUpdate();
  }

  queueButtonCount() {
    return [
      this.evanQueue.queue.entries.length > 0,
      this.mailboxService.newMailCount > 0,
      this.logErrors.length > 0 && !this.evanQueue.exception
    ].filter(check => check === true).length;
  }

  /*****************    functions    *****************/
  /**
   * Load the active dapp name and reload action from routes
   */
  private loadCurrentRouteInfos() {
    this.routing.setNavigateBackStatus();

    this.activeDApp = this.routing.getDAppNameFromRoutePath(
      this.routing.getRouteFromUrl(this.router.url)
    );

    this.reloadAction = this.routing.getDataParam('reload');

    if (this.reloadAction && !Array.isArray(this.reloadAction)) {
      this.reloadAction = [ this.reloadAction ];
    }

    this.ref.detectChanges();
  }

  /**
   * Toggle right queue menu.
   */
  public toggleQueueSidePanel() {
    this.menuController._menus.forEach(menu => {
      if (menu.id === 'queueMenu') {
        menu.enable(true);
        menu.toggle('queueMenu');
      }
    });
  }

  /**
   * Trigger an 'toggle-split-pane' event to open split-pane left panel on small
   * devices
   */
  private openSplitPane() {
    this.utilService.sendEvent('toggle-split-pane');
  }

  /**
   * Trigger content refreshing. Checks if the reloadAction is an function, then
   * trigger it. Else the content will be removed and shown again
   */
  private async startRefreshContent() {
    this.refreshContent = true;
    this.ref.detectChanges();
    this.refreshing.emit();

    if (this.reloadAction) {
      for (let reloadAction of this.reloadAction) {
        // simple refresh
        if (reloadAction === true) {
          await this.utilService.timeout(0);

        // custom function refresh
        } else if (typeof reloadAction === 'function') {
          await reloadAction(this);

        // profile refresh
        } else {
          await this.bccService.profile.loadForAccount(this.bccService.profile.treeLabels[reloadAction]);
        }
      }
    }

    this.refreshContent = false;
    this.ref.detectChanges();
    this.refreshing.emit();
  }

  /**
   * Set the current logErrors Array<any> to show report button.
   */
  private checkLogErrors() {
    this.logErrors = logLog.filter(entry => entry.level === 'error');

    this.ref.detectChanges();
  }

  /**
   * Open the log question alert and update the refs after it.
   *
   * @return     {Promise<void>}  resolved when done
   */
  async reportLogs() {
    await this.logging.logQuestionAlert();

    this.ref.detectChanges();
  }
}
