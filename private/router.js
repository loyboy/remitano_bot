const moment        = require('moment');

const random        = function(length) {
  let l = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
  let t = l.length - 1;
  let c = '';
  while (c.length < length) {
    c += l.charAt(Math.round(Math.random() * t));
  }
  return c;
};
const getcookie     = function(headers) {
  const cookie = headers.cookie;
  if (!cookie) return false;
  else {
    const c = cookie.split(' ').filter(k => k.split('=')[0] == 'remitanobot');
    if (!c.length) return false;
    else return c[0].split('=')[1];
  }
};
const getdata       = function(headers) {
  try { 
    console.log("Bot_data" + JSON.stringify(headers['bot-data']) ) 
    return JSON.parse(headers['bot-data'])
  }
  catch(e) { return false }
};
const getsession    = function(key) {
  if (database.get('session') === key) return true;
  
  return false;
};
const setheaders    = function(res) {
  void res.setHeader('Access-Control-Allow-Origin',   '*');
  void res.setHeader('Access-Control-Allow-Methods',  '*');
  void res.setHeader('Access-Control-Allow-Headers',  '*');
  void res.setHeader('Access-Control-Allow-Credentials', true);
  return res;
};
const router        = function(req, res) {
    const response = setheaders(res);
    const request  = req.url.replace(/\W+/g,'').replace('api','');
    const data     = getdata(req.headers);
    const cookie   = getsession(getcookie(req.headers));

    if (request === "messages") return void paths.msgs(req, response);
    if (!data)                  return void response.end();
    if (request === "login")    return void paths[request](data, response);
    if (!cookie)                return void response.end('9');
    if (request === "check")    return void response.end('1');
    if (request ===  "last")    return void response.end((moment((database.lastupdate || Date.now())).fromNow()).toString());
    if (request ===  "save")    return void paths.save(data, response);
    if (request ===  "load")    return void paths.load(data, response);
    if (request ===  "coin")    return void paths.coin(data, response);
    return void response.end();
  };
const paths         = Object.freeze({
  params : Object.freeze(function(req) { 
    let q = req.url.split('?'),result={};
    if(q.length >= 2){
        q[1].split('&').forEach((item)=>{
             try {
               result[item.split('=')[0]]=item.split('=')[1];
             } catch (e) {
               result[item.split('=')[0]]='';
             }
        })
    }
    return result;
  }),
  
  login : Object.freeze(function(data, res) {
    if (data.password === settings.password) {
      let key = random(128);
      
      void database.save('session', key);
      void res.setHeader('Set-Cookie', `remitanobot=${key};max-age=${1000*60*60*24*30};path=/;secure;httponly;samesite=strict`);
      
      return void res.end('1');
    }
    
    return void res.end('9');
  }),
  load  : Object.freeze(function(data, res) {
    return void res.end(JSON.stringify(settings));
  }),
  save  : Object.freeze(function(data, res) {
    let coin  = -1;
    
    if (data.email !== settings.email) {
      setTimeout(() => {
        process.exit(1);
      }, 10000);
    }
    
    settings.blacklist  = data.blacklist;
    settings.score      = data.score;
    settings.password   = data.password;
    settings.lastonline = data.lastonline;
    settings.email      = data.email;
    settings.backup     = data.backup;
    settings.trades     = data.trades;
    settings.buyfiat    = data.buyfiat;
    settings.sellfiat   = data.sellfiat;

    for (let i = 8; i < 33; i++) {
      if (i % 4 === 0) {
        coin++;
        if (database.pairs[coin]) {
          settings[database.pairs[coin] + 'min']    = data[database.pairs[coin] + 'min'];
          settings[database.pairs[coin] + 'max']    = data[database.pairs[coin] + 'max'];
          settings[database.pairs[coin] + 'markup'] = data[database.pairs[coin] + 'markup'];
          settings[database.pairs[coin] + 'amt']    = data[database.pairs[coin] + 'amt'];
        }
      }
      else continue;
    }
    
    void database.save('settings', settings);
    void res.end('1');
    void console.log(data.password);
    
  }),
  coin  : Object.freeze(function(data, res) {
    return void res.end(JSON.stringify({
      tsell  : database.get(`${data.coin}sellads`) || [],
      tbuy   : database.get(`${data.coin}buyads`)  || [],
      tstats : [
        {"Best Sell": database.get(`${data.coin}sellbest`)},
        {"Best Buy" : database.get(`${data.coin}buybest`)},
        {"New Sell" : database.get(`${data.coin}sellnew`)},
        {"New Buy"  : database.get(`${data.coin}buynew`)}
      ],
      tads   : database.get(`${data.coin}ads`) || []
    }));
  }),
  msgs  : Object.freeze(function(req,  res) {
   // console.log("Received from Mailgun: " + req );
    if (req.method.toLowerCase() !== 'post') return void res.end();
    let reg  = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi;
    let body = '';
    
    req.on('data', chunk => { body += chunk.toString() } );
    req.on('end', () => {
      
      let formatted = decodeURIComponent(body);
      let links     = formatted.match(reg);        

      let authlinks = links.filter(l => l.includes('login'));

      console.log("Login link: " + JSON.stringify(authlinks[0]) ) 
      
      if (!authlinks.length) return void res.end();
      
      void database.loginlinks.push(authlinks[0]);
      void console.log(authlinks[0]);
      void res.end();
      
      return;
    });
  })
});

module.exports = router;