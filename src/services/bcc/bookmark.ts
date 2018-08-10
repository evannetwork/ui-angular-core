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
 * Blockchain-core wrapper service to handle users favorites.
 *
 * @class      Injectable EvanBookmarkService
 */
@Injectable()
export class EvanBookmarkService {
  /**
   * queue id for handling favorite saving
   */
  public queueId: QueueId;

  /**
   * make it standalone and load dependency services
   */
  constructor(
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private descriptionService: EvanDescriptionService,
    private queue: EvanQueue,
    private singleton: SingletonService,
    private translate: EvanTranslationService,
    private utils: EvanUtilService,
  ) {
    return singleton.create(EvanBookmarkService, this, () => {
      this.queueId = new QueueId(
        this.descriptionService.getEvanENSAddress('favorites'),
        'BookmarkDispatcher',
        'bookmarks'
      );
    }, true);
  }

  /**
   * Queue a new bookmark add process.
   * 
   * Usage:
   *   const dapp = await this.bookmarkService.getBookmarkDefinition(ensAddress)
   *   await this
   *     .alertService.showSubmitAlert(
   *       '_dappdapps.alert.validTitle',
   *       {
   *         key: '_dappdapps.alert.dappMessage',
   *         translateOptions: dapp
   *       },
   *       'cancel',
   *       'submit'
   *     );
   *   this.bookmarkService.queueAddBookmark(ensAddress, dapp))
   *
   * @param      {string}  ensAddress  ens address that should be added
   * @param      {any}     dapp        dapp ens description
   */
  public async queueAddBookmark(ensAddress: string, dapp: any) {
    const bookmarkQueue = this.queue.getQueueEntry(this.queueId, true);
    let found = false;

    // check for existing bookmarks in the queue
    for (let i = 0; i < bookmarkQueue.data.length; i++) {
      const bookmark = bookmarkQueue.data[i];

      if (bookmark.ensAddress === ensAddress) {
        // remove the remove bookmark queue data when the same bookmark is added
        if (bookmark.type === 'remove') {
          bookmarkQueue.data.splice(i, 1);
        } else {
          found = true;
        }

        break;
      }
    }

    if (!found) {
      this.queue.addQueueData(this.queueId, {
        type: 'add',
        ensAddress,
        dapp
      });
    }
  }

  /**
   * Queue a new bookmark removal process.
   * 
   * Usage:
   *   this.bookmarkService.queueRemoveBookmark('**.evan')
   *
   * @param      {string}  ensAddress  ens address that should be remove
   */
  public async queueRemoveBookmark(ensAddress: string) {
    const bookmarkQueue = this.queue.getQueueEntry(this.queueId, true);
    let found = false;

    // check for existing bookmarks in the queue
    for (let i = 0; i < bookmarkQueue.data.length; i++) {
      const bookmark = bookmarkQueue.data[i];

      if (bookmark.ensAddress === ensAddress) {
        // remove the remove bookmark queue data when the same bookmark is added
        if (bookmark.type === 'remove') {
          found = true;
        } else {
          bookmarkQueue.data.splice(i, 1);

          // when the bookmark was removed but not from the blockchain, only from the queue
          //   => dont add it again, only remove it
          const bookmarkDapps = this.utils.deepCopy(await this.bcc.profile.getBookmarkDefinitions());
          if (!bookmarkDapps.hasOwnProperty(ensAddress)) {
            found = true;
          }
        }

        break;
      }
    }

    if (!found) {
      const dapp = await this.getBookmarkDefinition(ensAddress);

      this.queue.addQueueData(this.queueId, {
        type: 'remove',
        ensAddress,
        dapp
      });
    }
  }

  /**
   * Add DApp bookmark to the current profile.
   * 
   * Usage: Have a look at this.queueAddBookmark
   *
   * @param      {string}         ensAddress  ens address that should be added
   * @param      {any}            dapp        dapp ens definition
   * @return     {Promise<void>}  resolved when done
   */
  public async addDAppBookmark(ensAddress: string, dapp: any): Promise<void> {
    const bookmark = this.getBookmarkFromDefinition(dapp);

    await this.bcc.profile.addDappBookmark(ensAddress, bookmark);
    await this.bcc.profile.storeForAccount(this.bcc.profile.treeLabels.bookmarkedDapps);
  }

  /**
   * Remove bookmark from current account.
   *
   * @param      {string}         ensAddress  ens address that should be removed
   *                                          from the current account
   * @return     {Promise<void>}  resolved when done
   */
  public async removeDappBookmark(ensAddress: string):Promise<void> {
    await this.bcc.profile.removeDappBookmark(ensAddress);
    await this.bcc.profile.storeForAccount(this.bcc.profile.treeLabels.bookmarkedDapps);
  }

