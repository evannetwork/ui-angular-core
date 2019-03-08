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
  getDomainName,
  System,
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
import { EvanAlertService, } from '../../services/ui/alert';
import { EvanBCCService } from '../../services/bcc/bcc';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanDescriptionService } from '../../services/bcc/description';
import { EvanFileService, } from '../../services/ui/files';
import { EvanPictureService, } from '../../services//ui/picture';
import { EvanQueue } from '../../services/bcc/queue';
import { EvanTranslationService } from '../../services/ui/translate';
import { EvanVerificationService } from '../../services/bcc/verifications';
import { QueueId, } from '../../services/bcc/queue-utilities';

import { createOpacityTransition } from '../../animations/opacity';
import { createGrowTransition } from '../../animations/grow';

/**************************************************************************************************/

let d3;

/**
 * Display a all verifications for a specific topic using the api-blockchain-core verifications service.
 *
 * @class      Component EvanVerificationComponent
 */
@Component({
  selector: 'evan-verification',
  templateUrl: 'verification.html',
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
export class EvanVerificationComponent extends AsyncComponent {
  /***************** inputs & outpus *****************/
  /**
   * address that for that the verifications should be checked
   */
  @Input() address: string

  /**
   * the topic to load the verifications for (/test/test2)
   */
  @Input() topic: string;

  /**
   * display mode that should be used (minimal, detail, full)
   */
  @Input() mode: string;

  /**
   * use computed view and only one verification instead of all possible ones (will display a small verification
   * count at the right of the card)
   */
  @Input() compute: boolean = true;

  /**
   * is the component allowed to issue verifications?
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
    'normal', // icon, displayname, creation date, sub verification count
    'detail', // normal + from / to, issued + valid until + status
  ];

  /**
   * All available verifications for the given topic
   */
  private verifications: Array<any> = [ { loading: true } ];
  
  /**
   * concadinated verification including computed status
   */
  private computed: any = { loading: true };

  /**
   * Are currently the verifications loading?
   */
  private loadingVerifications: boolean

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
   * activate the detail popup when a verification was clicked 
   */
  private popupVerification: any;

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
   * new verification that should be issued
   */
  private issueVerification: any;

  /**
   * verification that should be rejected
   */
  private rejectVerification: any;

  /**
   * verification that should be rejected
   */
  private editDBCPVerification: any;

  /**
   * parent containing ion app contaioner
   */
  private closestIonApp: any;

  /**
   * for the current profile activated verifications
   */
  private profileVerifications: Array<string> = [ ];

  /**
   * Function to unsubscribe from profile verifications watcher queue results.
   */
  private profileVerificationsWatcher: Function;

  /**
   * menu value, when a verification menu entry was clicked
   */
  private verificationMenuValue: string;

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
  @ViewChild('evanDetailVerification') evanDetailVerification: any;

  /***************** initialization  *****************/
  constructor(
    private _DomSanitizer: DomSanitizer,
    private addressBookService: EvanAddressBookService,
    private alertService: EvanAlertService,
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private descriptionService: EvanDescriptionService,
    private element: ElementRef,
    private fileService: EvanFileService,
    private menuController: MenuController,
    private pictureService: EvanPictureService,
    private queue: EvanQueue,
    private translate: EvanTranslationService,
    private verificationService: EvanVerificationService,
    public ref: ChangeDetectorRef,
  ) {
    super(ref);
  }

  /**
   * Set initial, bind queue watchers and load the verifications.
   */
  async _ngOnInit() {
    // set now date for expiration date selection
    this.now = this.core.utils.toIsoString(new Date());

    // check for a valid and available mode 
    if (this.availableModes.indexOf(this.mode) === -1) {
      console.error(`EvanVerificationComponent: ${ this.mode } is not a valid display mode.`);
      this.mode = 'normal';
    }

    // load profile active verifications
    this.profileVerificationsWatcher = await this.queue.onQueueFinish(
      new QueueId(`profile.${ getDomainName() }`, '*'),
      async (reload, results) => {
        reload && await this.core.utils.timeout(0);
        this.profileVerifications = await this.verificationService.getProfileActiveVerifications();
        this.ref.detectChanges();
      }
    );

    // watch for any verification updates
    this.queueWatcher = await this.queue.onQueueFinish(
      this.verificationService.getQueueId(),
      async (reload, results) => {
        this.loadVerifications();
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
   * Takes a verification that was passed to specific status variable, renders the modal, shows it and
   * moves it to the next ion-app
   *
   * @param      {any}     verification   the verification that should be opened within a modal
   */
  private async enableVerificationModal(verification: any) {
    verification.showModal = false;
    this.ref.detectChanges();

    await this.core.utils.timeout(0);

    // move the modal to the next ion-app container
    this.moveModalsToClosestIonApp();

    verification.showModal = true;
    this.ref.detectChanges();

    // scrolling fix
    this.disableScrolling = true;
    this.ref.detectChanges();

    await this.core.utils.timeout(100);

    this.disableScrolling = false;
    this.ref.detectChanges()
  }

  /**
   * Closes a verification modal using a smooth hide.
   *
   * @param      {any}     verification   the verification that should be close
   * @param      {string}  type    the type of the modal to close (popupVerification, issueVerification, ...)
   */
  private async removeVerificationModal(verification: any, type: string, $event?: any) {
    if (this[type]) {
      verification.showModal = false;
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
   * Load all verifications for the current topic.
   *
   * @return     {Promise<void>}  resolved when done
   */
  private async loadVerifications() {
    this.loadingVerifications = true;
    this.ref.detectChanges();

    // if issue identity could be loaded, extract the contract address
    this.activeAccount = this.core.activeAccount();
    try {
      this.activeIdentity = await this.bcc.verifications.getIdentityForAccount(this.activeAccount);
      if (this.activeIdentity && this.activeIdentity.options &&
        this.activeIdentity.options.address !== '0x0000000000000000000000000000000000000000') {
        this.activeIdentity = this.activeIdentity.options.address;
      } else {
        this.activeIdentity = null;
      }
    } catch (ex) {
      this.activeIdentity = null;
    }

    // load verifications and the computed status to be able to display a combined view for all verifications of a
    // specific topic
    this.verifications = await this.verificationService.getVerifications(this.address, this.topic);
    // set loading status for the verifications
    this.verificationService.setVerificationsLoading(this.verifications);
    // load addressbook
    this.addressbook = await this.addressBookService.loadAccounts();
    // reset verifications loading status, could be old within cached values
    this.computed = await this.verificationService.computeVerifications(this.topic, this.verifications);

    // load contract dbcp name
    const firstVerification = this.verifications[0];
    if (firstVerification.subjectType === 'contract') {
      const dbcp = await this.descriptionService.getDescription(firstVerification.subject);
      this.computed.alias = dbcp.name;
    }

    this.loadingVerifications = false;
    this.ref.detectChanges();

    // if the detail mode is selected, activate the sub verifications and set the positions
    if (this.mode === 'detail') {
      this.renderDetail(this.computed);
    }
  }

  /**
   * Issue a new verification the current opened topic and the subject.
   *
   * @param      {any}      verification   the verification for that the action should be triggerd
   * @param      {string}   type    type of the dispatcher (issueDispatcher, acceptDispatcher,
   *                                deleteDispatcher)
   * @param      {any}      $event  the click event
   * @return     {boolean}  false to break the event bubbling
   */
  private async triggerDispatcher(verification: any, type: string, $event: any) {
    if (type !== 'issueDispatcher' && type !== 'rejectDispatcher') {
      try {
        const from = await this.addressBookService.getNameForAccount(verification.issuerAccount);
        const to = await this.addressBookService.getNameForAccount(verification.subject);

        await this.alertService.showSubmitAlert(
          `_angularcore.verifications.dispatcher.${ type }.title`,
          {
            key: `_angularcore.verifications.dispatcher.${ type }.description`,
            translateOptions: {
              topic: verification.name,
              from: from,
              to: to,
            }
          },
          `_angularcore.verifications.dispatcher.cancel`,
          `_angularcore.verifications.dispatcher.${ type }.ok`
        );
      } catch (ex) {
        return this.core.utils.stopEventBubbling($event);
      }
    }

    // trigger the queue data
    this.queue.addQueueData(
      this.verificationService.getQueueId(type),
      {
        address: verification.subjects ? verification.subjects[0] : verification.subject,
        description: verification.description,
        ensAddress: verification.ensAddress,
        expirationDate: verification.enableExpirationDate ? verification.expirationDate : null,
        disableSubVerifications: verification.disableSubVerifications || false,
        id: verification.id,
        issuer: verification.issuerAccount,
        rejectReason: verification.rejectReason,
        topic: verification.name,
      }
    );

    // hide all modals
    if (this.rejectVerification) {
      this.removeVerificationModal(this.rejectVerification, 'rejectVerification');
    }
    // show modals
    [ 'issueVerification', 'rejectVerification', 'popupVerification', 'editDBCPVerification' ]
      .forEach(modalType => this.removeVerificationModal(this[modalType], modalType))

    // show the loading symbol
    verification.loading = true;
    this.computed.loading = true;
    this.ref.detectChanges();
  }

  /**
   * Show details for a verification or computed one.
   *
   * @param      {any}     verificationToActivate  computed / normal verification
   */
  private async openVerificationPopup(verificationToActivate: any, $event: any) {
    // run asynchroniously but break event bubbeling
    (async () => {
      if (!this.popupVerification) {
        if (verificationToActivate.verifications) {
          this.popupVerification = this.core.utils.deepCopy(verificationToActivate);
        } else {
          this.popupVerification = await this.verificationService
            .computeVerifications(verificationToActivate.name, [ verificationToActivate ]);
        }

        await this.enableVerificationModal(this.popupVerification);

        // enable correct positioning of the detail verification view
        this.renderDetail(this.popupVerification);
      }
    })();

    // prevent any other event when this button was clicked
    return this.core.utils.stopEventBubbling($event);
  }

  /**
   * Check if a warning for a verification exists
   *
   * @param      {any}      verification    the verification that should be checked
   * @param      {any}      warning  the name of the warning that should be checked
   * @return     {boolean}  True if warning exists, False otherwise
   */
  private isWarning(verification: any, warning: string) {
    return verification.warnings.indexOf(warning) !== -1;
  }

  /**
   * Opens the issue verification popup, when the user is able to open the issue verification.
   *
   * @param      {any}    verification   the verification that should be opened
   * @param      {any}    $event  the click event
   * @return     {false}  break the event bubbling
   */
  private async openIssueVerification(verification: any, $event) {
    if (this.canIssueVerification(verification)) {
      this.issueVerification = verification;

      this.enableVerificationModal(verification);

      return this.core.utils.stopEventBubbling($event);
    }
  }

  /**
   * Opens the issue verification popup, when the user is able to open the issue verification.
   *
   * @param      {any}    verification   the verification that should be opened
   * @param      {any}    $event  the click event
   * @return     {false}  break the event bubbling
   */
  private async openRejectVerification(verification: any, $event) {
    if (this.canRejectVerification(verification) || verification.warnings.indexOf('rejected') !== -1) {
      this.rejectVerification = verification;
      this.rejectVerification.rejectReason = this.rejectVerification.rejectReason || { reason: '', };

      this.enableVerificationModal(verification);

      return this.core.utils.stopEventBubbling($event);
    }
  }

  /**
   * Opens the dbcp edit for a specific verification.
   *
   * @param      {any}     verification   the verification for that the topic description should be updated
   */
  private async openDBCPEdit(verification: any, $event: any) {
    if (verification.topLevelEnsOwner === this.activeAccount) {
      this.editDBCPVerification = verification;
      verification.selectedImages = [ ];

      this.enableVerificationModal(verification);

      return this.core.utils.stopEventBubbling($event);
    }
  }

  /**
   * Determines if the user is allowed to delete a verification.
   *
   * @param      {any}      verification   the verification
   * @return     {boolean}  True if able to delete verification, False otherwise
   */
  private canDeleteVerification(verification: any) {
    return this.enableDelete && verification.status !== -1 &&
      (this.activeAccount === verification.subject || this.activeAccount === verification.issuerAccount);
  }

  /**
   * Determines if the user is allowed to delete a verification.
   *
   * @param      {any}      verification   the verification
   * @return     {boolean}  True if able to delete verification, False otherwise
   */
  private canRejectVerification(verification: any) {
    return this.enableReject && verification.status !== -1 && verification.warnings.indexOf('rejected') === -1 &&
      (this.activeAccount === verification.subject || this.activeAccount === verification.issuerAccount);
  }

  /**
   * Determines if the user is allowed to accept a verification.
   *
   * @param      {any}      verification   the verification
   * @return     {boolean}  True if able to accept verification, False otherwise
   */
  private canAcceptVerification(verification: any) {
    return verification.status === 0 && verification.warnings.indexOf('issued') !== -1 &&
      (this.activeAccount === verification.subject ||
        (verification.subjectType === 'contract' &&
         verification.subjectOwner === this.activeAccount)
      );
  }

  /**
   * Determines if the user is allowed to issue a verification. (only allow computed verifications)
   *
   * @param      {any}      verification   the verification
   * @return     {boolean}  True if able to issue verification, False otherwise
   */
  private canIssueVerification(verification: any) {
    if (verification.warnings.indexOf('noIdentity') !== -1 &&
        verification.subjectType === 'contract' &&
        verification.subjectOwner === this.core.activeAccount()) {
      verification.warnings.splice(verification.warnings.indexOf('noIdentity'), 1);
    }

    // if the current user has no identity, enable issue is disabled or the subject has no identity,
    // but the subject is no contract
    if (!this.activeIdentity || !this.enableIssue ||
        verification.warnings.indexOf('noIdentity') !== -1) {
      return false;
    } else if (verification.warnings.indexOf('missing') !== -1) {
      return true;
    }

    // check all verifications on the same level
    const levelVerifications = verification.levelComputed && verification.levelComputed.verifications ?
      verification.levelComputed.verifications : verification.verifications;
    // only allow verification issue for computed verifications
    return levelVerifications
      .filter(subVerification => {
        if (subVerification.issuerAccount === this.activeAccount &&
            subVerification.warnings.indexOf('rejected') === -1) {
          return true;
        } else {
          return false;
        }
      }).length === 0;
  }

  /**
   * Return the amount of interactions that the current user can trigger on a specific verification.
   *
   * @param      {any}     verification   the verification that should be checked
   * @return     {number}  amount of interactions (0 - 3)
   */
  private verificationInteractionCount(verification: any) {
    return [
      this.canAcceptVerification(verification),
      this.canDeleteVerification(verification),
      this.canIssueVerification(verification),
      this.canRejectVerification(verification),
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
   * Return the verifications array or the parents object of an verification.
   *
   * @param      {any}         verification   the verification that should be analyzed
   * @return     {Array<any>}  verifications || parents
   */
  private getVerificationsOrParents(verification: any) {
      return verification.verifications || verification.parents || [ ];
   
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
   * @param      {any}     verification   the topic detail for that the img was changed
   * @return     {<type>}  { description_of_the_return_value }
   */
  async descriptionImgChanged(verification: any) {
    if (verification.selectedImages.length > 0) {
      const urlCreator = (<any>window).URL || (<any>window).webkitURL;
      const blobURI = urlCreator.createObjectURL(verification.selectedImages[0]);
      // transform to array buffer so we can save it within the queue
      const arrayBuffer = await this.fileService.readFilesAsArrayBuffer(
        [ verification.selectedImages[0] ]);

      // transform file object
      verification.selectedImages[0] = {
        blobURI: this._DomSanitizer.bypassSecurityTrustUrl(blobURI),
        file: arrayBuffer[0].file,
        fileType: arrayBuffer[0].type,
        name: arrayBuffer[0].name,
        base64: await this.pictureService.blobToDataURI(verification.selectedImages[0]),
      };

      verification.description.imgSquare = verification.selectedImages[0].base64;
    }

    this.ref.detectChanges();
  }

  /**
   * Return the status color for a verification and its taker
   *
   * @param      {any}     verification   the verification that should be analysed
   * @return     {string}  the class status (status-0, status-1, status-2)
   */
  trustTakerStatusClass(verification: any) {
    // yellow color
    if (verification.warnings.indexOf('issued') !== -1 || verification.warnings.indexOf('selfCreated') !== -1) {
      return 'status-0';
    } 

    // red color
    if (verification.warnings.indexOf('rejected') !== -1 && verification.rejectReason &&
        verification.rejectReason.rejector === verification.subject) {
      return 'status-2';
    }

    // green color
    if (verification.status === 1) {
      return 'status-1';
    }
  }

  /**
   * Return the status color for a verification and its taker
   *
   * @param      {any}     verification   the verification that should be analysed
   * @return     {string}  the class status (status-0, status-1, status-2)
   */
  trustProviderStatusClass(verification: any) {
    if (verification.parentComputed) {
      const parent = verification.parentComputed;

      // yellow color
      if (parent.status === 0) {
        return 'status-0';
      } 

      // red color
      if (parent.status === -1 || parent.status === 2 ||
          (verification.warnings.indexOf('rejected') !== -1 && verification.rejectReason &&
          verification.rejectReason.rejector === verification.issuerAccount)) {
        return 'status-2';
      }

      // green color
      if (parent.status === 1) {
        return 'status-1';
      }
    } else if (verification.warnings.indexOf('notEnsRootOwner') !== -1) {
      return 'status-0';
    } else if (verification.issuerAccount === this.verificationService.ensRootOwner) {
      return 'status-1';
    }
  }

  /******************************************** d3.js *********************************************/
  /**
   * Render the detail svg using d3.js.
   *
   * @param      {any}     verification   the verification for that the detail should be displayed
   */
  private async renderDetail(verification: any) {
    // wait for finish render process
    await this.core.utils.timeout(0);

    // calculate height of the container (check if we are within the verifications dapp, so size it for a
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
    // verification width + width of connector dot
    const connectorDot = 20;
    const boxHeight = 55;
    const boxWidth =  250 + connectorDot;
    const nodeHeight = 70;
    const nodeWidth = 300 + connectorDot;
    const svg = parentContentContainer.querySelectorAll('.evan-detailed-verification svg')[0];
    const svgZoomContainer = svg.childNodes[1];

    // declares a tree layout and assigns the size
    if (!d3) {
      d3 = (await System.import(`d3.libs.${ getDomainName() }!dapp-content`)).default;
    }

    let treemap = d3.tree()
      // Using nodeSize we are able to control
      // the separation between nodes. If we used
      // the size parameter instead then d3 would
      // calculate the separation dynamically to fill
      // the available space.
      .nodeSize([ nodeHeight, nodeWidth ])
  
      // By default, cousins are drawn further apart than siblings.
      // By returning the same value in all cases, we draw cousins
      // the same distance apart as siblings.
      .separation(function(){
        return 1;
      })

    // Assigns parent, children, height, depth
    const root = d3.hierarchy(verification, (d) => {
      return this.getVerificationsOrParents(d);
    });

    // initialize zooming of the element
    const zoom = d3.zoom()
      .scaleExtent([.1,1])
      .on('zoom', () => {
        const transform = d3.event.transform;
        svgZoomContainer.setAttribute(
          'transform',
          `translate(${ transform.x }, ${ transform.y }) scale(${ transform.k })`
        );
      })

    // levels and their counts of nodes for initially positioning
    const nodes = treemap(root).descendants();
    let levels = { };
    let xDepth = 0;
    let yDepth = 0;

    nodes.forEach(node => {
      xDepth = xDepth < node.y ? node.y : xDepth;
      yDepth = yDepth < node.x ? node.x : yDepth;
    });

    // calculate the initial width and height of the svg zoom container
    let svgZoomContainerWidth = xDepth + boxWidth;
    let svgZoomContainerHeight = yDepth + boxHeight;

    // calculate the initial position of the svg zoom container
    let initialX;
    let initialY = fullHeight / 2 - svgZoomContainerHeight / 2;

    // if the svg size is greater than the zoomContainer width, center the zoomContainer, else place
    // it on the right side
    if (width < svgZoomContainerWidth) {
      initialX = (width - svgZoomContainerWidth - 100);
    } else {
      initialX = -(width - svgZoomContainerWidth);
    }

    d3.select(svg)
      .call(zoom)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(initialX, initialY)
          .scale(1)
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
          sourceY = d.parent.y - (boxWidth / 2) - connectorDot,
          targetX = d.x,
          targetY = d.y + (boxWidth / 2) - connectorDot;
          
      return 'M' + sourceY + ',' + sourceX
        + 'H' + (sourceY + (targetY-sourceY)/2)
        + 'V' + targetX 
        + 'H' + targetY;
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

      // Normalize for fixed-depth.
      //  => from left to right
      // nodes.forEach((d) => d.y = d.depth * 180);
      //  => from right to left
      nodes.forEach((d) => d.y = svg.clientWidth - (d.depth * nodeWidth));

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

          // update the ref and stop the event bubbling
          this.ref.detectChanges();
          if (!$event.disableEventBubbling) {
            return this.core.utils.stopEventBubbling($event);
          }
        }).bind(this);

        node.transform = `translate(${ node.y },${ node.x })`;
        node.hoverTransform = `translate(${ node.y - 250 }, ${ node.x + 30 })`;
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
    await this.core.utils.timeout(0);
    update();

    // collapse missing popover automatically
    if (verification.status === -1) {
      setTimeout(() => {
        this.d3.nodes[1].toggleDetail({
          disableEventBubbling: true,
          target: svg.querySelectorAll('.tree-container foreignObject .evan-verification .verification-label')[1],
        });
      });
    }
  }
}
