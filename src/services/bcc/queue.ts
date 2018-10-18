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

import { System, dapp, queue } from 'dapp-browser';

import {
  OnInit, Injectable, Component, // '@angular/core';
  Injector, NgModule,
  BrowserAnimationsModule, IonicApp, RouterModule,
  Compiler, NgZone, OnDestroy
} from 'angular-libs';

import { SingletonService } from '../singleton-service';
import { EvanAlertService } from '../ui/alert';
import { EvanCoreService } from './core';
import { EvanRoutingService } from '../ui/routing';
import { EvanToastService } from '../ui/toast';
import { EvanTranslationService } from '../ui/translate';
import { EvanUtilService } from './../utils';

import { AngularCore } from '../../modules/angular-core';
import {
  QueueDispatcher,
  QueueId,
  QueueSequence
} from './queue-utilities';

/**************************************************************************************************/

const unAllowedSaveParams = [ 'loading', 'dispatcher', 'working' ];

/**
 * The evan queue synchronisation implementation. You can add entries using
 * QueueIDs and data properties. The configured dispatchers and its Angular
 * modules are loaded during runtime, so each dispatcher can handle angular
 * services, also, when the DApp is not openend.
 *
 * @class      Injectable EvanQueue
 */
@Injectable()
export class EvanQueue implements OnDestroy {
  /**
   * angular module cache
   */
  static moduleCache = { };

  /**
   * on queue finish function references
   */
  static onFinishFuncs = { };

  /**
   * dapp-wrapper queue reference object to handle alsome global queue
   */
  public queue: any;

  /**
   * is the queue loading?
   */
  public loading: boolean;

  /**
   * has the queue some exceptions?
   */
  public exception: boolean;

  /**
   * are all queue entries syncing?
   */
  public allSyncing: boolean;

  /**
   * interval that checks for new queue updates
   */
  private updateCheck: Function;

  /**
   * check if the queue instance should be destroyed, after a sync was finished
   * => when queue is running and the DApp is changed, the queue is still
   * running. Destroy it not instantly. Wait for queue finish and destroy the
   * service
   */
  private destroyAfterSync: boolean;

  /**
   * load dependency services, pull down global queue object, set initial queue status
   */
  constructor(
    private core: EvanCoreService,
    private translate: EvanTranslationService,
    private routing: EvanRoutingService,
    private alertService: EvanAlertService,
    private toastService: EvanToastService,
    private singleton: SingletonService,
    private utils: EvanUtilService,
    private injector: Injector,
    private compiler: Compiler,
    private zone: NgZone
  ) {
    this.queue = queue;

    this.setQueueStatus(true);
    this.updateCheck = this.utils.onEvent('evan-queue-update', () => {
      this.setQueueStatus(true);
    });
  }

  /**
   * clear update checks
   */
  public ngOnDestroy() {
    this.updateCheck();
  }

  /**
   * Returns the count of entries within the queue
   *
   * @return     {number}  dappBrowser.queue.entries.length
   */
  public queueCount(): number {
    return this.queue.entries.length;
  }

  /**
   * Check if the queue entries should enqueued instant or only over the queue
   * component
   *
   * @return     {boolean}  True if instant save, False otherwise.
   */
  public isInstantSave(): boolean {
    return true; // !window.localStorage['evan-queue-delayed'];
  }

  /**
   * Load an module from ens.
   *
   * @param      {string}  ensAddress  Ens address to load the module from
   * @return     {any}  module instance
   */
  loadModule(ensAddress: string): Promise<any> {
    if (EvanQueue.moduleCache[ensAddress]) {
      return Promise.resolve(EvanQueue.moduleCache[ensAddress]);
    } else {
      return dapp
        .loadDApp(ensAddress)
        .then(loadedModule => {
          EvanQueue.moduleCache[ensAddress] = loadedModule.module;

          return loadedModule.module;
        });
    }
  }

  /**
   * Load dispatchers for the current queue
   * 
   * usage:
   *  this.loadDispatcherForQueue({
   *    queueId: {},
   *    data: [],
   *    status: 0
   *  })
   *
   * @param      {QueueEntry}  queueEntry  queue entry to load the dispatcher
   *                                       for
   * @return     {void}        applies the dispatcher instance to the queue
   *                           entry
   */
  public async loadDispatcherForQueue(queueEntry?: any): Promise<void> {
    const entries = (queueEntry ? [ queueEntry ] : this.queue.entries);

    // load all needed modules
    let modules = this.utils.uniqueArray(
      entries
        .filter(entry => !entry.dispatcher)
        .map(entry => {
          entry.loading = true;

          return entry.queueId.ensAddress;
        })
    );

    // load all modules, to extract needed dispatchers and set them to the queue entries
    for (let ensAddress of modules) {
      await this
        .loadModule(ensAddress)
        .then(module => {
          entries.forEach(entry => {
            // check for correct ens address
            if (entry.queueId.ensAddress === ensAddress) {
              entry.dispatcher = module[entry.queueId.dispatcher];

              delete entry.loading;
            }
          });
        })
    }

    // load dispatcher i18n
    entries.forEach(entry =>
      this.translate.setMultipleLanguageTranslations(entry.dispatcher.i18n)
    );
  }

