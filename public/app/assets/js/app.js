(() => {
  "use strict";
  const pairs        = ['BTC', 'USDT'];
  const base         = `https://${window.location.host}/api/`;
  //  const base     = `https://${window.location.host}/api/`;
  
  const s            = Object.freeze((name, all) => {
    if (all) return document.querySelectorAll(name);
    else     return document.querySelector(name);
  });
  
  const lc           = window.location;

  const call         = Object.freeze((path, data, plain) => {
    return new Promise((resolve, reject) => {
      fetch(base + path, {headers: {"bot-data": JSON.stringify(data)}}).
      then(data => data.text()).
      then(data => {
        plain ?
          resolve(data) :
          resolve(JSON.parse(data));
      }).
      catch(data => resolve(false));
    });
  });

  const login        = Object.freeze((e) => {
    e.preventDefault();
    const input  = s('.login form input');
    const button = s('.login form button');
    Promise.resolve(call('login', {password: input.value})).
    then(data => {
      if (data === 1) void start();
      else button.innerText = "Invalid password";
    }).
    catch(data => {
      button.innerText = "Invalid password";
    });
  });

  const start        = Object.freeze(()  => {
      console.log('starting app');
      s('.app').classList.value    = "wrapper app";
      s('.login').classList.value  = "container-fluid login hide";
      document.body.style.display  = "block";
      s('.settings form').onsubmit = e => void save(e);
      void menu ();
      void coins();
      void load ();
      void last ();
    });

  const menu = Object.freeze(()  => {
      const tabs    = Array.from(s('.nav li', 1));
      const showtab = Object.freeze((tab, coin) => {
        const table     = s('.table');
        const settings  = s('.settings');
        for (let i = 0; i < 3; i++) {
          if (i === tab) tabs[i].classList = 'active';
          else tabs[i].classList = '';
        }
        if (tab === 0) {
          table.classList.value    = 'content table hide';
          settings.classList.value = 'content settings';
          return;
        }
        else {
          void getdata(coin);
          table.classList.value    = 'content table';
          settings.classList.value = 'content settings hide';
          return;
        }
      });
      tabs[0].onclick = () => showtab(0);
      tabs[1].onclick = () => showtab(1, 'btc');
     // tabs[2].onclick = () => showtab(2, 'bch');
     // tabs[3].onclick = () => showtab(3, 'ltc');
     // tabs[4].onclick = () => showtab(4, 'eth');
     // tabs[5].onclick = () => showtab(5, 'xrp');
      tabs[2].onclick = () => showtab(2, 'usdt');
  });

  const coins        = Object.freeze(()  => {
    const node  = s('.coin-settings');
    pairs.forEach(c => {
      node.innerHTML += `
      <div class="row ${c.toLowerCase()}">
          <div class="col-md-3">
              <div class="form-group">
                  <label>${c} Minimum Price</label>
                  <input type="number" step="0.001" class="form-control border-input ${c}" value="">
              </div>
          </div>
          <div class="col-md-3">
              <div class="form-group">
                  <label>${c} Maximum Price</label>
                  <input type="number" step="0.001" class="form-control border-input ${c}" value="">
              </div>
          </div>
          <div class="col-md-3">
              <div class="form-group">
                  <label>${c} Markup</label>
                  <input type="number" step="0.001" class="form-control border-input ${c}" value="">
              </div>
          </div>
          <div class="col-md-3">
              <div class="form-group">
                  <label>${c} Max Amount Filter</label>
                  <input type="number" step="0.001" class="form-control border-input ${c}" value="">
              </div>
          </div>
      </div>
      `;
    });
  });

  const load         = Object.freeze(()  => {
      Promise.resolve(call('load', 'load')).
      then(data => {
        if (typeof data == 'object') {
          console.log(data);
          const inputs     = Array.from(s('.settings input', 1));
          const coins      = Array.from(s('.coin-settings input', 1));
          const select     = s('.settings select');
          const blacklist  = s('.settings textarea');
          const pairs      = ['BTC', 'USDT'];
      
          inputs[0].value  = data.password;
          inputs[1].value  = data.email;
          inputs[2].value  = data.backup;
          inputs[3].value  = data.trades;
          inputs[4].value  = data.lastonline;
          inputs[5].value  = data.score;
          inputs[6].value  = data.buyfiat;
          inputs[7].value  = data.sellfiat;
          // inputs[8].value  = data.banknumber;
          // inputs[9].value  = data.bankname.toLowerCase();
          blacklist.value  = data.blacklist.join(',');
          for (let i = 0; i < 2; i++) {
            const current = i * 4;
            coins[current].value     = data[pairs[i] + 'min']; 
            coins[current + 1].value = data[pairs[i] + 'max']; 
            coins[current + 2].value = data[pairs[i] + 'markup']; 
            coins[current + 3].value = data[pairs[i] + 'amt']; 
          }
          // Array.from(s('option', 1)).forEach(o => {
          //   if (o.value.toLowerCase() == data.bank.toLowerCase()) {
          //     o.setAttribute('selected', true);
          //     return;
          //   }
          // });
        }
      }).
      catch(console.log);
  }); 
 
  
  const save         = Object.freeze((e) => {
    e.preventDefault();
    const inputs       = Array.from(s('.settings input', 1));
    const coins        = Array.from(s('.coin-settings input', 1));
    // const select       = s('.settings select');
    const blacklist    = s('.settings textarea').value;
    const button       = s('.settings button');
    const settings     = {};
    let current        = -1;
    
    settings.password   = inputs[0].value;
    settings.email      = inputs[1].value;
    settings.backup     = inputs[2].value;
    settings.trades     = inputs[3].value;
    settings.lastonline = inputs[4].value;
    settings.score      = inputs[5].value;
    settings.buyfiat    = inputs[6].value;
    settings.sellfiat   = inputs[7].value;
    // settings.bank       = select.value;
    // settings.banknumber = inputs[8].value;
    // settings.bankname   = inputs[9].value;
    settings.blacklist  = blacklist ? blacklist.split(',') : [];
    
    for (let i = 0; i < 2; i++) {
      const current = i * 4;
      settings[pairs[i] + 'min']    = coins[current].value; 
      settings[pairs[i] + 'max']    = coins[current + 1].value;
      settings[pairs[i] + 'markup'] = coins[current + 2].value;
      settings[pairs[i] + 'amt']    = coins[current + 3].value;
    }
    
    Promise.resolve(call('save', settings)).
    then(data => {
      if (data == 1) {
        button.innerText                  = "Settings saved";
        setTimeout(() => button.innerText = "Update settings", 1000);
      }
      else button.innerText             = "Error saving";
      setTimeout(() => button.innerText = "Update settings", 1000);
    }).
    catch(data => {
      console.log(data);
      button.innerText = "Error saving";
    });
  });    

  const last         = Object.freeze(()  => {
    Promise.resolve(call('last', 'last', 1)).
    then(data => s('.update').innerText = data).
    catch(console.log).
    finally(() => setTimeout(() => last(), 1000 * 30));
  });
  

///////////////////////////////////////////////////////////////////
  const getdata      = Object.freeze((coin) => {
      Promise.resolve(call('coin', {coin: coin})).
      then(data => {
      void table_entry("tsell",  data.tsell);
      void table_entry("tbuy",   data.tbuy);
      void table_entry("tads",   data.tads);
      void table_entry("tstats", data.tstats);
      }).
      catch(data => {
      console.log(data);
      alert('Error: ' + data);
      });
      return;
  });

  const table_entry  = Object.freeze((table, data) => {
    const body = s(`.${table} tbody`);
    switch (table) {
      case 'tstats': {
        body.innerHTML = '';
        for (let entry of data) {
          let keys = Object.keys(entry);
          body.innerHTML += `<tr><td>${keys[0]}</td><td>${entry[keys[0]]}</td></tr>`;
        }
        break;
      }
      case 'tsell' :
      case 'tbuy'  : {
        let dups = new Set();
        body.innerHTML = '';
        for (let entry of data) {
          let id = entry.user+entry.price.toString();
          if (dups.has(id)) continue;
          body.innerHTML += `<tr><td>${entry.user}</td><td>${entry.price}</td><td>${entry.max}</td></tr>`;
          dups.add(id);
        }
        break;
      }
      case 'tads': {
        body.innerHTML = '';
        let dups = new Set();
        for (let entry of data) {
          if (dups.has((entry.offer+entry.price).toString())) continue;
          body.innerHTML += `<tr><td>${entry.type}</td><td>${entry.price}</td><td>${entry.offer}</td></tr>`;
          dups.add((entry.offer+entry.price).toString());
        }
        break;
      }
      default: break;
    }
  });

  s('.login form').onsubmit = e => void login(e);
  
  Promise.resolve(call('check', 'check')).
      then(data => {
      if (data == 1) void start();
      else document.body.style.display = "block";
      }).
  catch(console.log);

})();


