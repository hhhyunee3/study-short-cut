// 문장 풀 묶음. 각 파일은 사이트마다 새로 쓴다.
import common from './common.js';
import school from './school.js';
import math from './math.js';
import english from './english.js';
import korean from './korean.js';
import science from './science.js';
import social from './social.js';
import extra1 from './extra1.js';
import extra2 from './extra2.js';
const subjects = { math, english, korean, science, social };
for (const x of [extra1, extra2]) if (x && x.key) subjects[x.key] = x;
export default { common, school, subjects };
