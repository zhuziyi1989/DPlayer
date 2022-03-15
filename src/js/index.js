import '../css/index.scss';
import DPlayer from './player';

/* global DPLAYER_VERSION GIT_HASH */
console.log(`${'\n'} %c ChinaMCloud Player v${DPLAYER_VERSION} ${GIT_HASH} %c https://www.chinamcloud.com/ ${'\n'}${'\n'}`, 'color: #fadfa3; background: #030307; padding:5px 0;', 'background: #f06; padding:5px 0;');

export default DPlayer;
