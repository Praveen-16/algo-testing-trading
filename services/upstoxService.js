const {user5CE, user5PE} = require("../user_stratagies/user5")
const {user10CE, user10PE} = require("../user_stratagies/user10");
const {simulateLTPUpdates, simulateLTPUpdates10} = require("../services/simulateLTPUpdates")

const dotenv = require('dotenv');
const UpstoxClient = require('upstox-js-sdk');
const WebSocket = require('ws').WebSocket;
const protobuf = require('protobufjs');

dotenv.config();


// simulateLTPUpdates("user10")

let isLTP = false;


const getLTPs = (instrumentKeys, accessToken)=>{
  console.log("getLTPs function called..")
  let apiVersion = "2.0";
  let defaultClient = UpstoxClient.ApiClient.instance;
  let OAUTH2 = defaultClient.authentications["OAUTH2"];
  OAUTH2.accessToken = accessToken;


const getMarketFeedUrl = async () => {
  return new Promise((resolve, reject) => {
    let apiInstance = new UpstoxClient.WebsocketApi(); 

    apiInstance.getMarketDataFeedAuthorize(
      apiVersion,
      (error, data, response) => {
        if (error) reject(error); 
        else resolve(data.data.authorizedRedirectUri); 
      }
    );
  });
};

const connectWebSocket = async (wsUrl) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, {
      headers: {
        "Api-Version": apiVersion,
        Authorization: "Bearer " + OAUTH2.accessToken,
      },
      followRedirects: true,
    });

    ws.on("open", () => {
      console.log("web socket connected");
      resolve(ws); 
      console.log("checking for ", instrumentKeys)
      setTimeout(() => {
        const data = {
          guid: "someguid",
          method: "sub",
          data: {
            mode: "full",
            instrumentKeys: instrumentKeys
          },
        };
        ws.send(Buffer.from(JSON.stringify(data)));
      }, 1000);
    });

    ws.on("close", () => {
      console.log("disconnected");
    });
    
    ws.on("message", (data) => {
      try {
        var decodedObject = decodeProfobuf(data); 
        var jsonString = JSON.stringify(decodedObject);
        var jsObject = JSON.parse(jsonString);
    
        var ffObject = jsObject?.feeds?.[instrumentKeys[0]]?.ff; 
        var ff2Object = jsObject?.feeds?.[instrumentKeys[1]]?.ff;
        
        simulateLTPUpdates("user5");
        simulateLTPUpdates10("user10")
    
        if (ffObject?.marketFF?.ltpc?.ltp != null) {
          let ltpPE = ffObject.marketFF.ltpc.ltp;
          user5PE?.(ltpPE, 'user5');
          user10PE?.(ltpPE, 'user10');
        }
    
        if (ff2Object?.marketFF?.ltpc?.ltp != null) {
          let ltpCE = ff2Object.marketFF.ltpc.ltp;    
          user5CE?.(ltpCE, 'user5');
          user10CE?.(ltpCE, 'user10');
        }
    
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });
    
    


    ws.on("error", (error) => {
      console.log("error:", error);
      reject(error); 
    });
  });
};


const initProtobuf = async () => {
  const protoFilePath = __dirname + "/MarketDataFeed.proto";
  protobufRoot = await protobuf.load(protoFilePath);
  console.log("Protobuf part initialization complete");
};


const decodeProfobuf = (buffer) => {
  if (!protobufRoot) {
    console.warn("Protobuf part not initialized yet!");
    return null;
  }

  const FeedResponse = protobufRoot.lookupType(
    "com.upstox.marketdatafeeder.rpc.proto.FeedResponse"
  );
  return FeedResponse.decode(buffer);
};

(async () => {
  try {
    await initProtobuf();
    const wsUrl = await getMarketFeedUrl(); 
    const ws = await connectWebSocket(wsUrl);
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();

}
module.exports = { getLTPs };
