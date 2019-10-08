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
  AnimationEntryMetadata
} from 'angular-libs';

/**
 * Create an transition to create an opacity transition effect. ==> Smooth
 * disappearing
 * @Component({
 *   ...
 *   animations: [
 *     createOpacityTransition(),
 *   ]
 * })
 * 
 * <div *ngIf="**" [@opacityTransition]></div>
 *
 * @return     {AnimationEntryMetadata}  the opacity transition
 */
const createOpacityTransition: AnimationEntryMetadata = function() {
  return trigger('opacityTransition', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('500ms', style({ opacity: 1 }))
    ]),
    transition(':leave', [
      style({ opacity: 1 }),
      animate('500ms', style({ opacity: 0 }))
    ])
  ])
}

export {
  createOpacityTransition
}
