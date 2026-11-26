// The Liquipedia wikitext parser behind the M8 block: scores, winners, dates, bracket rounds and team identity.
import assert from 'node:assert/strict';
import { parseMatch, parseDate, matchlists, brackets, canonicalize } from './m8-data.mjs';

assert.deepEqual(parseDate('January 3, 2027 - 13:00{{abbr/TRT}}'), { day: '2027-01-03', at: '2027-01-03T13:00:00+03:00' });
assert.deepEqual(parseDate('December 17, 2026 - 13:10 {{Abbr/ICT}}'), { day: '2026-12-17', at: '2026-12-17T13:10:00+07:00' });

const bo5 = `{{Match|bestof=5
 |opponent1={{TeamOpponent|alter ego}}|opponent2={{TeamOpponent|srg.og}}
 |date=January 18, 2027 - 14:30{{abbr/TRT}}
 |map1={{Map|winner=1|length=18:06|vod=https://www.youtube.com/watch?v=x|t1h1=esme|t1h2=ling|t1h3=yve|t1h4=claude|t1h5=grock|t2h1=fanny|t2h2=lylia|t2h3=moskov|t2h4=hilda|t2h5=kalea}}|map2={{Map|winner=2}}|map3={{Map|winner=1}}|map4={{Map|winner=1}}|map5={{Map|finished=skip}}}}`;
const played = parseMatch(bo5);
assert.deepEqual({ ...played, games: undefined }, { bo: 5, a: 'alter ego', b: 'srg.og', score: [3, 1], winner: 1, at: '2027-01-18T14:30:00+03:00', day: '2027-01-18', games: undefined });
assert.equal(played.games.length, 4);
assert.deepEqual(played.games[0], { w: 1, len: '18:06', picks: [['esme', 'ling', 'yve', 'claude', 'grock'], ['fanny', 'lylia', 'moskov', 'hilda', 'kalea']], vod: 'https://www.youtube.com/watch?v=x' });
const waiting = parseMatch('{{Match|bestof=1|opponent1={{TeamOpponent|}}|opponent2={{TeamOpponent|tbd}}|date=December 18, 2026 - 14:10{{Abbr/ICT}}}}');
assert.equal(waiting.winner, 0);
assert.equal(waiting.a + waiting.b, '');

const list = matchlists(`====High (2-0)====
{{Matchlist|id=M8SWISSR30|title=Round 3|M2={{Match|bestof=1|opponent1={{TeamOpponent|b}}|opponent2={{TeamOpponent|c}}}}|M1={{Match|bestof=3|opponent1={{TeamOpponent|a}}|opponent2={{TeamOpponent|d}}}}}}`);
assert.equal(list[0].record, '2-0');
assert.deepEqual(list[0].matches.map(m => m.id), ['M8SWISSR30-M1', 'M8SWISSR30-M2']);

const bracket = brackets(`{{Bracket|Bracket/4-1Q|id=M8WILDCARD|R1M1={{Match|bestof=5}}|R1M2={{Match|bestof=5}}|R2M1={{Match|bestof=5}}}}`)[0];
assert.deepEqual(bracket.rounds.map(r => [r.round, r.matches.length]), [['sf', 2], ['final', 1]]);

const data = {
  teams: { 'srg.og': { name: 'Selangor Red Giants' }, 'selangor red giants': { name: 'Selangor Red Giants' } },
  wildcard: { groups: [], bracket: null }, knockout: null,
  swiss: { teams: ['srg.og', 'selangor red giants'], rounds: [{ matches: [{ a: 'srg.og', b: '' }] }] }
};
canonicalize(data);
assert.deepEqual(data.swiss.teams, ['selangor red giants']);
assert.equal(data.swiss.rounds[0].matches[0].a, 'selangor red giants');
console.log('M8 parser: dates with time zones, scores, bracket rounds and one identity per team passed.');
