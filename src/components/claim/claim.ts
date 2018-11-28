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
  AfterViewInit,
  animate,
  AnimationEntryMetadata,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DomSanitizer,
  ElementRef,
  EventEmitter,
  Input,
  MenuController,
  OnDestroy,
  OnInit,
  Output,
  style,
  transition,
  trigger,
  ViewChild,
} from 'angular-libs';

import { AsyncComponent } from '../../classes/AsyncComponent';
import { EvanAddressBookService } from '../../services/bcc/address-book';
import { EvanBCCService } from '../../services/bcc/bcc';
import { EvanClaimService } from '../../services/bcc/claims';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanQueue } from '../../services/bcc/queue';
import { EvanTranslationService } from '../../services/ui/translate';
import { QueueId, } from '../../services/bcc/queue-utilities';

import { createOpacityTransition } from '../../animations/opacity';
import { createGrowTransition } from '../../animations/grow';

/**************************************************************************************************/

/**
 * Display a all claims for a specific topic using the api-blockchain-core claims service.
 *
 * @class      Component EvanClaimComponent
 */
@Component({
  selector: 'evan-claim',
  templateUrl: 'claim.html',
  animations: [
    createGrowTransition(),
    createOpacityTransition(),
    trigger('slowGrowTransition', [
      transition(':enter', [
        style({ height: 0, 'min-height': 0 }),
        animate('500ms', style({ height: '{{height}}' }))
      ]),
      transition(':leave', [
        style({ }),
        animate('500ms', style({ height: 0, 'min-height': 0 }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvanClaimComponent extends AsyncComponent {
  /***************** inputs & outpus *****************/
  /**
   * address that for that the claims should be checked
   */
  @Input() address: string

  /**
   * the topic to load the claims for (/test/test2)
   */
  @Input() topic: string;

  /**
   * display mode that should be used (minimal, detail, full)
   */
  @Input() mode: string;

  /**
   * use computed view and only one claim instead of all possible ones (will display a small claim
   * count at the right of the card)
   */
  @Input() compute: boolean = true;

  /*****************    variables    *****************/
  /**
   * available display modes
   */
  private availableModes = [
    'icon', // only circle that displays the icon
    'normal', // icon, displayname, creation date, sub claim count
    'detail', // normal + from / to, issued + valid until + status
  ];

  /**
   * All available claims for the given topic
   */
  private claims: Array<any> = [ { loading: true } ];
  
  /**
   * concadinated claim including computed status
   */
  private computed: any = { loading: true };

  /**
   * Are currently the claims loading?
   */
  private loadingClaims: boolean

  /**
   * Function to unsubscribe from queue results.
   */
  private queueWatcher: Function;

  /**
   * account id of the current logged in user
   */
  private activeAccount: any;

  /**
   * identity contract address of the current user
   */
  private activeIdentity: any;

  /**
   * identity contract address of the user that gets inspected
   */
  private subjectIdentity: any;

  /**
   * activate the detail popup when a claim was clicked 
   */
  private popupClaim: any;

  /**
   * current addressbook contact
   */
  private addressbook: any;

  /**
   * fix for modal scrolling => sometimes, modal does not scroll, change simply the size with an
   * delay, so the scrolling will be enabled
   */
  private disableScrolling: boolean;

  /**
   * generate a iso string from the current date for the date input fields
   */
  private now;

  /**
   * max date for the date input picker
   */
  private maxDate = new Date().getFullYear() + 5;

  /**
   * new claim that should be issued
   */
  private issueClaim: any;

  /**
   * all modals that are used by the claims component to handle correct scoped and sized modal dialogs
   */
  private modals: Array<any>;

  /**
   * parent containing ion app contaioner
   */
  private closestIonApp: any;

  /**
   * for the current profile activated claims
   */
  private profileClaims: Array<string> = [ ];

  /**
   * Function to unsubscribe from profile claims watcher queue results.
   */
  private profileClaimsWatcher: Function;

  /**
   * menu value, when a claim menu entry was clicked
   */
  private claimMenuValue: string;

  /***************** initialization  *****************/
  constructor(
    private _DomSanitizer: DomSanitizer,
    private addressBookService: EvanAddressBookService,
    private bcc: EvanBCCService,
    private claimService: EvanClaimService,
    private core: EvanCoreService,
    private element: ElementRef,
    private menuController: MenuController,
    private queue: EvanQueue,
    private translate: EvanTranslationService,
    public ref: ChangeDetectorRef,
  ) {
    super(ref);
  }

  /**
   * Set initial, bind queue watchers and load the claims.
   */
  async _ngOnInit() {
    // set now date for expiration date selection
    this.now = this.core.utils.toIsoString(new Date());

    // check for a valid and available mode 
    if (this.availableModes.indexOf(this.mode) === -1) {
      console.error(`EvanClaimComponent: ${ this.mode } is not a valid display mode.`);
      this.mode = 'normal';
    }

    // load profile active claims
    this.profileClaimsWatcher = await this.queue.onQueueFinish(
      new QueueId(`profile.${ getDomainName() }`, '*'),
      async (reload, results) => {
        reload && await this.core.utils.timeout(0);
        this.profileClaims = await this.claimService.getProfileActiveClaims();
        this.ref.detectChanges();
      }
    );

    // watch for any claim updates
    this.queueWatcher = await this.queue.onQueueFinish(
      this.claimService.getQueueId(),
      async (reload, results) => {
        this.loadClaims();
      }
    );
  }

  /**
   * Copy the modal views into the closest ion-app menu.
   */
  async _ngAfterViewInit() {
    this.modals = this.element.nativeElement.querySelectorAll('.evan-modal');
    this.closestIonApp = this.core.utils.getParentByClassName(this.element.nativeElement,
      'evan-dapp');

    for (let i = 0; i < this.modals.length; i++) {
      this.closestIonApp.appendChild(this.modals[i]);
    }
  }

  /**
   * Clear watchers
   */
  async _ngOnDestroy() {
    this.queueWatcher();

    for (let i = 0; i < this.modals.length; i++) {
      this.closestIonApp.removeChild(this.modals[i]);
    }
  }

  /**
   * Load all claims for the current topic.
   *
   * @return     {Promise<void>}  resolved when done
   */
  private async loadClaims() {
    this.loadingClaims = true;
    this.ref.detectChanges();

    // if issue identity could be loaded, extract the contract address
    this.activeAccount = this.core.activeAccount();
    this.activeIdentity = await this.bcc.claims.getIdentityForAccount(this.activeAccount);
    if (this.activeIdentity && this.activeIdentity.options &&
      this.activeIdentity.options.address !== '0x0000000000000000000000000000000000000000') {
      this.activeIdentity = this.activeIdentity.options.address;
    } else {
      this.activeIdentity = null;
    }

    // load claims and the computed status to be able to display a combined view for all claims of a
    // specific topic
    this.claims = await this.claimService.getClaims(this.address, this.topic);
    this.addressbook = await this.addressBookService.loadAccounts();
    this.computed = this.claimService.getComputedClaim(this.topic, this.claims);

    // if the detail mode is selected, activate the sub claims and set the positions
    if (this.mode === 'detail') {
      this.activateSubClaim(this.computed, null);
    }

    this.loadingClaims = false;
    this.ref.detectChanges();
  }

  /**
   * Issue a new claim the current opened topic and the subject.
   *
   * @param      {any}     claim   the claim for that the action should be triggerd
   * @param      {string}  type    type of the dispatcher (issueDispatcher, acceptDispatcher,
   *                               deleteDispatcher)
   */
  private triggerDispatcher(claim: any, type: string) {
    this.queue.addQueueData(
      this.claimService.getQueueId(type),
      {
        address: this.address,
        expirationDate: claim.enableExpirationDate ? claim.expirationDate : null,
        issuer: claim.issuerAccount,
        topic: claim.name,
      }
    );

    if (type === 'issueDispatcher') {
      delete this.issueClaim;
    }

    this.computed.loading = true;
    this.ref.detectChanges();
  }

  /**
   * Show details for a claim or computed one.
   *
   * @param      {any}     claimToActivate  computed / normal claim
   */
  private openClaimPopup(claimToActivate: any, $event: any) {
    if (!this.popupClaim) {
      if (claimToActivate.claims) {
        this.popupClaim = claimToActivate;
      } else {
        this.popupClaim = this.claimService.getComputedClaim(claimToActivate.name, [ claimToActivate ]);
      }

      // enable correct positioning of the detail claim view
      this.activateSubClaim(this.popupClaim, null);

      // scrolling fix
      this.disableScrolling = true;
      this.ref.detectChanges();
      setTimeout(() => {
        this.disableScrolling = false;
        this.ref.detectChanges()
      }, 100);
    }

    // prevent any other event when this button was clicked
    $event.preventDefault();
    $event.stopPropagation();
    return false;
  }

  /**
   * Remove the active claim and close the modal dialog.
   */
  private closepopupClaim($event: any) {
    this.popupClaim = null;
    this.ref.detectChanges();

    // prevent any other event when this button was clicked
    $event.preventDefault();
    $event.stopPropagation();
    return false;
  }

  /**
   * Check if a warning for a claim exists
   *
   * @param      {any}      claim    the claim that should be checked
   * @param      {any}      warning  the name of the warning that should be checked
   * @return     {boolean}  True if warning exists, False otherwise
   */
  private isWarning(claim: any, warning: string) {
    return claim.warnings.indexOf(warning) !== -1;
  }

  /**
   * When a user clicks a value within the select in an claim menu, start the specific action
   *
   * @param      {any}     claim   The claim for that an action should be runned.
   * @param      {string}  type    the type that was clicked (issue, accept, delete)
   */
  private claimMenuClicked(claim: any, type: string) {
    switch (type) {
      case 'issue': {
        this.issueClaim = claim;
        break;
      }
      case 'accept': {
        this.triggerDispatcher(claim, 'acceptDispatcher');
        break;
      }
      case 'delete': {
        this.triggerDispatcher(claim, 'deleteDispatcher');
        break;
      }
    }

    setTimeout(() => {
      this.claimMenuValue = '';
      this.ref.detectChanges();
    });
  }

  /**
   * Determines if the user is allowed to delete a claim.
   *
   * @param      {any}      claim   the claim
   * @return     {boolean}  True if able to delete claim, False otherwise
   */
  private canDeleteClaim(claim: any) {
    return claim.status !== -1 &&
      (this.activeAccount === claim.subject || this.activeAccount === claim.issuerAccount);
  }

  /**
   * Determines if the user is allowed to accept a claim.
   *
   * @param      {any}      claim   the claim
   * @return     {boolean}  True if able to accept claim, False otherwise
   */
  private canAcceptClaim(claim: any) {
    return claim.status === 0 && this.activeAccount === claim.subject;
  }

  /**
   * Determines if the user is allowed to issue a claim.
   *
   * @param      {any}      claim   the claim
   * @return     {boolean}  True if able to issue claim, False otherwise
   */
  private canIssueClaim(claim: any) {
    return claim.subject && this.activeIdentity;
  }

  /*************************************** begin magic ********************************************/
  private subClaimMarginTop: number = 40;

  /**
   * height of the sub claim with no active body 
   */
  private subClaimHeight:number = 70 + this.subClaimMarginTop;

  /**
   * height of an active sub claim including the body
   */
  private activeSubClaimheight:number = 170 + this.subClaimMarginTop;

  /**
   * Remove the active sub claim property of an array of claims and of all it's parents
   *
   * @param      {any}     subClaim  the sub claim, where all claims (in case of computed) and
   *                                 parents should be closed
   */
  private deactiveSubClaims(claim: any) {
    for (let subClaim of [ ].concat(this.getClaimsOrParents(claim))) {
      delete subClaim.activeSubClaim;
      delete subClaim.active;

      this.deactiveSubClaims(subClaim);
    }
  }

  /**
   * Sets the activeSubclaim poperty to a detailClaim and removes previously all opened parent
   * claims.
   *
   * @param      {any}     detailClaim  the parent detail claim that should where the subClaim
   *                                    should be activated
   * @param      {any}     subClaim     the sub claim that should be activated
   */
  private activateSubClaim(detailClaim: any, subClaim?: any) {
    this.deactiveSubClaims(detailClaim);

    // only activate the sub claim, if it's provided, else deactivate everything and update the ref
    if (subClaim) {
      detailClaim.activeSubClaim = subClaim;
      subClaim.active = true;

      // calculate sub claim height, to reset eventual caluclated height inlcuding an previously
      // actived one
      subClaim.subRowHeight = this.subClaimsRowHeight(subClaim);
      this.calculateSubClaimPositions(subClaim);
    } else {
      delete detailClaim.activeSubClaim;
    }

    // calculate sub claim row
    detailClaim.subRowHeight = this.subClaimsRowHeight(detailClaim);
    this.calculateSubClaimPositions(detailClaim);

    this.ref.detectChanges();
  }

  /**
   * Return the claims array or the parents object of an claim.
   *
   * @param      {any}         claim   the claim that should be analyzed
   * @return     {Array<any>}  claims || parents
   */
  private getClaimsOrParents(claim: any) {
    return claim.claims || claim.parents || [ ];
  }

  /**
   * Calculate the height of the claim row, depending of it's containing sub claims
   *
   * @param      {any}     claim   the claim that should be calculated
   * @return     {number}  height of the row (e.g. 100px)
   */
  private subClaimsRowHeight(claim: any):number {
    const subClaims = this.getClaimsOrParents(claim);

    return this.subClaimMarginTop + (claim.activeSubClaim ? ((subClaims.length - 1) *
      this.subClaimHeight) + this.activeSubClaimheight : subClaims.length * this.subClaimHeight);
  }

  /**
   * Get the position of an sub claim (container of persons)
   *
   * @param      {any}     claim   the parent claim that should be analyzed
   * @param      {number}  index   the index that should be positioned
   * @return     {string}  top position in px (e.g. 100px);
   */
  private calculateSubClaimPositions(claim: any) {
    const subClaims = this.getClaimsOrParents(claim);
    let activeClaim = subClaims.filter(subClaim => subClaim.active);

    if (activeClaim && activeClaim.length > 0) {
      // set the active claim into the middle of the row container
      activeClaim = activeClaim[0];
      activeClaim.topPos = (claim.subRowHeight / 2) - (this.activeSubClaimheight / 2) -
        this.subClaimMarginTop;

      // place all other claims at top or bottom of the centered active claim
      let activeClaimIndex = subClaims.indexOf(activeClaim);
      for (let i = 0; i < subClaims.length; i++) {
        if (i !== activeClaimIndex) {
          if (i < activeClaimIndex) {
            // move the previous claims more to the top, analogous to the active one
            subClaims[i].topPos = activeClaim.topPos -
              ((activeClaimIndex - i) * this.subClaimHeight);
          } else {
            // move the next claims downwards and add 100 (the active body height)
            subClaims[i].topPos = activeClaim.topPos +
              ((i - activeClaimIndex) * this.subClaimHeight) +
              (this.activeSubClaimheight - this.subClaimHeight);
          }
        }
      }

      // if the first row gets into a negative position range, move it to the zero position and
      // raise all other positions and the claim subRowHeight by the negative value 
      if (subClaims[0].topPos < 0) {
        const negativeTopPos = -1 * subClaims[0].topPos;

        subClaims.forEach(subClaim => {
          subClaim.topPos += negativeTopPos;
        });

        claim.subRowHeight += negativeTopPos;
      }
    } else {
      for (let i = 0; i < subClaims.length; i++) {
        subClaims[i].topPos = i * this.subClaimHeight;
      }
    }

    // calculate height of vertical connectors
    const halfHeight = (claim.subRowHeight / 2);
    const personContainerHeight = 66;
    const connectorWidth = 3;
    for (let i = 0; i < subClaims.length; i++) {
      if (subClaims[i].topPos < (halfHeight - this.subClaimMarginTop)) {
        subClaims[i].vertical = {
          height: halfHeight - subClaims[i].topPos - this.subClaimMarginTop - (personContainerHeight / 2)
            + connectorWidth,
          top: 30
        };
      } else {
        subClaims[i].vertical = {
          height: subClaims[i].topPos + this.subClaimMarginTop + (personContainerHeight / 2)
            - halfHeight,
          bottom: 33
        };
      }
    }
  }
}
