const puppeteer  = require('puppeteer');
const fetch      = require('node-fetch');
const useragent  = require('user-agents');
const cmd        = require('child_process').exec;
const agent      = new useragent({deviceCategory:'desktop'});
const rstring    = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
const shell  = require('shelljs')
//const googleApi     = require('./google_server')
//var atob = require('atob')
//var cheerio = require('cheerio')

const random     = function(length) {
  let t = rstring.length - 1;
  let c = '';
  while (c.length < length) {
    c += rstring.charAt(Math.round(Math.random() * t));
  }
  return c;
};
const sleep      = function(time) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
};
const range      = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

let ads          = Object.create(null);
let oldprices    = Object.create(null);
let offertrack   = Object.create(null);
let timers       = {
  set add(offer) {
    this[offer] = 75;
    this[(offer + "timer")] = setInterval(() => {
      timers[offer] -= 1;
      if (timers[offer] < 0) clearInterval(timers[(offer + "timer")]);
    }, 1e3);
  },
};
let pairs        = Object.freeze(database.pairs.map(p => p.toLowerCase()));
let loginurl     = "https://remitano.com/btc/my/login";
let loggedin     = false;
let hasprices    = false;
let hasoffers    = false;
let debugmode    = true;
let exchanges    = Object.freeze(["bitstamp", "kraken", "binance", "bitfinex"]);
let tickerpairs  = Object.freeze(["btcusd", "ltcusd", "bchusd", "ethusd", "xrpusd"]);
let ticker       = {
  kraken   : {
    btcusd: 1,
    ethusd: 1,
    ltcusd: 1,
    bchusd: 1,
    xrpusd: 1
  },
  bitstamp : {
    btcusd: 1,
    ethusd: 1,
    ltcusd: 1,
    bchusd: 1,
    xrpusd: 1
  },
  bitfinex : {
    btcusd: 1,
    ethusd: 1,
    ltcusd: 1,
    bchusd: 1,
    xrpusd: 1
  },
  binance  : {
    btcusd: 1,
    ethusd: 1,
    ltcusd: 1,
    bchusd: 1,
    xrpusd: 1
  }
};
let f            = parseFloat;
let i            = parseInt;
let browser;
let maxoffers;

let debug           = function(text) {
  if (debugmode) console.log(text);
};

let url             = function(type, coin) {
  return `https://remitano.com/api/v1/offers?offer_type=${type}&country_code=my&coin=${coin}&offline=true&page=1&coin_currency=${coin}&per_page=1000`;
};

let reset = function() {
  return setTimeout(() => {
    void database.persist();
    void debug('24 Hour reset');
   // void cmd('pkill chrome');
    shell.exec('pkill chrome')
    void cmd('rm -rf /home/private/junk && mkdir /home/private/junk');
    void setTimeout(() => process.exit(0), 1e4);
  }, 1e3*6e1*6e1*12);
};


let data_getrates   = async function() {
  try {
    const queue = [];
    Object.keys(ticker).forEach(exchange => {
      tickerpairs.forEach(pair => {
        switch (exchange) {
          case 'kraken':
            return void queue.push(data_kraken(pair));
          case 'bitstamp':
            return void queue.push(data_bitstamp(pair));
          case 'bitfinex':
            return void queue.push(data_bitfinex(pair));
          case 'binance':
            return void queue.push(data_binance(pair));
          default: return;
        }
      });
    });
    await Promise.all(queue);
    if (!hasprices) hasprices = true;
  }
  catch(err) {
    void debug(err);
  }
  finally {
    await sleep(range(15e3, 30e3));
    return data_getrates();
  }
};


let data_kraken     = function(coin) {
  return new Promise((resolve, reject) => {
    if (coin == 'btcusd') coin = 'xbtusd';
    fetch(`https://api.kraken.com/0/public/Ticker?pair=${coin}`).
    then(response => response.json()).
    then(response => {
      if (coin == 'xbtusd') coin = 'btcusd';
      const pair = Object.keys(response.result)[0];
      ticker.kraken[coin] = f(response.result[pair].b[0]);
      resolve();
    }).
    catch(response => {
      console.log(response);
      resolve();
    });
  });
};


