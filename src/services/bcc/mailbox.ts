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
  Router,             // '@angular/router';
  OnInit, Injectable, // '@angular/core';
  Injector,
} from 'angular-libs';

import { EvanAddressBookService } from './address-book';
import { EvanBCCService } from './bcc';
import { EvanCoreService } from './core';
import { EvanDescriptionService } from './description';
import { EvanModalService } from '../ui/modal';
import { EvanQueue } from './queue';
import { EvanRoutingService } from '../ui/routing';
import { EvanToastService } from '../ui/toast';
import { EvanTranslationService } from '../ui/translate';
import { EvanUtilService } from '../utils';
import { MailDialogComponent } from '../../components/mail-dialog/mail-dialog';
import { QueueId } from './queue-utilities';
import { SingletonService } from '../singleton-service';

/**************************************************************************************************/

/**
 * Blockchain-core mailbox wrapper
 *
 * @class      Injectable EvanMailboxService
 */
@Injectable()
export class EvanMailboxService {
  /**
   * indicator that mails are loading
   */
  public isLoadingMails;

  /**
   * last count of mail notifications
   */
  public lastNotificationMailCount = 0;

  /**
   * maximum mails to get for received mails
   */
  public receivedMailLoadCount = 10;

  /**
   * amount of received mails, that could not be decrypted
   */
  public invalidReceivedMailCount = 0;

  /**
   * maximum mails to get for sent mails
   */
  public sentMailLoadCount = 10;

  /**
   * amount of sent mails, that could not be decrypted
   */
  public invalidSentMailCount = 0;

  /**
   * profile queue id, for saving sharing keys, ..
   */
  public updateProfileQueueId: QueueId;

  /**
   * all mail cache
   */
  public mails: object[] = [];

  /**
   * newly received mail count
   */
  public newMailCount = 0;

  /**
   * all mails that were already viewed (cached into local storage)
   */
  public readMails: Array<string>;

  /**
   * received mail cache
   */
  public receivedMails: object[] = [];

  /**
   * queue id to handle mail sending
   */
  public sendMailQueueId: QueueId;

  /**
   * queue id to handle mail sending
   */
  public answerMailQueueId: QueueId;


  /**
   * send mail cache
   */
  public sentMails: object[] = [];

  /**
   * total received mail count
   */
  public totalReceivedMailCount: number;
  
  /**
   * total sent mail count
   */
  public totalSentMailCount: number;

  /**
   * make it standalone and load dependency services and load mails
   */
  constructor(
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private singleton: SingletonService,
    private definitionService: EvanDescriptionService,
    private queueService: EvanQueue,
    private toastService: EvanToastService,
    private translateService: EvanTranslationService,
    private routingService: EvanRoutingService,
  ) {
    return singleton.create(EvanMailboxService, this, () => {
      this.sendMailQueueId = new QueueId(
        definitionService.getEvanENSAddress('mailbox'),
        'SendMailDispatcher',
        'sendMail'
      );
      this.answerMailQueueId = new QueueId(
        definitionService.getEvanENSAddress('mailbox'),
        'AnswerMailDispatcher',
        'answerMail'
      );
      this.receivedMails = [ ];
      this.sentMails = [ ];

      this.readMails = this.getReadMails();
    }, true);
  }

  /**
   * Check for new mails and set the newMails property to false / true when new mails incoming
   *
   * @return     {Promise<void>}  resolved when done
   */
  async checkNewMails(): Promise<void> {
    if (!this.isLoadingMails && this.bcc.mailbox &&
        window.location.hash.indexOf('onboarding') === -1 && this.core.activeAccount()) {
      this.isLoadingMails = true;

      const receivedMails = await this.bcc.mailbox.getReceivedMails(1);
      const lastViewedMails = this.readMails.length;
      const totalMailCount = receivedMails.totalResultCount;

      this.newMailCount = totalMailCount - this.getReadMailsCount();
      this.totalReceivedMailCount = totalMailCount;

      if (this.lastNotificationMailCount < totalMailCount && this.newMailCount > 0) {
        this.lastNotificationMailCount = totalMailCount;
      }

      this.isLoadingMails = false;
      this.core.utils.sendEvent('check-new-mail-update');
    }
  }

  /**
   * Check read mails within localStorage cache and return them.
   * 
   * returns: [ '0x00...', '0x100...' ]
   *
   * @return     {Array<string>}  readed mails from localStorage
   */
  getReadMails(): Array<string> {
    try {
      const readMails = JSON.parse(window.localStorage['evan-mail-read']);

      if (Array.isArray(readMails)) {
        return readMails;
      }
    } catch (ex) { }

    return [ ];
  }

  /**
   * Get read mail count
   *
   * @return     {number}  count of read mails
   */
  getReadMailsCount(): number {
    const mailCount = parseInt(window.localStorage['evan-mail-read-count'], 10) || 0;

    if (isNaN(mailCount)) {
      return 0;
    } else {
      return mailCount;
    }
  }

  /**
   * Add a mail id to the mail read array within the localStorage
   *
   * @param      {string}  mailId  mail id
   */
  addReadMails(mailId: string) {
    if (mailId && this.readMails.indexOf(mailId) === -1) {
      this.readMails.push(mailId);

      this.checkNewMails();
    }

    window.localStorage['evan-mail-read'] = JSON.stringify(this.readMails);

    this.checkNewMails();
  }

  /**
   * Check for new mails and update the last read mail count
   */
  async syncLastReadCount() {
    await this.checkNewMails();

    window.localStorage['evan-mail-read-count'] = this.totalReceivedMailCount;

    this.newMailCount = 0;
  }

