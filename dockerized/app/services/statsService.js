var geoip = require('geoip-lite');
var RequestModel = require("../models/requestModel");

var logRequest = function (shortUrl, req) {
    console.log("====> log: " + shortUrl);  // debug
    var reqInfo = {};
    reqInfo.shortUrl = shortUrl;
    reqInfo.referer = req.headers.referer || "Unknown";  // could be null
    reqInfo.platform = req.useragent.platform || "Unknown";
    reqInfo.browser = req.useragent.browser || "Unknown";
    var ip = req.headers["x-forwarded-for"] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress || 
            req.connection.socket.remoteAddress;
    var geo = geoip.lookup(ip);
    if (geo) { 
        reqInfo.country = geo.country;
    } else {
        reqInfo.country = "Unknown";  // local access wil result 'undefine'
    }
    reqInfo.timestamp = new Date();
    var request = new RequestModel(reqInfo);
    request.save(); // need further work to handle error
    console.log("save: " + shortUrl + " : " + reqInfo.country);  // debug
};

var getUrlInfo = function (shortUrl, info, callback) {
    if (info === "totalClicks") {
        RequestModel.count({ shortUrl: shortUrl}, function (err, data) {
            callback(data);
        });
        return;
    }

    var groupId = ""  // group by ...

    if (info === 'hour') {
        groupId = {
            year: {$year: "$timestamp"},
            month: {$month: "$timestamp"},
            day: {$dayOfMonth: "$timestamp"},
            hour: {$hour: "$timestamp"},
            minutes: {$minute: "$timestamp"}
        }
    } else if (info === 'day') {
        groupId = {
            year: {$year: "$timestamp"},
            month: {$month: "$timestamp"},
            day: {$dayOfMonth: "$timestamp"},
            hour: {$hour: "$timestamp"}
        }
    } else if (info === 'month') {
        groupId = {
            year: {$year: "$timestamp"},
            month: {$month: "$timestamp"},
            day: {$dayOfMonth: "$timestamp"}
        }
    } else {
        groupId = "$" + info;
    }


    RequestModel.aggregate([
        {
            $match: {
                shortUrl: shortUrl
            }
        },
        {
            $sort: {
                timestamp: -1
            }
        },
        {
            $group: {
                _id: groupId,         // grouping
                count: { 
                    $sum: 1
                }     // sum number
            }
        }
    ], function (err, data) {
        callback(data);
    });

}

module.exports = {
    logRequest: logRequest,
    getUrlInfo: getUrlInfo
};