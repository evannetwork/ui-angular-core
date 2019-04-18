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

import { logLog } from 'bcc';

import {
  notifications,
  utils,
  getDomainName
} from 'dapp-browser';

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
import { EvanAlertService } from '../../services/ui/alert';
import { AsyncComponent } from '../../classes/AsyncComponent';
import { EvanPaymentService } from '../../services/bcc/payment';

/**************************************************************************************************/

// show all types warning only each 30 seconds
let warningTimeout = { };

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

  /**
   * img that should be displayed at the start oft the dapp-wrapper header
   */
  @Input() headerImg: string;

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
   * watch for new notifications
   */
  private notificationWatcher: Function;

  /**
   * watch for warnings
   */
  private warningWatcher: Function;

  /**
   * is currently a warning shown?
   */
  private warningDisplayed: Promise<any> = Promise.resolve();

  /**
   * handle log errors
   */
  private logErrors: Array<any>;

  /**
   * log error watcher
   */
  private logErrorWatcher: any;

  /**
   * is the developer mode enabled?
   */
  private isDeveloperMode: boolean;

  /**
   * watch for developer mode switch
   */
  private developerModeSwitch: Function;

  /**
   * last amount of queue buttons
   */
  private lastQueueButtonCount: number;

  /***************** initialization  *****************/
  constructor(
    private _DomSanitizer: DomSanitizer,
    private alertService: EvanAlertService,
    private bccService: EvanBCCService,
    private core: EvanCoreService,
    private definitionService: EvanDescriptionService,
    private elementRef: ElementRef,
    private evanQueue: EvanQueue,
    private logging: EvanLoggingService,
    private mailboxService: EvanMailboxService,
    private menuController: MenuController,
    private paymentService: EvanPaymentService,
    private ref: ChangeDetectorRef,
    private router: Router,
    private routing: EvanRoutingService,
    private translateService: EvanTranslationService,
    private utilService: EvanUtilService,
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

    // check for new translations, submitted by sub dapps => update the i18n of
    // the current application
    this.translationUpdate = this.translateService.watchTranslationUpdate(() => this.ref.detectChanges());

    // if the header is shown, apply the notification, mails, queue buttons and so on
    if (this.showHeader) {
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

      // if a notification is available, but we didn't ask the user before to open this notification
      // show an alert and ask the user
      if (notifications.notifications.length > 0 &&
        !notifications.notifications[notifications.notifications.length - 1].evanNotificationOpened) {
        this.handleNotification();
      }

      // create an new watcher to handle incoming notifications
      this.notificationWatcher = this.utilService.onEvent('evan-notification',
        (notification) => this.handleNotification());

      // watch for queue changes and try to sync everything
      this.warningWatcher = this.utilService.onEvent('evan-warning', async (data) => {
        this.warningDisplayed = this.warningDisplayed
          .then(async () => {
            let dontShowAgain = window.localStorage['evan-warnings-disabled'] || '{ }';

            try {
              dontShowAgain = JSON.parse(dontShowAgain);
            } catch (ex) {
              dontShowAgain = { };
            }

            // if the popup should be shown, show it!
            if (!dontShowAgain[data.detail.type] && !warningTimeout[data.detail.type]) {
              await new Promise((resolve, reject) => {
                // add all basic buttons (cance, ok, dont show again)
                const buttons: Array<any> = [
                  {
                    text: this.translateService.instant('_angularcore.warnings.dont-show-again'),
                    handler: () => {
                      dontShowAgain[data.detail.type] = true;
                      window.localStorage['evan-warnings-disabled'] = JSON.stringify(dontShowAgain);

                      resolve();
                    }
                  },
                  {
                    role: 'cancel',
                    cssClass: 'display-none',
                    handler: () => resolve()
                  },
                  {
                    text: 'ok',
                    handler: () => resolve(data)
                  }
                ];

                // if the quota exceeded warning was received, add the clear ipfs cache data button
                if (data.detail.type === 'quota-exceeded') {
                  buttons.unshift({
                    text: this.translateService.instant(
                      '_angularcore.warnings.quota-exceeded.clear-ipfs-cache'),
                    handler: async () => {
                      await new Promise((quotaClearResolve) => {
                        let deleteRequest = indexedDB.deleteDatabase('ipfs-cache');

                        deleteRequest.onsuccess = () => quotaClearResolve();
                        deleteRequest.onerror = () => quotaClearResolve();
                        deleteRequest.onblocked = () => quotaClearResolve();
                      });

                      // ask the user to reload the application
                      try {
                        await this.alertService.showSubmitAlert(
                          '_angularcore.warnings.quota-reload.title',
                          '_angularcore.warnings.quota-reload.description',
                          '_angularcore.warnings.quota-reload.cancel',
                          '_angularcore.warnings.quota-reload.ok',
                        );

                        window.location.reload();
                      } catch (ex) { }

                      resolve();
                    }
                  });
                }

                // if the quota exceeded warning was received, add the clear ipfs cache data button
                if (data.detail.type === 'payment-channel') {
                  buttons.unshift({
                    text: this.translateService.instant(
                      '_angularcore.warnings.payment-channel.navigate-to-profile'),
                    handler: async () => {
                      this.routing.navigate([
                        `/${ this.routing.getActiveRootEns() }`,
                        `profile.${ getDomainName() }`,
                        `payments`
                      ].join('/'));

                      resolve();
                    }
                  });
                }

                this.alertService.showAlert(
                  this.translateService.instant(
                    `_angularcore.warnings.${ data.detail.type }.title`, data.detail),
                  this.translateService.instant(
                    `_angularcore.warnings.${ data.detail.type }.body`, data.detail),
                  buttons
                );
              });

              // show all types warning only each 30 seconds
              warningTimeout[data.detail.type] = setTimeout(() => {
                delete warningTimeout[data.detail.type];
              }, 30 * 1000);
            }
          });

        await this.warningDisplayed;
      });

      // check if the user already has created an payment channel, if not, trigger an popup to
      // navigate the user to the profile page, where the payment channel can be set up
      //   => cannot be check within the dapp-browser, their is no uer logged in
      const paymentChannels = await this.paymentService.requestPaymentAgent('getChannels');
      const activeChannels = paymentChannels.channels.filter(channel => channel.state === 'OPEN');
      if (activeChannels.length === 0) {
        this.core.utils.sendEvent('evan-warning', { type: 'payment-channel' });
      }

      // watch for developer mode is changing
      this.isDeveloperMode = window.localStorage['evan-developer-mode'] === 'true';
      this.developerModeSwitch = this.core.utils
        .onEvent('evan-developer-mode', () => {
          this.isDeveloperMode = window.localStorage['evan-developer-mode'] === 'true';
          this.ref.detectChanges();
        });
    }

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
    this.notificationWatcher && this.notificationWatcher();
    this.developerModeSwitch && this.developerModeSwitch();
  }

  /**
   * Handles incoming notifications and asks the user, if he want to jump into the incoming
   * notification application.
   */
  async handleNotification() {
    const receivedNotifications = notifications.notifications;

    // check if notifications are available and open the last one
    if (receivedNotifications.length > 0 &&
      !receivedNotifications[receivedNotifications.length - 1].evanNotificationOpened) {
      const notification = notifications.notifications[receivedNotifications.length - 1];

      // ask the user
      try {
        let title = notification.title || '_angularcore.new-notification';
        let body = notification.body || '';

        // check for the notification text, on ios capsuled within the aps object, on android we use
        // simply the body attribute
        if (notification.aps && notification.aps.alert) {
          if (typeof notification.aps.alert === 'string') {
            body = notification.aps.alert;
          } else {
            if (notification.aps.alert.body) {
              body = notification.aps.alert.body;
            }

            if (notification.aps.alert.title) {
              title = notification.aps.alert.title;
            }
          }
        }

        await this.alertService.showSubmitAlert(
          title,
          body,
          'cancel',
          'open'
        );
        window.location.href = await notifications.getDAppUrlFromNotification(notification);
      } catch (ex) { }

      // set that this notification was opened
      notification.evanNotificationOpened = true;
    }
  }

  /**
   * Return the count of top right buttons that should be displayed (queue, mail, log)
   *
   * @return     {number}  Number of buttons to show
   */
  queueButtonCount() {
    const lastQueueButtonCount = [
      this.evanQueue.queue.entries.length > 0,
      this.mailboxService.newMailCount > 0,
      this.logErrors.length > 0 && !this.evanQueue.exception
    ].filter(check => check === true).length;

    if (lastQueueButtonCount !== this.lastQueueButtonCount) {
      this.utilService.sendEvent('evan-queue-button-count');
    }

    this.lastQueueButtonCount = lastQueueButtonCount;

    return this.lastQueueButtonCount;
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

  /**
   * Opens an explorer for the current opened DApp.
   */
  private async openExplorer() {
    const dappsToOpen = this.routing.getRouteFromUrl(window.location.hash).split('/').reverse();

    for (let dapp of dappsToOpen) {
      let isValid = false;

      // is it an contract?
      isValid = isValid || dapp.indexOf('0x') === 0;

      // has it an valid dbcp description
      isValid = isValid || (await this.definitionService.getDescription(dapp)).status === 'valid';

      // check if underlaying nameresolver contract address exists
      if (!isValid) {
        try {
          const fifsAddress = await this.bccService.nameResolver.getAddress(dapp);

          // if an valid address was set, overwrite the dapp to open
          if (fifsAddress && fifsAddress !== '0x0000000000000000000000000000000000000000') {
            dapp = fifsAddress;
            isValid = true;
          }
        } catch (ex) { }
      }

      if (isValid) {
        this.routing.navigate(`/explorer.${ getDomainName() }/detail/${ dapp }`);
      }
    }
  }
}
