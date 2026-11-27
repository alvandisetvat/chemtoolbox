/* ابزارهای مشترک: قاشقک، قطره‌چکان، شیشهٔ شست‌وشو (آب مقطر) */
import {THREE,v3,world} from './kernel.js';
import {makeSpoon,makeDropper,makeWash} from './glassware.js';
import {stream,dropMesh} from './fx.js';

export let spoon,dropper,wash;
export const tools={};
export const SPOON_REST=v3(1.7,.075,2.9);export const SPOON_REST_ROT={x:0,y:.45,z:0};
export const DROP_REST=v3(-1.9,.16,2.8);export const DROP_REST_ROT={x:0,y:.3,z:-Math.PI/2};
export const WASH_REST=v3(4.9,0,-1.5);
export function placeTools(){
  spoon.position.copy(SPOON_REST);spoon.rotation.set(SPOON_REST_ROT.x,SPOON_REST_ROT.y,SPOON_REST_ROT.z);
  spoon.holder.visible=false;spoon.holder.scale.setScalar(1);
  dropper.group.position.copy(DROP_REST);dropper.group.rotation.set(DROP_REST_ROT.x,DROP_REST_ROT.y,DROP_REST_ROT.z);
  dropper.setFill(0);dropper.setBulb(1);
  wash.position.copy(WASH_REST);wash.rotation.y=-Math.PI/2;wash.body.scale.set(1,1,1);
  stream.visible=false;dropMesh.visible=false;
}

export function initTools(){
  spoon=makeSpoon();dropper=makeDropper();wash=makeWash();
  tools.spoon=spoon;tools.dropper=dropper;tools.wash=wash;
  world.scene.add(spoon,dropper.group,wash);
}
