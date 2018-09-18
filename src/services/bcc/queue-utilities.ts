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

/**
 * Generates an queue ID by concadinating an ensAddress and a dispatcher name
 *
 * @param ensAddress    ens address were the dispatcher lives
 * @param dispatcher    name of the exported function on the ens expose object
 * @param id            specification to start the same queue in seperated instances
 * @param foreReload    use force reload to disable alert when current opened ens address is the same as the currently finished dispatcher
 */
export class QueueId {
  public ensAddress: string;
  public dispatcher: string;
  public id: string;
  public forceReload: boolean;

  /**
   * use force reload to disable alert when current opened ens address is the
   * same as the currently finished dispatcher
   */
  constructor(ensAddress: string, dispatcher: string, id: string = '*', forceReload?: boolean) {
    this.ensAddress = ensAddress;
    this.dispatcher = dispatcher;
    this.id = id;
    this.forceReload = forceReload;
  }

  /**
   * return the queue id concadinated to a unique string
   *
   * @return     {<type>}  queue id string
   */
  getString() {
    return `${ this.ensAddress }-${ this.dispatcher }-${ this.id }`;
  }
}

/**
 * Used to handle one step of an dispatcher
 * 
 * @param {string} name         Display name for queue (used for QueueDApp)
 * @param {string} description  Description for the queue (used for QueueDApp)
 * @param {Function} run        the function that is called to run the queue
 *                              (gets the within the QueueDispatcher configured service and the data
 *                              that should be handled (Array<any>: one entry for each new added
 *                              QueueEntry))
 * 
 * usage:
 *     new QueueSequence(
 *       '_dappdapps.dispatcher.save-bookmarks',
 *       '_dappdapps.dispatcher.save-bookmarks-description',
 *       async (service: BookmarkDispatcherService, data: any) => {
 *         await service.bookmarkService.syncQueueBookmarks();
 *       }
 *     )
 *
 * @class      QueueSequence
 */
export class QueueSequence {
  name: string;
  description: string;
  run: Function;

  constructor(name: string, description: string, run: Function) {
    this.name = name;
    this.description = description;
    this.run = run;
  }
}

/**
 * Represents one dispatcher using several queueSequences, that will processed
 * one after another, using step caches
 * 
 * @param {Array<QueueSequence>} sequence  All sequences that should be runned after another
 * @param {any} i18n                       i18n definitions for the queue
 * @param {string} serviceName             name of the servide that should be applied to the
 *                                         sequence entry 
 * 
 * usage:
 *  export const BookmarkDispatcher = new QueueDispatcher(
 *    [
 *      sequences...
 *    ],
 *    translations
 *  );
 *
 * @class      QueueDispatcher
 */
export class QueueDispatcher {
  sequence: Array<QueueSequence>;
  i18n: any;
  serviceName: any;

  constructor(sequence: Array<QueueSequence>, i18n: any, serviceName?: string) {
    this.sequence = sequence;
    this.i18n = i18n;
    this.serviceName = serviceName;
  }
}
