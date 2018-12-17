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
  d3,
} from 'angular-libs';

import { AsyncComponent } from '../../classes/AsyncComponent';
import { EvanAddressBookService } from '../../services/bcc/address-book';
import { EvanAlertService, } from '../../services/ui/alert';
import { EvanBCCService } from '../../services/bcc/bcc';
import { EvanClaimService } from '../../services/bcc/claims';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanQueue } from '../../services/bcc/queue';
import { EvanTranslationService } from '../../services/ui/translate';
import { QueueId, } from '../../services/bcc/queue-utilities';
import { EvanFileService, } from '../../services/ui/files';
import { EvanPictureService, } from '../../services//ui/picture';

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

  /**
   * is the component allowed to issue claims?
   */
  @Input() enableIssue: boolean = true;

  /**
   * should the delete button be shown?
   */
  @Input() enableDelete: boolean = false;

  /**
   * should the delete button be shown?
   */
  @Input() enableReject: boolean = true;

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
   * claim that should be rejected
   */
  private rejectClaim: any;

  /**
   * claim that should be rejected
   */
  private editDBCPClaim: any;

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

  /**
   * contains all current d3 specific variables
   */
  private d3: any = {
    dimensions: { width: 0, height: 0 },
    nodes: [ ],
    links: [ ]
  };

  /**
   * current clicked d3 node, for that the detail should be shown
   */
  private activeDetailHover: any;

  /**
   * current detail container for auto scroll
   */
  @ViewChild('evanDetailClaim') evanDetailClaim: any;

  /***************** initialization  *****************/
  constructor(
    private _DomSanitizer: DomSanitizer,
    private addressBookService: EvanAddressBookService,
    private alertService: EvanAlertService,
    private bcc: EvanBCCService,
    private claimService: EvanClaimService,
    private core: EvanCoreService,
    private element: ElementRef,
    private fileService: EvanFileService,
    private menuController: MenuController,
    private pictureService: EvanPictureService,
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
    this.closestIonApp = this.core.utils.getParentByClassName(this.element.nativeElement,
      'evan-dapp');
  }

  /**
   * Clear watchers.
   */
  async _ngOnDestroy() {
    this.queueWatcher();

    if (this.closestIonApp && this.closestIonApp.parentElement) {
      // remove all moved modals
      const modals = this.element.nativeElement.querySelectorAll('.evan-modal');
      for (let i = 0; i < modals.length; i++) {
        this.closestIonApp.removeChild(modals[i]);
      }
    }
  }

  /**
   * Takes all displayed evan modals of this view and moves it to the next top ion-app, to be
   * displayed in the correct height
   */
  private moveModalsToClosestIonApp() {
    const modals = this.element.nativeElement.querySelectorAll('.evan-modal');
    for (let i = 0; i < modals.length; i++) {
      this.closestIonApp.appendChild(modals[i]);
    }
  }

  /**
   * Takes a claim that was passed to specific status variable, renders the modal, shows it and
   * moves it to the next ion-app
   *
   * @param      {any}     claim   the claim that should be opened within a modal
   */
  private async enableClaimModal(claim: any) {
    claim.showModal = false;
    this.ref.detectChanges();

    await this.core.utils.timeout(0);

    // move the modal to the next ion-app container
    this.moveModalsToClosestIonApp();

    claim.showModal = true;
    this.ref.detectChanges();

    // scrolling fix
    this.disableScrolling = true;
    this.ref.detectChanges();

    await this.core.utils.timeout(100);

    this.disableScrolling = false;
    this.ref.detectChanges()
  }

  /**
   * Closes a claim modal using a smooth hide.
   *
   * @param      {any}     claim   the claim that should be close
   * @param      {string}  type    the type of the modal to close (popupClaim, issueClaim, ...)
   */
  private async removeClaimModal(claim: any, type: string, $event?: any) {
    if (this[type]) {
      claim.showModal = false;
      this.ref.detectChanges();

      await this.core.utils.timeout(400);

      delete this[type];
      this.ref.detectChanges();
    }

    if ($event) {
      return this.core.utils.stopEventBubbling($event);
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
    this.computed = await this.claimService.getComputedClaim(this.topic, this.claims);

    this.loadingClaims = false;
    this.ref.detectChanges();

    // if the detail mode is selected, activate the sub claims and set the positions
    if (this.mode === 'detail') {
      this.renderDetail(this.computed);
    }
  }

  /**
   * Issue a new claim the current opened topic and the subject.
   *
   * @param      {any}      claim   the claim for that the action should be triggerd
   * @param      {string}   type    type of the dispatcher (issueDispatcher, acceptDispatcher,
   *                                deleteDispatcher)
   * @param      {any}      $event  the click event
   * @return     {boolean}  false to break the event bubbling
   */
  private async triggerDispatcher(claim: any, type: string, $event: any) {
    if (type !== 'issueDispatcher' && type !== 'rejectDispatcher') {
      try {
        const from = await this.addressBookService.getNameForAccount(claim.issuerAccount);
        const to = await this.addressBookService.getNameForAccount(claim.subject);

        await this.alertService.showSubmitAlert(
          `_angularcore.claims.dispatcher.${ type }.title`,
          {
            key: `_angularcore.claims.dispatcher.${ type }.description`,
            translateOptions: {
              topic: claim.name,
              from: from,
              to: to,
            }
          },
          `_angularcore.claims.dispatcher.cancel`,
          `_angularcore.claims.dispatcher.${ type }.ok`
        );
      } catch (ex) {
        return this.core.utils.stopEventBubbling($event);
      }
    }

    // trigger the queue data
    this.queue.addQueueData(
      this.claimService.getQueueId(type),
      {
        address: this.address,
        description: claim.description,
        ensAddress: claim.ensAddress,
        expirationDate: claim.enableExpirationDate ? claim.expirationDate : null,
        id: claim.id,
        issuer: claim.issuerAccount,
        rejectReason: claim.enableReason ? claim.rejectReason : null,
        topic: claim.name,
      }
    );

    // hide all modals
    if (this.rejectClaim) {
      this.removeClaimModal(this.rejectClaim, 'rejectClaim');
    }
    [ 'issueClaim', 'rejectClaim', 'popupClaim', 'editDBCPClaim' ]
      .forEach(modalType => this.removeClaimModal(this[modalType], modalType))

    // show the loading symbol
    claim.loading = true;
    this.computed.loading = true;
    this.ref.detectChanges();
  }

  /**
   * Show details for a claim or computed one.
   *
   * @param      {any}     claimToActivate  computed / normal claim
   */
  private async openClaimPopup(claimToActivate: any, $event: any) {
    // run asynchroniously but break event bubbeling
    (async () => {
      if (!this.popupClaim) {
        if (claimToActivate.claims) {
          this.popupClaim = this.core.utils.deepCopy(claimToActivate);
        } else {
          this.popupClaim = await this.claimService
            .getComputedClaim(claimToActivate.name, [ claimToActivate ]);
        }

        await this.enableClaimModal(this.popupClaim);

        // enable correct positioning of the detail claim view
        this.renderDetail(this.popupClaim);
      }
    })();

    // prevent any other event when this button was clicked
    return this.core.utils.stopEventBubbling($event);
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
   * Opens the issue claim popup, when the user is able to open the issue claim.
   *
   * @param      {any}    claim   the claim that should be opened
   * @param      {any}    $event  the click event
   * @return     {false}  break the event bubbling
   */
  private async openIssueClaim(claim: any, $event) {
    if (this.canIssueClaim(claim)) {
      this.issueClaim = claim;

      this.enableClaimModal(claim);

      return this.core.utils.stopEventBubbling($event);
    }
  }

  /**
   * Opens the issue claim popup, when the user is able to open the issue claim.
   *
   * @param      {any}    claim   the claim that should be opened
   * @param      {any}    $event  the click event
   * @return     {false}  break the event bubbling
   */
  private async openRejectClaim(claim: any, $event) {
    if (this.canRejectClaim(claim) || claim.warnings.indexOf('rejected') !== -1) {
      this.rejectClaim = claim;
      this.rejectClaim.rejectReason = this.rejectClaim.rejectReason || { reason: '', };

      this.enableClaimModal(claim);

      return this.core.utils.stopEventBubbling($event);
    }
  }

  /**
   * Opens the dbcp edit for a specific claim.
   *
   * @param      {any}     claim   the claim for that the topic description should be updated
   */
  private async openDBCPEdit(claim: any, $event: any) {
    if (claim.topLevelEnsOwner === this.activeAccount) {
      this.editDBCPClaim = claim;
      claim.selectedImages = [ ];

      this.enableClaimModal(claim);

      return this.core.utils.stopEventBubbling($event);
    }
  }

  /**
   * Determines if the user is allowed to delete a claim.
   *
   * @param      {any}      claim   the claim
   * @return     {boolean}  True if able to delete claim, False otherwise
   */
  private canDeleteClaim(claim: any) {
    return this.enableDelete && claim.status !== -1 &&
      (this.activeAccount === claim.subject || this.activeAccount === claim.issuerAccount);
  }

  /**
   * Determines if the user is allowed to delete a claim.
   *
   * @param      {any}      claim   the claim
   * @return     {boolean}  True if able to delete claim, False otherwise
   */
  private canRejectClaim(claim: any) {
    return this.enableReject && claim.status !== -1 && claim.warnings.indexOf('rejected') === -1 &&
      (this.activeAccount === claim.subject || this.activeAccount === claim.issuerAccount);
  }

  /**
   * Determines if the user is allowed to accept a claim.
   *
   * @param      {any}      claim   the claim
   * @return     {boolean}  True if able to accept claim, False otherwise
   */
  private canAcceptClaim(claim: any) {
    return claim.status === 0 && this.activeAccount === claim.subject &&
      claim.warnings.indexOf('issued') !== -1;
  }

  /**
   * Determines if the user is allowed to issue a claim. (only allow computed claims)
   *
   * @param      {any}      claim   the claim
   * @return     {boolean}  True if able to issue claim, False otherwise
   */
  private canIssueClaim(claim: any) {
    if (!this.activeIdentity || !this.enableIssue || claim.warnings.indexOf('noIdentity') !== -1) {
      return false;
    } else if (claim.warnings.indexOf('missing') !== -1) {
      return true;
    }

    // check all claims on the same level
    const levelClaims = claim.levelComputed && claim.levelComputed.claims ?
      claim.levelComputed.claims : claim.claims;
    // only allow claim issue for computed claims
    return levelClaims
      .filter(subClaim => {
        if (subClaim.issuerAccount === this.activeAccount &&
            subClaim.warnings.indexOf('rejected') === -1) {
          return true;
        } else {
          return false;
        }
      }).length === 0;
  }

  /**
   * Return the amount of interactions that the current user can trigger on a specific claim.
   *
   * @param      {any}     claim   the claim that should be checked
   * @return     {number}  amount of interactions (0 - 3)
   */
  private claimInteractionCount(claim: any) {
    return [
      this.canAcceptClaim(claim),
      this.canDeleteClaim(claim),
      this.canIssueClaim(claim),
      this.canRejectClaim(claim),
    ].filter(interaction => !!interaction).length;
  }

  /**
   * Returns the name or the account of a account from the addressbook.
   *
   * @param      {string}  accountId  the account id thath should be checked
   * @return     {string}  The addressbook name
   */
  private getAddressbookName(accountId: string) {
    if (this.addressbook && this.addressbook[accountId]) {
      return this.addressbook[accountId].alias || this.addressbook[accountId].email || accountId;
    } else {
      return accountId;
    }
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
   * Checks if a form property is touched and invalid.
   *
   * @param      {string}   paramName  name of the form property that should be checked
   * @return     {boolean}  true if touched and invalid, else false
   */
  showError(form: any, paramName: string) {
    if (form && form.controls[paramName]) {
      return form.controls[paramName].invalid &&
        form.controls[paramName].touched;
    }
  }

  /**
   * Transform the file input result for the description img into an single value.
   *
   * @param      {any}     claim   the topic detail for that the img was changed
   * @return     {<type>}  { description_of_the_return_value }
   */
  async descriptionImgChanged(claim: any) {
    if (claim.selectedImages.length > 0) {
      const urlCreator = (<any>window).URL || (<any>window).webkitURL;
      const blobURI = urlCreator.createObjectURL(claim.selectedImages[0]);
      // transform to array buffer so we can save it within the queue
      const arrayBuffer = await this.fileService.readFilesAsArrayBuffer(
        [ claim.selectedImages[0] ]);

      // transform file object
      claim.selectedImages[0] = {
        blobURI: this._DomSanitizer.bypassSecurityTrustUrl(blobURI),
        file: arrayBuffer[0].file,
        fileType: arrayBuffer[0].type,
        name: arrayBuffer[0].name,
        base64: await this.pictureService.blobToDataURI(claim.selectedImages[0]),
      };

      claim.description.imgSquare = claim.selectedImages[0].base64;
    }

    this.ref.detectChanges();
  }

  /**
   * Return the status color for a claim and its taker
   *
   * @param      {any}     claim   the claim that should be analysed
   * @return     {string}  the class status (status-0, status-1, status-2)
   */
  trustTakerStatusClass(claim: any) {
    // yellow color
    if (claim.warnings.indexOf('issued') !== -1 || claim.warnings.indexOf('selfCreated') !== -1) {
      return 'status-0';
    } 

    // red color
    if (claim.warnings.indexOf('rejected') !== -1 && claim.rejectReason &&
        claim.rejectReason.rejector === claim.subject) {
      return 'status-2';
    }

    // green color
    if (claim.status === 1) {
      return 'status-1';
    }
  }

  /**
   * Return the status color for a claim and its taker
   *
   * @param      {any}     claim   the claim that should be analysed
   * @return     {string}  the class status (status-0, status-1, status-2)
   */
  trustProviderStatusClass(claim: any) {
    if (claim.parentComputed) {
      const parent = claim.parentComputed;

      // yellow color
      if (parent.status === 0) {
        return 'status-0';
      } 

      // red color
      if (parent.status === -1 || parent.status === 2 ||
          (claim.warnings.indexOf('rejected') !== -1 && claim.rejectReason &&
          claim.rejectReason.rejector === claim.issuerAccount)) {
        return 'status-2';
      }

      // green color
      if (parent.status === 1) {
        return 'status-1';
      }
    } else if (claim.issuerAccount === this.claimService.ensRootOwner) {
      return 'status-1';
    }
  }

  /******************************************** d3.js *********************************************/
  /**
   * Render the detail svg using d3.js.
   *
   * @param      {any}     claim   the claim for that the detail should be displayed
   */
  private async renderDetail(claim: any) {
    // wait for finish render process
    await this.core.utils.timeout(0);

    // calculate height of the container (check if we are within the claims dapp, so size it for a
    // perfect view)
    let fullHeight = 500;
    const modalContainer = document.querySelectorAll('.evan-modal.show-modal .evan-content')[0];
    const parentContentContainer: any = modalContainer || this.core.utils.getParentByClassName(
      this.element.nativeElement, 'evan-content');

    // when we are running within a modal, size it to 80% of the current screen and reduce it by the amount of height of the headelines
    if (!modalContainer) {
      const parentDAppContainer: any = this.core.utils.getParentByClassName(parentContentContainer,
        'evan-dapp');

      // when we are running only within an usal DApp, calculate the height of the svg, so the DApp
      // has no scrollbar
      fullHeight = parentDAppContainer.offsetHeight - parentContentContainer.offsetHeight - 55 - 25
        + 500;

      // minimum height is 500
      if (fullHeight < 500) {
        fullHeight = 500;
      }
    }

    // Set the dimensions and margins of the diagram
    const containerWidth =  parentContentContainer.offsetWidth;
    const margin = {top: 50, right: 90, bottom: 50, left: 90};
    const width = containerWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    // claim width + width of connector dot
    const connectorDot = 20;
    const boxWidth =  250 + connectorDot; 
    const boxHeight = 55;
    const svg = parentContentContainer.querySelectorAll('.evan-detailed-claim svg')[0];
    const svgZoomContainer = svg.children[0];

    // declares a tree layout and assigns the size
    let treemap = d3.tree()
      // Using nodeSize we are able to control
      // the separation between nodes. If we used
      // the size parameter instead then d3 would
      // calculate the separation dynamically to fill
      // the available space.
      .nodeSize([ 70, 300 + connectorDot ])
  
      // By default, cousins are drawn further apart than siblings.
      // By returning the same value in all cases, we draw cousins
      // the same distance apart as siblings.
      .separation(function(){
        return 1;
      })

    // Assigns parent, children, height, depth
    const root = d3.hierarchy(claim, (d) => {
      return this.getClaimsOrParents(d);
    });

    // initialize zooming of the element
    const zoom = d3.zoom()
      .scaleExtent([.1,1])
      .on('zoom', () => {
        const transform = d3.event.transform;
        svg.children[0].setAttribute(
          'transform',
          `translate(${ transform.x }, ${ transform.y }) scale(${ transform.k })`
        );
      });

    d3.select(svg)
      .call(zoom)
      .call(
        zoom.transform,
        d3.zoomIdentity.translate(margin.left + margin.right, fullHeight / 2).scale(1)
      );

    // Collapse the node and all it's children
    function collapse(d) {
      if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
      }
    }

    /**
     * Custom path function that creates straight connecting lines.
     * Calculate start and end position of links.
     * Instead of drawing to the center of the node,
     * draw to the border of the person profile box.
     * That way drawing order doesn't matter. In other
     * words, if we draw to the center of the node
     * then we have to draw the links first and the
     * draw the boxes on top of them.
     */
    function elbow(d) {
      var sourceX = d.parent.x,
          sourceY = d.parent.y + (boxWidth / 2),
          targetX = d.x,
          targetY = d.y - (boxWidth / 2);
          
      return "M" + sourceY + "," + sourceX
        + "H" + (sourceY + (targetY-sourceY)/2)
        + "V" + targetX 
        + "H" + targetY;
    }

    /**
     * Use an element and extract it's current transform
     *
     * @param      {any}  element  the element that should be analyzed
     * @return     {any}  {scale: .., translate: { x: ..., y:...}}
     */
    function getTransformFromElement(element: any) {
      let splitTransform = element.getAttribute('transform').split('scale');
      let scale: any = 1;
      let translate = splitTransform[0].replace(/translate\(|\)/g, '').split(',');
      if (splitTransform.length > 1) {
        scale = splitTransform[1].replace(/\(|\)/g, '');
      }

      return {
        scale: parseFloat(scale),
        translate: {
          x: parseFloat(translate[0]),
          y: parseFloat(translate[1])
        }
      };
    }

    /**
     * Updates the current svg elements position
     */
    const update = async () => {
      // Assigns the x and y position for the nodes
      let treeData = treemap(root);

      // Compute the new tree layout.
      let nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);

      // bind special function handlers for each node
      nodes.forEach((node, index) => {
        node.id = index;

        // bind toggle event
        node.toggle = (($event) => {
          if (node.children) {
            node._children = node.children;
            node.children = null;
          } else {
            node.children = node._children;
            node._children = null;
          }

          // update node positions
          update();

          // deactivate hover
          delete this.activeDetailHover;

          // stop event bubbling
          return this.core.utils.stopEventBubbling($event);
        }).bind(this);

        // add the show detail function
        node.toggleDetail = (($event) => {
          if (node === this.activeDetailHover) {
            delete this.activeDetailHover;
          } else {
            this.activeDetailHover = node;
          }

          // scroll to node
          const nodeElement = this.core.utils.getParentByClassName($event.target, 'evan-claim')
            .parentElement.parentElement; 
          const nodeTransform = getTransformFromElement(nodeElement);
          const zoomBox = d3.select(svgZoomContainer).node().getBBox();
          const bbox = d3.select(nodeElement).node().getBBox();

          // center the current element container half - zoombox half -
          // (node.x / 2 - node.width / 2)          
          const tx = (containerWidth / 2) - (zoomBox.width / 2) -
            ((nodeTransform.translate.x / 2) - (bbox.width / 2));
          // move it to the top and a bit down
          const ty = -zoomBox.y + 100;

          // move the zoom container to the caluculated position 
          d3.select(svgZoomContainer)
            .transition()
            .duration(1000)
            .attr('transform', `translate(${ tx }, ${ ty }) scale(1)`);

          // update the zoom component position to prevent back moving by click
          d3.select(svg)
            .call(
              zoom.transform,
              d3.zoomIdentity.translate(tx, ty).scale(1)
            );

          // update the ref and stop the event bubbling
          this.ref.detectChanges();
          if (!$event.disableEventBubbling) {
            return this.core.utils.stopEventBubbling($event);
          }
        }).bind(this);

        node.transform = `translate(${ node.y },${ node.x })`;
      });

      // create the link elbow connectors
      links.forEach(link => {
        link.elbow = elbow(link);

        if (link.data.warnings.indexOf('rejected') !== -1) {
          link.markerStart = 'url(#arrow-danger)';
        } else {
          switch (link.data.status) {
            case -1: {
              link.markerStart = 'url(#arrow-danger)';
              break;
            }
            case 0: {
              link.markerStart = 'url(#arrow-warning)';
              break;
            }
            case 1: {
              link.markerStart = 'url(#arrow-success)';
              break;
            }
          }
        }
      });

      // Normalize for fixed-depth.
      nodes.forEach((d) => d.y = d.depth * 180);

      // filter first element, without removing initial missing elements
      if (claim.status !== -1) {
        nodes = nodes.filter((d) => d.depth !== 0);
        links = links.filter((d) => d.depth !== 1);
      // if the root claim is missing, show only this element
      } else {
        nodes = nodes.filter((d) => d.depth === 0);
        links = [ ];

        setTimeout(() => {
          nodes[0].toggleDetail({
            disableEventBubbling: true,
            target: svg.querySelectorAll('.tree-container foreignObject .evan-claim .claim-label')[0],
          });
        });
      }

      // update current d3 object
      this.d3 = {
        nodes, links, root,
        dimensions: {
          boxHeight,
          boxWidth,
          connectorDot,
          containerWidth,
          fullHeight,
          height,
          margin,
          svg,
          width,
        }
      };

      this.ref.detectChanges();
    }

    // start!
    update();
  }
}
