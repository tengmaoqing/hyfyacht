/**
 * Created by qxj on 15/10/19.
 */

var tools = {
  code: function(s){
    var arr = String(s).split('');

    var temp1 = arr.slice(0, 3);
    var temp2 = arr.slice(3, 6);
    var temp3 = arr.slice(6, 12);
    var temp4 = arr.slice(12, 18);
    var temp5 = arr.slice(18, 24);

    temp2.reverse();
    temp4.reverse();

    var newArr = temp5.concat(temp3, temp1, temp2, temp4);

    newArr.reverse();

    return newArr.join('');
  },
  decode: function(s){
    var arr = s.split('');
    arr.reverse();

    var temp1 = arr.slice(0, 6);
    var temp2 = arr.slice(6, 12);
    var temp3 = arr.slice(12, 15);
    var temp4 = arr.slice(15, 18);
    var temp5 = arr.slice(18, 24);

    temp4.reverse();
    temp5.reverse();

    var newArr = temp3.concat(temp4, temp2, temp5, temp1);

    return newArr.join('');
  }
};

module.exports = tools;