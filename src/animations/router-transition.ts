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
  trigger,
  animate,
  style,
  group,
  animateChild,
  query,
  stagger,
  transition,
  AnimationEntryMetadata
} from 'angular-libs';

/**
 * Defines an AnimationDefinition that specifies the transition that should be
 * build.
 *
 * @class      AnimationDefinition (name)
 */
class AnimationDefinition {
  // forward, backward
  type: string;

  // from state
  from: string;

  // =>, <=, <=>
  direction: string;

  // to state
  to: string;

  constructor(from, direction, to, type) {
    this.type = type;
    this.from = from;
    this.to = to;
    this.direction = direction;
  }
}

/**
 * Generates an slide animation for angular animate.
 *
 * @param      {number}  translateEnter      From translateDirection on enter
 * @param      {number}  translateEnterTo    To translateDirection on enter
 * @param      {number}  translateLeave      From translateDirection on leave
 * @param      {number}  translateLeaveTo    To translateDirection on leave
 * @param      {string}  translateDirection  translateX / translateY
 * @return     {Array<any>}  The side slide animation.
 */
function getSideSlideAnimation(
  translateEnter: number, translateEnterTo: number,
  translateLeave: number, translateLeaveTo: number,
  translateDirection: string
): Array<any> {
  return [
    // 1. Make it movable
    query(
      ':enter, :leave',
      style({ position: 'absolute', width: '100%' }),
      { optional: true }
    ),

    // 2. Move it
    group([
      query(
        ':enter',
        [
          style({
            transform: `${translateDirection}(${translateEnter}%)`
          }),
          animate('0.5s ease-in-out', style({
            transform: `${translateDirection}(${translateEnterTo}%)`
          }))
        ],
        { optional: true }
      ),

      query(
        ':leave',
        [
          style({
            transform: `${translateDirection}(${translateLeave}%)`
          }),
          animate('0.5s ease-in-out', style({
            transform: `${translateDirection}(${translateLeaveTo}%)`
          }))
        ],
        { optional: true }
      ),
    ])
  ]
}

const animations = {
    /**
     * Generate up animation (from bottom to top)
     *
     * @param      {string}  from       The from state (/parent)
     * @param      {string}  to         The to state (/parent/child)
     * @param      {string}  direction  <= | =>
     * @return     {AnimationEntryMetadata}  Transition including it's slideanimation
     */
  up: function (from: string, to: string, direction: string): AnimationEntryMetadata {
    return transition(`${from} ${direction} ${to}`, getSideSlideAnimation(
      100, 0,
      0, -100,
      'translateY'
    ));
  },

  /**
   * Generate down animation (from top to bottom)
   *
   * @param      {string}  from       The from state (/parent)
   * @param      {string}  to         The to state (/parent/child)
   * @param      {string}  direction  <= | => 
   * @return     {AnimationEntryMetadata}  Transition including it's slideanimation
   */
  down: function (from: string, to: string, direction: string): AnimationEntryMetadata {
    return transition(`${from} ${direction} ${to}`, getSideSlideAnimation(
      100, 0,
      0, -100,
      'translateY'
    ));
  },

  /**
   * Generate forward animation (from left to right)
   *
   * @param      {string}  from       The from state (/parent)
   * @param      {string}  to         The to state (/parent/child)
   * @param      {string}  direction  <= | =>
   * @return     {AnimationEntryMetadata}  Transition including it's slideanimation
   */
  right: function (from: string, to: string, direction: string): AnimationEntryMetadata {
    return transition(`${from} ${direction} ${to}`, getSideSlideAnimation(
      100, 0,
      0, -100,
      'translateX'
    ));
  },

  /**
   * Generate backward animation (from right to left)
   *
   * @param      {string}  from       The from state (/parent/child)
   * @param      {string}  to         The to state (/parent)
   * @param      {string}  direction  <= | =>
   * @return     {AnimationEntryMetadata}  Transition including it's slideanimation
   */
  left: function (from: string, to: string, direction: string): AnimationEntryMetadata {
    return transition(`${from} ${direction} ${to}`, getSideSlideAnimation(
      -100, 0,
      0, 100,
      'translateX'
    ));
  },

  /**
   * Disable animation
   *
   * @param      {string}  from       The from state (/parent/child)
   * @param      {string}  to         The to state (/parent)
   * @param      {string}  direction  <= | =>
   * @return     {AnimationEntryMetadata}  Transition including it's slideanimation
   */
  none: function(from: string, to: string, direction: string): AnimationEntryMetadata {
    return transition(`${from} ${direction} ${to}`, getSideSlideAnimation(
      0, 0,
      0, 0,
      'translateX'
    ));
  }
};

/**
 * Create a transition for several an router-outlet to get swiping animations between routing changes.
 *
 * - Create Transition to swipe everything to the right
 * @Component({
 *   ...
 *   animations: [
 *     createRouterTransition([
 *       new AnimationDefinition('component1', '=>', 'component2', 'right'),
 *       new AnimationDefinition('component2', '=>', 'component1', 'left'),
 *     ])
 *   ]
 * })
 * 
 * <div evan-content [@routerTransition]="o?.activatedRouteData?.state">
 *   <router-outlet #o="outlet"></router-outlet>
 * </div>
 *
 * @param      {Array<AnimationDefinition>}  animationDefinitions  The animation definitions
 * @return     {AnimationEntryMetadata}      the animation
 */
const createRouterTransition: AnimationEntryMetadata = function (animationDefinitions: Array<AnimationDefinition>) {
  return trigger('routerTransition',
    animationDefinitions
      .map(definition => animations[definition.type](
        definition.from,
        definition.to,
        definition.direction
      ))
  )
}

export {
  AnimationDefinition,
  createRouterTransition,
  animations,
  getSideSlideAnimation,
}