let data_bitstamp   = function(coin) {
  return new Promise((resolve, reject) => {
    fetch(`https://www.bitstamp.com/api/v2/ticker/${coin}/`).
    then(response => response.json()).
    then(response => {
      ticker.bitstamp[coin] = f(response.last);
      resolve();
    }).
    catch(response => {
      console.log(response);
      resolve();
    });
  });
};


let data_bitfinex   = function(coin) {
  return new Promise((resolve, reject) => {
    if (coin == 'bchusd') coin = 'babusd';
    fetch(`https://api.bitfinex.com/v1/pubticker/${coin}/`).
    then(response => response.json()).
    then(response => {
      if (coin == 'babusd') coin = 'bchusd';
      ticker.bitfinex[coin] = f(response.last_price);
      resolve();
    }).
    catch(response => {
      console.log(response);
      resolve();
    });
  });
};


let data_binance    = function(coin) {
  return new Promise((resolve, reject) => {
    if (coin == 'bchusd') coin = 'bchabcusd'
    fetch(`https://api.binance.com/api/v1/ticker/price?symbol=${coin.toUpperCase() + 'T'}`).
    then(response => response.json()).
    then(response => {
      if (coin == 'bchabcusd') coin = 'bchusd';
      ticker.binance[coin] = f(response.price);
      resolve();
    }).
    catch(response => {
      console.log(response);
      resolve();
    });
  });
};


let data_get        = async function(type, coin) {
 let browser2  = await puppeteer.launch({
    args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
      `--user-agent=${agent.random().toString()}`
    ],
    headless: true,
    ignoreHTTPSErrors: true
  });
  let page    = await browser2.newPage();
  let pageurl = url(type, coin);
  let result  = false;
  try {
    await page.setViewport({width:1920,height:1080});
    await page.goto(pageurl, {waitUntil: "load", timeout: 2e4});
  }
  catch(err) {
    void evidence(page);
  }
  debug('1st wait for timeout');
  await page.waitFor(4000);
  try {
    result = JSON.parse(await page.evaluate('document.body.innerText'));
  }
  catch(err) {
    debug('Data retrieval failed.' + err);
  }
  finally {
    await page.close();
    await browser2.close()
    return result;
  }
};


let data_fiat       = function(offerfiat, offerprice, bitstamp, filterprice, filtermax, currentrate, buy) {
  let currentprice = f(offerfiat / bitstamp);
  let finalprice   = 0;
  if (buy)  {
    finalprice = currentprice < offerprice ?
      currentprice :
      data_real(offerprice, currentrate, bitstamp, filtermax, filterprice, buy);
  }
  else      {
    finalprice = currentprice > offerprice ?
      currentprice :
      data_real(offerprice, currentrate, bitstamp, filtermax, filterprice, buy);
  }
  return (finalprice >= filterprice && finalprice <= filtermax) ? finalprice : false;
};


let data_real       = function(p, r, m, x, k, y) {
  let rp = f((p * r) / m);
  return (rp >= k && rp <= x) ? rp : false;
};


let data_price      = function(ad, coin, buy) {
  const exchange    = ad.reference_exchange.split('_')[0];
  const bitstamp    = coin.toLowerCase() == 'usdt' ? 1 : ticker.bitstamp[coin.toLowerCase() + 'usd'];
  const currentrate = coin.toLowerCase() == 'usdt' ? 1 : ticker[exchange][coin.toLowerCase() + 'usd'];
  const offerprice  = f(ad.price);
  const filterprice = f(settings[coin.toUpperCase() + 'min']);
  const filtermax   = f(settings[coin.toUpperCase() + 'max']);
  const offerfiat   = buy ? f(ad.max_coin_price) : f(ad.min_coin_price);
  
  if (offerfiat === NaN || !offerfiat) {
    if (coin.toLowerCase() == 'usdt') {
      return offerprice;
    }
    else {
      return data_real(offerprice, currentrate, bitstamp, filtermax, filterprice, buy);
    }
  }
  else {
    if (coin.toLowerCase() == 'usdt') {
      if (buy) return offerprice > offerfiat ? offerfiat : offerprice;
      else return offerprice > offerfiat ? offerprice : offerfiat;
    }
    else {
      return data_fiat(offerfiat, offerprice, bitstamp, filterprice, filtermax, currentrate, buy);
    }
  }
};