  /**
   * Overwrite current bookmarks to the profile and write them to the
   * blockchain.
   *
   * @return     {Promise<void>}  resolved when done
   */
  public async syncQueueBookmarks(): Promise<void> {
    const dappBookmarks = this.utils.deepCopy(await this.getDAppBookmarks());

    await this.bcc.profile.setDappBookmarks(dappBookmarks);
    await this.bcc.profile.storeForAccount(this.bcc.profile.treeLabels.bookmarkedDapps);
  }

  /**
   * Reload profile data and return current bookmarked dapps.
   * 
   * returns:
   *   {
   *     ...
   *     "taskboard.evan": {
   *       "name": "taskboard",
   *       "description": "Create todos and manage updates.",
   *       "i18n": {
   *         "description": {
   *           "de": "Erstelle Aufgaben und überwache Änderungen",
   *           "en": "Create todos and manage updates"
   *         },
   *         "name": {
   *           "de": "Task Board",
   *           "en": "Task Board"
   *         }
   *       },
   *       "imgSquare": "...",
   *       "standalone": true,
   *       "primaryColor": "#e87e23",
   *       "secondaryColor": "#fffaf5",
   *       "translated": {
   *         "description": "Create todos and manage updates",
   *         "name": "Task Board"
   *       }
   *     }
   *   }
   *   
   * @param      {boolean}              reload  Force reload of current profile
   *                                            and so reload the bookmarks.
   * @return     {Promise<Array<any>>}  bookmarks for the current user
   */
  public async getDAppBookmarks(reload?: boolean): Promise<Array<any>> {
    if (reload) {
      delete this.bcc.profile.trees[this.bcc.profile.treeLabels.bookmarkedDapps];
    }

    const bookmarkDapps = this.utils.deepCopy(
      await this.bcc.profile.getBookmarkDefinitions() || {}
    );

    // check the evan queue for pending local transactions
    const bookmarkQueue = this.queue.getQueueEntry(this.queueId, true);

    bookmarkQueue.data
      .forEach(queueEntry => {
        switch (queueEntry.type) {
          case 'add': {
            bookmarkDapps[queueEntry.ensAddress] = this.getBookmarkFromDefinition(queueEntry.dapp);

            break;
          }
          case 'remove': {
            delete bookmarkDapps[queueEntry.ensAddress];

            break;
          }
        }
      });

    // translate them
    const bookmarkKeys = Object.keys(bookmarkDapps);

    bookmarkKeys.forEach(key =>
      bookmarkDapps[key] = this.translate.getTranslatedDescription(bookmarkDapps[key])
    );

    return bookmarkDapps;
  }

  /**
   * Clear bookmarks of current profile.
   *
   * @return     {Promise<void>}  resolved when done
   */
  public async clearBookmarks(): Promise<void> {
    await this.bcc.profile.setDappBookmarks({});

    await this.bcc.profile.storeForAccount(this.bcc.profile.treeLabels.bookmarkedDapps);
  }

  /**
   * Checks if the bookmark is already added the current profile bookmarks.
   *
   * @param      {any}  bookmark  Bookmark ENS definition
   * @return     {Promise<void>}  resolved when done
   */
  private async setAlreadyAddedToBookmark(bookmark: any): Promise<void> {
    const bookmarks = await this.getDAppBookmarks();

    if (bookmark.status !== 'invalid' && bookmarks.hasOwnProperty(bookmark.ensAddress)) {
      bookmark.status = 'already_added';
    }
  }

  /**
   * Transform ENS definition to bookmark definition.
   *
   * @param      {any}  definition  ENS definition to parse
   * @return     {any}  The bookmark from definition.
   */
  public getBookmarkFromDefinition(definition: any): any {
    return {
      name: definition.name,
      description: definition.description,
      i18n: definition.i18n,
      imgSquare: definition.imgSquare,
      imgWide: definition.imgWide,
      standalone: definition.standalone || definition.dapp.standalone,
      primaryColor: definition.primaryColor || definition.dapp.primaryColor,
      secondaryColor: definition.secondaryColor || definition.dapp.secondaryColor
    };
  }

  /**
   * Loads an definition and checks the "already_added" state.
   * 
   * result: have a look at getBookmarkFromDefinition
   *
   * @param      {string}  ensAddress  ENS addres to load the definition from
   * @return     {Promise<any>}  The bookmark definition.
   */
  public async getBookmarkDefinition(ensAddress: string): Promise<any> {
    const definition = await this.descriptionService.getDescription(ensAddress);

    await this.setAlreadyAddedToBookmark(definition);

    return definition;
  }

  /**
   * Loads multiple definitions and checks the "already_added" state.
   *
   * @param      {string}  ensAddresses  ENS addresses to load the definition
   *                                     from
   * @return     {any}     The bookmark definitions.
   */
  public async getBookmarkDefinitions(ensAddresses: Array<string>): Promise<any> {
    const descriptions = await this.descriptionService.getMultipleDescriptions(ensAddresses);

    for (let description of descriptions) {
      await this.setAlreadyAddedToBookmark(description);
    }

    return descriptions;
  }
}