  /**
   * Save the current queue to the queue db storage.
   */
  public saveQueue() {
    const entriesToSave = [ ];

    for (let i = 0; i < this.queue.entries.length; i++) {
      // copy the queue for saving and to keep current object instances
      // Important: dont use Object.parse(Object.stringify(this.queue.entries[i])) if could cause
      //            circular reference errors
      const entryToSave: any = { };
      const originProperties = Object.keys(this.queue.entries[i]);
      for (let param of originProperties) {
        // remove runtime object params
        if (unAllowedSaveParams.indexOf(param) === -1) {
          entryToSave[param] = this.queue.entries[i][param];
        }
      }

      if (entryToSave.data.length === 0) {
        this.queue.entries.splice(i, 1);
        entryToSave.splice(i, 1);

        i = i - 1;
      } else {
        entriesToSave.push(entryToSave);
      }
    }

    this.queue.storeQueue(entriesToSave);

    this.setQueueStatus();
  }

  /**
   * Get an specifc queue entry for the given queue id.
   * 
   * returns:
   *  {
   *    queueId: {},
   *    data: [],
   *    status: 0
   *  }
   *
   * @param      {QueueId}  id         QueueId to get
   * @param      {boolean}  fillEmpty  creates an empty queue entry
   * @return     {any}   The queue entry.
   */
  public getQueueEntry(id: QueueId, fillEmpty = false): any {
    for (let i = 0; i < this.queue.entries.length; i++) {
      if ((id.ensAddress === '*' || this.queue.entries[i].queueId.ensAddress === id.ensAddress) &&
          (id.dispatcher === '*' || this.queue.entries[i].queueId.dispatcher === id.dispatcher) &&
          (id.id === '*' || this.queue.entries[i].queueId.id === id.id)) {
        return this.queue.entries[i];
      }
    }

    if (fillEmpty) {
      return {
        queueId: {},
        data: [],
        status: 0
      }
    }
  }

  /**
   * Add new Queue entry to the queue
   * 
   * usage:
   *   this.queue.addQueueData(queueId, {
   *     data...
   *   });
   *
   * @param      {QueueId}        id            Queue id where the data should
   *                                            be added.
   * @param      {any}            data          Data that should be added.
   * @param      {Array<string>}  idProperties  identity properties that should
   *                                            match, to remove / add queue
   *                                            updates
   */
  public addQueueData(id: QueueId, data: any, idProperties?: Array<string>) {
    const queueEntry = this.getQueueEntry(id);

    if (queueEntry) {
      if (idProperties) {
        for (let i = 0; i < queueEntry.data.length; i++) {
          let found = true;

          for (let x = 0; x < idProperties.length; x++) {
            if (queueEntry.data[i][idProperties[x]] !== data[idProperties[x]]) {
              found = false;

              break;
            }
          }

          if (found) {
            delete queueEntry.ex;

            if (data.type) {
              if (data.type === 'add' && queueEntry.data[i].type === 'remove' ||
                 data.type === 'remove' && queueEntry.data[i].type === 'add') {
                this.removeQueueData(id, queueEntry.data[i]);
              }
            } else {
              queueEntry.data[i] = data;
            }

            return;
          }
        }
      }

      delete queueEntry.ex;

      queueEntry.data.push(data);
    } else {
      this.queue.entries.push({
        queueId: id,
        data: [ data ],
        status: 0
      });
    }

    this.saveQueue();
  }

  /**
   * Remove data entry from queue id
   *
   * @param      {QueueId}  id      Queue id where the data should be added.
   * @param      {any}      data    Data that should be removed.
   */
  public removeQueueData(id: QueueId, data: any) {
    const queueEntry = this.getQueueEntry(id);

    if (queueEntry) {
      queueEntry.data.splice(queueEntry.data.indexOf(data));

      this.saveQueue();
    }
  }

