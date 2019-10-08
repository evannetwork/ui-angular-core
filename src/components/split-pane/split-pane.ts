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
  getDomainName
} from 'dapp-browser';

import {
  Component, OnInit, OnDestroy, // @angular/core
  Observable, Subscription,
  DomSanitizer,  MenuController, Input,
  ChangeDetectionStrategy, ChangeDetectorRef, // optimize me
  Output, EventEmitter
} from 'angular-libs';

import { EvanRoutingService } from '../../services/ui/routing';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanDescriptionService } from '../../services/bcc/description';
import { EvanQueue } from '../../services/bcc/queue';
import { createOpacityTransition } from '../../animations/opacity';
import { EvanAddressBookService } from '../../services/bcc/address-book';
import { EvanSlidesService } from '../../services/ui/slides';
import { EvanMailboxService } from '../../services/bcc/mailbox';
import { EvanUtilService } from '../../services/utils';
import { AsyncComponent } from '../../classes/AsyncComponent';

/**************************************************************************************************/

/**
 * Create easy Dashboards
 *   - generates an left panel using Ionic (will be folded on small displays)
 *   - With a click into the header it will show a small view on big devices.
 *   - include footer select box to navigate to root dapps
 * 
 * Notice: powerfull in combination with DApps that using dapp-wrapper.
 * 
 * ng-content selectors:
 *  - "evan-menu-content" for left panel contents
 *  - "evan-content" for right side 
 * 
 * Usage:
 *   typescript:
 *   this.dapps = await this.descriptionService.getMultipleDescriptions([
 *     'favorites',
 *     'addressbook',
 *     'mailbox',
 *     'profile'
 *   ]);
 * 
 *   html:
 *   <evan-split-pane #splitPane *ngIf="!loading" (smallToolbarToggled)="ref.detectChanges()">
 *     <div evan-menu-content>
 *       <ion-list>
 *         <button ion-item menuClose 
 *           color="light" 
 *           *ngFor="let dapp of dapps"
 *           routerLink="./{{ dapp.ensAddress }}"
 *           routerLinkActive="active">
 *           <ion-avatar item-start *ngIf="dapp.imgSquare">
 *             <img item-start large *oneTime [src]="_DomSanitizer.bypassSecurityTrustUrl(dapp.imgSquare)" />
 *           </ion-avatar>
 *           <h2 *ngIf="!splitPane.isSmallToolbar()">{{ dapp.translated.name | translate }}</h2>
 *           <h3 *ngIf="!splitPane.isSmallToolbar()">{{ dapp.translated.description | translate }}</h3>
 *
 *           <div class="left-panel-notification"
 *             *ngIf="dapp.name === 'mailbox' && mailboxService.newMailCount > 0">
 *             {{ mailboxService.newMailCount > 9 ? 9 + '+' : mailboxService.newMailCount }}
 *           </div>
 *         </button>
 *       </ion-list>
 *     </div>
 *     <div evan-content
 *       [@routerTransition]="o?.activatedRouteData?.state">
 *       <router-outlet #o="outlet"></router-outlet>
 *     </div>
 *   </evan-split-pane>
 *
 * @class      Component EvanSplitPaneComponent
 */
@Component({
  selector: 'evan-split-pane',
  templateUrl: 'split-pane.html',
  animations: [
    createOpacityTransition(),
  ]
})
export class EvanSplitPaneComponent extends AsyncComponent {
  /***************** inputs & outpus *****************/
  /**
   * use dashboard wrapper functions, but hide the sidepanel
   */
  @Input() disableSidepanel: boolean;

  /**
   * Check if a custom header should be displayed
   */
  @Input() customHeader: boolean;

  /**
   * check if the small view can be enabled or not
   */
  @Input() allowSmall: boolean = true;

  /**
   * check if the small view can be enabled or not
   */
  @Input() rootDAppOpen: Function;

  /**
   * Event triggered, when user clicks of dashboard header
   */
  @Output() public smallToolbarToggled: EventEmitter<any> = new EventEmitter();

  /**
   * Event triggered, when a new root dapp was loaded (can be submitted multiple times)
   */
  @Output() public rootDAppLoaded: EventEmitter<any> = new EventEmitter();

  /**
   * Event triggered, when a new root dapp was loaded (can be submitted multiple times)
   */

  /*****************    variables    *****************/
  /**
   * active account id
   */
  private accountId: string;

  /**
   * check if the current route has navigate back configured
   */
  private canNavigateBack: Observable<boolean>;

  /**
   * hide or show the split pane additionally
   */
  private displaySplitPane: boolean;

  /**
   * if footer is enabled, pass ion-select options
   */
  private footerSelectOptions: any;

  /**
   * active root DApp routing instance (dashboard, taskboard, ...)
   */
  private rootDApp: any;

  /**
   * show loading indicator for header
   */
  private rootDAppLoading: boolean;

  /**
   * name of the root DApp
   */
  private rootDAppName: string;

  /**
   * all root dapps (dashboard, favorites, mailbox, profile, addressbook)
   */
  private rootDApps: any;

  /**
   * selected value of the footer
   */
  private rootDAppSelectValue: string;

  /**
   * should the footer select box be displayed?
   */
  private showRootDApps: boolean;

  /**
   * use to check for small or big toolbarr
   */
  private smallToolbar: boolean;

  /**
   * active route name watcher
   */
  private watchActiveRouteName: Subscription;