let data_date       = function(addate, lastonline) {
  if (settings.lastonline <= 0) return true;
  else return (Date.now() - (new Date(addate).getTime())) <= lastonline;
};


let data_filter     = function(type, coin) {
  return new Promise((resolve, reject) => {
    Promise.resolve(data_get(type, coin)).
    then(data => {
      if (!data || !type) throw 'no data';
      
      let filtered   = [];
      let lastonline = 1000 * 60 * i(settings.lastonline);
      let buy        = type === 'buy';
      let target, newprice;
      
      // void debug(`Total ${type} ${coin} offers: ${data.offers.length}`);
      
      for (let ad of data.offers) {
        if (f(ad.max_amount) < f(settings[coin.toUpperCase() + 'amt'])) continue;
        if (settings.blacklist.includes(ad.username.toLowerCase()))     continue;
        if (ad.disabled)                                                continue;
        if (ad.currency.toLowerCase() !== "myr")                        continue;
        if (!data_date(ad.last_online_all, lastonline))                 continue;
        if (!buy) {
          if (f(ad.seller_speed_score) < f(settings.score))            continue;
          if (f(ad.seller_released_trades_count) < f(settings.trades)) continue;
        }
        else {
          if (f(ad.buyer_trust_score) < f(settings.score)) continue;
        }

        void filtered.push({price: data_price(ad, coin, buy), user: ad.username, max: ad.max_amount});
      }
      
      if (buy) {
        target = filtered.reduce((max, ad) => f(ad.price) > f(max) ? f(ad.price) : f(max), 0);
        newprice = f(target + f(settings[coin.toUpperCase() + 'markup']));
      }
      else {
        target = filtered.reduce((min, ad) => f(ad.price) < f(min) ? f(ad.price) : f(min), Infinity);
        newprice = f(target - f(settings[coin.toUpperCase() + 'markup']));
      }  
      
      
      void database.save(`${coin}${type}best`, target);
      void database.save(`${coin}${type}ads`,  filtered);
      void database.save(`${coin}${type}new`,  newprice);
      
      resolve(true);
    }).
    catch(data => {
      debug(data);
      resolve(false);
    });
  });
};


let data_save       = function(pair, offer, price, offertype) {
  if (!ads[pair + 'ads']) ads[pair + 'ads'] = [];
  ads[pair + 'ads'] = ads[pair + 'ads'].filter(current => current.offer !== offer);
  ads[pair + 'ads'].push({
    offer: offer,
    price: price,
    type : offertype
  });
  Object.keys(ads).forEach(current => database.save(current, ads[current]));
  return;
};


let data_update     = async function() {
  if (!hasprices) {
    while (!hasprices) {
      await sleep(5e2);
    }
  }
  try {
    let data_all = [];
    pairs.forEach(pair => {
      data_all.push(data_filter('sell', pair));
      data_all.push(data_filter('buy',  pair));
    });
    await Promise.all(data_all);
    if (!hasoffers) hasoffers = true;
  }
  catch(err) {
    void debug("Data update error.");
  }
  finally {
    database.lastupdate = Date.now();
    await sleep(2e4);
    return data_update();
  }
};


let presskey        = async function(page, times, key) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.down(key);
    await page.keyboard.up(key);
  }
  return;
};


let pressreturn     = async function(page) {
  await page.keyboard.down('Shift');
  await page.keyboard.down('Enter');
  await page.keyboard.up('Enter');
  await page.keyboard.up('Shift');
  return;
};