  /**
   * Remove queue entry with queue id
   *
   * @param      {QueueId}  id      Queue id where the data should be added.
   */
  public removeQueueEntry(id: QueueId) {
    const queueEntry = this.getQueueEntry(id);

    this.queue.entries.splice(this.queue.entries.indexOf(queueEntry), 1);

    this.saveQueue();
  }

  /**
   * Gets the dispatcher service.
   *
   * @param      {any}           queueEntry  queue entry to load the dispatcher
   *                                         service fore
   * @return     {Promise<any>}  service instance
   */
  public async getDispatcherService(queueEntry: any): Promise<any> {
    const ensAddress = queueEntry.queueId.ensAddress;
    const dispatcherName = queueEntry.queueId.dispatcher;
    const serviceName = queueEntry.dispatcher.serviceName || dispatcherName + 'Service';

    // get queue modules from moduleCache
    const ensQueueModule = EvanQueue.moduleCache[ensAddress];
    const DispatcherModule = ensQueueModule.DispatcherModule;
    const dispatcherService = ensQueueModule[serviceName];

    // get runtime module for getting service instance
    @NgModule({
      imports: [
        AngularCore,
        DispatcherModule
      ]
    })
    class RuntimeComponentModule {  }

    return this.compiler
      .compileModuleAsync(RuntimeComponentModule)
      .then(moduleWithFactories => {
        const initialized = moduleWithFactories.create(this.injector);
        const service = initialized.injector.get(dispatcherService);

        return service;
      });
  }

  /**
   * Starts syncing an queue entry. It's running the dispatchers run function.
   *
   * @param queueEntry   The queue entry to start the synchronisation for.
   */
  async startSync(queueEntry: any) {
    delete queueEntry.ex;
    queueEntry.working = true;

    try {
      this.setQueueStatus();

      // load missing dispatcher
      await this.loadDispatcherForQueue(queueEntry);

      const dispatcherService = await this.getDispatcherService(queueEntry);

      // the service was retrieved, after the dispatcher was loaded so resubmit i18n to all current
      // translation services
      this.translate.setMultipleLanguageTranslations(queueEntry.dispatcher.i18n)

      // run the dispatcher
      const dispatcherResult = await queueEntry.dispatcher.sequence[queueEntry.status].run(
        // look in to module
        dispatcherService,
        queueEntry
      );

      queueEntry.status++;
      queueEntry.results = queueEntry.results || [ ];
      try {
        // try to parse result, if it's recursive it will crash the localStorage saving
        if (typeof dispatcherResult === 'object' && dispatcherResult !== null) {
          JSON.stringify(dispatcherResult);
        }
        
        // save it as a result
        queueEntry.results.push(dispatcherResult);
      } catch (ex) {
        queueEntry.results.push(new Error('Could not parse dispatche result!'));
      }

      // stop the recursive working when all sequences were runned
      if (queueEntry.status >= queueEntry.dispatcher.sequence.length) {        
        // notify user that the synchronisation is finished
        this.toastService.showToast({
          message: '_angularcorequeue.sync-finished',
          duration: 3000
        });

        // if we are on a page of an ens address, give the ability to reload it
        if (window.location.hash.indexOf(queueEntry.queueId.ensAddress) !== -1) {
          if (queueEntry.queueId.forceReload) {
            this.routing.reloadCurrentContent();
          }
        }

        // generate the queue id to get the queueId string
        const queueId = new QueueId(
          queueEntry.queueId.ensAddress,
          queueEntry.queueId.dispatcher,
          queueEntry.queueId.id,
        );

        // get the queue id string to check, if listeners are available
        const queueIdString = queueId.getString();
        const splitQueueIdString = queueIdString.split('-');

        // iterate through all finish funcs and check if the queueId (ens-dispatcher-id) or the
        // queueGeneralString is available (ens-dispatcher-*)
        const onFinishKeys = Object.keys(EvanQueue.onFinishFuncs);
        for (let i = 0; i < onFinishKeys.length; i++) {
          const splitFinishKeys = onFinishKeys[i].split('-');

          // check all generalized queue id's
          if ((splitFinishKeys[0] === '*' || splitFinishKeys[0] === splitQueueIdString[0]) &&
              (splitFinishKeys[1] === '*' || splitFinishKeys[1] === splitQueueIdString[1]) &&
              (splitFinishKeys[2] === '*' || splitFinishKeys[2] === splitQueueIdString[2])) {
            const finishFuncIds = Object.keys(EvanQueue.onFinishFuncs[onFinishKeys[i]]);

            // call all watching functions
            for (let x = 0; x < finishFuncIds.length; x++) {
              EvanQueue.onFinishFuncs[onFinishKeys[i]][finishFuncIds[x]](
                queueEntry.results
              );
            }
          }
        }

        queueEntry.working = false;

        // use timeout to wait to finish animation
        this.removeQueueEntry(queueEntry.queueId);

        this.saveQueue();

        if (!this.isLoading() && this.destroyAfterSync) {
          this.ngOnDestroy();
        }
      } else {
        queueEntry.working = false;

        // start the next sequence
        this.saveQueue();

        this.startSync(queueEntry);
      }
    } catch (ex) {
      // show the error message to the user
      queueEntry.ex = {
        timestamp: Date.now(),
        message: ex.message + ` (${ ex.stack })`,
        level: 'error',
        queue: true
      };
      queueEntry.working = false;

      this.core.utils.log(ex, 'error');

      this.setQueueStatus();

      // show toast to notify the user that an error occured to step directly into the queue,
      // when he is using another frontend page
      this.toastService
        .showToast({
          message: '_angularcorequeue.error-occured',
          duration: 3000,
        })

      this.saveQueue();
    }
  }

