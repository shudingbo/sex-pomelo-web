'use strict';
/* eslint-disable no-bitwise */
const fs = require('fs');
const path = require('path');

const crypto = require('crypto');

module.exports = {


  getNanoSecTime() {
    const hrTime = process.hrtime();
    return hrTime[0] * 1000000000 + hrTime[1];
  },
  getMicroSecTime() {
    const hrTime = process.hrtime();
    return (hrTime[0] * 1000000000 + hrTime[1]) / 1000;
  },

  /**
   * 字符串首字母大写
   * @param {String} str 字符串
   * @return {String} 格式化后字符串
   */
  ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },


  /**
   * 格式化日期字符串
   * @param {Date} dateObj Date 对象 或者 时间戳
   * @param {String} fmt 格式化字符串 默认 'yyyy-MM-dd hh:mm:ss'
   */
  dateFormat(dateObj = new Date(), fmt = 'yyyy-MM-dd hh:mm:ss') {
    if ((dateObj instanceof Date) === false) {
      dateObj = new Date(dateObj);
    }

    const o = {
      'M+': dateObj.getMonth() + 1, // 月份
      'd+': dateObj.getDate(), // 日
      'h+': dateObj.getHours(), // 小时
      'm+': dateObj.getMinutes(), // 分
      's+': dateObj.getSeconds(), // 秒
      'q+': Math.floor((dateObj.getMonth() + 3) / 3), // 季度
      S: dateObj.getMilliseconds(), // 毫秒
    };

    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (dateObj.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
      }
    }
    return fmt;
  },

  /**
   * 数据库日期转时间戳
   * @param {String} date 数据库日期 Y-m-d H:i:s
   */
  date2time(date) {
    return new Date(date).valueOf() - 8 * 3600 * 1000;
  },

  /**
   * 计算两个数组的差集
   * @param {Array} arr1 数组1
   * @param {Array} arr2 数组2
   * @return {Array} 数组差集
   */
  arrayDiff(arr1, arr2) {
    return arr1.concat(arr2).filter(v => {
      return arr1.indexOf(v) === -1 || arr2.indexOf(v) === -1;
    });
  },

  /**
   * 计算两个数组的交集
   * @param {Array} arr1 数组1
   * @param {Array} arr2 数组2
   * @return {Array} 数组交集
   */
  arrayIntersect(arr1, arr2) {
    return arr2.filter(function(v) {
      return arr1.indexOf(v) !== -1; // 利用filter方法来遍历是否有相同的元素
    });
  },

  /**
   * 数组去重
   * @param {Array} arr 需要去重源数组
   * @return {Array} 去重后的数组
   */
  arrayUnique(arr) {
    const res = [];
    const json = {};
    for (let i = 0; i < arr.length; i++) {
      if (!json[arr[i]]) {
        res.push(arr[i]);
        json[arr[i]] = 1;
      }
    }
    return res;
  },

  /** 时间与时间差（天数）
   * @param {Date} timeStamp0 时间戳
   * @param {Date} timeStamp1 基准时间戳,缺省表示获取今天的时间戳
   *
   * @return {Number} 相差的天数
   */
  dateDiffDay(timeStamp0, timeStamp1 = 0) {
    let time0 = null;
    let time1 = null;
    const type0 = typeof (timeStamp0);
    if (type0 === 'string' || type0 === 'number') {
      time0 = new Date(this.dateFormat(new Date(timeStamp0), 'yyyy-MM-dd'));
    } else {
      time0 = timeStamp0;
    }

    if (timeStamp1 === 0) {
      time1 = new Date(this.dateFormat(new Date(), 'yyyy-MM-dd'));
    } else {
      const type1 = typeof (timeStamp1);
      if (type1 === 'string' || type1 === 'number') {
        time1 = new Date(this.dateFormat(new Date(timeStamp1), 'yyyy-MM-dd'));
      } else {
        time1 = timeStamp1;
      }
    }
    const diff = time0 - time1;
    return Math.floor(diff / 86400000);
  },
  /** 获取指定日期的下一天
   * @param {Date|String|Int} day Date对象，日期字符串或者时间戳
   * @return {Date} 下一天
   */
  getNextDay(day) {
    const dateCur = new Date(day);
    const dayNext = new Date(dateCur);
    dayNext.setDate(dayNext.getDate() + 1);
    return dayNext;
  },

  /** 获取指定日期下一天的时间戳
   * @param {Date|String|Int} day Date对象，日期字符串或者时间戳
   * @return {number} 下一天0秒时间戳
   */
  getNextDayStartTimeStamp(day) {
    const dateCur = new Date(day);
    const dayNext = new Date(dateCur);
    dayNext.setDate(dayNext.getDate() + 1);

    const nxtDay = this.dateFormat(dayNext, 'yyyy-MM-dd');
    const nxtDayStart = new Date(nxtDay);
    return this.date2time(nxtDayStart);
  },

  rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  php_urlencode(str) {
    return encodeURIComponent(str + '')
      .replace(/[!'()]/g, escape)
      .replace(/\*/g, '%2A')
      .replace(/\%20/g, '+')
      .replace(/~/g, '%7E');
  },
  php_urldecode(str) {
    return decodeURIComponent(
      (str + '')
        .replace(/%(?![\da-f]{2})/gi, '%25')
        .replace(/\+/g, '%20')
    );
  },
  /** 解码base64字符串
   *
   * @param {string} str base64字符串
   * @param {boolean} isGetReq 字符串是否是通过 get request 传过来的
   * @return {string} 解码后的字符串
   */
  base64_decode(str, isGetReq = false) {
    if (isGetReq === true) {
      const a = str.replace(new RegExp(' ', 'gm'), '+');
      return Buffer.from(a, 'base64').toString();
    }
    return Buffer.from(str, 'base64').toString();
  },
  /** 生成字符串的base64编码
   *
   * @param {string} str 原始字符串
   * @return {string} base64字符串
   */
  base64_encode(str) {
    return Buffer.from(str).toString('base64');
  },
  ip2int(ip) {
    let num = 0;
    ip = ip.split('.');
    num = Number(ip[0]) * 256 * 256 * 256 + Number(ip[1]) * 256 * 256 + Number(ip[2]) * 256 + Number(ip[3]);
    num = num >>> 0;
    return num;
  },

  int2ip(num) {
    let str = '';
    const tt = [];
    tt[0] = (num >>> 24) >>> 0;
    tt[1] = ((num << 8) >>> 24) >>> 0;
    tt[2] = (num << 16) >>> 24;
    tt[3] = (num << 24) >>> 24;
    str = String(tt[0]) + '.' + String(tt[1]) + '.' + String(tt[2]) + '.' + String(tt[3]);
    return str;
  },

  /** 同步删除apcu 缓存数据
   *
   * @param {string} key 要删除的缓存键
   */
  async php_apcu_delete(key) {
    this.app.cache.del(key);

    const ip = this.config.apcu_sync.domain;
    for (const webUrl of ip) {
      await this.ctx.curl(webUrl + '/APCuSync/delete', {
        method: 'post',
        data: {
          key,
        },
      });
    }
  },
  async php_apcu_store(key, data, ttl = 0) {
    if (ttl > 0) {
      this.app.cache.set(key, data, ttl);
    } else {
      this.app.cache.set(key, data);
    }

    // TODO: 等全部是新后台才开放
    const ip = this.config.apcu_sync.domain;
    for (const webUrl of ip) {
      await this.ctx.curl(webUrl + '/APCuSync/store', {
        method: 'post',
        data: {
          key,
          data,
          ttl,
        },
      });
    }
  },

  /** 获取当前本地日期字符串 */
  getCurDate() {
    return this.dateFormat(new Date(), 'yyyy-MM-dd');
  },

  /** 获取当前本地时间字符串 */
  getCurTime() {
    return this.dateFormat(new Date(), 'hh:mm:ss');
  },
  /** 获取当前本地日期 时间字符串 */
  getCurDateTime() {
    return this.dateFormat(new Date(), 'yyyy-MM-dd hh:mm:ss');
  },

  /** 获取指定日期的起始时间，时间戳（秒）
   *
   * @param {date|string|number} date 日期对象，日期字符串，时间戳
   * @return {number} 当天日期起始时间戳(秒)
   */
  getDateStartTime(date) {
    const d = new Date(date);
    const t = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    return Math.floor(d.getTime() / 1000) - t;
  },

  /** 获取当前时间偏移指定秒数的时间
   * @param {Number} secondOff 偏移秒数
   * @param {String} fmt 日期格式化字符串
   * @return {String} 日期字符串
   */
  getDateTimeByTodayOff(secondOff = 0, fmt = 'yyyy-MM-dd hh:mm:ss') {
    const tm = Date.now() + secondOff * 1000; // 3600 * 24 * 1000;
    return this.dateFormat(tm, fmt);
  },

  /**
   * 计算两个对象的差集
   * @param {Object} obj1 数组1
   * @param {Object} obj2 数组2
   * @return {Object} 对象差集
   */
  ObjDiff(obj1, obj2) {
    const k1 = Object.keys(obj1);
    const k2 = Object.keys(obj2);
    const diffKeys = k1.concat(k2).filter(v => {
      return k1.indexOf(v) === -1 || k2.indexOf(v) === -1;
    });

    const ret = {};
    for (const it of diffKeys) {
      if (obj1[it] !== undefined) {
        ret[it] = obj1[it];
      } else if (obj2[it] !== undefined) {
        ret[it] = obj2[it];
      }
    }

    return ret;
  },
  timeout(ms) {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms, 'done');
    });
  },
  /** 获取指定日期的时间戳，（秒）
   * @param {Date?} date 日期或者不传
   * @return {Number} 基于秒的时间戳
   */
  getTimeSec(date) {
    if (date === undefined) {
      return Math.floor(Date.now() / 1000);
    }

    if (date instanceof Date) {
      return Math.floor(date.getTime() / 1000);
    }

    if (typeof (date) === 'string') {
      return Math.floor(new Date(date).getTime() / 1000);
    }

    if (typeof (date) === 'number') {
      return Math.floor(date / 1000);
    }
  },
  /** 发送POST 请求
   *
   * @param {String} url 请求的地址
   * @param {Object} post_data 请求参数
   */
  async http_post(url, post_data) {
    const opt = {
      method: 'POST',
      data: post_data,
      dataType: 'json',
    };

    try {
      const ret = await this.app.curl(url, opt);
      // console.log(ret);
      if (ret.status === 200) {

        return ret.data;
      }

      return {
        response: 'resp status:' + ret.status,
        status: false,
      };
    } catch (e) {
      return {
        response: 'resp status:' + e.toString(),
        status: false,
      };
    }
  },
  validEmail(v) {
    if (typeof (v) !== 'string') {
      return false;
    }
    const r = new RegExp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?");
    return v.match(r) !== null;
  },
  /** 计算MD5
   *
   * @param {String} str 原始字符串
   * @return {String} MD5
   */
  md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
  },
  /** 获取操作者名字
   *
   * @param {string} [operName] - 操作者名字
   * @return {string} 操作者名字
   */
  getOperName(operName) {
    let opName = 'sys';
    if (typeof (operName) === 'string' && operName.length > 1) {
      opName = operName;
    } else {
      if (this.ctx.locals.admin !== undefined) {
        opName = this.ctx.locals.admin.name;
      }
    }
    return opName;
  },
  get_csrf_hash() {
    return '';
  },
  /** 获取概率区间索引
   * @param {number[]} ratArray 每个区间的概率
   * @return {number} 选择区间索引
   */
  getRandAreaIdx(ratArray) {
    const maxC = 100000;
    const ratRange = [];
    let curSeek = 0;
    let totalRat = 0;
    // / 重新计算概率（防止所有概率之和不为1）
    for (const rat of ratArray) {
      totalRat += rat;
    }

    for (const rat of ratArray) {
      const ratMod = rat / totalRat;
      curSeek = curSeek + ratMod * maxC;
      ratRange.push(curSeek);
    }

    const len = ratRange.length;
    const val = this.rand(1, maxC);
    for (let i = 0; i < len; i++) {
      if (val < ratRange[i]) {
        return i;
      }
    }
    return len - 1;
  },
  array_fill(sIdx, cnt, val) {
    const ar = [];
    for (let i = sIdx; i < sIdx + cnt; i++) {
      ar[i] = val;
    }
    return ar;
  },

  /**
   * 循环创建文件夹
   * @param {string} dir dir
   */
  mkdir(dir) {
    if (!fs.existsSync(dir)) {
      const dirArr = dir.split(path.sep);
      let dirTmp = path.sep;
      for (const item of dirArr) {
        if (item) {
          dirTmp += (item + path.sep);
          if (!fs.existsSync(dirTmp)) fs.mkdirSync(dirTmp);
        }
      }
    }
  },

  /** 验证指定的日期字符串是不是日期字符串
   *
   * @param {string} szDate 日期时间字符串
   * @return {boolean} true,是
   */
  isValidDate(szDate) {
    return !isNaN(new Date(szDate).getTime());
  },

  /**
 * number_format
 * @param number 传进来的数,
 * @param bit 保留的小数位,默认保留两位小数,
 * @param sign 为整数位间隔符号,默认为空格
 * @param gapnum 为整数位每几位间隔,默认为3位一隔
 * @type arguments的作用：arguments[0] == number(之一)
 */

  number_format(number, bit, sign, gapnum) {
  // 设置接收参数的默认值
    bit = arguments[1] ? arguments[1] : 2;
    sign = arguments[2] ? arguments[2] : ' ';
    gapnum = arguments[3] ? arguments[3] : 3;
    let str = '';
    number = Number(number).toFixed(bit); // 格式化
    let realnum = number.split('.')[0]; // 整数位(使用小数点分割整数和小数部分)
    let decimal = number.split('.')[1]; // 小数位
    if (decimal === undefined) {
      decimal = '0000';
    } else {
      decimal = decimal.substr(0, 4);
    }
    const realnumarr = realnum.split(''); // 将整数位逐位放进数组 ["1", "2", "3", "4", "5", "6"]

    // 把整数部分从右往左拼接，每bit位添加一个sign符号
    for (let i = 1; i <= realnumarr.length; i++) {
      str = realnumarr[realnumarr.length - i] + str;
      if (i % gapnum === 0) {
        str = sign + str; // 每隔gapnum位前面加指定符号
      }
    }

    str = (realnum.length % gapnum === 0) ? str.substr(1) : str;
    if (str === 'NaN') {
      str = '0';
    }
    realnum = str + '.' + decimal;
    return realnum;
  },


};
