
let gTimeZoneOff = new Date().getTimezoneOffset() * 60 * 1000;

/**
 * 给商品价格加补0
 * @param {*} value
 */
const NumFormat = function (value, fix = 0) {
  if (Number.isNaN(value) || value === undefined) {
    return '0';
  }
  if (value === 0) {
    return '0';
  }

  if (fix > 0) {
    value = Number(value).toFixed(fix);
  }

  const pattern = /(?=((?!\b)\d{3})+$)/g;
  const tmp = value + '';
  return tmp.replace(pattern, ',');
};

/** 日期格式化函数
 * @param { Date | Number | String} dateObj 要转化的对象
 * @param {String} fmt 格式化参数 (yyyy-MM-dd hh:mm:ss)
 */
const DateFormat = function (dateObj, fmt = 'yyyy-MM-dd') {
  if ((dateObj instanceof Date) === false) {
    let type = typeof (dateObj);
    if (type === 'number') { // 时间戳不加偏移
      let valu = new Date(dateObj).getTime();
      dateObj = new Date(valu);
    } else if (type === 'string') {
      if (dateObj.indexOf('Z') !== -1) {
        let valu = new Date(dateObj).getTime() + gTimeZoneOff;// 加上时区
        dateObj = new Date(valu);
      } else {
        let valu = new Date(dateObj).getTime();
        dateObj = new Date(valu);
      }
    } else {
      return '';
    }
  }

  const o = {
    'M+': dateObj.getMonth() + 1, // 月份
    'd+': dateObj.getDate(), // 日
    'h+': dateObj.getHours(), // 小时
    'm+': dateObj.getMinutes(), // 分
    's+': dateObj.getSeconds(), // 秒
    'q+': Math.floor((dateObj.getMonth() + 3) / 3), // 季度
    S: dateObj.getMilliseconds() // 毫秒
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
};

const StrSubstr = function (val, len = 30) {
  const lens = val.length;
  if (lens > len) {
    return val.substr(0, len) + '......';
  }
  return val;
};

export default {
  NumFormat,
  DateFormat,
  StrSubstr
};
