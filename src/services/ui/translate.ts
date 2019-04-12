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
  Injectable, // '@angular/core';
  TranslateService, // @ngx-translate/core
  OnDestroy
} from 'angular-libs';

import { SingletonService } from '../singleton-service';
import { EvanUtilService } from '../utils';

/**************************************************************************************************/

/**
 * I18N utility functions. Make it possible to share i18n through all
 * applications
 *
 * @class      Injectable EvanTranslationService
 */
@Injectable()
export class EvanTranslationService implements OnDestroy {
  /**
   * function that is called, when i18n was added globally
   */
  private translateWatcher: any;

  /**
   * translated month short names for simple ion-date usage
   */
  public monthShortNames: Array<string>;

  /**
   * load dependencies and register translation updater watcher
   */
  constructor(
    public translate: TranslateService,
    private singleton: SingletonService,
    private utils: EvanUtilService
  ) {
    this.translateWatcher = this.watchTranslationUpdate();

    setTimeout(() => {
      this.monthShortNames = this.instant('_angularcore.month-short-names').split(',');
    });
  }

  /**
   * remove translation watchers on service destroy
   *
   * @return     {<type>}  { description_of_the_return_value }
   */
  ngOnDestroy() {
    this.translateWatcher();
  }

  /**
   * Set to the translation service the default language to en and the language
   * to use.
   * 
   * Usage:
   *   this.translateService.setLanguage('en')
   *
   * @param      {string}  language  Language to use (en, fr, it, ...)
   */
  setLanguage(language?: string) {
    this.translate.setDefaultLang('en');
    this.translate.use(
      language ||
      window.localStorage['evan-language'] ||
      navigator.language.split('-')[0]
    );
  }

  /**
   * Reload all translations for the current language.
   */
  reloadTranslations() {
    this.translate.reloadLang(this.translate.currentLang);
  }

  /**
   * Set translations for multiple languages
   * 
   *   Usage:
   *     this.translateService.setMultipleLanguageTranslations({
   *       en : { 'hello' : 'Hello' },
   *       de : { 'hello' : 'Hallo' }
   *     });
   *
   * @param      {any}  translations  Translations objects wrapped by
   *                                     language keys { en : { 'hello' :
   *                                     'Hello' }, de : { 'hello' : 'Hallo' } }
   */
  setMultipleLanguageTranslations(translations: any) {
    const languages = Object.keys(translations);

    languages.forEach(lang => this.setTranslation(lang, translations[lang]));
  }

  /**
   * Adds translations to the shared translate service
   * 
   * Usage:
   *   this.translateservice.setTranslation('en', {
   *     'key1': 'translated 1',
   *     'key2': 'translated 2'
   *   })
   *
   * @param      {string}   language      Language to set translations for
   * @param      {any}      translations  Translations to add.
   * @param      {boolean}  disableEvent  dont trigger translation update event
   */
  setTranslation(language: string, translations: any, disableEvent?: boolean) {
    this.translate.setTranslation(language, translations, true);

    if (!disableEvent) {
      this.utils.sendEvent('angular-set-translations', {
        language: language,
        translations: translations
      });
    }
  }

  /**
   * Adds translations to the current language service
   * 
   * Usage:
   *   this.translateservice.setTranslationToCurrentLanguage({
   *     'key1': 'translated 1',
   *     'key2': 'translated 2'
   *   })
   *
   * @param      {any}  translations  Translations to add.
   */
  setTranslationToCurrentLanguage(translations: any) {
    this.setTranslation(this.translate.currentLang, translations);
  }

  /**
   * Returns an translated key instant.
   * 
   *   Usage:
   *     this.translateservice.instant('key1', { param1: '...' })
   *
   * @param      {string|any}  key      Key to translate or an object that
   *                                    contains key and translateOptions params
   * @param      {any}         options  translation options
   */
  instant(key: string|any, options?: any): string {
    if (typeof key === 'object') {
      options = key.translateOptions;
      key = key.key;
    }

    options = options || { };

    options.currentLang = this.translate.currentLang;

    if (key) {
      return this.translate.instant(key, options);
    } else {
      return '';
    }
  }

  /**
   * Use I18N object from DApp and add an translated property to the DApp, where
   * translations for the current language are saved.
   * 
   * Usage: have a look into the description service, getDescription function
   *
   * @param      {any}  dapp    DApp definition from ENS.
   * @return     {any}  The translated dapp description.
   */
  getTranslatedDescription(dapp: any): any {
    dapp.translated = dapp.translated || { };

    if (dapp.i18n) {
      const translationKeys = Object.keys(dapp.i18n);

      translationKeys.forEach(key =>
        dapp.translated[key] = dapp.i18n[key][this.translate.currentLang] || dapp.i18n[key]['en'] || dapp[key]
      );
    } else {
      dapp.translated = {
        name: dapp.name,
        description: dapp.description
      };
    }

    return dapp;
  }

  /**
   * Adds a single translation to the current language.
   * 
   * Usage:
   *   this.translateservice.addSingleTranslation('key1', 'translated 1')
   *
   * @param      {string}  key          key to add
   * @param      {string}  translation  value for the key
   */
  addSingleTranslation(key: string, translation: string) {
    // set translation for account id in dashboard header
    const i18n = { };

    i18n[key] = translation;

    this.setTranslationToCurrentLanguage(i18n);
  }

  /**
   * Returns the current language.
   * 
   * Usage:
   *   this.translateservice.getCurrentLang()
   *
   * @return     {string}  The current language key
   */
  getCurrentLang(): string {
    return this.translate.currentLang;
  }

  /**
   * Adds a translation update watcher.
   * 
   * Usage:
   *   const clearFunc = this.translateservice.watchTranslationUpdate(() => {
   *     console.log('translations added!')
   *   }))
   *
   * @param      {Function}  callback  function that is called, when translations were added
   * @return     {Function}  call to unsubscribe
   */
  watchTranslationUpdate(callback?: Function): Function {
    let bounce;

    return this.utils.onEvent('angular-set-translations', (event) => {
      this.setTranslation(event.detail.language, event.detail.translations, true);

      if (callback) {
        if (bounce) {
          clearTimeout(bounce);
        }

        bounce = setTimeout(() => {
          bounce = null;

          callback();
        }, 500);
      }
    });
  }
}
