var orderList = [];

function addLog(order, cb){
  orderList.push(order);
  if(cb){
    cb(order);
  }
}

function closeDB(){
}

exports.AddLog = addLog;
exports.CloseDB = closeDB;
