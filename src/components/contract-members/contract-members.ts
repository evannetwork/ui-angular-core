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
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  MenuController,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from 'angular-libs';

import { AsyncComponent } from '../../classes/AsyncComponent';
import { createOpacityTransition } from '../../animations/opacity';
import { EvanAddressBookService } from '../../services/bcc/address-book';
import { EvanVerificationService } from '../../services/bcc/verifications';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanQueue, } from '../../services/bcc/queue';
import { QueueId, } from '../../services/bcc/queue-utilities';

/**************************************************************************************************/

/**
 * Contract member management component. Allows you to show existing members of contracts and, if
 * you want, to collect more users that can be invited by your code.
 *
 * Usage:
 * <contract-members
 *   [(members)]="membersToAdd"
 *   [origin]="originalContractMembers"
 *   [readonly]="!(amITheCreator() && task.contractState == 2)"
 *   [contractMemberStates]="memberStatesObject"
 *   (onChange)="ref.detectChanges()">
 * </contract-members>
 *
 * @class      Component ContractMembersComponent
 */
@Component({
  selector: 'contract-members',
  templateUrl: 'contract-members.html',
  animations: [
    createOpacityTransition()
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractMembersComponent extends AsyncComponent {
  /***************** inputs & outpus *****************/
  /**
   * new member account ids that should be added to the contract
   */
  @Input() members: Array<string>;

  /**
   * members states of the contract
   * 
   * Usage:
   * async loadTaskStates(task) {
   *   const states = { };
   *
   *   for (let member of task.members) {
   *     states[member] = await this.getMemberState(task.address, member);
   *   }
   *
   *   return states;
   * }
   *
   *   async getMemberState(contractId?: any, accountId?: string) {
   *   if (accountId === this.core.activeAccount()) {
   *     const stateChanges = this.queueService.getQueueEntry(this.getStateQueueId(contractId), true).data;
   *     const myStateUpdate = !!stateChanges.find(stateUpdate => stateUpdate === 'me');
   *
   *     if (myStateUpdate) {
   *       return 'loading';
   *     }
   *   }
   *
   *   const contractInstance = this.bccService.contractLoader.loadContract('BaseContract', contractId);
   *   return await this.bccService.executor.executeContractCall(contractInstance, 'getConsumerState', accountId);
   * }
   */
  @Input() contractMemberStates?: any;

  /**
   * this component is displayed like an ionic input, defines property or hides it
   */
  @Input() label?: string;

  /**
   * replace input placeholder
   */
  @Input() placeholder?: string;

  /**
   * already added user accounts
   */
  @Input() origin?: Array<string>;

  /**
   * show display or add mode
   */
  @Input() readonly?: boolean;

  /**
   * Should the select component be disabled?
   */
  @Input() disabled?: boolean;

  /**
   * max users that can be added
   */
  @Input() maxMembers?: number;

  /**
   * include the current active account into the list
   */
  @Input() includeActiveAccount: boolean;
  /**
   * Event trigger that is called when something has changed (account moved / removed)
   */
  @Output() public onChange: EventEmitter<any> = new EventEmitter();


  /*****************    variables    *****************/
  /**
   * search input reference for autofocus
   */
  @ViewChild('searchInput') searchInput: any;

  /**
   * curret account id reference
   */
  private activeAccount: string;

  /**
   * contact keys of current address book
   */
  private contactKeys: Array<string>;

  /**
   * addressbook
   */
  private contacts: any;

  /**
   * current search input value
   */
  private contactSearch: string;

  /**
   * using contract states grouped members
   */
  private groupedMembers: any;

  /**
   * Object.keys(groupedMembers)
   */
  private groupedMemberKeys: Array<string>;

  /**
   * ion menu reference for showing side panel
   */
  private ionMenu: Element;

  /**
   * show member count or member tags, member tags will be hidden, when they
   * overflow the screen
   */
  private showTags: boolean;

  /**
   * account suggestions that were genrated during member search
   */
  private suggestions: Array<string>;

  /**
   * specify, if the contract members input were adjusted
   */
  public touched: boolean;

  /**
   * for the current profile activated verifications
   */
  private verifications: Array<string> = [ ];

  /**
   * Function to unsubscribe from profile verifications watcher queue results.
   */
  private profileVerificationsWatcher: Function;


  /***************** initialization  *****************/
  constructor(
    private addressBook: EvanAddressBookService,
    private verificationsService: EvanVerificationService,
    private core: EvanCoreService,
    private element: ElementRef,
    private menuController: MenuController,
    private queueService: EvanQueue,
    public ref: ChangeDetectorRef,
  ) {
    super(ref);
  }

  /**
   * loads active account & addressbook, group members and trigger empty search
   */
  async _ngOnInit() {
    this.activeAccount = this.core.activeAccount();

    this.contactSearch = '';
    this.suggestions = [ ];

    this.members = this.members || [ ];
    this.origin = this.origin || [ ];
    this.contacts = await this.addressBook.loadAccounts();
    this.contactKeys = Object
      .keys(this.contacts)
      .filter(contactKey => {
        const isValid = this.contacts[contactKey] && contactKey.indexOf('0x') === 0;
        if (this.includeActiveAccount) {
          return isValid;
        } else {
          return isValid && contactKey !== this.activeAccount; 
        }
      });

    // load profile active verifications
    this.profileVerificationsWatcher = await this.queueService.onQueueFinish(
      new QueueId(`profile.${ getDomainName() }`, '*'),
      async (reload, results) => {
        reload && await this.core.utils.timeout(0);
        this.verifications = await this.verificationsService.getProfileActiveVerifications();
        this.ref.detectChanges();
      }
    );

    this.contactSearchChanged();
    this.groupMembers();
  }

  /**
   * append ion menu to a top level element to handle multiple, nested right
   * panels (mostly used by dapp-wrapper)
   */
  async _ngAfterViewInit() {
    this.ionMenu = this.element.nativeElement.querySelector('ion-menu');
    document.querySelector('body > .evan-angular > ion-app dapp-wrapper').appendChild(this.ionMenu);
    setTimeout(() => this.setShowTags());
  }

  /**
   * remove the right menu on element destroy
   */
  async _ngOnDestroy() {
    this.profileVerificationsWatcher();

    try {
      document.querySelector('body > .evan-angular > ion-app dapp-wrapper').removeChild(this.ionMenu);
    } catch (ex) { }
  }

  /*****************    functions    *****************/
  /**
   * Group all newly added and origin members into states for a grouped display
   */
  private groupMembers() {
    const allMembers = [ ].concat(this.members, this.origin);

    this.groupedMembers = { };

    for (let i = 0; i < allMembers.length; i++) {
      const memberState = this.getMemberState(allMembers[i]);

      this.groupedMembers[memberState] = this.groupedMembers[memberState] || [ ];
      this.groupedMembers[memberState].push(allMembers[i]);
    }

    this.groupedMemberKeys = Object.keys(this.groupedMembers);
  }

  /**
   * Check if members should be displayed as tags or only as member count text
   */
  private setShowTags() {
    const tags = this.element.nativeElement.querySelectorAll('.evan-tag');
    let computedWidth = 0;

    for (let i = 0; i < tags.length; i++) {
      computedWidth += tags[i].offsetWidth;
    }

    if (computedWidth > (this.element.nativeElement.offsetWidth - 35)) {
      this.showTags = false;
    } else {
      this.showTags = true;
    }

    this.ref.detectChanges();
  }

  /**
   * Filter contacts for the current search term.
   */
  private async contactSearchChanged() {
    await this.core.utils.timeout(0);

    const suggestions = [ ];
    const searchValue = this.contactSearch.toLowerCase();

    this.contactKeys.forEach(contactKey => {
      let matchString = '';

      if (this.contacts[contactKey]) {
        const keys = Object.keys(this.contacts[contactKey]);

        for (let i = 0; i < keys.length; i++) {
          matchString += this.contacts[contactKey][keys[i]];
        }
      }

      matchString = matchString.toLowerCase();

      if (suggestions.length < 6 &&
          !this.findMember(this.members, contactKey) &&
          !this.findMember(this.origin, contactKey) &&
          (
            contactKey.toLowerCase().indexOf(searchValue) !== -1 ||
            matchString.indexOf(searchValue) !== -1
          )) {
        suggestions.push(contactKey);
      }
    });

    this.suggestions = suggestions;

    this.onChange.emit();
    this.ref.detectChanges();
  }

  /**
   * Open the right panel.
   */
  private async openMenu() {
    if (this.disabled) {
      return;
    }

    if (!this.ionMenu) {
      await this._ngAfterViewInit();
    }

    this.menuController._menus.forEach(async (menu) => {
      if (menu.getElementRef().nativeElement === this.ionMenu) {
        menu.enable(true);
        menu.open('contactMemberAdd');
        menu.getElementRef().nativeElement.style.display = 'block';

        if (!this.core.utils.isMobile()) {
          await this.core.utils.timeout(0);

          const searchInput = this.ionMenu.querySelector('input');
          if (searchInput) {
            searchInput.focus();
          }
        }
      }
    });
  }

  private async closeMenu() {
    this.menuController._menus.forEach(async (menu) => {
      if (menu.getElementRef().nativeElement === this.ionMenu) {
        menu.enable(true);
        menu.close('contactMemberAdd');
        menu.getElementRef().nativeElement.style.display = 'none';
      }
    });
  }

  /**
   * find a member within a member list array.
   *
   * @param      {Array<string>}  memberList  list of account ids
   * @param      {string}         contactKey  contract key to search
   * @return     {boolean}        true if found, false if not
   */
  private findMember(memberList: Array<string>, contactKey: string) {
    return !!memberList.find(member => member === contactKey);
  }

  /**
   * Add a member to the members array and resets search terms and set focus
   *
   * @param      {string}  memberAddress  member address to add
   */
  private addMember(memberAddress?: string) {
    if (memberAddress && this.canAddMember()) {
      this.members.push(memberAddress);

      this.contactSearch = '';

      this.searchInput.setFocus();
      this.contactSearchChanged();

      this.contactSearchChanged();
      this.groupMembers();
      this.onChange.emit();
      this.ref.detectChanges();

      setTimeout(() => {
        this.setShowTags();
      });
    }
  }

  /**
   * Removes a member from the members array.
   *
   * @param      {string}  memberAddress  member to remove
   */
  private removeMember(memberAddress: string) {
    this.members.splice(this.members.indexOf(memberAddress), 1);

    this.contactSearchChanged();
    this.groupMembers();
    this.onChange.emit();
    this.ref.detectChanges();

    setTimeout(() => {
      this.setShowTags();
    });
  }

  /**
   * Returns the member state for a user
   *
   * @param      {string}  member  member account id
   * @return     {number}  state of the user
   */
  private getMemberState(member: string): number {
    if (this.contractMemberStates && this.contractMemberStates[member]) {
      return this.contractMemberStates[member];
    }
  }

  /**
   * Determines if an account id is my account id.
   *
   * @param      {string}   accountId  account id to check
   * @return     {boolean}  True if my account, False otherwise.
   */
  private isMyAccount(accountId) {
    return accountId.toLowerCase() === this.activeAccount.toLowerCase();
  }

  /**
   * return an contact alias from address book, if its available
   *
   * @param      {string}  accountId  account id to get the alias for
   * @return     {<type>}  The contact alias.
   */
  private getContactAlias(accountId: string): string {
    const lowerCaseAccount = accountId.toLowerCase();
    let name = accountId;

    if (this.contacts[accountId]) {
      const profile = this.contacts[accountId];

      name = profile.alias || profile.email || accountId;
    } else if (this.contacts[lowerCaseAccount]) {
      const profile = this.contacts[accountId];

      name = profile.alias || profile.email || accountId;
    }

    return name;
  }

  /**
   * If the menu was closed, we need to set the component to touched, so a using component can show
   * an required error or something.
   */
  private setTouched() {
    this.closeMenu();

    // set that the component was touched
    this.touched = true;
    this.onChange.emit();
    this.ref.detectChanges();
  }

  /**
   * Can be more members added?
   *
   * @return     {boolean}  True if able to add member, False otherwise.
   */
  private canAddMember(): boolean {
    return !this.maxMembers || [ ].concat(this.members, this.origin).length < this.maxMembers;
  }
}
