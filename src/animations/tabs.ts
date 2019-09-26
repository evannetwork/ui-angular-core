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
*/

import {
  trigger,
  animate,
  style,
  transition,
  AnimationEntryMetadata,
  group,
  query
} from 'angular-libs';

/**
 * Create an transition to create an tab sliding transition effect.
 * @Component({
 *   ...
 *   animations: [
 *     createTabSlideTransition(),
 *   ]
 * })
 * 
 * <div class="evan-tabs-container" [@tabSlideTransition]="activeTab">
 *   <div *ngIf="activeTab === 0"></div>
 *   <div *ngIf="activeTab === 1"></div>
 *   <div *ngIf="activeTab === 2"></div>
 * </div>
 *
 * @return     {AnimationEntryMetadata}  the animation definition
 */
const createTabSlideTransition: AnimationEntryMetadata = function() {
  return trigger('tabSlideTransition', [
    transition(':increment', group([
      query(':enter', [
        style({ transform: `translateX(100%)`, opacity: 0 }),
        animate('0.5s ease-out', style({ transform: `translateX(0)`, opacity: 1  }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: `translateX(0%)`, opacity: 1 }),
        animate('0.5s ease-out', style({ transform: `translateX(-100%)`, opacity: 0 }))
      ], { optional: true }),
    ])),
    transition(':decrement', group([
      query(':enter', [
        style({ transform: `translateX(-100%)`, opacity: 0  }),
        animate('0.5s ease-out', style({ transform: `translateX(0)`, opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: `translateX(0%)`, opacity: 1 }),
        animate('0.5s ease-out', style({ transform: `translateX(100%)`, opacity: 0 }))
      ], { optional: true }),
    ]))
  ])
}

export {
  createTabSlideTransition
}
