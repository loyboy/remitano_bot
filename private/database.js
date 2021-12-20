const fs = require('fs-extra');

function Database(location) {
  void fs.ensureFileSync(location);
  
  this.location = location;
  let reader    = fs.createReadStream(location);
  let that      = this;
  let data      = "";
  let coin      = -1

  void reader.on('data', function(chunk) { data += chunk });
  void reader.on('end',  function() {
    try {
      that.cache = JSON.parse(data);
    }
    catch(err) {
      console.log(err);
      that.cache = {};
    }
  });
  
  this.loginlinks  = [];
  this.lastupdate  = Date.now();
  this.home        = '/home/private';
  this.pairs       = ['BTC', 'BCH', 'LTC', 'ETH', 'XRP', 'USDT'];
  this.temp        = {
    password    : "password12345",
    email       : "mistresspotatoes@gmail.com",
    backup      : 4.13,
    score       : 0.300,
    lastonline  : 15,
    trades      : 30,
    sellfiat    : 13500,
    buyfiat     : 13500,
    bank        : "maybank",
    banknumber  : 23212312,
    bankname    : "John Doe",
    blacklist   : []
  };
  
  for (let i = 8; i < 33; i++) {
    if (i % 4 === 0) {
      coin++;
      if (this.pairs[coin]) {
        this.temp[this.pairs[coin] + 'min']    = 1.500;
        this.temp[this.pairs[coin] + 'max']    = 4.500;
        this.temp[this.pairs[coin] + 'markup'] = 0.001;
        this.temp[this.pairs[coin] + 'amt']    = 0.500;
      }
    }
    else continue;
  }
};

Database.prototype.sleep   = function(time) {
  return new Promise((resolve, reject) => {
    void setTimeout(resolve, time);
  });
};
Database.prototype.open    = async function() {
  let max   = 60;
  
  while (!this.cache) {
    await this.sleep(1000);
    max--;
    
    if (!max) return false;
  }
  
  void this.persist();
  
  return true;
};
Database.prototype.persist = async function() {
  try {
    if (!this.writing) {
      this.writing = true;

      if (!await this.backup()) throw "Error backing up db";
      
      let writer = fs.createWriteStream(this.location);
      let active = true;
      
      void writer.write(JSON.stringify(this.cache));
      void writer.end();
      void writer.on('finish', function() { active = false });
      
      while (this.writing) {
        await this.sleep(100);
        this.writing = active;
      }
    }
    else throw "Writer active";
  }
  catch(err) {
    console.log(err);
  }
  finally {
    await  this.sleep(3e4);
    return this.persist();
  }
};
Database.prototype.save    = function(key, value) {
  this.cache[key] = value;
  return;
};
Database.prototype.get     = function(key) {
  return this.cache[key];
};
Database.prototype.del     = function(key) {
  this.cache[key] = null;
  return;
};
Database.prototype.clear   = function() {
  this.cache = {};
  return;
};
Database.prototype.clean   = function() {
  let keys   = Object.keys(this.cache);
  let object = {};
  
  for (let key of keys) {
    if (this.cache[key]) object[key] = this.cache[key];
  }
  
  this.cache = object;
  
  return;
};
Database.prototype.backup  = function() {
  const that = this;
  return new Promise(function(resolve) {
    let writer = fs.createWriteStream(that.location + '.bk');
    
    writer.on('finish', function() { return resolve(true) });
    writer.write(JSON.stringify(that.cache));
    writer.end();
  });
};


module.exports = Database;