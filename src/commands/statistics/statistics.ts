import { Argv } from 'yargs';
import { calculateBasics } from '../../analyze/analyze';
import { LocalIOService } from '../../services/local-io/local-io';
import { HttpService } from '../../services/http/http';
import { EastMoneyService } from '../../services/eastmoney/eastmoney-service';
import { PersistCacheService } from '../../services/cache/persist-cache';
import { formatOutput } from './statistics-out-template';
import { getNetValues } from '../../utils/net-values';

type CliArgs = {
  numDays: number;
  fundId: string;
};

async function handler({ numDays, fundId }: CliArgs) {
  const httpService = new HttpService();
  const eastMoneyLocalIOService = new LocalIOService('east-money');
  const eastMoneyCacheService = new PersistCacheService(
    eastMoneyLocalIOService,
  );
  const eastMoneyService = new EastMoneyService(
    httpService,
    eastMoneyCacheService,
  );

  const fundList = await eastMoneyService.getFundInfoList();
  const fundInfo = fundList[fundId];
  if (fundInfo == null) {
    throw new Error(`No matching result for fundId = ${fundId}`);
  }
  const netValues = await getNetValues({ eastMoneyService, numDays, fundId });
  const statistics = calculateBasics(netValues);
  const output = formatOutput({
    fundId,
    fundName: fundInfo.name,
    max: statistics.max,
    min: statistics.min,
    average: statistics.average,
    numDays,
  });
  console.log(output); // eslint-disable-line no-console
}

export function addStatisticsCommand(yargs: Argv) {
  return yargs.command(
    'statistics',
    'calculate statics such as x days average/min/max',
    {
      builder: (): Argv<CliArgs> =>
        yargs
          .option('numDays', {
            alias: 'num-days',
            demand: true,
            description: 'number of days need to be taken into consideration',
            type: 'number',
          })
          .options('fundId', {
            alias: 'fund-id',
            demand: true,
            description: 'id of the fund',
            type: 'string',
          }),
      handler,
    },
  );
}