  /**
   * Start synchronisation of the whole queue.
   *
   * @param      {boolean}  disableErrors  dont run dispatchers with exceptions
   */
  public startSyncAll(disableErrors?: boolean) {
    for (let i = 0; i < this.queue.entries.length; i++) {
      if (!this.queue.entries[i].working && (!disableErrors || (disableErrors && !this.queue.entries[i].ex))) {
        this.startSync(this.queue.entries[i]);
      }
    }
  }

  /**
   * Check if sync all can be triggered (when not all queue entries are running)
   *
   * @return     {boolean}  true if all can be started (when no queueEntry is working)
   */
  public enableSyncAll(): boolean {
    let allSyncing = true;

    for (let i = 0; i < this.queue.entries.length; i++) {
      if (!this.queue.entries[i].working) {
        allSyncing = false;
      }
    }

    return !allSyncing;
  }

  /**
   * Returns the current working percentage.
   *
   * @param      {any}     queueEntry  get process percentage of the queueEntry
   * @return     {number}  The percentage of the queue dispatcher (if 2 of 5 sequences was solved,
   *                       it returns 20)
   */
  public calculatePercentage(queueEntry: any): number {
    if (queueEntry.dispatcher) {
      const sequenceLength = queueEntry.dispatcher.sequence.length * 2;
      const percentPart = 100 / sequenceLength;

      return percentPart * (queueEntry.status + (queueEntry.working ? 1 : 0));
    } else {
      return 0;
    }
  }

  /**
   * Check all queue stati (loading, exception, allSyncing) and send, that the queue stati have
   * changed
   *
   * @param      {boolean}  disableEvent  dont trigger evan-queue-update
   */
  public setQueueStatus(disableEvent?: boolean) {
    this.loading = this.isLoading();
    this.exception = this.isException();
    this.allSyncing = this.enableSyncAll();

    if (!disableEvent) {
      this.utils.sendEvent('evan-queue-update');
    }
  }

  /**
   * Check if one queue entry is loading.
   *
   * @return     {boolean}  True if loading, False otherwise.
   */
  public isLoading(): boolean {
    for (let i = 0; i < this.queue.entries.length; i++) {
      if (this.queue.entries[i].working || this.queue.entries[i].loading) {
        return true;
      }
    }
  }

  /**
   * Check if an exception is represented within the queue.
   *
   * @return     {boolean}  True if exception, False otherwise.
   */
  public isException(): boolean {
    for (let i = 0; i < this.queue.entries.length; i++) {
      if (this.queue.entries[i].ex) {
        return true;
      }
    }
  }

  /**
   * Adds an "event handle" to refresh data on queue entry finish.
   *
   * @param      {QueueId}   queueId  Queue ID to check for updates
   * @param      {Function}  run      Function to call on first binding and when queue entry with
   *                                  the queue id has finished
   */
  public async onQueueFinish(queueId: QueueId, run: Function) {
    const id = this.utils.generateID();
    const queueIdString = queueId.getString();

    EvanQueue.onFinishFuncs[queueIdString] = EvanQueue.onFinishFuncs[queueIdString] || { };
    EvanQueue.onFinishFuncs[queueIdString][id] = (result) => {
      this.zone.run(() => {
        run(true, result);
      });
    };

    await run();

    return () => {
      if (EvanQueue.onFinishFuncs[queueIdString] && EvanQueue.onFinishFuncs[queueIdString][id]) {
        delete EvanQueue.onFinishFuncs[queueIdString][id];
      }
    };
  }
}
