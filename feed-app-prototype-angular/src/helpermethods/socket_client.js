import { Client } from "@stomp/stompjs";

const url = 'ws://localhost:8080/polls'

let headers = () =>{
  let logIn = localStorage.getItem('JWT');
  if (logIn){
    return {
        'Authorization': `Bearer ${logIn}`,
    }
  } else{
    let guestId = localStorage.getItem('guest-id');
    return{
        'GuestId': guestId
    }
  }
}

/** @type{Client} */
const stompClient = new Client({
  brokerURL: url,
  reconnectDelay: 5000,
  debug: (str) => {
    console.log(str);
  }
});

let onConnect = function(frame){
  console.log('Connected: ' + frame);
  stompClient.subscribe('/topic/greetings', onMessage)
  sendGreeting()
}

let onError = function(error){
  console.error(error.headers.message);
}

let onMessage = function(message){
  if (message.body){
    console.log("Got message with body: " + message.body);
  } else {
    console.log("Got an empty message???");
  }
}

function sendGreeting(){
  if (stompClient.connected){
    stompClient.publish({
      destination: "/app/hello",
      body: "Hello"
    })
  } else {
    console.error('Cannot send greeting: STOMP client is not connected')
  }
}

/** @returns {Client} stompClient */
export function createClient(onVoteMessage, onPollMessage, onDeletePoll){
  stompClient.onConnect = function(frame){
    console.log('Connected: ' + frame);
    stompClient.subscribe('/topic/greetings', onVoteMessage)
    stompClient.subscribe('/topic/new-poll', onPollMessage)
    stompClient.subscribe('/topic/delete-poll', onDeletePoll)
  }
  stompClient.connectHeaders = headers();
  stompClient.onStompError = onError;
  stompClient.activate();
  return stompClient;
}