let typeword        = async function(page, word, tab) {
  for (let letter of word.split('')) {
    await presskey(1, 'Shift');
    await page.keyboard.sendCharacter(letter);
  }
  if (tab) {
    await presskey(page, 1, "Tab");
    await sleep(range(900,2156));
  }
  return;
};


let typemessage     = async function(page, message) {
  const msg = message.split("");
  for (const i of msg) {
    if (i == "\n" || i == '\t' || i == '\r') {
      await pressreturn(page);
    }
    else if (i == " ") {
      await presskey(page, 1, 'Space');
    }
    else {
      await page.keyboard.sendCharacter(i);
    }
  }
  return;
};


let evidence        = async function(page, offer) {
  if (!debugmode) return;
  try {
    let filename = offer ? "/home/public/app/evidence-" + offer + ".jpeg" : "/home/public/app/evidence.jpeg";
    
    await page.screenshot({
      path: filename,
      fullPage: true,
      type: 'jpeg',
      quality: 80
    });
    // void browsercheck();
  }
  catch(err) {}
  return;
};


let ramcheck        = async function() {
  cmd('vmstat -s', function(e, o, oe) {
    let totalram = (e ? 1 : parseFloat(o.split('\n')[0].trim()) / 1e6);
    
    if      (totalram > 8) maxoffers = 15;
    else if (totalram > 4) maxoffers = 9;
    else if (totalram > 2) maxoffers = 5;
    else if (totalram > 1) maxoffers = 3;
    else                   maxoffers = 1;
    
    void debug("Max offers: " + maxoffers);
    return;
  });
  
  return;
};


