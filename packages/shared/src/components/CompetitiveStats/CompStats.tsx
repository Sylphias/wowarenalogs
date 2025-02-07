import { CombatUnitSpec } from '@wowarenalogs/parser';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { TbArrowDown } from 'react-icons/tb';
import { useQuery } from 'react-query';

import { ErrorPage } from '../common/ErrorPage';
import { SpecImage } from '../common/SpecImage';
import { LoadingScreen } from '../LoadingScreen';
import { STATS_SCHEMA_VERSION } from './common';

type StatsData = {
  [bracket: string]: {
    [specs: string]: {
      win?: number;
      lose?: number;
    };
  };
};

const SUPPORTED_SORT_KEYS = new Set(['total', 'winRate']);

export default function CompStats(props: { activeBracket: string; sortKey: string }) {
  const router = useRouter();
  const specStatsQuery = useQuery(
    ['competitive-stats', 'comp-stats'],
    async () => {
      const result = await fetch(`https://images.wowarenalogs.com/data/comp-stats.v${STATS_SCHEMA_VERSION}.json`);
      return (await result.json()) as StatsData;
    },
    {
      // locally cache for one hour to avoid people spamming refresh.
      // don't cache for too long to allow people to see latest data not too long after a refresh.
      // the file is behind a CDN which has a 4-hour cache anyways.
      cacheTime: 1000 * 60 * 1 * 24,
      // rely on cache. only refetch when cache expired.
      staleTime: Infinity,
      enabled: true,
    },
  );

  const sortKey = SUPPORTED_SORT_KEYS.has(props.sortKey) ? props.sortKey : 'total';
  const setSortKey = useCallback(
    (key: string) => {
      router.push(`/stats?tab=comp-stats&bracket=${props.activeBracket}&sortKey=${key}`, undefined, {
        shallow: true,
      });
    },
    [props.activeBracket, router],
  );

  if (specStatsQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (specStatsQuery.isError) {
    return <ErrorPage message={JSON.stringify(specStatsQuery.error)} />;
  }

  const specStats = specStatsQuery.data;
  if (!specStats) {
    return <ErrorPage message="Failed to retrieve stats data." />;
  }

  const bracketStats = specStats[props.activeBracket];
  const bracketStatsSorted = _.orderBy(
    Object.keys(bracketStats)
      .filter((rawSpec) => rawSpec !== '0' && rawSpec !== '(not set)')
      .map((rawSpec) => {
        const spec = rawSpec as CombatUnitSpec;
        const stats = bracketStats[spec];
        return {
          spec,
          win: stats.win ?? 0,
          lose: stats.lose ?? 0,
          total: (stats.win ?? 0) + (stats.lose ?? 0),
          winRate: (stats.win ?? 0) / ((stats.win ?? 0) + (stats.lose ?? 0)),
        };
      }),
    sortKey,
    'desc',
  );
  const maxSpecTotal = _.maxBy(bracketStatsSorted, (stats) => stats.total)?.total ?? 0;

  return (
    <div className="mt-2 flex-1 flex flex-row items-start relative overflow-x-auto overflow-y-scroll">
      <div className="flex flex-col">
        <table className="table table-compact relative rounded-box">
          <thead>
            <tr>
              <th className="bg-base-300">Spec</th>
              <th className="bg-base-300" colSpan={2}>
                <div className="flex flex-row items-center gap-1">
                  Matches
                  <button
                    className={`btn btn-xs btn-ghost ${sortKey === 'total' ? 'text-primary' : ''}`}
                    onClick={() => {
                      setSortKey('total');
                    }}
                  >
                    <TbArrowDown />
                  </button>
                </div>
              </th>
              <th className="bg-base-300">
                <div className="flex flex-row items-center gap-1">
                  Win Rate
                  <button
                    className={`btn btn-xs btn-ghost ${sortKey === 'winRate' ? 'text-primary' : ''}`}
                    onClick={() => {
                      setSortKey('winRate');
                    }}
                  >
                    <TbArrowDown />
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {bracketStatsSorted
              .filter((stats) => stats.total >= 10)
              .map((stats) => (
                <tr key={stats.spec}>
                  <th className="bg-base-200">
                    <div className="flex flex-row gap-2">
                      {stats.spec.split('_').map((spec, i) => (
                        <SpecImage key={`${spec}_${i}`} specId={spec} />
                      ))}
                    </div>
                  </th>
                  <td className="bg-base-200">{stats.total}</td>
                  <td className="bg-base-200">
                    <progress
                      className="progress progress-info sm:w-32 md:w-64 lg:w-96"
                      value={Math.floor((stats.total * 100) / maxSpecTotal)}
                      max={100}
                    />
                  </td>
                  <td className="bg-base-200 text-right">{((stats.win * 100) / stats.total).toFixed(1)}%</td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="opacity-50 mt-2">Specs and comps with less than 10 recorded matches are hidden.</div>
      </div>
    </div>
  );
}
