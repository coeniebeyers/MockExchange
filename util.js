
function round(number, constant){
  return Math.round(number*constant)/constant;
  //return Number((Math.round(number*constant)/constant).toFixed(4));
  //return number;
}

exports.Round = round;
