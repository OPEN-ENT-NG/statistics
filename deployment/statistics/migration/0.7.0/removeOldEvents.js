// If You Want to execute the Script with another ttl : mongo one_gridfs --eval 'var ttl=604800000' removeOldEvents.js
// Default TimeToLive : 3 monthes
var timeToLive = 7884000000;
if (typeof ttl !== 'undefined') {
    if (ttl !== 'number') {
        timeToLive = ~~ttl;
    }
}
printjson(new Date() + " : BEGIN : Delete events older than (ms) : " + timeToLive);
db.events.remove(
    {
        date: {
            // Expire documents older than ttl
            $lt: (Date.now() - (timeToLive))
        }
    }
)
printjson(new Date() + " : END : Delete events older than (ms) : " + timeToLive);