  /**
   * screen size watcher
   */
  private watchScreenSize: Function;

  /**
   * hear on 'toggle-split-pane' event (triggered by dapp-wrapper on mobile devices)
   */
  private watchToggleSplitPane: Function;

  /**
   * cache the loggingDApp to handle development mode
   */
  private loggingDApp: Function;

  /**
   * watch for developer mode switch
   */
  private developerModeSwitch: Function;

  /***************** initialization  *****************/
  constructor(
    private core: EvanCoreService,
    private routing: EvanRoutingService,
    private evanQueue: EvanQueue,
    private addressBookService: EvanAddressBookService,
    private _DomSanitizer: DomSanitizer,
    private slidesService: EvanSlidesService,
    private menuController: MenuController,
    private mailboxService: EvanMailboxService,
    private descriptionService: EvanDescriptionService,
    private utils: EvanUtilService,
    private ref: ChangeDetectorRef
  ) {
    super(ref);
  }

  /**
   * apply watchers, load rootDapps, load addressbook
   */
  async _ngOnInit() {
    this.accountId = this.core.activeAccount();

    this.smallToolbar = this.allowSmall ? window.localStorage['evan-small-toolbar'] === 'true' : false;
    this.footerSelectOptions = { cssClass: 'evan-callout bottom' };

    this.displaySplitPane = document.querySelectorAll('evan-split-pane').length === 1;
    this.watchActiveRouteName = this.watchRouteName();
    this.watchScreenSize = await this.utils.windowSize(() => this.ref.detectChanges());
    this.watchToggleSplitPane = this.core.utils.onEvent('toggle-split-pane', () => {
      this.menuController._menus.forEach(menu => {
        if (menu._side === 'left') {
          menu.toggle();
        }
      });

      this.ref.detectChanges();
    });

    this.rootDApps = await this.descriptionService.getMultipleDescriptions([
      `dashboard`,
      `favorites`,
      `mailbox`,
      `addressbook`,
      `profile`,
    ]);

    await this.addressBookService.loadAccounts();

    this.checkDevelopmentMode();
  }

  /**
   * clear subscriptions
   */
  async _ngOnDestroy() {
    this.watchActiveRouteName.unsubscribe();
    this.watchScreenSize();
    this.watchToggleSplitPane();
  }

  /**
   * at startup, the left panel is hanging sometimes
   */
  async _ngAfterViewInit() {
    setTimeout(() => this.ref.detectChanges(), 500);
  }

  /*****************    functions    *****************/
  /**
   * Watch for route changes and load DBCP definitions for route DApp to be able
   * to display name and img of the dapp
   */
  watchRouteName() {
    let lastActiveRoute = '';

    return this.routing
      .activeRootRouteName()
      .subscribe(async (value) => {
        this.rootDAppName = value;

        if (value !== lastActiveRoute && value !== '**') {
          try {
            this.rootDAppLoading = true;

            const ensAddress = this.descriptionService.getEvanENSAddress(value);
            const definition = await this.descriptionService.getDescription(ensAddress);

            this.rootDApp = definition;
            if (this.rootDApp.name === 'dashboard') {
              this.showRootDApps = false;
            } else {
              this.showRootDApps = true;
            }

            this.rootDAppLoading = false;

            lastActiveRoute = value;

            this.rootDAppLoaded.emit();
            this.ref.detectChanges();
          } catch (ex) {
            console.error(ex);
          }
        }
      });
  }

  /**
   * toggle toolbar small / big
   */
  toggleSmallToolbar() {
    if (this.allowSmall) {
      this.smallToolbar = !this.smallToolbar;

      window.localStorage['evan-small-toolbar'] = this.smallToolbar;

      this.ref.detectChanges();

      this.smallToolbarToggled.emit();
    }
  }

  /**
   * Check if toolbar should displayed as small
   */
  isSmallToolbar() {
    return this.smallToolbar && this.utils.isMD;
  }

  /**
   * open a route dapp
   *
   * @param      {any}  rootDAppSelect  select value of the footer select
   */
  openDApp(rootDAppSelect) {
    const dapp = rootDAppSelect.value;

    if (dapp) {
      if (typeof this.rootDAppOpen === 'function') {
        this.rootDAppOpen(dapp);
      } else {
        if (dapp.dapp.standalone) {
          this.routing.navigate(`/${ dapp.ensAddress }`);
        } else {
          this.routing.navigate(`./${ dapp.ensAddress }`, true);
        }
      }
    }

    rootDAppSelect.setValue('');
    this.menuController.close();
  }

  /**
   * Check if developer mode is enabled and add the logging dapp to dashboard apps
   */
  async checkDevelopmentMode(): Promise<any> {
    if (this.core.utils.isDeveloperMode()) {
      if (!this.loggingDApp) {
        this.loggingDApp = await this.descriptionService.getDescription(
          this.descriptionService.getEvanENSAddress('logging')
        );
      }

      if (this.rootDApps[this.rootDApps.length - 1].name !== 'logging') {
        this.rootDApps.push(this.loggingDApp);
      }
    } else if (this.loggingDApp) {
      this.rootDApps.pop();
    }

    if (!this.developerModeSwitch) {
      this.developerModeSwitch = this.core.utils
        .onEvent('evan-developer-mode', () => this.checkDevelopmentMode());
    }
    
    this.ref.detectChanges();
  }
}
