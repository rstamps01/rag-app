import {loadEsm} from 'load-esm';

(async () => {
  const esmModule = await loadEsm('esm-module');
})();
