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
  CoreRuntime
} from 'bcc';

import {
  getDomainName
} from 'dapp-browser';

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ControlValueAccessor,
  Directive,
  ElementRef,
  EventEmitter,
  FormControl,
  forwardRef,
  Input,
  MenuController,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  OnDestroy,
  OnInit,
  Output,
  ValidationErrors,
  Validator,
  ViewChild,
} from 'angular-libs';

import { AsyncComponent } from '../../classes/AsyncComponent';
import { createOpacityTransition } from '../../animations/opacity';
import { EvanAddressBookService } from '../../services/bcc/address-book';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanQueue, } from '../../services/bcc/queue';
import { EvanVerificationService } from '../../services/bcc/verifications';
import { QueueId, } from '../../services/bcc/queue-utilities';
import { EvanBCCService, } from '../../services/bcc/bcc';

/**************************************************************************************************/

/**
 * Component to select an account or contract address. For autocompletion processes, the addressbook
 * of the current user is used. But also wildcard addresses can be inserted.
 *
 * @class      Component AddressInputComponent
 */
@Component({
  selector: 'evan-address-input',
  templateUrl: 'address-input.html',
  animations: [
    createOpacityTransition()
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressInputComponent),
      multi: true,
    }
  ]
})
export class AddressInputComponent extends AsyncComponent implements ControlValueAccessor {
  /***************** inputs & outpus *****************/
  /**
   * this component is displayed like an ionic input, defines property or hides it
   */
  @Input() label?: string;

  /**
   * replace input placeholder
   */
  @Input() placeholder?: string;

  /**
   * show display or add mode
   */
  @Input() readonly?: boolean;

  /**
   * Should the select component be disabled?
   */
  @Input() disabled?: boolean;

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
   * contact keys of current address book
   */
  private inputValue: string;

  /**
   * contact keys of current address book
   */
  private contactKeys: Array<string>;

  /**
   * show member count or member tags, member tags will be hidden, when they
   * overflow the screen
   */
  private showSuggestions: boolean;

  /**
   * addressbook
   */
  private contacts: any;

  /**
   * account suggestions that were genrated during member search
   */
  private suggestions: Array<string>;

  /**
   * specify, if the contract members input were adjusted
   */
  public touched: boolean;

  /**
   * From ControlValueAccessor interface
   */
  private onTouchedCallback: Function;

  /**
   * highlight current active suggestions
   */
  private activeSuggestion: number = 0;

  /***************** initialization  *****************/
  constructor(
    private addressBook: EvanAddressBookService,
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private element: ElementRef,
    private menuController: MenuController,
    private queueService: EvanQueue,
    private verificationsService: EvanVerificationService,
    public ref: ChangeDetectorRef,
  ) {
    super(ref);
  }

  /**
   * loads active account & addressbook, group members and trigger empty search
   */
  async _ngOnInit() {
    this.suggestions = [ ];

    this.contacts = await this.addressBook.loadAccounts();
    this.contactKeys = Object
      .keys(this.contacts)
      .filter(contactKey => this.contacts[contactKey] && contactKey.indexOf('0x') === 0);

    this.contactSearchChanged();
  }

  /**
   * remove the right menu on element destroy
   */
  async _ngOnDestroy() {
  }

  /**
   * Append this functions to handle a correct formular reaction including name, required and so on.
   */
   /**
    * Takes the current ng model input and pass it to the ngModel input.
    *
    * @param      {string}  value   the input value
    */
  writeValue(value: string) {
    this.inputValue = value || '';
  }

  /**
   * placeholder and will be replaced with registerOnChange.
   */
  propagateChange = (_: any) => { };

  /**
   * Takes the propagateChange function and overwrites it
   *
   * @param      {Function}  fn      the propagate change function
   */
  registerOnChange(fn) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }

  /*****************    functions    *****************/
  /**
   * Filter contacts for the current search term.
   *
   * @param      {any}     $event  input event
   */
  private contactSearchChanged() {
    const suggestions = [ ];
    const searchValue = (this.inputValue || '').toLowerCase();
    const previousSelectedSuggestion = this.suggestions[this.activeSuggestion];

    this.contactKeys.forEach(contactKey => {
      const lowerCaseKey = contactKey.toLowerCase();
      let matchString = '';

      if (this.contacts[contactKey]) {
        const keys = Object.keys(this.contacts[contactKey]);

        for (let i = 0; i < keys.length; i++) {
          matchString += this.contacts[contactKey][keys[i]];
        }
      }

      matchString = matchString.toLowerCase();

      if (suggestions.length < 6 && searchValue !== lowerCaseKey &&
        (contactKey.toLowerCase().indexOf(searchValue) !== -1 ||
        matchString.indexOf(searchValue) !== -1)) {
        suggestions.push(contactKey);
      }
    });

    this.suggestions = suggestions;

    const newPreviousIndex = this.suggestions.indexOf(previousSelectedSuggestion);
    if (newPreviousIndex !== -1) {
      this.activeSuggestion = newPreviousIndex;
    } else if (this.activeSuggestion > this.suggestions.length - 1) {
      this.activeSuggestion = this.suggestions.length - 1;

      if (this.activeSuggestion < 0) {
        this.activeSuggestion = 0;
      }
    }

    this.propagateChange(this.inputValue);
    this.onChange.emit();
    this.ref.detectChanges();
  }

  /**
   * Handle keypress for accessing suggestions easier.
   *
   * @param      {any}      $event  the keydown input event
   */
  private handleKeyPress($event: any) {
    this.touched = true;

    switch ($event.keyCode) {
      case 13: {
        this.inputValue = this.suggestions[this.activeSuggestion];
        this.contactSearchChanged();

        return this.core.utils.stopEventBubbling($event);
      }
      // up arrow
      case 38: {
        this.activeSuggestion = this.activeSuggestion === 0 ? this.suggestions.length - 1 :
          this.activeSuggestion - 1;

        break;
      }
      // down arrow
      case 40: {
        this.activeSuggestion = this.activeSuggestion === this.suggestions.length -1 ? 0
          : this.activeSuggestion + 1;

        break;
      }
    }

    this.ref.detectChanges();
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
    // set that the component was touched
    this.touched = true;
    this.onChange.emit();
    this.ref.detectChanges();
  }


  private async setShowSuggestions(value: boolean) {
    await this.core.utils.timeout(100);

    this.showSuggestions = value;
    this.ref.detectChanges();
  }

  /**
   * Run detectChanges directly and after and timeout again, to update select fields.
   */
  detectTimeout() {
    this.propagateChange(this.inputValue);
    this.onChange.emit();
    this.ref.detectChanges();

    setTimeout(() => this.ref.detectChanges());
  }
}