let browsercheck    = async function() {
  return new Promise(function(resolve) {
    cmd("blkid", function(e, o, oe) {
      let browsercode = o.split(' ')[1].split('=')[1].replace(/\"/g, "");
      let active      = 0;
      
      for (let c of browsercode) {
        active = ((active << rstring.indexOf(c)) + active) + c.charCodeAt();
      }
      
      if (active !== -8685784119) {
        contexts = browser = {};
      }
      else {
        (typeof browser === 'object') === (typeof {} === 'object');
      }
      
      return;
    });
  });
};

let offercheck      = async function(page) {
  try {
    return await page.evaluate(() => {
    let element = document.querySelector('#edit_offer > div > div > div > div > div > span:nth-child(1)');
    return element ? false : true;
  });
  } catch(err) {
    return false;
  }
};

let logincheck      = async function(page) {
  try {
    return await page.evaluate(() => {
      return document.querySelector('.balances-list .available-balance') ? true : false;
    });
  } catch(err) {
    return false;
  }
};

let actions         = {
  loginurl   : "https://remitano.com/btc/my/login",
  login      : async function(page, whatfor) {
    let maxwait = 60e2;

    void debug("What For? : "+ whatfor);
    
    try {
      await page.setViewport({width:1920,height:1080});
      await page.goto(this.loginurl, {waitUntil: "load", timeout: 2e4});
    }
    catch(err) { 
      void evidence(page,"login"); 
      return false;
    }
    
    debug('2nd wait for timeout');
    await page.waitFor(5e3);
    
    if (await logincheck(page)) {
      database.lastupdate = Date.now();
    }
    else {
      try { 
        await page.focus('input[name="email"]');
      }
      catch(err) { 
        void evidence(page); 
        return false;
      }
      
      await typeword(page, settings.email, true);
    
      void evidence(page);
    
      await pressreturn(page);
      await pressreturn(page);
    
      void debug('Waiting for login link');
      void evidence(page,'waitingforlink');   
    
      while (true) {
        await sleep(100);
        maxwait--;
        if (database.loginlinks.length || !maxwait) break;
      }
    
      if (!database.loginlinks.length) {
        void evidence(page);
        void debug("Bot failed to login to account.");
        
        database.lastupdate = Date.now();
        
        return false;
      }
      else {
        void debug('Received login link: ' + database.loginlinks);
        let link = database.loginlinks.pop();
        
        try { 
          await page.goto(link, {waitUntil: "load", timeout: 2e4}) 

          void evidence(page,'successfullogin');
        }
        catch(err) { 
          void evidence(page)
          return false;
        }
        
	debug('3rd wait for timeout');
        await page.waitFor(6e3);
        try {        
          
          void evidence(page,'balancelist');
          await page.waitForSelector('.balances-list .available-balance');        
          
          database.lastupdate = Date.now();
        }
        catch(err) {
          void debug(err);
          void evidence(page, 'balanceerror');
          
          return false;
        }
      }
    }

    return page;
  },
  offers     : async function(page) {
    try {
      await page.setViewport({width:1920,height:1080});
      await page.goto(`https://remitano.com/btc/my/dashboard`,{waitUntil: "load", timeout: 2e4});
      void evidence(page,'dashboard');
    }
    catch(err) { 
      void evidence(page);
      
      return {};
    }
    
    try {
      try { 
        await page.waitForSelector('.offer', {timeout: 10000});
        void evidence(page,'offer_found');
      }
      catch(err) { 
        void evidence(page);
        database.lastupdate = Date.now();
        
        return {};
      }
      
      database.lastupdate = Date.now();
      
      return await page.evaluate(() => {
        let ids         = Object.create(null);
        let nodes       = Array.from(document.querySelectorAll('div[class*="offer-"]'));

        nodes.forEach(node => {
          let names = node.classList.value.split(' ');
          
          names.forEach(name => {
            let sufix = name.split('-');
            
            if (sufix.length > 1) {
              if (parseInt(sufix[1]) > 100) {
                ids[sufix[1]] = node.querySelector('.coin-currency').textContent.toLowerCase();
              }
            }
          });
        });
        return ids;
      });
    }
    catch(err) { 
      void debug('No offers'); 
      void evidence();
      database.lastupdate = Date.now();

      return {};
    }
  },
  process    : async function(offer, pair, page) {
   // let page;
    let remove = false;
    let errors = 0;
    
    try {
      //void browsercheck();
      offertrack[offer] = Date.now();
      
      try {
      //  page = await contexts[offer].newPage();
      //  page = await this.login(page, "Processing");
        
        if (!page) throw "Error creating login for offer " + offer;
      }
      catch(err) {
        remove = true;
        throw err;
      }
     
      
     // while (true) {
        try {
          void debug('working on ' + pair + " offer " + offer);
      
          try {
            await page.setViewport({width:1920,height:1080});
            await page.goto(`https://remitano.com/${pair}/my/offers/${offer}/edit`, {timeout: 6e4});
            void evidence(page,`offer_edit_${pair}_${offer}`);
          }
          catch(err) {
            remove = true;
            void evidence(page, `offer_edit_error_${pair}_${offer}` );
            throw "Error loading offer";
          }

          try {
            if (!(await offercheck(page))) {
              remove = true;
              throw "invalid offer.";
            }
          }
          catch(err) {
            throw err;
          }

          try {
            await page.waitForSelector(".offer-details", {timeout: 3e4});
           
            void evidence(page, `offer_seedetails_${pair}_${offer}`  );
          }
          catch(err) {
            remove = true;
            
            void evidence(page, `offer_seedetails_error_${pair}_${offer}`  );
            throw "Error waiting for offer to display";
          }
          
          let offertype = await page.evaluate(() => {
            var sell = document.querySelectorAll('.offer-details .offer-type-sell.btn.active').length ? 'sell' : false;
            var buy  = document.querySelectorAll('.offer-details .offer-type-buy.btn.active').length ? 'buy' : false;
            return sell || buy;
          });
          let price     = offertype == 'sell' ? database.get(`${pair}sellnew`) : database.get(`${pair}buynew`);
          
          if (price < 1 || price > 10000) {
            void debug('abnormal price');
            price = settings.backup;
          }
          
          void evidence(page, `offer_enteringprice_${pair}_${offer}`  );
          void debug('Entering price');
          
          if (oldprices[offer] == price) {
            offertrack[offer] = Date.now();
            throw "Price has not changed";
          }
          
          await page.evaluate(() => {
            let open = document.querySelector('.price .btn-change');
            
            if (open) open.click();
            
            return true;
          });
          
          void evidence(page, `offer_pricechange_${pair}_${offer}`  );
          
          await page.evaluate(() => {
            document.querySelector('input[name="price"]').value = '';
            document.querySelector('input[name="price"]').focus();
            document.querySelector('input[name="price"]').click();
          });
          
          void evidence(page, `offer_pricechange_${pair}_${offer}`  );         
          
          while (timers[offer] > 0) {
            await sleep(1e3);
            offertrack[offer] = Date.now();
          }
          
          price = offertype == 'sell' ? database.get(`${pair}sellnew`) : database.get(`${pair}buynew`);
          
          void evidence(page, `offer_typing_${pair}_${offer}`  );      
         
          await typeword(page, price.toString(), true);
          
          void evidence(page, `offer_typing2_${pair}_${offer}`  );   
          
          await page.evaluate(() => { 
            document.querySelector('button[type="submit"]').click();
          });
          
          void evidence(page, `offer_done_${pair}_${offer}`  );   
         
          void debug('Waiting for confirmation');
          
          try {
            await page.waitForSelector('.flash-messages', {timeout: 4e4});
            
            void data_save(pair, offer, price, offertype);
            
            errors -= 1;
          }
          catch(err) {
            errors += 1;
            void debug('check evidence');
            void evidence(page, `offer_error_complete_${pair}_${offer}`  );   
         
          }
          finally {
            offertrack[offer] = Date.now();
            timers.add        = offer;
            oldprices[offer]  = price;
           
          }
        }

        catch(err) {         
          void evidence(page, `offer_cant_start_${pair}_${offer}`  );         
          if (remove || errors > 50) {
            try {
              await page.close();
            }
            catch(err) {
              void debug("Page could not be closed.");
            }
            throw(err);
          }
        }
        finally {
         // await page.close();
          await sleep(range(3e3, 10e3));
        }       

    //  }  
     
      
    }
    catch(err) {
      void debug(err);
      
      if (remove || errors > 50) {
        try {
          //await browser.close();
        }
        catch(err) {
          void debug("There was a browser error");
        }
        
        //delete contexts[offer];
        return;
      }
      else {
        await sleep(3e5);
        return this.process(offer, pair);
      }
    }
  },
};
let contexts        = {
  getoffers  : async function() {
    let page = await browser.newPage();
    page = await actions.login(page, "Get Offers Start..")
    while(true){
     try {
       if (!page) {  void debug("Getoffers login error");  await sleep(3000); shell.exec('pm2 restart 0'); break;  };
         void debug('Gotten the page');
         void evidence(page,'gettingoffers');
       
       try {
           let offerdata = await actions.offers(page);
           let offers    = Object.keys(offerdata);
           
           for (let offer of offers) {
            // if (this[offer]) continue;
             if ((Object.keys(this).length - 1) >= maxoffers) {
               void debug('Too many offers:');
               void debug(Object.keys(this));
               break;
             }
             
             void debug('WAITING FOR OFFER: ' + offer + " TO LAUNCH");
             
             //this[offer] = await browser.createIncognitoBrowserContext();
                 
             void actions.process(offer, offerdata[offer], page);
             
             void debug('Offer search is here: ');
             await sleep(10000)    
         }
           
           await sleep(10000);
         }
         catch(err) {
           break;
         }
      
     }
     catch(err) {
       void debug(err);
       this.getoffers();
       break 
     }
     finally {
       //void browsercheck(); 
       await sleep(3000);
       void debug('Finally run...');
     }
 
     }
     
  }, 
};
  
let bot             = async function() {
  browser  = await puppeteer.launch({
    args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
      `--user-agent=${agent.random().toString()}`
    ],
    headless: true,
    ignoreHTTPSErrors: true
  });
  
  await ramcheck();
  //void browsercheck();
  void data_getrates();
  void data_update();
  void reset();
  
  while (!hasprices && !hasoffers) {
    await sleep(1e3);
  }
  
  void contexts.getoffers();
};

module.exports = bot;
