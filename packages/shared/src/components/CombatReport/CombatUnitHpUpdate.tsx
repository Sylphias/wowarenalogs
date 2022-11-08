import {
  AtomicArenaCombat,
  CombatHpUpdateAction,
  CombatUnitClass,
  getClassColor,
  ICombatUnit,
} from '@wowarenalogs/parser';

import { Utils } from '../../utils/utils';

interface IProps {
  action: CombatHpUpdateAction;
  unit: ICombatUnit;
  combat: AtomicArenaCombat;
  groupTotal: number;
  timelineMax: number;
}

export const CombatUnitHpUpdate = (props: IProps) => {
  const colorSourceUnitId =
    props.action.destUnitId === props.unit.id ? props.action.srcUnitId : props.action.destUnitId;
  const colorSourceUnit = props.combat.units[colorSourceUnitId];
  const colorSourceUnitClass = colorSourceUnit ? colorSourceUnit.class : CombatUnitClass.None;

  const widthPercentage = (Math.abs(props.action.amount) / props.groupTotal) * 100;
  const widthPercentageAbsolute = (Math.abs(props.action.amount) / props.timelineMax) * 100;

  return (
    <div
      className="tooltip flex flex-row"
      data-tip={`${props.action.spellName || 'Auto Attack'}: ${Math.abs(props.action.amount).toFixed()}`}
      style={{
        minWidth: '4px',
        width: widthPercentage.toFixed(2) + '%',
      }}
    >
      <div
        className="border border-solid border-black flex-1 flex flex-row items-center relative"
        style={{
          backgroundColor: getClassColor(colorSourceUnitClass),
        }}
      >
        {widthPercentageAbsolute >= 10 && props.action.spellId ? (
          <div
            className="rounded w-4 h-4 bg-cover ml-1"
            style={{
              backgroundImage: `url(${Utils.getSpellIcon(
                props.action.spellId,
              )}), url(https://images.wowarenalogs.com/spells/0.jpg)`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};
