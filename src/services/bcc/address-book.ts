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

import { Ipld } from 'bcc';

import {
  OnInit, Injectable, // '@angular/core';
} from 'angular-libs';

import { SingletonService } from '../singleton-service';

import { EvanCoreService } from './core';
import { EvanBCCService } from './bcc';
import { EvanQueue } from './queue';
import { QueueId } from './queue-utilities';
import { EvanTranslationService } from '../ui/translate';
import { EvanDescriptionService } from './description';
import { EvanUtilService } from '../utils';

/**************************************************************************************************/

/**
 * BCC addressbook wrapper
 *
 * @class      Injectable EvanAddressBookService
 */
@Injectable()
export class EvanAddressBookService {
  /**
   * Address book sync queue id
   */
  public queueId: QueueId;

  /**
   * latest loaded address book data
   */
  public current: any;

  /**
   * create singleton instance and create queue id
   */
  constructor(
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private description: EvanDescriptionService,
    private queue: EvanQueue,
    private singleton: SingletonService,
    private translate: EvanTranslationService,
    private utils: EvanUtilService,
  ) {
    return singleton.create(EvanAddressBookService, this, () => {
      this.queueId = new QueueId(
        this.description.getEvanENSAddress('addressbook'),
        'ContactsDispatcher',
        'contacts'
      );
    }, true);
  }

  /**
   * Load the accounts from the address book from the blockchain and from the
   * queue.
   * 
   * Sample:
   *   {
   *     // sharing keys
   *     "keys": {
   *       "0xd1fa932fa69a55fde0d943b1bff79a31e6dc943263697068711570adb652c409": {
   *         "dataKey": "f5510ce31283edef95aeeccae3589cf60b35882e71c741636d5d64c4953b7e89"
   *       },
   *       "0x1d84ab8f4f7b90d837bd2dea56ac559706d1e918f9fe0e85e7b2042a6a7e8ece": {
   *         "commKey": "de6aa299ecabb7508cc6a64f295a1c493200f5cd22bbac10efed409188a616ec"
   *       }
   *     },
   *     "profile": {
   *       "0x1813587e095cDdfd174DdB595372Cb738AA2753A": {
   *         "alias": "My Account Alias"
   *       },
   *       "0x1637Fa43D44a1Fb415D858a3cf4F7F8596A4048F": {
   *         "alias": "My buddy"
   *       }
   *     },
   *     "0x1813587e095cDdfd174DdB595372Cb738AA2753A": {
   *       "alias": "My account Alias"
   *     },
   *     "0x1637Fa43D44a1Fb415D858a3cf4F7F8596A4048F": {
   *       "alias": "My buddy"
   *     }
   *   }
   *
   * @return     {Promise<any>}  addressbok data
   */
  public async loadAccounts(): Promise<any> {
    const addressBook = this.utils.deepCopy(await this.bcc.profile.getAddressBook()) || { };
    Ipld.purgeCryptoInfo(addressBook);

    if (addressBook.profile) {
      for (let contactAddress of Object.keys(addressBook.profile)) {
        try {
          addressBook[contactAddress] = this.utils.deepCopy(await this.bcc.profile.getAddressBookAddress(contactAddress));
        } catch (ex) { }
      }
    }

    const queueEntry = this.queue.getQueueEntry(this.queueId, true);

    queueEntry.data.forEach(dataEntry => {
      if (dataEntry.type === 'add') {
        addressBook[dataEntry.accountId] = Object.assign({}, addressBook[dataEntry.accountId], dataEntry, dataEntry.profile);
      } else {
        delete addressBook[dataEntry.accountId];
      }
    });

    this.current = addressBook;
    return addressBook;
  }

  /**
   * Loads an account ids address book entry
   * 
   * Sample:
   *   {
   *      "alias": "My buddy"
   *   }
   *
   * @param      {string}  accountId  account id to get the entry for
   * @return     {Promise<string>}  addressbook data
   */
  public async loadAccount(accountId: string): Promise<string> {
    const account = this.utils.deepCopy(await this.bcc.profile.getAddressBookAddress(accountId));
    return account;
  }

  /**
   * Save an contact to the address book queue and sets a locally saved contact
   * type 'add' property, so the ui can display it as "adding"
   *
   * Usage:
   *   this.addressBookService.addContactToQueue('0x00...', {
   *      "isCreate": true,
   *      "profile": {
   *         "alias": "Test account",
   *         "accountId": "0xf2009Fc431B326469005bB13370F1df67Ad852e9"
   *       },
   *       "mail": {
   *         "fromAlias": "My Account Alias",
   *         "title": "Contact request",
   *         "body": "Hi,\n\nI'd like to add you as a contact. Do you accept my invitation?\n\nWith kind regards,\n\nMy Account Alias"
   *      },
   *    });
   *   
   * @param      {string}  accountId  account id to add
   * @param      {any}     contact    Contact object (accountId, alias, email
   *                                  address)
   */
  public addContactToQueue(accountId: string, contact: any) {
    contact.accountId = accountId;
    contact.type = 'add';

    this.saveContactToQueue(contact);
  }

  /**
   * Remove an contact from the address book queue and sets a locally saved
   * contact type 'remove' property, so the ui can display it as "removing"
   *
   * Usage: 
   *   this.addressBookService.addRemoveContactToQueue(this.accountId, {
   *     email: "..."
   *   });
   *
   * @param      {string}  accountId  account id to remove
   * @param      {any}     contact    Contact object (accountId, alias, email
   *                                  address)
   */
  public addRemoveContactToQueue(accountId: string, contact: any) {
    contact.accountId = accountId;
    contact.type = 'remove';

    this.saveContactToQueue(contact);
  }

  /**
   * Add an contact including type property to the queue.
   *
   * For usage have a look at "addContactToQueue"
   *
   * @param      {any}     contact  Contact object (accountId, alias, email address) including type
   *                                property
   */
  private saveContactToQueue(contact: any) {
    this.queue.addQueueData(this.queueId, contact, [ 'accountId' ]);
  }

  /**
   * Get the current configured user name.
   *
   * @param      {boolean}          disableNoAlias  disable empty alis filling
   * @return     {Promise<string>}  users alias
   */
  async activeUserName(disableNoAlias?: boolean): Promise<string> {
    const addressbook = await this.loadAccounts();
    const myProfile = addressbook[this.core.activeAccount()];

    if (myProfile && myProfile.alias) {
      return myProfile.alias;
    } else if (!disableNoAlias) {
      return this.translate.instant('_angularcore.no-alias');
    }
  }
}