  /**
   * Show a mail modal, to provide the user the possility to change the email
   * text before sending.
   * Usage:
   *   await this.mailboxService
   *     .showMailModal(
   *       this.modalService,
   *       '_dappcontacts.invitation-message',
   *       '_dappcontacts.invitation-message-long',
   *       '_dappcontacts.invitation-text.title',
   *       '_dappcontacts.invitation-text.body',
   *     );
   *
   * @param      {string}  modalService  modal service (must to be inclued, to
   *                                     prevent recursive services)
   * @param      {string}  alertTitle    title of the modal
   * @param      {string}  alertText     sub text of the modal
   * @param      {string}  title         title text of the mail
   * @param      {string}  body          body text of the mail
   * @return     {Promise<any>}     adjusted mail result
   */
  showMailModal(
    modalService: EvanModalService,
    alertTitle: string,
    alertText: string,
    title: string,
    body: string
  ): Promise<any> {
    return modalService.createModal(MailDialogComponent, {
      alertTitle,
      alertText,
      title,
      body
    }, true);
  }

  /**
   * Increase the mail count for a specific type
   *
   * @param      {number}  raise   number to raise the mail count with
   * @param      {string}  type    sent / received
   */
  raiseMailLoadCount(raise: number, type: string) {
    if (type === 'sent') {
      this.sentMailLoadCount = this.sentMailLoadCount + raise;
    } else {
      this.receivedMailLoadCount = this.receivedMailLoadCount + raise;
    }
  }

  /**
   * Reset the current bunch of mails and starts at the beginning
   *
   * @return     {Promise<void>}  Resolved when done.
   */
  async resetMails() {
    this.receivedMailLoadCount = 0;
    this.sentMailLoadCount = 0;
    this.invalidReceivedMailCount = 0;
    this.invalidSentMailCount = 0;
    this.receivedMails = [ ];
    this.sentMails = [ ];

    return await this.getMails();
  }

  /**
   * Load the mails for the current account.
   * 
   * result:
   *   {
   *     receivedMails: [ this.getMail() ],
   *     sentMails: [ ... ]
   *   }
   *
   * @return     {any}  The mails.
   */
  async getMails() {
    const [receivedMails, sentMails] = await Promise.all([
      this.bcc.mailbox.getReceivedMails(10, this.receivedMailLoadCount),
      this.bcc.mailbox.getSentMails(10, this.sentMailLoadCount)
    ]);

    Object.keys(receivedMails.mails).map((key) => {
      const ret = {
        id: key
      };
      if (!receivedMails.mails[key] || !receivedMails.mails[key].content) {
        this.invalidReceivedMailCount++;
        return null;
      }
      Object.assign(ret, receivedMails.mails[key]);
      
      if (ret !== null && this.receivedMails.filter((mail: any) => mail.id === key).length === 0) {
        this.receivedMails.push(ret);
      }
    })

    Object.keys(sentMails.mails).map((key) => {
      const ret = {
        id: key
      };
      if (sentMails.mails[key] == null) {
        this.invalidSentMailCount++;
        return null;
      }
      Object.assign(ret, sentMails.mails[key]);
      if (ret !== null && this.sentMails.filter((mail: any) => mail.id === key).length === 0) {
        this.sentMails.push(ret);
      }
    })

    this.totalSentMailCount = sentMails.totalResultCount;
    this.totalReceivedMailCount = receivedMails.totalResultCount;

    return {
      receivedMails: this.receivedMails,
      sentMails: this.sentMails
    }
  }

  /**
   * Get a mail with a mail id.
   *
   * usage:
   *    {
   *     "id": "0x00000000000000000000000000000000000000fa",
   *     "content": {
   *       "from": "0xe70dfbc43369DE771d357fA4a6559be2eF16772f",
   *       "fromAlias": "Another user",
   *       "title": "contact request",
   *       "body": "hello,\n\ni want to add you as a contact.\n\nWith kind regards,\n\nAnother user",
   *       "attachments": [
   *         {
   *           "type": "commKey",
   *           "key": "9430..."
   *         }
   *       ],
   *       "sent": 1526626132635,
   *       "to": "0xCCC..."
   *     },
   *     "cryptoInfo": {
   *       "originator": "0xd926...",
   *       "keyLength": 256,
   *       "algorithm": "aes-256-cbc"
   *     }
   *
   * @param      {string}        mailId  The mail identifier
   * @return     {Promise<any>}  return the mail
   */
  async getMail(mailId: string): Promise<any> {
    if (this.mails[mailId]) {
      return this.mails[mailId];
    } else {
      const mail = await this.bcc.mailbox.getMail(mailId);
      this.mails[mailId] = mail;
      return mail;
    }
  }

  /**
   * Send an mail, using the queue.
   *
   * @param      {string}  mail    mail object
   * @param      {string}  from    account id from
   * @param      {string}  to      to account id
   */
  async sendMail(mail: any, from: string, to: string) {
    this.queueService.addQueueData(this.sendMailQueueId, {
      mail,
      from,
      to,
    });
  }

  /**
   * Send an mail answer, using the queue.
   *
   * @param      {string}  mail    mail object
   * @param      {string}  from    account id from
   * @param      {string}  to      to account id
   */
  async sendAnswer(mail: any, from: string, to: string) {
    this.queueService.addQueueData(this.answerMailQueueId, {
      mail,
      from,
      to,
    });
  }
}
