import { expect, type Page, test } from '@playwright/test';

type TestPlayerCount = 2 | 3 | 4;
const PLAYTEST_LOG_TIMEOUT_MS = 12_000;
type PlaytestOptions = {
  matchDurationMs?: number;
  countdownMs?: number;
  roundsToWin?: number;
  maxRounds?: number;
};

const buildPlaytestUrl = (players: TestPlayerCount, options: PlaytestOptions = {}) => {
  const params = new URLSearchParams({
    playtestPlayers: String(players),
    playtest: '1',
    matchDurationMs: String(options.matchDurationMs ?? 4000),
    countdownMs: String(options.countdownMs ?? 0),
    roundsToWin: '1',
    maxRounds: '1',
  });

  if (options.roundsToWin !== undefined) {
    params.set('roundsToWin', String(options.roundsToWin));
  }

  if (options.maxRounds !== undefined) {
    params.set('maxRounds', String(options.maxRounds));
  }

  return `/?${params.toString()}`;
};

const waitForPlaytestLog = async (
  logs: string[],
  predicate: (line: string) => boolean,
) => {
  await expect(async () => {
    expect(logs.some((entry) => predicate(entry))).toBeTruthy();
  }).toPass({ timeout: PLAYTEST_LOG_TIMEOUT_MS });
};

const parsePlaytestMetric = (line: string, metric: string): number => {
  const match = new RegExp(`\\b${metric}=(\\d+)`).exec(line);
  if (!match) {
    return NaN;
  }

  return Number.parseInt(match[1], 10);
};

const runPlaytestCombatSequence = async (page: Page) => {
  await page.locator('canvas').click();
  await page.keyboard.down('D');
  await page.waitForTimeout(3400);
  await page.keyboard.up('D');

  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press('F');
    await page.waitForTimeout(280);
  }

  await page.waitForTimeout(700);
};

for (const playerCount of [2, 3, 4] as const) {
  test(`phase 8 playtest — ${playerCount} joueurs`, async ({ page }) => {
    const observed: string[] = [];

    page.on('console', (message) => {
      observed.push(message.text());
    });

    await page.goto(buildPlaytestUrl(playerCount));

    await waitForPlaytestLog(
      observed,
      (line) => line.includes('[playtest] menu-autojoin')
        && line.includes(`targetPlayers=${playerCount}`)
        && line.includes(`joinedPlayers=`),
    );

    await waitForPlaytestLog(
      observed,
      (line) => line.includes('[playtest] arena-start') && line.includes(`players=${playerCount}`),
    );

    await waitForPlaytestLog(
      observed,
      (line) => line.includes('[playtest] match-finished'),
    );

    expect(observed.filter((entry) => entry.includes('[playtest]')).length).toBeGreaterThanOrEqual(3);
  });
}

test('phase 13 — vérification perf en playtest', async ({ page }) => {
  const observed: string[] = [];

  page.on('console', (message) => {
    observed.push(message.text());
  });

  await page.goto(buildPlaytestUrl(2, { matchDurationMs: 7000, countdownMs: 0 }));

  await waitForPlaytestLog(
    observed,
    (line) => line.includes('[playtest] arena-start') && line.includes('players=2'),
  );

  await page.locator('canvas').click();
  await page.keyboard.press('F9');

  await waitForPlaytestLog(
    observed,
    (line) => line.includes('[Perf]'),
  );

  const perfLine = observed.find((line) => line.includes('[Perf]'));
  expect(perfLine, 'Aucune mesure de perf n’a été produite en mode playtest').toBeDefined();

  const fps = parsePlaytestMetric(perfLine as string, 'fps');
  expect(fps, `Impossible d’extraire le FPS de la ligne: ${perfLine}`).toBeGreaterThan(0);

  await waitForPlaytestLog(
    observed,
    (line) => line.includes('[playtest] match-finished'),
  );
});

test('phase 13 — vérification circulation du sang en playtest', async ({ page }) => {
  const observed: string[] = [];

  page.on('console', (message) => {
    observed.push(message.text());
  });

  await page.goto(buildPlaytestUrl(2, { matchDurationMs: 7000, countdownMs: 0 }));

  await waitForPlaytestLog(
    observed,
    (line) => line.includes('[playtest] arena-start') && line.includes('players=2'),
  );

  await runPlaytestCombatSequence(page);

  await waitForPlaytestLog(
    observed,
    (line) => line.includes('[playtest] blood-flow') && line.includes('spilled=') && line.includes('recovered='),
  );

  const bloodFlowLine = observed.find(
    (line) => line.includes('[playtest] blood-flow') && line.includes('spilled=') && line.includes('recovered='),
  );

  expect(bloodFlowLine, 'Le récapitulatif de circulation sanguine doit apparaître en mode playtest').toBeDefined();

  const spilled = parsePlaytestMetric(bloodFlowLine as string, 'spilled');
  const recovered = parsePlaytestMetric(bloodFlowLine as string, 'recovered');
  expect(spilled, `Impossible d’extraire "spilled" depuis: ${bloodFlowLine}`).toBeGreaterThan(0);
  expect(recovered, `Impossible d’extraire "recovered" depuis: ${bloodFlowLine}`).toBeGreaterThan(0);
});
